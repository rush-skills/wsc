<script lang="ts">
  import {
    allWeaselWords, hedgingPhrases, fillerAdverbs,
    nominalizations, irregularVerbs, abbreviations,
    aiTellsVocabulary, aiTellsPhrases,
  } from '../../core';

  let selectedList = 'weaselWords';
  let word = '';
  let suggestion = '';
  let existsMessage = '';

  const lists = [
    { key: 'weaselWords', label: 'Weasel Words' },
    { key: 'hedging', label: 'Hedging Phrases' },
    { key: 'adverbs', label: 'Filler Adverbs' },
    { key: 'nominalizations', label: 'Nominalizations' },
    { key: 'irregularVerbs', label: 'Irregular Verbs' },
    { key: 'abbreviations', label: 'Abbreviations' },
    { key: 'aiTellsVocab', label: 'AI Tells (Words)' },
    { key: 'aiTellsPhrases', label: 'AI Tells (Phrases)' },
  ];

  function checkExists(w: string, list: string): boolean {
    const lower = w.toLowerCase().trim();
    if (!lower) return false;
    switch (list) {
      case 'weaselWords': return allWeaselWords.some(x => x.toLowerCase() === lower);
      case 'hedging': return hedgingPhrases.some(x => x.toLowerCase() === lower);
      case 'adverbs': return fillerAdverbs.some(x => x.toLowerCase() === lower);
      case 'nominalizations': return nominalizations.some(x => x.word.toLowerCase() === lower);
      case 'irregularVerbs': return irregularVerbs.some(x => x.toLowerCase() === lower);
      case 'abbreviations': return abbreviations.has(lower);
      case 'aiTellsVocab': return aiTellsVocabulary.some(x => x.word.toLowerCase() === lower);
      case 'aiTellsPhrases': return aiTellsPhrases.some(x => x.phrase.toLowerCase() === lower);
      default: return false;
    }
  }

  function handleSubmit() {
    if (!word.trim()) return;

    if (checkExists(word, selectedList)) {
      existsMessage = `"${word.trim()}" already exists in the ${lists.find(l => l.key === selectedList)?.label} list.`;
      return;
    }

    existsMessage = '';
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

  // Clear exists message when inputs change
  $: if (word || selectedList) existsMessage = '';
</script>

<div class="suggest-form">
  <h4>Suggest a Word</h4>
  <p>Think a word or phrase should be added to one of the lists?</p>

  <div class="suggest-fields">
    <select bind:value={selectedList} class="suggest-select" aria-label="Select word list">
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

    <button class="suggest-button" on:click={handleSubmit} disabled={!word.trim()}>
      Suggest
    </button>
  </div>

  {#if existsMessage}
    <p class="exists-message">{existsMessage}</p>
  {/if}
</div>

<style>
  .suggest-form {
    margin-top: 2rem;
    padding: 1.25rem;
    background-color: var(--secondary-bg);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
  }

  .suggest-form h4 {
    margin-top: 0;
    margin-bottom: 0.25rem;
    font-family: var(--font-display);
    color: var(--primary-text);
    font-size: 1.05rem;
    font-weight: 600;
  }

  .suggest-form p {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--secondary-text);
    font-size: 0.85rem;
  }

  .suggest-fields {
    display: flex;
    gap: 0.5rem;
    align-items: stretch;
  }

  .suggest-select, .suggest-input {
    padding: 0.45rem 0.7rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    background-color: var(--primary-bg);
    color: var(--primary-text);
    font-size: 0.85rem;
    font-family: var(--font-body);
  }

  .suggest-select {
    min-width: 150px;
    flex-shrink: 0;
  }

  .suggest-input {
    flex: 1;
    min-width: 0;
  }

  .suggest-button {
    padding: 0.45rem 1rem;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .suggest-button:hover:not(:disabled) {
    opacity: 0.9;
  }

  .suggest-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .exists-message {
    margin-top: 0.75rem;
    margin-bottom: 0;
    color: var(--warning-color);
    font-size: 0.85rem;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    .suggest-fields {
      flex-direction: column;
    }

    .suggest-select, .suggest-input, .suggest-button {
      width: 100%;
      box-sizing: border-box;
    }

    .suggest-select {
      min-width: 0;
    }
  }
</style>
