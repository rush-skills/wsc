import { describe, it, expect } from 'vitest';
import { handleMcpRequest } from '../../src/mcp/handler';

describe('MCP output snapshots', () => {
  it('check_text clean text output', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'check_text', arguments: { text: 'The team wrote good code.' } },
    });
    expect((res.result as any).content[0].text).toMatchSnapshot();
  });

  it('check_text with issues output', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'check_text', arguments: { text: 'This is very good.' } },
    });
    expect((res.result as any).content[0].text).toMatchSnapshot();
  });

  it('fix_duplicates output', async () => {
    const res = await handleMcpRequest({
      jsonrpc: '2.0', id: 1, method: 'tools/call',
      params: { name: 'fix_duplicates', arguments: { text: 'The the code works.' } },
    });
    expect((res.result as any).content[0].text).toMatchSnapshot();
  });
});
