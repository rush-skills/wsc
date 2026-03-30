<script lang="ts">
  let text = '';
  let includeConfig = false;
  let configJson = '';
  let loading = false;
  let response: string | null = null;
  let httpStatus: number | null = null;
  let timing: number | null = null;
  let error: string | null = null;

  async function sendRequest() {
    error = null;
    response = null;
    httpStatus = null;
    timing = null;

    if (!text.trim()) {
      error = 'Please enter some text to analyze.';
      return;
    }

    let body: Record<string, unknown> = { text };

    if (includeConfig && configJson.trim()) {
      try {
        body.config = JSON.parse(configJson);
      } catch {
        error = 'Invalid JSON in config field.';
        return;
      }
    }

    loading = true;
    const start = performance.now();

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      timing = Math.round(performance.now() - start);
      httpStatus = res.status;

      const data = await res.json();
      response = JSON.stringify(data, null, 2);
    } catch (e) {
      timing = Math.round(performance.now() - start);
      error = 'Network error: could not reach the API.';
    } finally {
      loading = false;
    }
  }
</script>

<div class="api-tester">
  <h4>Try the API</h4>

  <textarea
    class="api-input"
    placeholder="Enter text to analyze..."
    rows="4"
    bind:value={text}
  ></textarea>

  <label class="config-checkbox">
    <input type="checkbox" bind:checked={includeConfig} />
    Include config
  </label>

  {#if includeConfig}
    <textarea
      class="api-config-input"
      placeholder={'{"detectors":{"adverbs":{"enabled":false}}}'}
      rows="3"
      bind:value={configJson}
    ></textarea>
  {/if}

  <button class="send-button" on:click={sendRequest} disabled={loading}>
    {#if loading}
      <span class="spinner"></span> Sending...
    {:else}
      Send Request
    {/if}
  </button>

  {#if error}
    <div class="api-error">{error}</div>
  {/if}

  {#if response !== null}
    <div class="api-response">
      <div class="response-header">
        <span class="status-badge" class:success={httpStatus === 200} class:error={httpStatus !== 200}>
          {httpStatus}
        </span>
        {#if timing !== null}
          <span class="timing">{timing}ms</span>
        {/if}
      </div>
      <pre class="response-body"><code>{response}</code></pre>
    </div>
  {/if}
</div>

<style>
  .api-tester {
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--border-color);
  }

  .api-tester h4 {
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: var(--primary-text);
    font-size: 1rem;
  }

  .api-input, .api-config-input {
    width: 100%;
    padding: 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
    box-sizing: border-box;
    margin-bottom: 0.5rem;
  }

  .api-config-input {
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.8rem;
  }

  .config-checkbox {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--secondary-text);
    margin-bottom: 0.5rem;
    cursor: pointer;
  }

  .send-button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.2rem;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: opacity 0.2s;
    margin-bottom: 0.75rem;
  }

  .send-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .send-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .api-error {
    padding: 0.5rem 0.75rem;
    background-color: rgba(231, 76, 60, 0.1);
    color: var(--error-color);
    border-radius: 4px;
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }

  .api-response {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }

  .response-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.4rem 0.75rem;
    background-color: var(--border-color);
    font-size: 0.8rem;
  }

  .status-badge {
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    font-weight: 600;
    font-size: 0.8rem;
  }

  .status-badge.success {
    background-color: var(--success-color);
    color: white;
  }

  .status-badge.error {
    background-color: var(--error-color);
    color: white;
  }

  .timing {
    color: var(--secondary-text);
    font-size: 0.8rem;
  }

  .response-body {
    margin: 0;
    padding: 0.75rem;
    background-color: var(--primary-bg);
    overflow-x: auto;
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    color: var(--primary-text);
    max-height: 400px;
    overflow-y: auto;
  }

  .response-body code {
    white-space: pre;
  }

  @media (max-width: 768px) {
    .api-input, .api-config-input {
      width: 100%;
    }
  }
</style>
