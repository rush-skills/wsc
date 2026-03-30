<script lang="ts">
  import {
    allWeaselWords, nominalizations, hedgingPhrases,
    fillerAdverbs, irregularVerbs, abbreviations,
  } from '../../core';

  let searchQuery = '';
  let activeGroup = 'weaselWords';

  const abbreviationsList = [...abbreviations];

  const groups = [
    { key: 'weaselWords', label: 'Weasel Words', count: allWeaselWords.length, color: 'var(--weasel-word-bg)', textColor: 'var(--weasel-word-text)' },
    { key: 'nominalizations', label: 'Nominalizations', count: nominalizations.length, color: 'var(--nominalization-bg)', textColor: 'var(--nominalization-text)' },
    { key: 'hedging', label: 'Hedging Phrases', count: hedgingPhrases.length, color: 'var(--hedging-bg)', textColor: 'var(--hedging-text)' },
    { key: 'adverbs', label: 'Filler Adverbs', count: fillerAdverbs.length, color: 'var(--adverb-bg)', textColor: 'var(--adverb-text)' },
    { key: 'irregularVerbs', label: 'Irregular Verbs', count: irregularVerbs.length, color: 'var(--passive-voice-bg)', textColor: 'var(--passive-voice-text)' },
    { key: 'abbreviations', label: 'Abbreviations', count: abbreviationsList.length, color: 'var(--long-sentence-bg)', textColor: 'var(--long-sentence-text)' },
  ] as const;

  function filterStrings(list: string[]): string[] {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(w => w.toLowerCase().includes(q));
  }

  function filterNominalizations() {
    if (!searchQuery.trim()) return nominalizations;
    const q = searchQuery.toLowerCase();
    return nominalizations.filter(n =>
      n.word.toLowerCase().includes(q) || n.suggestion.toLowerCase().includes(q)
    );
  }

  $: filteredWeasel = filterStrings(allWeaselWords);
  $: filteredNom = filterNominalizations();
  $: filteredHedging = filterStrings(hedgingPhrases);
  $: filteredAdverbs = filterStrings(fillerAdverbs);
  $: filteredVerbs = filterStrings(irregularVerbs);
  $: filteredAbbrevs = filterStrings(abbreviationsList);

  function getFiltered(key: string) {
    switch (key) {
      case 'weaselWords': return { items: filteredWeasel, total: allWeaselWords.length };
      case 'nominalizations': return { items: filteredNom, total: nominalizations.length };
      case 'hedging': return { items: filteredHedging, total: hedgingPhrases.length };
      case 'adverbs': return { items: filteredAdverbs, total: fillerAdverbs.length };
      case 'irregularVerbs': return { items: filteredVerbs, total: irregularVerbs.length };
      case 'abbreviations': return { items: filteredAbbrevs, total: abbreviationsList.length };
      default: return { items: [], total: 0 };
    }
  }
</script>

<div class="word-library">
  <div class="search-bar">
    <input
      type="text"
      placeholder="Search across all word lists..."
      bind:value={searchQuery}
      class="search-input"
    />
    {#if searchQuery}
      <button class="clear-search" on:click={() => (searchQuery = '')}>Clear</button>
    {/if}
  </div>

  <div class="group-tabs">
    {#each groups as group}
      {@const filtered = getFiltered(group.key)}
      <button
        class="group-tab"
        class:active={activeGroup === group.key}
        on:click={() => (activeGroup = group.key)}
        style="--tab-color: {group.color}"
      >
        <span class="tab-label">{group.label}</span>
        <span class="tab-count">
          {#if searchQuery}
            {filtered.items.length}/{filtered.total}
          {:else}
            {filtered.total}
          {/if}
        </span>
      </button>
    {/each}
  </div>

  <div class="word-display">
    {#each groups as group}
      {#if activeGroup === group.key}
        {@const filtered = getFiltered(group.key)}
        {#if filtered.items.length === 0}
          <div class="empty-state">No matches found for "{searchQuery}"</div>
        {:else if group.key === 'nominalizations'}
          <div class="chip-grid">
            {#each filteredNom as nom}
              <span class="word-chip" style="background-color: {group.color}; color: {group.textColor}">
                {nom.word} <span class="nom-arrow">&rarr;</span> {nom.suggestion}
              </span>
            {/each}
          </div>
        {:else}
          <div class="chip-grid">
            {#each filtered.items as word}
              <span class="word-chip" style="background-color: {group.color}; color: {group.textColor}">
                {word}
              </span>
            {/each}
          </div>
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .word-library {
    margin-bottom: 2rem;
  }

  .search-bar {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .search-input {
    flex: 1;
    padding: 0.6rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    font-size: 1rem;
  }

  .search-input:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px var(--accent-color-transparent);
  }

  .clear-search {
    padding: 0.6rem 1rem;
    background-color: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--secondary-text);
    cursor: pointer;
    font-size: 0.9rem;
  }

  .clear-search:hover {
    background-color: var(--button-hover);
  }

  .group-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .group-tab {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .group-tab:hover {
    border-color: var(--accent-color);
  }

  .group-tab.active {
    background-color: var(--tab-color);
    border-color: transparent;
  }

  .tab-count {
    font-size: 0.75rem;
    padding: 0.1rem 0.4rem;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }

  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .word-chip {
    display: inline-block;
    padding: 0.3rem 0.7rem;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .nom-arrow {
    opacity: 0.7;
    margin: 0 0.15rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: var(--secondary-text);
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    .group-tabs {
      overflow-x: auto;
      flex-wrap: nowrap;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 0.25rem;
    }

    .group-tabs::-webkit-scrollbar {
      display: none;
    }

    .group-tab {
      white-space: nowrap;
      flex-shrink: 0;
    }

    .chip-grid {
      gap: 0.3rem;
    }
  }
</style>
