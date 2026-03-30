<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slide } from 'svelte/transition';
  import type { WscConfig } from '../../core';

  export let config: WscConfig;

  const dispatch = createEventDispatcher<{ change: void }>();

  let showJson = false;

  // Detector toggle states (default all enabled)
  let weaselEnabled = true;
  let passiveEnabled = true;
  let duplicateEnabled = true;
  let longSentencesEnabled = true;
  let nominalizationsEnabled = true;
  let hedgingEnabled = true;
  let adverbsEnabled = true;
  let aiTellsEnabled = true;

  let maxWords = 30;

  // Word list additions/removals
  let weaselAdd: string[] = [];
  let weaselRemove: string[] = [];
  let hedgingAdd: string[] = [];
  let hedgingRemove: string[] = [];
  let adverbAdd: string[] = [];
  let adverbRemove: string[] = [];
  let nomAdd: Array<{ word: string; suggestion: string }> = [];
  let nomRemove: string[] = [];

  // Input fields
  let weaselAddInput = '';
  let weaselRemoveInput = '';
  let hedgingAddInput = '';
  let hedgingRemoveInput = '';
  let adverbAddInput = '';
  let adverbRemoveInput = '';
  let nomAddWord = '';
  let nomAddSuggestion = '';
  let nomRemoveInput = '';

  $: detectors = [
    { key: 'weaselWords', label: 'Weasel Words', color: 'var(--weasel-word-bg)', enabled: weaselEnabled },
    { key: 'passiveVoice', label: 'Passive Voice', color: 'var(--passive-voice-bg)', enabled: passiveEnabled },
    { key: 'duplicateWords', label: 'Duplicate Words', color: 'var(--duplicate-word-bg)', enabled: duplicateEnabled },
    { key: 'longSentences', label: 'Long Sentences', color: 'var(--long-sentence-bg)', enabled: longSentencesEnabled },
    { key: 'nominalizations', label: 'Nominalizations', color: 'var(--nominalization-bg)', enabled: nominalizationsEnabled },
    { key: 'hedging', label: 'Hedging', color: 'var(--hedging-bg)', enabled: hedgingEnabled },
    { key: 'adverbs', label: 'Filler Adverbs', color: 'var(--adverb-bg)', enabled: adverbsEnabled },
    { key: 'aiTells', label: 'AI Tells', color: 'var(--ai-tells-bg)', enabled: aiTellsEnabled },
  ];

  function toggleDetector(key: string) {
    switch (key) {
      case 'weaselWords': weaselEnabled = !weaselEnabled; break;
      case 'passiveVoice': passiveEnabled = !passiveEnabled; break;
      case 'duplicateWords': duplicateEnabled = !duplicateEnabled; break;
      case 'longSentences': longSentencesEnabled = !longSentencesEnabled; break;
      case 'nominalizations': nominalizationsEnabled = !nominalizationsEnabled; break;
      case 'hedging': hedgingEnabled = !hedgingEnabled; break;
      case 'adverbs': adverbsEnabled = !adverbsEnabled; break;
      case 'aiTells': aiTellsEnabled = !aiTellsEnabled; break;
    }
    buildConfig();
  }

  function addWord(list: 'weaselAdd' | 'weaselRemove' | 'hedgingAdd' | 'hedgingRemove' | 'adverbAdd' | 'adverbRemove' | 'nomRemove') {
    let input: string;
    switch (list) {
      case 'weaselAdd': input = weaselAddInput.trim(); if (input && !weaselAdd.includes(input)) { weaselAdd = [...weaselAdd, input]; } weaselAddInput = ''; break;
      case 'weaselRemove': input = weaselRemoveInput.trim(); if (input && !weaselRemove.includes(input)) { weaselRemove = [...weaselRemove, input]; } weaselRemoveInput = ''; break;
      case 'hedgingAdd': input = hedgingAddInput.trim(); if (input && !hedgingAdd.includes(input)) { hedgingAdd = [...hedgingAdd, input]; } hedgingAddInput = ''; break;
      case 'hedgingRemove': input = hedgingRemoveInput.trim(); if (input && !hedgingRemove.includes(input)) { hedgingRemove = [...hedgingRemove, input]; } hedgingRemoveInput = ''; break;
      case 'adverbAdd': input = adverbAddInput.trim(); if (input && !adverbAdd.includes(input)) { adverbAdd = [...adverbAdd, input]; } adverbAddInput = ''; break;
      case 'adverbRemove': input = adverbRemoveInput.trim(); if (input && !adverbRemove.includes(input)) { adverbRemove = [...adverbRemove, input]; } adverbRemoveInput = ''; break;
      case 'nomRemove': input = nomRemoveInput.trim(); if (input && !nomRemove.includes(input)) { nomRemove = [...nomRemove, input]; } nomRemoveInput = ''; break;
    }
    buildConfig();
  }

  function removeWord(list: 'weaselAdd' | 'weaselRemove' | 'hedgingAdd' | 'hedgingRemove' | 'adverbAdd' | 'adverbRemove' | 'nomRemove', word: string) {
    switch (list) {
      case 'weaselAdd': weaselAdd = weaselAdd.filter(w => w !== word); break;
      case 'weaselRemove': weaselRemove = weaselRemove.filter(w => w !== word); break;
      case 'hedgingAdd': hedgingAdd = hedgingAdd.filter(w => w !== word); break;
      case 'hedgingRemove': hedgingRemove = hedgingRemove.filter(w => w !== word); break;
      case 'adverbAdd': adverbAdd = adverbAdd.filter(w => w !== word); break;
      case 'adverbRemove': adverbRemove = adverbRemove.filter(w => w !== word); break;
      case 'nomRemove': nomRemove = nomRemove.filter(w => w !== word); break;
    }
    buildConfig();
  }

  function addNominalization() {
    const word = nomAddWord.trim();
    const suggestion = nomAddSuggestion.trim();
    if (word && suggestion && !nomAdd.some(n => n.word === word)) {
      nomAdd = [...nomAdd, { word, suggestion }];
      nomAddWord = '';
      nomAddSuggestion = '';
      buildConfig();
    }
  }

  function removeNominalization(word: string) {
    nomAdd = nomAdd.filter(n => n.word !== word);
    buildConfig();
  }

  function handleKeydown(event: KeyboardEvent, action: () => void) {
    if (event.key === 'Enter') {
      event.preventDefault();
      action();
    }
  }

  function buildConfig() {
    const cfg: WscConfig = { detectors: {} };

    if (!weaselEnabled || weaselAdd.length || weaselRemove.length) {
      cfg.detectors!.weaselWords = {
        ...(!weaselEnabled && { enabled: false }),
        ...(weaselAdd.length && { add: [...weaselAdd] }),
        ...(weaselRemove.length && { remove: [...weaselRemove] }),
      };
    }
    if (!passiveEnabled) cfg.detectors!.passiveVoice = { enabled: false };
    if (!duplicateEnabled) cfg.detectors!.duplicateWords = { enabled: false };
    if (!longSentencesEnabled || maxWords !== 30) {
      cfg.detectors!.longSentences = {
        ...(!longSentencesEnabled && { enabled: false }),
        ...(maxWords !== 30 && { maxWords }),
      };
    }
    if (!nominalizationsEnabled || nomAdd.length || nomRemove.length) {
      cfg.detectors!.nominalizations = {
        ...(!nominalizationsEnabled && { enabled: false }),
        ...(nomAdd.length && { add: nomAdd.map(n => ({ ...n })) }),
        ...(nomRemove.length && { remove: [...nomRemove] }),
      };
    }
    if (!hedgingEnabled || hedgingAdd.length || hedgingRemove.length) {
      cfg.detectors!.hedging = {
        ...(!hedgingEnabled && { enabled: false }),
        ...(hedgingAdd.length && { add: [...hedgingAdd] }),
        ...(hedgingRemove.length && { remove: [...hedgingRemove] }),
      };
    }
    if (!adverbsEnabled || adverbAdd.length || adverbRemove.length) {
      cfg.detectors!.adverbs = {
        ...(!adverbsEnabled && { enabled: false }),
        ...(adverbAdd.length && { add: [...adverbAdd] }),
        ...(adverbRemove.length && { remove: [...adverbRemove] }),
      };
    }
    if (!aiTellsEnabled) {
      cfg.detectors!.aiTells = { enabled: false };
    }

    // Clean empty detectors object
    if (Object.keys(cfg.detectors!).length === 0) {
      config = {};
    } else {
      config = cfg;
    }
    dispatch('change');
  }

  function resetConfig() {
    weaselEnabled = passiveEnabled = duplicateEnabled = longSentencesEnabled = nominalizationsEnabled = hedgingEnabled = adverbsEnabled = aiTellsEnabled = true;
    maxWords = 30;
    weaselAdd = []; weaselRemove = [];
    hedgingAdd = []; hedgingRemove = [];
    adverbAdd = []; adverbRemove = [];
    nomAdd = []; nomRemove = [];
    config = {};
    dispatch('change');
  }

  function handleMaxWordsChange() {
    buildConfig();
  }

  $: configJson = Object.keys(config).length > 0 ? JSON.stringify(config, null, 2) : '{}';

  let configCopied = false;
  function copyConfig() {
    navigator.clipboard.writeText(configJson);
    configCopied = true;
    setTimeout(() => { configCopied = false; }, 2000);
  }
