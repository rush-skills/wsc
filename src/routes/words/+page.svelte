<script lang="ts">
  import WordLibrary from '$lib/components/WordLibrary.svelte';
  import SuggestWord from '$lib/components/SuggestWord.svelte';
</script>

<svelte:head>
  <title>Word Library - Writing Style Checker</title>
  <meta name="description" content="Browse all word lists used by the Writing Style Checker: weasel words, nominalizations, hedging phrases, filler adverbs, irregular verbs, and abbreviations." />
</svelte:head>

<h2 class="page-title">Word Library</h2>
<p class="page-description">Browse the complete word and phrase lists used by each detector.</p>

<WordLibrary />
<SuggestWord />

<style>
  .page-title {
    margin-top: 0;
    margin-bottom: 0.25rem;
    color: var(--accent-color);
    font-size: 1.5rem;
  }

  .page-description {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: var(--secondary-text);
  }
</style>
