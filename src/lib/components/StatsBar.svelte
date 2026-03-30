<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let weaselCount: number;
  export let passiveCount: number;
  export let duplicateCount: number;
  export let longSentenceCount: number;
  export let nominalizationCount: number;
  export let hedgingCount: number;
  export let adverbCount: number;
  export let aiTellsCount: number;

  const dispatch = createEventDispatcher<{ statclick: { detector: string } }>();

  $: stats = [
    { key: 'weaselWords', icon: 'W', iconClass: 'weasel-icon', label: 'Weasel Words', count: weaselCount },
    { key: 'passiveVoice', icon: 'P', iconClass: 'passive-icon', label: 'Passive Voice', count: passiveCount },
    { key: 'duplicateWords', icon: 'D', iconClass: 'duplicate-icon', label: 'Duplicate Words', count: duplicateCount },
    { key: 'longSentences', icon: 'S', iconClass: 'long-sentence-icon', label: 'Long Sentences', count: longSentenceCount },
    { key: 'nominalizations', icon: 'N', iconClass: 'nominalization-icon', label: 'Nominalizations', count: nominalizationCount },
    { key: 'hedging', icon: 'H', iconClass: 'hedging-icon', label: 'Hedging', count: hedgingCount },
    { key: 'adverbs', icon: 'A', iconClass: 'adverb-icon', label: 'Filler Adverbs', count: adverbCount },
    { key: 'aiTells', icon: 'AI', iconClass: 'ai-tells-icon', label: 'AI Tells', count: aiTellsCount },
  ];

  function handleClick(detector: string) {
    dispatch('statclick', { detector });
  }
</script>

<div class="stats">
  {#each stats as stat}
    <button
      class="stat-item stat-button"
      class:has-issues={stat.count > 0}
      on:click={() => handleClick(stat.key)}
      title="Jump to {stat.label} issues"
    >
      <div class="stat-icon {stat.iconClass}">{stat.icon}</div>
      <span class="stat-label">{stat.label}:</span>
      <span class="stat-value">{stat.count}</span>
    </button>
  {/each}
</div>

<style>
  .stat-button {
    cursor: pointer;
    border: none;
    font-family: inherit;
    font-size: inherit;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .stat-button:hover {
    transform: scale(1.03);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .stat-button:active {
    transform: scale(0.98);
  }
</style>
