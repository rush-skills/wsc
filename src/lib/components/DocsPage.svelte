<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { marked } from 'marked';

  // Import markdown docs as raw strings at build time
  import gettingStartedMd from '../../docs/getting-started.md?raw';
  import configMd from '../../docs/config.md?raw';
  import apiMd from '../../docs/api.md?raw';
  import mcpMd from '../../docs/mcp.md?raw';
  import cliMd from '../../docs/cli.md?raw';
  import githubActionMd from '../../docs/github-action.md?raw';
  import contributingMd from '../../docs/contributing.md?raw';

  export let initialSection: string = 'getting-started';

  let activeSection = initialSection;

  const sections = [
    { id: 'getting-started', label: 'Getting Started', md: gettingStartedMd },
    { id: 'config', label: 'Configuration', md: configMd },
    { id: 'api', label: 'HTTP API', md: apiMd },
    { id: 'mcp', label: 'MCP Server', md: mcpMd },
    { id: 'cli', label: 'CLI', md: cliMd },
    { id: 'github-action', label: 'GitHub Action', md: githubActionMd },
    { id: 'contributing', label: 'Contributing', md: contributingMd },
  ];

  // Pre-render all sections to HTML at component init (trusted content from our own .md files)
  const renderedSections: Record<string, string> = {};
  for (const section of sections) {
    renderedSections[section.id] = marked.parse(section.md, { async: false }) as string;
  }

  onMount(() => {
    if (browser) {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section && sections.some(s => s.id === section)) {
        activeSection = section;
      }
    }
  });
</script>

<div class="docs-layout">
  <nav class="docs-sidebar">
    {#each sections as section}
      <button
        class="docs-nav-item"
        class:active={activeSection === section.id}
        on:click={() => (activeSection = section.id)}
      >
        {section.label}
      </button>
    {/each}
  </nav>

  <div class="docs-content">
    {#each sections as section}
      {#if activeSection === section.id}
        {@html renderedSections[section.id]}
      {/if}
    {/each}
  </div>
</div>

<style>
  .docs-layout {
    display: flex;
    gap: 2rem;
    min-height: 400px;
    max-width: 100%;
    overflow: hidden;
  }

  .docs-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 160px;
    flex-shrink: 0;
    position: sticky;
    top: 1rem;
    align-self: flex-start;
  }

  .docs-nav-item {
    background: none;
    border: none;
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    color: var(--secondary-text);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.2s, background-color 0.2s;
    font-family: inherit;
  }

  .docs-nav-item:hover {
    color: var(--accent-color);
    background-color: var(--button-hover);
  }

  .docs-nav-item.active {
    color: var(--accent-color);
    background-color: var(--accent-color-transparent);
  }

  .docs-content {
    flex: 1;
    min-width: 0;
    overflow-x: hidden;
  }

  /* Markdown rendered content styles */
  .docs-content :global(h2) {
    margin-top: 0;
    margin-bottom: 0.75rem;
    color: var(--accent-color);
    font-size: 1.5rem;
  }

  .docs-content :global(h3) {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--primary-text);
    font-size: 1.1rem;
  }

  .docs-content :global(h4) {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: var(--primary-text);
    font-size: 0.95rem;
  }

  .docs-content :global(p) {
    color: var(--secondary-text);
    margin-top: 0;
    margin-bottom: 0.75rem;
    line-height: 1.6;
  }

  .docs-content :global(a) {
    color: var(--accent-color);
    text-decoration: none;
  }

  .docs-content :global(a:hover) {
    text-decoration: underline;
  }

  .docs-content :global(code) {
    font-family: "Menlo", "Monaco", "Courier New", monospace;
    font-size: 0.85em;
    background-color: var(--secondary-bg);
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    color: var(--primary-text);
  }

  .docs-content :global(pre) {
    margin: 0 0 1rem 0;
    padding: 0.75rem 1rem;
    background-color: var(--secondary-bg);
    border-radius: 6px;
    border: 1px solid var(--border-color);
    overflow-x: auto;
  }

  .docs-content :global(pre code) {
    background: none;
    padding: 0;
    font-size: 0.8rem;
    line-height: 1.5;
    white-space: pre;
  }

  .docs-content :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
    font-size: 0.9rem;
  }

  .docs-content :global(th) {
    text-align: left;
    padding: 0.5rem 0.75rem;
    background-color: var(--border-color);
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--secondary-text);
    border-bottom: 1px solid var(--border-color);
  }

  .docs-content :global(td) {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--secondary-text);
  }

  .docs-content :global(ul),
  .docs-content :global(ol) {
    color: var(--secondary-text);
    margin-top: 0;
    margin-bottom: 0.75rem;
    padding-left: 1.5rem;
  }

  .docs-content :global(li) {
    margin-bottom: 0.25rem;
    line-height: 1.6;
  }

  .docs-content :global(strong) {
    color: var(--primary-text);
  }

  .docs-content :global(hr) {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 1.5rem 0;
  }

  .docs-content :global(table) {
    display: block;
    overflow-x: auto;
  }

  @media (max-width: 768px) {
    .docs-layout {
      flex-direction: column;
      gap: 1rem;
      overflow: visible;
    }

    .docs-sidebar {
      flex-direction: row;
      flex-wrap: nowrap;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      position: static;
      min-width: 0;
      width: 100%;
      max-width: 100%;
      gap: 0.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      box-sizing: border-box;
    }

    .docs-sidebar::-webkit-scrollbar {
      display: none;
    }

    .docs-nav-item {
      font-size: 0.8rem;
      padding: 0.4rem 0.6rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .docs-content :global(table) {
      font-size: 0.8rem;
    }

    .docs-content :global(th),
    .docs-content :global(td) {
      padding: 0.4rem 0.5rem;
    }

    .docs-content :global(pre) {
      max-width: 100%;
    }
  }
</style>
