import {
  detectWeaselWords,
  detectPassiveVoice,
  detectDuplicateWords,
  removeDuplicateWord,
  allWeaselWords,
} from '../core';

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
    description: 'Analyze text for weasel words, passive voice, and duplicate words. Returns structured results with issue positions and context.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to analyze for writing style issues',
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
    // Fix from the end to preserve indices
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
