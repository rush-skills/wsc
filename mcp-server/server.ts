import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  detectDuplicateWords,
  removeDuplicateWord,
  allWeaselWords,
  analyzeText as coreAnalyzeText,
  validateConfig,
} from '../src/core/index.js';
import type { WscConfig } from '../src/core/index.js';
import { findConfigFile, loadConfigFromFile } from '../src/core/config-node.js';

const MAX_TEXT_LENGTH = 100_000;

export function getLineCol(text: string, index: number) {
  const lines = text.substring(0, index).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

export function getContext(text: string, index: number, length: number) {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + length + 20);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.substring(start, end)}${suffix}`;
}

export function formatAnalysis(text: string, config?: WscConfig): string {
  const result = coreAnalyzeText(text, config);
  const { summary, issues, meta } = result;

  let output = `Writing Style Analysis\n======================\n`;

  if (summary.total === 0) {
    output += `No issues found in ${meta.characterCount} characters (${meta.wordCount} words). Nice work!\n`;
  } else {
    output += `Found ${summary.total} issue${summary.total !== 1 ? 's' : ''} in ${meta.characterCount} characters (${meta.wordCount} words)\n`;

    const sections: Array<{ label: string; items: Array<{ display: string; index: number; length: number }> }> = [
      { label: 'WEASEL WORDS', items: issues.weaselWords.map(w => ({ display: w.word, ...w })) },
      { label: 'PASSIVE VOICE', items: issues.passiveVoice.map(p => ({ display: p.phrase, ...p })) },
      { label: 'DUPLICATE WORDS', items: issues.duplicateWords.map(d => ({ display: d.word, ...d })) },
      { label: 'LONG SENTENCES', items: issues.longSentences.map(s => ({ display: `${s.sentence} (${s.wordCount} words)`, ...s })) },
      { label: 'NOMINALIZATIONS', items: issues.nominalizations.map(n => ({ display: `${n.word} → ${n.suggestion}`, ...n })) },
      { label: 'HEDGING', items: issues.hedging.map(h => ({ display: h.phrase, ...h })) },
      { label: 'FILLER ADVERBS', items: issues.adverbs.map(a => ({ display: a.word, ...a })) },
    ];

    for (const section of sections) {
      if (section.items.length > 0) {
        output += `\n${section.label} (${section.items.length}):\n`;
        for (const item of section.items) {
          const { line, column } = getLineCol(text, item.index);
          const context = getContext(text, item.index, item.length);
          output += `  - "${item.display}" at line ${line}, column ${column}\n    Context: ${context}\n`;
        }
      }
    }
  }

  return output;
}

// Keep backward compatibility — old name used in tests
export const analyzeText = formatAnalysis;

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'writing-style-checker',
    version: '2.0.0',
  });

  server.tool(
    'check_text',
    'Analyze text for writing style issues (weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging, filler adverbs). Returns structured results with issue positions and context.',
    {
      text: z.string().describe('The text to analyze for writing style issues'),
      config: z.any().optional().describe('Optional WscConfig JSON object to customize detectors'),
    },
    async ({ text, config: rawConfig }) => {
      if (text.length > MAX_TEXT_LENGTH) {
        return { content: [{ type: 'text', text: `Error: Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }] };
      }
      let config: WscConfig | undefined;
      if (rawConfig !== undefined) {
        const errors = validateConfig(rawConfig);
        if (errors.length > 0) {
          return { content: [{ type: 'text', text: `Error: Invalid config - ${errors.join('; ')}` }] };
        }
        config = rawConfig as WscConfig;
      }
      return { content: [{ type: 'text', text: formatAnalysis(text, config) }] };
    }
  );

  server.tool(
    'fix_duplicates',
    'Remove all duplicate adjacent words from the text and return the cleaned version.',
    { text: z.string().describe('The text to clean by removing duplicate adjacent words') },
    async ({ text }) => {
      let cleaned = text;
      const fixes: string[] = [];
      let duplicates = detectDuplicateWords(cleaned);

      while (duplicates.length > 0) {
        const d = duplicates[duplicates.length - 1];
        fixes.push(d.word);
        cleaned = removeDuplicateWord(cleaned, d.index, d.length);
        duplicates = detectDuplicateWords(cleaned);
      }

      let output: string;
      if (fixes.length === 0) {
        output = `No duplicate words found. Text is clean.\n\n${cleaned}`;
      } else {
        output = `Removed ${fixes.length} duplicate word${fixes.length !== 1 ? 's' : ''}: ${fixes.reverse().join(', ')}\n\nCleaned text:\n${cleaned}`;
      }

      return { content: [{ type: 'text', text: output }] };
    }
  );

  server.tool(
    'list_weasel_words',
    'Return the complete list of weasel words that the checker flags.',
    {},
    async () => {
      const output = `Weasel Words List (${allWeaselWords.length} words)\n${'='.repeat(40)}\n\n${allWeaselWords.join(', ')}`;
      return { content: [{ type: 'text', text: output }] };
    }
  );

  server.tool(
    'check_file',
    'Read a file from disk and analyze it for writing style issues. Auto-discovers .wscrc.json config from the file directory upward.',
    {
      path: z.string().describe('Path to the file to analyze'),
      config: z.any().optional().describe('Optional WscConfig JSON object (overrides auto-discovered .wscrc.json)'),
    },
    async ({ path, config: rawConfig }) => {
      try {
        const text = await readFile(path, 'utf-8');
        if (text.length > MAX_TEXT_LENGTH) {
          return { content: [{ type: 'text', text: `Error: File exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }] };
        }

        let config: WscConfig | undefined;
        if (rawConfig !== undefined) {
          const errors = validateConfig(rawConfig);
          if (errors.length > 0) {
            return { content: [{ type: 'text', text: `Error: Invalid config - ${errors.join('; ')}` }] };
          }
          config = rawConfig as WscConfig;
        } else {
          // Auto-discover .wscrc.json
          const configPath = await findConfigFile(dirname(path));
          if (configPath) {
            config = await loadConfigFromFile(configPath);
          }
        }

        return { content: [{ type: 'text', text: `File: ${path}\n\n${formatAnalysis(text, config)}` }] };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Error reading file: ${message}` }] };
      }
    }
  );

  return server;
}