</script>

<div class="config-panel">
  <h3>Detector Settings</h3>

  <div class="detector-toggles">
    {#each detectors as det}
      <label class="toggle-row">
        <span class="toggle-color" style="background-color: {det.color}"></span>
        <span class="toggle-label">{det.label}</span>
        <button
          class="toggle-switch"
          class:active={det.enabled}
          on:click={() => toggleDetector(det.key)}
          role="switch"
          aria-checked={det.enabled}
          aria-label="Toggle {det.label}"
        >
          <span class="toggle-knob"></span>
        </button>
      </label>
    {/each}
  </div>

  {#if longSentencesEnabled}
    <div class="config-section" transition:slide={{ duration: 200 }}>
      <h4>Max Words per Sentence</h4>
      <div class="range-row">
        <input
          type="range"
          min="5"
          max="100"
          bind:value={maxWords}
          on:input={handleMaxWordsChange}
          class="range-slider"
        />
        <span class="range-value">{maxWords}</span>
      </div>
    </div>
  {/if}

  <p class="config-note">
    Passive Voice and Duplicate Words use grammar-based pattern matching and only support enable/disable.
    The other detectors support custom word list overrides via the config file.
  </p>

  {#if weaselEnabled}
  <div class="config-section" transition:slide={{ duration: 200 }}>
    <h4>Weasel Words</h4>
    <div class="word-editor">
      <div class="word-input-row">
        <input type="text" placeholder="Add word..." bind:value={weaselAddInput} on:keydown={(e) => handleKeydown(e, () => addWord('weaselAdd'))} />
        <button class="add-btn" on:click={() => addWord('weaselAdd')}>Add</button>
      </div>
      {#if weaselAdd.length}
        <div class="chip-list">
          {#each weaselAdd as word}
            <span class="chip chip-add"><span class="chip-prefix">+</span>{word}<button class="chip-remove" on:click={() => removeWord('weaselAdd', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
      <div class="word-input-row">
        <input type="text" placeholder="Remove word..." bind:value={weaselRemoveInput} on:keydown={(e) => handleKeydown(e, () => addWord('weaselRemove'))} />
        <button class="add-btn remove-btn" on:click={() => addWord('weaselRemove')}>Remove</button>
      </div>
      {#if weaselRemove.length}
        <div class="chip-list">
          {#each weaselRemove as word}
            <span class="chip chip-remove-item"><span class="chip-prefix">-</span>{word}<button class="chip-remove" on:click={() => removeWord('weaselRemove', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  {/if}

  {#if hedgingEnabled}
  <div class="config-section" transition:slide={{ duration: 200 }}>
    <h4>Hedging Phrases</h4>
    <div class="word-editor">
      <div class="word-input-row">
        <input type="text" placeholder="Add phrase..." bind:value={hedgingAddInput} on:keydown={(e) => handleKeydown(e, () => addWord('hedgingAdd'))} />
        <button class="add-btn" on:click={() => addWord('hedgingAdd')}>Add</button>
      </div>
      {#if hedgingAdd.length}
        <div class="chip-list">
          {#each hedgingAdd as word}
            <span class="chip chip-add"><span class="chip-prefix">+</span>{word}<button class="chip-remove" on:click={() => removeWord('hedgingAdd', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
      <div class="word-input-row">
        <input type="text" placeholder="Remove phrase..." bind:value={hedgingRemoveInput} on:keydown={(e) => handleKeydown(e, () => addWord('hedgingRemove'))} />
        <button class="add-btn remove-btn" on:click={() => addWord('hedgingRemove')}>Remove</button>
      </div>
      {#if hedgingRemove.length}
        <div class="chip-list">
          {#each hedgingRemove as word}
            <span class="chip chip-remove-item"><span class="chip-prefix">-</span>{word}<button class="chip-remove" on:click={() => removeWord('hedgingRemove', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  {/if}

  {#if adverbsEnabled}
  <div class="config-section" transition:slide={{ duration: 200 }}>
    <h4>Filler Adverbs</h4>
    <div class="word-editor">
      <div class="word-input-row">
        <input type="text" placeholder="Add adverb..." bind:value={adverbAddInput} on:keydown={(e) => handleKeydown(e, () => addWord('adverbAdd'))} />
        <button class="add-btn" on:click={() => addWord('adverbAdd')}>Add</button>
      </div>
      {#if adverbAdd.length}
        <div class="chip-list">
          {#each adverbAdd as word}
            <span class="chip chip-add"><span class="chip-prefix">+</span>{word}<button class="chip-remove" on:click={() => removeWord('adverbAdd', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
      <div class="word-input-row">
        <input type="text" placeholder="Remove adverb..." bind:value={adverbRemoveInput} on:keydown={(e) => handleKeydown(e, () => addWord('adverbRemove'))} />
        <button class="add-btn remove-btn" on:click={() => addWord('adverbRemove')}>Remove</button>
      </div>
      {#if adverbRemove.length}
        <div class="chip-list">
          {#each adverbRemove as word}
            <span class="chip chip-remove-item"><span class="chip-prefix">-</span>{word}<button class="chip-remove" on:click={() => removeWord('adverbRemove', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  {/if}

  {#if nominalizationsEnabled}
  <div class="config-section" transition:slide={{ duration: 200 }}>
    <h4>Nominalizations</h4>
    <div class="word-editor">
      <div class="word-input-row nom-row">
        <input type="text" placeholder="Word..." bind:value={nomAddWord} on:keydown={(e) => handleKeydown(e, addNominalization)} />
        <input type="text" placeholder="Suggestion..." bind:value={nomAddSuggestion} on:keydown={(e) => handleKeydown(e, addNominalization)} />
        <button class="add-btn" on:click={addNominalization}>Add</button>
      </div>
      {#if nomAdd.length}
        <div class="chip-list">
          {#each nomAdd as nom}
            <span class="chip chip-add"><span class="chip-prefix">+</span>{nom.word} &rarr; {nom.suggestion}<button class="chip-remove" on:click={() => removeNominalization(nom.word)} aria-label="Remove {nom.word}">&times;</button></span>
          {/each}
        </div>
      {/if}
      <div class="word-input-row">
        <input type="text" placeholder="Remove nominalization..." bind:value={nomRemoveInput} on:keydown={(e) => handleKeydown(e, () => addWord('nomRemove'))} />
        <button class="add-btn remove-btn" on:click={() => addWord('nomRemove')}>Remove</button>
      </div>
      {#if nomRemove.length}
        <div class="chip-list">
          {#each nomRemove as word}
            <span class="chip chip-remove-item"><span class="chip-prefix">-</span>{word}<button class="chip-remove" on:click={() => removeWord('nomRemove', word)} aria-label="Remove {word}">&times;</button></span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  {/if}

  <div class="config-actions">
    <button class="json-toggle" on:click={() => (showJson = !showJson)}>
      {showJson ? 'Hide' : 'Show'} JSON
    </button>
    <button class="reset-btn" on:click={resetConfig}>Reset to Defaults</button>
  </div>

  {#if showJson}
    <div class="json-preview" transition:slide={{ duration: 200 }}>
      <div class="code-block">
        <div class="code-block-header">
          <span>Config JSON</span>
          <button class="copy-button" on:click={copyConfig}>
            {configCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre><code>{configJson}</code></pre>
      </div>
    </div>
  {/if}
</div>

<style>
  .config-panel {
    padding: 1.5rem;
    background-color: var(--secondary-bg);
    border-radius: 8px;
    border: 1px solid var(--border-color);
    margin-bottom: 1.5rem;
  }

  .config-panel h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--accent-color);
    font-size: 1.2rem;
  }

  .config-panel h4 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: var(--primary-text);
    font-size: 0.95rem;
  }

  .detector-toggles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 0.5rem;
    margin-bottom: 1.25rem;
  }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background-color: var(--primary-bg);
    border-radius: 6px;
    cursor: pointer;
  }

  .toggle-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .toggle-label {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .toggle-switch {
    position: relative;
    width: 36px;
    height: 20px;
    background-color: var(--border-color);
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
    padding: 0;
    flex-shrink: 0;
  }

  .toggle-switch.active {
    background-color: var(--accent-color);
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .toggle-switch.active .toggle-knob {
    transform: translateX(16px);
  }

  .config-note {
    font-size: 0.85rem;
    color: var(--secondary-text);
    font-style: italic;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }

  .config-section {
    margin-bottom: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }

  .range-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .range-slider {
    flex: 1;
    accent-color: var(--accent-color);
  }

  .range-value {
    font-weight: 600;
    min-width: 3ch;
    text-align: center;
    font-size: 0.95rem;
  }

  .word-editor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .word-input-row {
    display: flex;
    gap: 0.5rem;
  }

  .word-input-row input {
    flex: 1;
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    font-size: 0.85rem;
  }

  .nom-row {
    flex-wrap: wrap;
  }

  .add-btn {
    padding: 0.4rem 0.8rem;
    background-color: var(--accent-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .add-btn:hover {
    opacity: 0.9;
  }

  .remove-btn {
    background-color: var(--error-color);
  }

  .chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .chip-add {
    background-color: var(--success-color);
    color: white;
  }

  .chip-remove-item {
    background-color: var(--error-color);
    color: white;
  }

  .chip-prefix {
    font-weight: 700;
    margin-right: 0.1rem;
  }

  .chip-remove {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
    padding: 0 0.1rem;
    opacity: 0.8;
  }

  .chip-remove:hover {
    opacity: 1;
  }

  .config-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border-color);
  }

  .json-toggle, .reset-btn {
    padding: 0.4rem 0.8rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--primary-bg);
    color: var(--primary-text);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background-color 0.2s;
  }

  .json-toggle:hover, .reset-btn:hover {
    background-color: var(--button-hover);
  }

  .reset-btn {
    color: var(--error-color);
    border-color: var(--error-color);
  }

  .json-preview {
    margin-top: 0.75rem;
  }

  @media (max-width: 768px) {
    .detector-toggles {
      grid-template-columns: 1fr;
    }

    .word-input-row {
      flex-wrap: wrap;
    }

    .word-input-row input {
      min-width: 0;
    }

    .config-actions {
      flex-wrap: wrap;
    }
  }
</style>
