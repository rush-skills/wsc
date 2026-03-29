import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import {
  detectWeaselWords,
  detectPassiveVoice,
  detectDuplicateWords,
  removeDuplicateWord,
  allWeaselWords,
} from '../src/core/index.js';

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

export function analyzeText(text: string): string {
  const weaselWords = detectWeaselWords(text);
  const passiveVoice = detectPassiveVoice(text);
  const duplicateWords = detectDuplicateWords(text);
  const total = weaselWords.length + passiveVoice.length + duplicateWords.length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  let output = `Writing Style Analysis\n======================\n`;

  if (total === 0) {
    output += `No issues found in ${text.length} characters (${wordCount} words). Nice work!\n`;
  } else {
    output += `Found ${total} issue${total !== 1 ? 's' : ''} in ${text.length} characters (${wordCount} words)\n`;

    if (weaselWords.length > 0) {
      output += `\nWEASEL WORDS (${weaselWords.length}):\n`;
      for (const w of weaselWords) {
        const { line, column } = getLineCol(text, w.index);
        const context = getContext(text, w.index, w.length);
        output += `  - "${w.word}" at line ${line}, column ${column}\n    Context: ${context}\n`;
      }
    }

    if (passiveVoice.length > 0) {
      output += `\nPASSIVE VOICE (${passiveVoice.length}):\n`;
      for (const p of passiveVoice) {
        const { line, column } = getLineCol(text, p.index);
        const context = getContext(text, p.index, p.length);
        output += `  - "${p.phrase}" at line ${line}, column ${column}\n    Context: ${context}\n`;
      }
    }

    if (duplicateWords.length > 0) {
      output += `\nDUPLICATE WORDS (${duplicateWords.length}):\n`;
      for (const d of duplicateWords) {
        const { line, column } = getLineCol(text, d.index);
        const context = getContext(text, d.index, d.length);
        output += `  - "${d.word}" at line ${line}, column ${column}\n    Context: ${context}\n`;
      }
    }
  }

  return output;
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'writing-style-checker',
    version: '1.0.0',
  });

  server.tool(
    'check_text',
    'Analyze text for weasel words, passive voice, and duplicate words. Returns structured results with issue positions and context.',
    { text: z.string().describe('The text to analyze for writing style issues') },
    async ({ text }) => {
      if (text.length > MAX_TEXT_LENGTH) {
        return { content: [{ type: 'text', text: `Error: Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }] };
      }
      return { content: [{ type: 'text', text: analyzeText(text) }] };
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
    'Read a file from disk and analyze it for writing style issues. Supports .txt, .md, and other text files.',
    { path: z.string().describe('Path to the file to analyze') },
    async ({ path }) => {
      try {
        const text = await readFile(path, 'utf-8');
        if (text.length > MAX_TEXT_LENGTH) {
          return { content: [{ type: 'text', text: `Error: File exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }] };
        }
        return { content: [{ type: 'text', text: `File: ${path}\n\n${analyzeText(text)}` }] };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Error reading file: ${message}` }] };
      }
    }
  );

  return server;
}
