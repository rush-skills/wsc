<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
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

  function setSection(id: string) {
    activeSection = id;
    if (browser) {
      goto(`/docs?section=${id}`, { replaceState: true, noScroll: true, keepFocus: true });
    }
  }

  let contentEl: HTMLDivElement;

  function addCopyButtons() {
    if (!contentEl) return;
    contentEl.querySelectorAll('.code-copy-btn').forEach(b => b.remove());

    contentEl.querySelectorAll('pre').forEach(pre => {
      pre.style.position = 'relative';
      const btn = document.createElement('button');
      btn.className = 'code-copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const text = code ? code.textContent || '' : pre.textContent || '';
        navigator.clipboard.writeText(text);
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
      });
      pre.appendChild(btn);
    });
  }

  // Read section from URL on mount
  onMount(() => {
    if (browser) {
      const section = $page.url.searchParams.get('section');
      if (section && sections.some(s => s.id === section)) {
        activeSection = section;
      }
    }
    addCopyButtons();
  });

  afterUpdate(() => {
    addCopyButtons();
  });
</script>

<div class="docs-layout">
  <nav class="docs-sidebar">
    {#each sections as section}
      <button
        class="docs-nav-item"
        class:active={activeSection === section.id}
        on:click={() => setSection(section.id)}
      >
        {section.label}
      </button>
    {/each}
  </nav>

  <div class="docs-content" bind:this={contentEl}>
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
    padding: 0.45rem 0.75rem;
    border-radius: var(--radius-sm);
    color: var(--secondary-text);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: color 0.15s, background-color 0.15s;
    font-family: var(--font-body);
    letter-spacing: -0.01em;
  }

  .docs-nav-item:hover {
    color: var(--primary-text);
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
    font-family: var(--font-display);
    color: var(--primary-text);
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .docs-content :global(h3) {
    margin-top: 1.75rem;
    margin-bottom: 0.5rem;
    font-family: var(--font-display);
    color: var(--primary-text);
    font-size: 1.1rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  .docs-content :global(h4) {
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: var(--primary-text);
    font-size: 0.95rem;
    font-weight: 600;
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
    font-family: var(--font-mono);
    font-size: 0.82em;
    background-color: var(--secondary-bg);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: var(--primary-text);
    border: 1px solid var(--border-color);
  }

  .docs-content :global(pre) {
    margin: 0 0 1rem 0;
    padding: 0.75rem 1rem;
    background-color: var(--secondary-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    overflow-x: auto;
  }

  .docs-content :global(pre code) {
    background: none;
    padding: 0;
    font-size: 0.78rem;
    line-height: 1.6;
    white-space: pre;
    border: none;
  }

  .docs-content :global(.code-copy-btn) {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    background-color: var(--tertiary-bg);
    border: 1px solid var(--border-color-strong);
    color: var(--secondary-text);
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-family: var(--font-body);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    opacity: 0;
  }

  .docs-content :global(pre:hover .code-copy-btn) {
    opacity: 1;
  }

  .docs-content :global(.code-copy-btn:hover) {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
  }

  .docs-content :global(table) {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    table-layout: fixed;
  }

  .docs-content :global(th) {
    text-align: left;
    padding: 0.6rem 0.85rem;
    background-color: var(--tertiary-bg);
    font-weight: 600;
    font-size: 0.75rem;
    color: var(--secondary-text);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border-color);
  }

  .docs-content :global(td) {
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--secondary-text);
    vertical-align: top;
    word-wrap: break-word;
  }

  .docs-content :global(tr:last-child td) {
    border-bottom: none;
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
      gap: 0;
      padding-bottom: 0;
      box-sizing: border-box;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
      mask-image: linear-gradient(to right, black 85%, transparent 100%);
      -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    }

    .docs-sidebar::-webkit-scrollbar {
      display: none;
    }

    .docs-nav-item {
      font-size: 0.8rem;
      padding: 0.5rem 0.75rem;
      white-space: nowrap;
      flex-shrink: 0;
      border-radius: 0;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }

    .docs-nav-item.active {
      background-color: transparent;
      border-bottom-color: var(--accent-color);
    }

    .docs-content :global(table) {
      font-size: 0.8rem;
      table-layout: auto;
    }

    .docs-content :global(th),
    .docs-content :global(td) {
      padding: 0.4rem 0.6rem;
    }

    .docs-content :global(.code-copy-btn) {
      opacity: 1;
    }
  }
</style>
