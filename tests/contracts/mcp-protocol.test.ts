import { describe, it, expect } from 'vitest';
import { handleMcpRequest } from '../../src/mcp/handler';

describe('MCP JSON-RPC protocol compliance', () => {
  it('always returns jsonrpc: "2.0"', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(res.jsonrpc).toBe('2.0');
  });

  it('preserves numeric id', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 42, method: 'tools/list' });
    expect(res.id).toBe(42);
  });

  it('preserves string id', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 'abc', method: 'tools/list' });
    expect(res.id).toBe('abc');
  });

  it('invalid version returns -32600', async () => {
    const res = await handleMcpRequest({ jsonrpc: '1.0' as any, id: 1, method: 'initialize' });
    expect(res.error?.code).toBe(-32600);
  });

  it('unknown method returns -32601', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'nonexistent' });
    expect(res.error?.code).toBe(-32601);
  });

  it('unknown tool returns -32602', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'nonexistent_tool', arguments: {} },
    });
    expect(res.error?.code).toBe(-32602);
  });

  it('missing required param returns -32602', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'check_text', arguments: {} },
    });
    expect(res.error?.code).toBe(-32602);
  });

  it('successful result has no error field', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(res.error).toBeUndefined();
    expect(res.result).toBeDefined();
  });

  it('error response has no result field', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'nonexistent' });
    expect(res.result).toBeUndefined();
    expect(res.error).toBeDefined();
    expect(res.error).toHaveProperty('code');
    expect(res.error).toHaveProperty('message');
  });

  it('initialize returns protocol version and capabilities', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
    });
    const result = res.result as any;
    expect(result.protocolVersion).toBeDefined();
    expect(result.capabilities).toBeDefined();
    expect(result.serverInfo).toBeDefined();
  });

  it('tools/list returns array of tools with name and inputSchema', async () => {
    const res = await handleMcpRequest({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    const tools = (res.result as any).tools;
    expect(Array.isArray(tools)).toBe(true);
    for (const tool of tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('inputSchema');
      expect(tool.inputSchema).toHaveProperty('type');
    }
  });

  it('tools/call returns content array with type and text', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'check_text', arguments: { text: 'Hello world.' } },
    });
    const content = (res.result as any).content;
    expect(Array.isArray(content)).toBe(true);
    expect(content[0].type).toBe('text');
    expect(typeof content[0].text).toBe('string');
  });
});
