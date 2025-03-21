<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { slide } from "svelte/transition";
  import { browser } from "$app/environment";
  import {
    detectWeaselWords,
    detectPassiveVoice,
    detectDuplicateWords,
    removeDuplicateWord,
  } from "./detector";
  import "../styles/main.scss";

  let editor: HTMLTextAreaElement;
  let lineNumbersContainer: HTMLDivElement;
  let highlightOverlay: HTMLDivElement;
  let theme: "light" | "dark" | "system" = "system";
  let currentTheme: "light" | "dark" = "light";
  let mounted = false;
  let showAbout = false; // State for the expandable section
  let editorContent = `Type or paste your text here.
This editor will highlight weasel words, passive voice, and duplicate words.

For example:
- Weasel words: Using very and extremely is not good for technical writing.
- Passive voice: The code was written by the team.
- Duplicate words: Sometimes the the brain will miss duplicated words.`;

  // Font measurements
  let charWidth = 7.8; // Will be measured precisely
  let lineHeight = 20; // Will be measured precisely

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

  // Position information
  let linePositions: number[] = [];
  let lineCount = 0;

  // Toggle the about section
  function toggleAbout() {
    showAbout = !showAbout;
  }

  // Measure character dimensions for precise positioning
  function measureCharacterDimensions() {
    if (!editor) return;

    // Create a more accurate measurement span
    const span = document.createElement("span");
    span.textContent = "X";
    span.style.fontFamily = getComputedStyle(editor).fontFamily;
    span.style.fontSize = getComputedStyle(editor).fontSize;
    span.style.letterSpacing = getComputedStyle(editor).letterSpacing;
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre";

    document.body.appendChild(span);
    charWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);

    // Get computed line height for more accuracy
    const computedStyle = getComputedStyle(editor);
    const computedLineHeight = computedStyle.lineHeight;

    if (computedLineHeight === "normal") {
      // If line-height is 'normal', use a multiplier of font size
      lineHeight = parseFloat(computedStyle.fontSize) * 1.2;
    } else {
      lineHeight = parseFloat(computedLineHeight);
    }
  }

  // Handle text changes and perform analysis
  function handleTextChange() {
    if (!browser) return;

    const text = editorContent;

    // Calculate line positions for faster lookup
    calculateLinePositions(text);

    // Detect issues
    weaselWords = detectWeaselWords(text);
    passiveVoices = detectPassiveVoice(text);
    duplicateWords = detectDuplicateWords(text);

    // Update counts
    weaselCount = weaselWords.length;
    passiveCount = passiveVoices.length;
    duplicateCount = duplicateWords.length;
    totalIssues = weaselCount + passiveCount + duplicateCount;

    // Update line numbers and highlighting
    updateLineNumbers();
    updateHighlights();
  }

  // Calculate line positions for finding line numbers of issues
  function calculateLinePositions(text: string) {
    linePositions = [0]; // First line starts at index 0
    let pos = 0;

    while (pos < text.length) {
      pos = text.indexOf("\n", pos) + 1;
      if (pos === 0) break; // No more newlines
      linePositions.push(pos);
    }

    lineCount = linePositions.length;
  }

  // Get line and column for a character position (1-indexed)
  function getLineAndColumn(index: number): { line: number; column: number } {
    // Find which line contains this index
    let lineIndex = 0;
    for (let i = 1; i < linePositions.length; i++) {
      if (linePositions[i] > index) break;
      lineIndex = i;
    }

    // Column is the distance from the line start (1-indexed)
    const column = index - linePositions[lineIndex] + 1;

    return { line: lineIndex + 1, column };
  }

  // Format position as "line:column"
  function formatPosition(index: number): string {
    const { line, column } = getLineAndColumn(index);
    return `${line}:${column}`;
  }

  // Update line numbers
  function updateLineNumbers() {
    if (!lineNumbersContainer) return;

    lineNumbersContainer.innerHTML = "";
    const linesCount = (editorContent.match(/\n/g) || []).length + 1;

    for (let i = 1; i <= linesCount; i++) {
      const lineNumber = document.createElement("div");
      lineNumber.className = "line-number";
      lineNumber.textContent = String(i);
      lineNumbersContainer.appendChild(lineNumber);
    }
  }

  // Enhanced scroll handling for precise highlight positioning
  function handleScroll() {
    // Sync line numbers with editor
    if (lineNumbersContainer && editor) {
      lineNumbersContainer.scrollTop = editor.scrollTop;
    }

    // Sync highlights with editor for both vertical and horizontal scrolling
    if (highlightOverlay && editor) {
      // Use direct assignment for more precise positioning
      highlightOverlay.scrollTop = editor.scrollTop;
      highlightOverlay.scrollLeft = editor.scrollLeft;
    }
  }

  // Update the highlight overlay to handle vertical scrolling correctly
  function updateHighlights() {
    if (!highlightOverlay || !editor) return;

    // Clear existing highlights
    highlightOverlay.innerHTML = "";

    // Get the total content dimensions
    const contentWidth = Math.max(editor.scrollWidth, editor.clientWidth);
    const contentHeight = Math.max(editor.scrollHeight, editor.clientHeight);

    // Create a wrapper for highlights that exactly matches the content
    const highlightsWrapper = document.createElement("div");
    highlightsWrapper.style.position = "relative";

    // Set exact dimensions to match the editor content
    highlightsWrapper.style.width = contentWidth + "px";
    highlightsWrapper.style.height = contentHeight + "px";
    highlightsWrapper.style.minHeight = "100%";

    // Add the wrapper to the highlight overlay
    highlightOverlay.appendChild(highlightsWrapper);

    // Add highlights to the wrapper
    addHighlightsToWrapper(weaselWords, "weasel-highlight", highlightsWrapper);
    addHighlightsToWrapper(
      passiveVoices,
      "passive-highlight",
      highlightsWrapper
    );
    addHighlightsDuplicateToWrapper(duplicateWords, highlightsWrapper);

    // Initialize the scroll position
    handleScroll();
  }

  // Modified function to add highlights to the wrapper
  function addHighlightsToWrapper(
    issues: Array<{ word: string; index: number; length: number }>,
    className: string,
    wrapper: HTMLElement
  ) {
    if (!editor) return;

    for (const issue of issues) {
      const highlight = document.createElement("div");
      highlight.className = `text-highlight ${className}`;

      // Position the highlight
      const position = getPositionInEditor(issue.index, issue.length);
      if (position) {
        highlight.style.left = `${position.left}px`;
        highlight.style.top = `${position.top}px`;
        highlight.style.width = `${position.width}px`;
        highlight.style.height = `${position.height}px`;

        wrapper.appendChild(highlight);
      }
    }
  }

  // Modified function to add duplicate highlights to the wrapper
  function addHighlightsDuplicateToWrapper(
    issues: Array<{ word: string; index: number; length: number }>,
    wrapper: HTMLElement
  ) {
    if (!editor) return;

    for (const issue of issues) {
      const container = document.createElement("div");
      container.className = "duplicate-highlight-container";

      const highlight = document.createElement("div");
      highlight.className = "text-highlight duplicate-highlight";

      const fixButton = document.createElement("button");
      fixButton.className = "fix-highlight-button";
      fixButton.textContent = "Fix";
      fixButton.onclick = (e) => {
        e.stopPropagation();
        handleRemoveDuplicate(issue.index, issue.length);
      };

      // Position the highlight and button
      const position = getPositionInEditor(issue.index, issue.length);
      if (position) {
        container.style.left = `${position.left}px`;
        container.style.top = `${position.top}px`;
        container.style.width = `${position.width}px`;
        container.style.height = `${position.height}px`;

        highlight.style.width = "100%";
        highlight.style.height = "100%";
        highlight.style.position = "absolute";
        highlight.style.top = "0";
        highlight.style.left = "0";

        container.appendChild(highlight);
        container.appendChild(fixButton);
        wrapper.appendChild(container);
      }
    }
  }

  // Helper function to get accurate positions even after scrolling
  function getPositionInEditor(index: number, length: number) {
    if (!editor) return null;

    // Get line and column information
    const { line, column } = getLineAndColumn(index);

    // Get editor padding from computed style
    const editorStyle = getComputedStyle(editor);
    const paddingLeft = parseFloat(editorStyle.paddingLeft) || 8; // Use 8px as default
    const paddingTop = parseFloat(editorStyle.paddingTop) || 1;

    // Apply a precise adjustment to fix the 1-character offset issue
    const characterOffset = 1.0; // Exact 1 character width offset

    // Calculate position with precise measurements
    return {
      left:
        (column - 1) * charWidth + paddingLeft - characterOffset * charWidth,
      top: (line - 1) * lineHeight + paddingTop,
      width: length * charWidth,
      height: lineHeight,
    };
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

  // Improved Go To function with horizontal scrolling and visual highlight
  function goToPosition(index: number) {
    if (!editor) return;

    // Clear any existing target highlights
    const existingHighlights = document.querySelectorAll(".target-highlight");
    existingHighlights.forEach((el) => el.remove());

    // Focus the editor
    editor.focus();

    // Get line and column information for scrolling
    const { line, column } = getLineAndColumn(index);

    // Set cursor position - select the issue
    editor.setSelectionRange(index, index + 1);

    // Calculate vertical scroll position (a few lines above for context)
    const scrollPositionY = Math.max(0, (line - 3) * lineHeight);

    // Calculate horizontal scroll position
    // First character visible should be a few characters before the target
    const contextChars = 10; // Show 10 characters before the highlighted one
    const scrollPositionX = Math.max(0, (column - contextChars) * charWidth);

    // Scroll to position (both vertically and horizontally)
    editor.scrollTop = scrollPositionY;
    editor.scrollLeft = scrollPositionX;

    // Force synchronization of highlight overlay scroll
    if (highlightOverlay) {
      highlightOverlay.scrollTop = editor.scrollTop;
      highlightOverlay.scrollLeft = editor.scrollLeft;
    }

    // Add a temporary highlight effect to make it easier to find
    const targetHighlight = document.createElement("div");
    targetHighlight.className = "target-highlight";

    // Position the highlight
    const position = getPositionInEditor(index, 1);
    if (position && highlightOverlay) {
      targetHighlight.style.left = `${position.left}px`;
      targetHighlight.style.top = `${position.top}px`;
      targetHighlight.style.width = `${position.width}px`;
      targetHighlight.style.height = `${position.height}px`;

      // Add the highlight to the overlay
      const wrapper = highlightOverlay.querySelector("div");
      if (wrapper) {
        wrapper.appendChild(targetHighlight);

        // Remove the highlight after animation completes
        setTimeout(() => {
          targetHighlight.remove();
        }, 4500); // 1.5s × 3 iterations = 4.5s
      }
    }
  }

  // Ensure highlights update on resize and scroll
  onMount(() => {
    mounted = true;
    updateTheme();

    // Measure character dimensions for precise positioning
    measureCharacterDimensions();

    // Initial analysis
    handleTextChange();

    if (editor) {
      // Use passive event listener for better performance
      editor.addEventListener("scroll", handleScroll, { passive: true });

      // Setup throttled scroll handler to reduce performance impact
      let ticking = false;
      editor.addEventListener(
        "scroll",
        () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              handleScroll();
              ticking = false;
            });
            ticking = true;
          }
        },
        { passive: true }
      );

      // Update highlights when editor dimensions change
      const resizeObserver = new ResizeObserver(() => {
        measureCharacterDimensions();
        updateHighlights();
      });

      resizeObserver.observe(editor);

      return () => {
        resizeObserver.disconnect();
        editor.removeEventListener("scroll", handleScroll);
      };
    }
  });

  // After the DOM updates, recalculate highlight positions
  afterUpdate(() => {
    if (mounted) {
      updateHighlights();
    }
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
    <div class="header-top">
      <div class="logo-title">
        <img
          src="/images/logo-small.png"
          alt="Writing Style Checker Logo"
          class="logo"
        />
        <div class="title-container">
          <h1>Writing Style Checker</h1>
          <div class="subtitle-container">
            <button
              class="subtitle-button"
              on:click={toggleAbout}
              aria-expanded={showAbout}
            >
              <p class="subtitle">
                Improve your technical writing by detecting common issues
              </p>
              <span class="dropdown-arrow" class:open={showAbout}>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L6 6L11 1"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
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
    </div>
    {#if showAbout}
      <div class="about-content" transition:slide={{ duration: 300 }}>
        <p>
          Good writing is clear, precise, and free from clutter. But even
          experienced writers fall into common traps: using vague "weasel
          words," hiding behind passive voice, or accidentally repeating words.
          This tool helps you catch these issues in real-time.
        </p>
        <p>
          Inspired by Matt Might's shell scripts for writing improvement, this
          interactive tool brings those command-line utilities to the web. Just
          type or paste your text, and see immediate feedback about potential
          improvements. You don't need to eliminate every highlight - just make
          conscious choices about your writing.
        </p>
        <p>
          <strong>Your privacy is protected</strong>: This tool runs entirely in
          your browser. Your text is never sent to any server, stored in
          databases, or shared with third parties. All analysis happens locally
          in your device.
        </p>
        <p>
          This project was built in a single day using Claude and SvelteKit. It
          demonstrates how AI-assisted development can quickly transform useful
          ideas into practical tools.
        </p>
      </div>
    {/if}
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
        <div class="line-numbers" bind:this={lineNumbersContainer}></div>
        <div class="editor-content-wrapper">
          <textarea
            bind:value={editorContent}
            bind:this={editor}
            class="editor-textarea"
            spellcheck="false"
            on:scroll={handleScroll}
          ></textarea>
          <div class="highlight-overlay" bind:this={highlightOverlay}></div>
        </div>
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
      <div class="issue-section">
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
      <div class="issue-section">
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
      </a>
      by
      <a href="https://matt.might.net" target="_blank" rel="noopener noreferrer"
        >Matt Might</a
      >
    </p>
    <p class="footer-credits">
      Made by <a
        href="https://anks.in"
        target="_blank"
        rel="noopener noreferrer">Ankur Singh</a
      >
      <a
        href="https://github.com/rush-skills/wsc"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="github-icon"
        >
          <path
            d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
          ></path>
        </svg>
      </a>
    </p>
  </footer>
</div>
