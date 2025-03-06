<script lang="ts">
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import {
    detectWeaselWords,
    detectPassiveVoice,
    detectDuplicateWords,
    removeDuplicateWord,
  } from "./detector";
  import "./styles/main.scss";

  let editor: HTMLTextAreaElement;
  let theme: "light" | "dark" | "system" = "system";
  let currentTheme: "light" | "dark" = "light";
  let mounted = false;
  let editorContent = `Type or paste your text here.
This editor will highlight weasel words, passive voice, and duplicate words.

For example:
- Weasel words: Using very and extremely is not good for technical writing.
- Passive voice: The code was written by the team.
- Duplicate words: Sometimes the the brain will miss duplicated words.`;

  // Statistics
  let weaselCount = 0;
  let passiveCount = 0;
  let duplicateCount = 0;
  let totalIssues = 0;

  // Issue detection results
  let weaselWords: Array<{ word: string; index: number; length: number }> = [];
  let passiveVoices: Array<{ phrase: string; index: number; length: number }> =
    [];
  let duplicateWords: Array<{ word: string; index: number; length: number }> =
    [];

  // Handle text changes and perform analysis
  function handleTextChange() {
    if (!browser) return;

    const text = editorContent;

    // Detect issues
    weaselWords = detectWeaselWords(text);
    passiveVoices = detectPassiveVoice(text);
    duplicateWords = detectDuplicateWords(text);

    // Update counts
    weaselCount = weaselWords.length;
    passiveCount = passiveVoices.length;
    duplicateCount = duplicateWords.length;
    totalIssues = weaselCount + passiveCount + duplicateCount;
  }

  // Set up theme
  function updateTheme() {
    if (!browser) return;

    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      currentTheme = prefersDark ? "dark" : "light";
    } else {
      currentTheme = theme;
    }

    document.documentElement.setAttribute("data-theme", currentTheme);
  }

  // Handle removing duplicate words
  function handleRemoveDuplicate(index: number, length: number) {
    editorContent = removeDuplicateWord(editorContent, index, length);
    handleTextChange();
  }

  // Handle Go To button functionality
  function goToPosition(index: number) {
    if (!editor) return;

    // Focus the editor
    editor.focus();

    // Set cursor position
    editor.setSelectionRange(index, index + 1);

    // Calculate the position for scrolling
    const lineHeight = parseInt(getComputedStyle(editor).lineHeight) || 20;
    const lines = editorContent.substring(0, index).split("\n").length - 1;
    const scrollPosition = lines * lineHeight;

    // Scroll to position
    editor.scrollTop = scrollPosition;
  }

  // Initialize on mount
  onMount(() => {
    mounted = true;
    updateTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    // Initial analysis
    handleTextChange();

    return () => {
      mediaQuery.removeEventListener("change", updateTheme);
    };
  });

  // Update theme when it changes
  $: if (mounted && theme) {
    updateTheme();
  }

  // Analyze text when it changes
  $: if (mounted && editorContent !== undefined) {
    handleTextChange();
  }
</script>

<div class="container" data-theme={currentTheme}>
  <header>
    <div class="header-left">
      <h1>Writing Style Checker</h1>
      <p class="subtitle">Improve your writing by detecting common issues</p>
    </div>
    <div class="theme-switcher">
      <button
        class={theme === "light" ? "active" : ""}
        on:click={() => (theme = "light")}
        title="Light Theme"
      >
        <span class="icon">☀️</span>
        <span class="label">Light</span>
      </button>
      <button
        class={theme === "dark" ? "active" : ""}
        on:click={() => (theme = "dark")}
        title="Dark Theme"
      >
        <span class="icon">🌙</span>
        <span class="label">Dark</span>
      </button>
      <button
        class={theme === "system" ? "active" : ""}
        on:click={() => (theme = "system")}
        title="System Theme"
      >
        <span class="icon">⚙️</span>
        <span class="label">System</span>
      </button>
    </div>
  </header>

  <main>
    <div class="editor-wrapper">
      <div class="editor-header">
        <div class="editor-title">Editor</div>
        <div class="editor-stats">
          <div class="stat-item" class:has-issues={totalIssues > 0}>
            <span class="stat-value">{totalIssues}</span>
            <span class="stat-label">total issues</span>
          </div>
        </div>
      </div>

      <div class="editor-container">
        <textarea
          bind:value={editorContent}
          bind:this={editor}
          class="editor-textarea"
          spellcheck="false"
        ></textarea>
      </div>

      <div class="stats">
        <div class="stat-item" class:has-issues={weaselCount > 0}>
          <div class="stat-icon weasel-icon">W</div>
          <span class="stat-label">Weasel Words:</span>
          <span class="stat-value">{weaselCount}</span>
        </div>
        <div class="stat-item" class:has-issues={passiveCount > 0}>
          <div class="stat-icon passive-icon">P</div>
          <span class="stat-label">Passive Voice:</span>
          <span class="stat-value">{passiveCount}</span>
        </div>
        <div class="stat-item" class:has-issues={duplicateCount > 0}>
          <div class="stat-icon duplicate-icon">D</div>
          <span class="stat-label">Duplicate Words:</span>
          <span class="stat-value">{duplicateCount}</span>
        </div>
      </div>
    </div>

    {#if weaselCount > 0}
      <div class="issue-section">
        <h3>Weasel Words</h3>
        <div class="issue-list">
          {#each weaselWords as { word, index }}
            <div class="issue-item">
              <span class="weasel-word-example">{word}</span>
              <button class="goto-button" on:click={() => goToPosition(index)}>
                Go to
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if passiveCount > 0}
      <div class="issue-section">
        <h3>Passive Voice</h3>
        <div class="issue-list">
          {#each passiveVoices as { phrase, index }}
            <div class="issue-item">
              <span class="passive-voice-example">{phrase}</span>
              <button class="goto-button" on:click={() => goToPosition(index)}>
                Go to
              </button>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if duplicateCount > 0}
      <div class="issue-section">
        <h3>Duplicate Words</h3>
        <div class="issue-list">
          {#each duplicateWords as { word, index, length }}
            <div class="issue-item">
              <span class="duplicate-word-example">{word}</span>
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

    <div class="legend">
      <h3>How to use this tool:</h3>
      <p>
        This tool highlights three common writing issues that can weaken your
        writing:
      </p>
      <div class="legend-items">
        <div class="legend-item">
          <span class="weasel-word-example">Weasel Words</span>
          <p>
            Words that sound good without conveying information (very,
            extremely, various, etc.)
          </p>
        </div>
        <div class="legend-item">
          <span class="passive-voice-example">Passive Voice</span>
          <p>
            Constructions where the subject receives the action rather than
            performing it
          </p>
        </div>
        <div class="legend-item">
          <span class="duplicate-word-example">Duplicate Words</span>
          <p>
            Repeated adjacent words (click on highlighted duplicates to remove
            them)
          </p>
        </div>
      </div>
      <p class="legend-note">
        Note: The goal is not to eliminate all highlighted issues, but to make
        conscious choices about their use.
      </p>
    </div>
  </main>

  <footer>
    <p>
      Based on <a
        href="https://matt.might.net/articles/shell-scripts-for-passive-voice-weasel-words-duplicates/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Shell scripts for passive voice, weasel words, duplicates
      </a> by Matt Might
    </p>
  </footer>
</div>

<style>
  @import "./styles/main.scss";
</style>
