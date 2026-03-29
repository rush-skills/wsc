import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      all: true,
      include: [
        'src/core/detector.ts',
        'src/core/words.ts',
        'src/mcp/handler.ts',
        'src/routes/api/check/+server.ts',
        'src/routes/mcp/+server.ts',
        'mcp-server/server.ts',
        // mcp-server/index.ts excluded: 3-line entry point that immediately
        // connects to StdioServerTransport (blocks on stdin). Cannot be
        // imported in tests. All logic it calls (createServer) is 100% tested
        // through server.test.ts.
      ],
    },
  },
  resolve: {
    alias: {
      '$app/environment': '/tests/__mocks__/$app/environment.ts',
    },
  },
});
