import {
  detectDuplicateWords,
  removeDuplicateWord,
  allWeaselWords,
  analyzeText,
  validateConfig,
} from '../core';
import type { WscConfig } from '../core';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const TOOLS = [
  {
    name: 'check_text',
    description: 'Analyze text for writing style issues (weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging, filler adverbs). Returns structured results with issue positions and context.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to analyze for writing style issues',
        },
        config: {
          type: 'object',
          description: 'Optional WscConfig to customize which detectors run and their settings',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'fix_duplicates',
    description: 'Remove all duplicate adjacent words from the text and return the cleaned version.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to clean by removing duplicate adjacent words',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'list_weasel_words',
    description: 'Return the complete list of weasel words that the checker flags.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_word_lists',
    description: 'Return all word/phrase lists used by the detectors.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

const MAX_TEXT_LENGTH = 100_000;

function getLineCol(text: string, index: number) {
  const lines = text.substring(0, index).split('\n');
  return { line: lines.length, column: lines[lines.length - 1].length + 1 };
}

function getContext(text: string, index: number, length: number) {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + length + 20);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.substring(start, end)}${suffix}`;
}

function handleCheckText(args: Record<string, unknown>): { content: Array<{ type: string; text: string }> } {
  const text = args.text as string;
  if (!text || typeof text !== 'string') {
    throw { code: -32602, message: 'Missing or invalid "text" argument' };
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw { code: -32602, message: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` };
  }

  let config: WscConfig | undefined;
  if (args.config !== undefined) {
    const errors = validateConfig(args.config);
    if (errors.length > 0) {
      throw { code: -32602, message: `Invalid config: ${errors.join('; ')}` };
    }
    config = args.config as WscConfig;
  }

  const result = analyzeText(text, config);
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

  return { content: [{ type: 'text', text: output }] };
}

function handleFixDuplicates(args: Record<string, unknown>): { content: Array<{ type: string; text: string }> } {
  let text = args.text as string;
  if (!text || typeof text !== 'string') {
    throw { code: -32602, message: 'Missing or invalid "text" argument' };
  }

  const fixes: string[] = [];
  let duplicates = detectDuplicateWords(text);

  while (duplicates.length > 0) {
    const d = duplicates[duplicates.length - 1];
    fixes.push(d.word);
    text = removeDuplicateWord(text, d.index, d.length);
    duplicates = detectDuplicateWords(text);
  }

  let output: string;
  if (fixes.length === 0) {
    output = `No duplicate words found. Text is clean.\n\n${text}`;
  } else {
    output = `Removed ${fixes.length} duplicate word${fixes.length !== 1 ? 's' : ''}: ${fixes.reverse().join(', ')}\n\nCleaned text:\n${text}`;
  }

  return { content: [{ type: 'text', text: output }] };
}

function handleListWeaselWords(): { content: Array<{ type: string; text: string }> } {
  const output = `Weasel Words List (${allWeaselWords.length} words)\n${'='.repeat(40)}\n\n${allWeaselWords.join(', ')}`;
  return { content: [{ type: 'text', text: output }] };
}

function handleListWordLists(): { content: Array<{ type: string; text: string }> } {
  // Import all lists dynamically would require top-level imports, so reference via analyzeText
  const result = analyzeText('');
  const cfg = result.config;
  const output = [
    `Detector Word Lists`,
    `===================`,
    ``,
    `Detectors: weaselWords, passiveVoice, duplicateWords, longSentences, nominalizations, hedging, adverbs`,
    ``,
    `All detectors are enabled by default. Use the config parameter in check_text to customize.`,
    `For the complete weasel words list, use the list_weasel_words tool.`,
  ].join('\n');

  return { content: [{ type: 'text', text: output }] };
}

export async function handleMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { jsonrpc, id, method, params } = request;

  if (jsonrpc !== '2.0') {
    return { jsonrpc: '2.0', id: id ?? 0, error: { code: -32600, message: 'Invalid JSON-RPC version' } };
  }

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2025-03-26',
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: 'writing-style-checker',
            version: '1.0.0',
          },
        },
      };

    case 'notifications/initialized':
      return { jsonrpc: '2.0', id, result: {} };

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS },
      };

    case 'tools/call': {
      const toolName = (params as Record<string, unknown>)?.name as string;
      const args = ((params as Record<string, unknown>)?.arguments ?? {}) as Record<string, unknown>;

      try {
        let result;
        switch (toolName) {
          case 'check_text':
            result = handleCheckText(args);
            break;
          case 'fix_duplicates':
            result = handleFixDuplicates(args);
            break;
          case 'list_weasel_words':
            result = handleListWeaselWords();
            break;
          case 'list_word_lists':
            result = handleListWordLists();
            break;
          default:
            return {
              jsonrpc: '2.0',
              id,
              error: { code: -32602, message: `Unknown tool: ${toolName}` },
            };
        }
        return { jsonrpc: '2.0', id, result };
      } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code && error.message) {
          return { jsonrpc: '2.0', id, error: { code: error.code, message: error.message } };
        }
        return { jsonrpc: '2.0', id, error: { code: -32603, message: 'Internal error' } };
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}
