<script lang="ts">
  let selectedList = 'weaselWords';
  let word = '';
  let suggestion = '';

  const lists = [
    { key: 'weaselWords', label: 'Weasel Words' },
    { key: 'hedging', label: 'Hedging Phrases' },
    { key: 'adverbs', label: 'Filler Adverbs' },
    { key: 'nominalizations', label: 'Nominalizations' },
    { key: 'irregularVerbs', label: 'Irregular Verbs' },
    { key: 'abbreviations', label: 'Abbreviations' },
  ];

  function openIssue() {
    if (!word.trim()) return;

    const listLabel = lists.find(l => l.key === selectedList)?.label ?? selectedList;
    const title = encodeURIComponent(`[Word Suggestion] Add "${word.trim()}" to ${listLabel}`);

    let bodyParts = [`**Word/Phrase:** ${word.trim()}`, `**List:** ${listLabel}`];
    if (selectedList === 'nominalizations' && suggestion.trim()) {
      bodyParts.push(`**Suggested verb:** ${suggestion.trim()}`);
    }
    bodyParts.push('', '---', '_Submitted via Word Library suggest form_');

    const body = encodeURIComponent(bodyParts.join('\n'));
    const labels = encodeURIComponent('word-suggestion');

    const url = `https://github.com/theserverlessdev/wsc/issues/new?title=${title}&body=${body}&labels=${labels}`;
    window.open(url, '_blank');
  }
</script>

<div class="suggest-form">
  <h4>Suggest a Word</h4>
  <p>Think a word or phrase should be added to one of the lists?</p>

  <div class="suggest-fields">
    <select bind:value={selectedList} class="suggest-select">
      {#each lists as list}
        <option value={list.key}>{list.label}</option>
      {/each}
    </select>

    <input
      type="text"
      placeholder="Word or phrase..."
      bind:value={word}
      class="suggest-input"
    />

    {#if selectedList === 'nominalizations'}
      <input
        type="text"
        placeholder="Suggested verb..."
        bind:value={suggestion}
        class="suggest-input"
      />
    {/if}

    <button class="suggest-button" on:click={openIssue} disabled={!word.trim()}>
      Open GitHub Issue
    </button>
  </div>
</div>

<style>
  .suggest-form {
    margin-top: 2rem;
    padding: 1.5rem;
    background-color: var(--secondary-bg);
    border-radius: 8px;
    border: 1px solid var(--border-color);
  }

  .suggest-form h4 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    color: var(--accent-color);
    font-size: 1.1rem;
  }

  .suggest-form p {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--secondary-text);
    font-size: 0.9rem;
  }

  .suggest-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .suggest-select, .suggest-input {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    font-size: 0.9rem;
  }

  .suggest-select {
    min-width: 160px;
  }

  .suggest-input {
    flex: 1;
    min-width: 150px;
  }

  .suggest-button {
    padding: 0.5rem 1rem;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .suggest-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .suggest-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .suggest-fields {
      flex-direction: column;
    }

    .suggest-select, .suggest-input, .suggest-button {
      width: 100%;
    }
  }
</style>
