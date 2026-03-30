<script lang="ts">
  import ApiTester from './ApiTester.svelte';

  let copiedId: string | null = null;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    copiedId = text;
    setTimeout(() => { copiedId = null; }, 2000);
  }
</script>

<div class="integration-section">
  <h2>Integrate WSC</h2>
  <p class="integration-intro">
    Use the Writing Style Checker from the command line, CI pipelines, AI assistants, or your own apps.
    <a href="/docs">Read the full documentation &rarr;</a>
  </p>

  <div class="integration-cards">
    <a href="/docs?section=api" class="integration-card">
      <div class="card-icon">API</div>
      <div class="card-title">HTTP API</div>
      <div class="card-desc">POST /api/check with text and receive structured results</div>
    </a>
    <a href="/docs?section=mcp" class="integration-card">
      <div class="card-icon">MCP</div>
      <div class="card-title">MCP Server</div>
      <div class="card-desc">Connect Claude, Cursor, or any MCP-compatible AI assistant</div>
    </a>
    <a href="/docs?section=cli" class="integration-card">
      <div class="card-icon">CLI</div>
      <div class="card-title">Command Line</div>
      <div class="card-desc">npx wsc-cli check "**/*.md"</div>
    </a>
    <a href="/docs?section=github-action" class="integration-card">
      <div class="card-icon">CI</div>
      <div class="card-title">GitHub Action</div>
      <div class="card-desc">Automatically check writing in PRs and pushes</div>
    </a>
  </div>

  <div class="api-tester-section">
    <h3>Try the API</h3>
    <p>Send a request to <code>POST /api/check</code> and see the response.</p>
    <ApiTester />
  </div>
</div>

<style>
  .integration-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .integration-card {
    padding: 1rem;
    background-color: var(--primary-bg);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    text-decoration: none;
    color: var(--primary-text);
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: pointer;
    display: block;
  }

  .integration-card:hover {
    border-color: var(--accent-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .card-icon {
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: white;
    background-color: var(--accent-color);
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .card-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--secondary-text);
    line-height: 1.4;
  }

  .api-tester-section {
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .api-tester-section h3 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    color: var(--primary-text);
    font-size: 1.1rem;
  }

  .api-tester-section p {
    color: var(--secondary-text);
    margin-top: 0;
    margin-bottom: 0;
    font-size: 0.9rem;
  }

  .api-tester-section code {
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.85em;
    background-color: var(--primary-bg);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
  }

  @media (max-width: 768px) {
    .integration-cards {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .integration-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
