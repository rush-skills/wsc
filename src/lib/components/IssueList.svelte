<script lang="ts">
  export let weaselWords: Array<{ word: string; index: number; length: number }>;
  export let passiveVoices: Array<{ phrase: string; index: number; length: number }>;
  export let duplicateWords: Array<{ word: string; index: number; length: number }>;
  export let longSentences: Array<{ sentence: string; wordCount: number; index: number; length: number }>;
  export let nominalizationResults: Array<{ word: string; suggestion: string; index: number; length: number }>;
  export let hedgingResults: Array<{ phrase: string; index: number; length: number }>;
  export let adverbResults: Array<{ word: string; index: number; length: number }>;

  export let weaselCount: number;
  export let passiveCount: number;
  export let duplicateCount: number;
  export let longSentenceCount: number;
  export let nominalizationCount: number;
  export let hedgingCount: number;
  export let adverbCount: number;

  export let formatPosition: (index: number) => string;
  export let goToPosition: (index: number) => void;
  export let handleRemoveDuplicate: (index: number, length: number) => void;
</script>

{#if weaselCount > 0}
  <div class="issue-section" id="issues-weaselWords">
    <h3>Weasel Words</h3>
    <div class="issue-list">
      {#each weaselWords as { word, index }}
        <div class="issue-item">
          <span class="weasel-word-example">{word}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if passiveCount > 0}
  <div class="issue-section" id="issues-passiveVoice">
    <h3>Passive Voice</h3>
    <div class="issue-list">
      {#each passiveVoices as { phrase, index }}
        <div class="issue-item">
          <span class="passive-voice-example">{phrase}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if duplicateCount > 0}
  <div class="issue-section" id="issues-duplicateWords">
    <h3>Duplicate Words</h3>
    <div class="issue-list">
      {#each duplicateWords as { word, index, length }}
        <div class="issue-item">
          <span class="duplicate-word-example">{word}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button
            class="fix-button"
            on:click={() => handleRemoveDuplicate(index, length)}
          >
            Fix
          </button>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if longSentenceCount > 0}
  <div class="issue-section" id="issues-longSentences">
    <h3>Long Sentences</h3>
    <div class="issue-list">
      {#each longSentences as { sentence, wordCount, index }}
        <div class="issue-item">
          <span class="long-sentence-example">{sentence}</span>
          <span class="word-count-badge">{wordCount} words</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if nominalizationCount > 0}
  <div class="issue-section" id="issues-nominalizations">
    <h3>Nominalizations</h3>
    <div class="issue-list">
      {#each nominalizationResults as { word, suggestion, index }}
        <div class="issue-item">
          <span class="nominalization-example">{word}</span>
          <span class="suggestion-badge">try: {suggestion}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if hedgingCount > 0}
  <div class="issue-section" id="issues-hedging">
    <h3>Hedging Language</h3>
    <div class="issue-list">
      {#each hedgingResults as { phrase, index }}
        <div class="issue-item">
          <span class="hedging-example">{phrase}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}

{#if adverbCount > 0}
  <div class="issue-section" id="issues-adverbs">
    <h3>Filler Adverbs</h3>
    <div class="issue-list">
      {#each adverbResults as { word, index }}
        <div class="issue-item">
          <span class="adverb-example">{word}</span>
          <span class="position-indicator">{formatPosition(index)}</span>
          <button class="goto-button" on:click={() => goToPosition(index)}>
            Go to
          </button>
        </div>
      {/each}
    </div>
  </div>
{/if}
