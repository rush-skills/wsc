<script lang="ts">
  import { onMount, afterUpdate } from "svelte";
  import { slide } from "svelte/transition";
  import { browser } from "$app/environment";
  import {
    analyzeText,
    removeDuplicateWord,
  } from "../core";
  import type { AnalysisResult, WscConfig } from "../core";
  import StatsBar from "./components/StatsBar.svelte";
  import IssueList from "./components/IssueList.svelte";
  import Legend from "./components/Legend.svelte";
  import IntegrationSection from "./components/IntegrationSection.svelte";
  import ConfigPanel from "./components/ConfigPanel.svelte";

  let editor: HTMLTextAreaElement;
  let lineNumbersContainer: HTMLDivElement;
  let highlightOverlay: HTMLDivElement;
  let mounted = false;
  let showConfig = false;
  let toastMessage = '';
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  let userConfig: WscConfig = {};

  let editorContent = `Type or paste your text here.
This editor will highlight weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging, and filler adverbs.

For example:
- Weasel words: Using very and extremely is not good for technical writing.
- Passive voice: The code was written by the team.
- Duplicate words: Sometimes the the brain will miss duplicated words.
- Long sentences: This is a very long sentence that keeps going and going with more and more words added to it so that the sentence detector will flag it because it has many more words than the default threshold of thirty.
- Nominalizations: The implementation of the optimization led to improvement.
- Hedging: I think it seems like this could be better.
- Filler adverbs: The system is totally and utterly broken.`;

  // Font measurements
  let charWidth = 7.8;
  let lineHeight = 20;

  // Statistics
  let weaselCount = 0;
  let passiveCount = 0;
  let duplicateCount = 0;
  let longSentenceCount = 0;
  let nominalizationCount = 0;
  let hedgingCount = 0;
  let adverbCount = 0;
  let totalIssues = 0;

  // Issue detection results
  let weaselWords: Array<{ word: string; index: number; length: number }> = [];
  let passiveVoices: Array<{ phrase: string; index: number; length: number }> = [];
  let duplicateWords: Array<{ word: string; index: number; length: number }> = [];
  let longSentences: Array<{ sentence: string; wordCount: number; index: number; length: number }> = [];
  let nominalizationResults: Array<{ word: string; suggestion: string; index: number; length: number }> = [];
  let hedgingResults: Array<{ phrase: string; index: number; length: number }> = [];
  let adverbResults: Array<{ word: string; index: number; length: number }> = [];

  // Position information
  let linePositions: number[] = [];
  let lineCount = 0;

  function measureCharacterDimensions() {
    if (!editor) return;

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

    const computedStyle = getComputedStyle(editor);
    const computedLineHeight = computedStyle.lineHeight;

    if (computedLineHeight === "normal") {
      lineHeight = parseFloat(computedStyle.fontSize) * 1.2;
    } else {
      lineHeight = parseFloat(computedLineHeight);
    }
  }

  function handleTextChange() {
    if (!browser) return;

    const text = editorContent;
    calculateLinePositions(text);

    const result = analyzeText(text, userConfig);
    weaselWords = result.issues.weaselWords;
    passiveVoices = result.issues.passiveVoice;
    duplicateWords = result.issues.duplicateWords;
    longSentences = result.issues.longSentences;
    nominalizationResults = result.issues.nominalizations;
    hedgingResults = result.issues.hedging;
    adverbResults = result.issues.adverbs;

    weaselCount = weaselWords.length;
    passiveCount = passiveVoices.length;
    duplicateCount = duplicateWords.length;
    longSentenceCount = longSentences.length;
    nominalizationCount = nominalizationResults.length;
    hedgingCount = hedgingResults.length;
    adverbCount = adverbResults.length;
    totalIssues = result.summary.total;

    updateLineNumbers();
    updateHighlights();
  }

  function calculateLinePositions(text: string) {
    linePositions = [0];
    let pos = 0;

    while (pos < text.length) {
      pos = text.indexOf("\n", pos) + 1;
      if (pos === 0) break;
      linePositions.push(pos);
    }

    lineCount = linePositions.length;
  }

  function getLineAndColumn(index: number): { line: number; column: number } {
    let lineIndex = 0;
    for (let i = 1; i < linePositions.length; i++) {
      if (linePositions[i] > index) break;
      lineIndex = i;
    }

    const column = index - linePositions[lineIndex] + 1;
    return { line: lineIndex + 1, column };
  }

  function formatPosition(index: number): string {
    const { line, column } = getLineAndColumn(index);
    return `${line}:${column}`;
  }

  function updateLineNumbers() {
    if (!lineNumbersContainer) return;

    // Note: This uses innerHTML for performance with trusted numeric content only
    let html = '';
    const linesCount = (editorContent.match(/\n/g) || []).length + 1;
    for (let i = 1; i <= linesCount; i++) {
      html += `<div class="line-number">${i}</div>`;
    }
    lineNumbersContainer.innerHTML = html;
  }

  function handleScroll() {
    if (lineNumbersContainer && editor) {
      lineNumbersContainer.scrollTop = editor.scrollTop;
    }

    if (highlightOverlay && editor) {
      highlightOverlay.scrollTop = editor.scrollTop;
      highlightOverlay.scrollLeft = editor.scrollLeft;
    }
  }

  function updateHighlights() {
    if (!highlightOverlay || !editor) return;

    // Clear existing highlights using DOM methods
    while (highlightOverlay.firstChild) {
      highlightOverlay.removeChild(highlightOverlay.firstChild);
    }

    const contentWidth = Math.max(editor.scrollWidth, editor.clientWidth);
    const contentHeight = Math.max(editor.scrollHeight, editor.clientHeight);

    const highlightsWrapper = document.createElement("div");
    highlightsWrapper.style.position = "relative";
    highlightsWrapper.style.width = contentWidth + "px";
    highlightsWrapper.style.height = contentHeight + "px";
    highlightsWrapper.style.minHeight = "100%";

    highlightOverlay.appendChild(highlightsWrapper);

    addHighlightsToWrapper(weaselWords, "weasel-highlight", highlightsWrapper);
    addHighlightsToWrapper(passiveVoices, "passive-highlight", highlightsWrapper);
    addHighlightsDuplicateToWrapper(duplicateWords, highlightsWrapper);
    addHighlightsToWrapper(longSentences, "long-sentence-highlight", highlightsWrapper);
    addHighlightsToWrapper(nominalizationResults, "nominalization-highlight", highlightsWrapper);
    addHighlightsToWrapper(hedgingResults, "hedging-highlight", highlightsWrapper);
    addHighlightsToWrapper(adverbResults, "adverb-highlight", highlightsWrapper);

    handleScroll();
  }

  function addHighlightsToWrapper(
    issues: Array<{ index: number; length: number }>,
    className: string,
    wrapper: HTMLElement
  ) {
    if (!editor) return;

    for (const issue of issues) {
      const highlight = document.createElement("div");
      highlight.className = `text-highlight ${className}`;

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

  function getPositionInEditor(index: number, length: number) {
    if (!editor) return null;

    const { line, column } = getLineAndColumn(index);

    const editorStyle = getComputedStyle(editor);
    const paddingLeft = parseFloat(editorStyle.paddingLeft) || 8;
    const paddingTop = parseFloat(editorStyle.paddingTop) || 1;

    const characterOffset = 1.0;

    return {
      left:
        (column - 1) * charWidth + paddingLeft - characterOffset * charWidth,
      top: (line - 1) * lineHeight + paddingTop,
      width: length * charWidth,
      height: lineHeight,
    };
  }

  function handleRemoveDuplicate(index: number, length: number) {
    editorContent = removeDuplicateWord(editorContent, index, length);
    handleTextChange();
  }

  function goToPosition(index: number) {
    if (!editor) return;

    const existingHighlights = document.querySelectorAll(".target-highlight");
    existingHighlights.forEach((el) => el.remove());

    editor.focus();

    const { line, column } = getLineAndColumn(index);

    editor.setSelectionRange(index, index + 1);

    const scrollPositionY = Math.max(0, (line - 3) * lineHeight);
    const contextChars = 10;
    const scrollPositionX = Math.max(0, (column - contextChars) * charWidth);

    editor.scrollTop = scrollPositionY;
    editor.scrollLeft = scrollPositionX;

    if (highlightOverlay) {
      highlightOverlay.scrollTop = editor.scrollTop;
      highlightOverlay.scrollLeft = editor.scrollLeft;
    }

    const targetHighlight = document.createElement("div");
    targetHighlight.className = "target-highlight";

    const position = getPositionInEditor(index, 1);
    if (position && highlightOverlay) {
      targetHighlight.style.left = `${position.left}px`;
      targetHighlight.style.top = `${position.top}px`;
      targetHighlight.style.width = `${position.width}px`;
      targetHighlight.style.height = `${position.height}px`;

      const wrapper = highlightOverlay.querySelector("div");
      if (wrapper) {
        wrapper.appendChild(targetHighlight);

        setTimeout(() => {
          targetHighlight.remove();
        }, 4500);
      }
    }
  }

  function handleStatClick(event: CustomEvent<{ detector: string }>) {
    const { detector } = event.detail;
    const id = `issues-${detector}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      showToast('No issues found');
    }
  }

  function showToast(message: string) {
    toastMessage = message;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMessage = '';
      toastTimeout = null;
    }, 2000);
  }

  function handleConfigChange() {
    handleTextChange();
  }

  onMount(() => {
    mounted = true;

    measureCharacterDimensions();
    handleTextChange();

    if (editor) {
      editor.addEventListener("scroll", handleScroll, { passive: true });

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

  afterUpdate(() => {
    if (mounted) {
      updateHighlights();
    }
  });

  $: if (mounted && editorContent !== undefined) {
    handleTextChange();
  }
</script>

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

  <StatsBar
    {weaselCount}
    {passiveCount}
    {duplicateCount}
    {longSentenceCount}
    {nominalizationCount}
    {hedgingCount}
    {adverbCount}
    on:statclick={handleStatClick}
  />
</div>

{#if toastMessage}
  <div class="toast" transition:slide={{ duration: 200 }}>
    {toastMessage}
  </div>
{/if}

<div class="config-toggle-row">
  <button class="config-toggle-button" on:click={() => (showConfig = !showConfig)}>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.2"/>
      <path d="M8 0.5V3M8 13V15.5M15.5 8H13M3 8H0.5M13.3 2.7L11.5 4.5M4.5 11.5L2.7 13.3M13.3 13.3L11.5 11.5M4.5 4.5L2.7 2.7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    </svg>
    {showConfig ? 'Hide' : 'Show'} Config
    <span class="dropdown-arrow" class:open={showConfig}>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </span>
  </button>
</div>

{#if showConfig}
  <div transition:slide={{ duration: 300 }}>
    <ConfigPanel bind:config={userConfig} on:change={handleConfigChange} />
  </div>
{/if}

<IssueList
  {weaselWords}
  {passiveVoices}
  {duplicateWords}
  {longSentences}
  nominalizationResults={nominalizationResults}
  {hedgingResults}
  {adverbResults}
  {weaselCount}
  {passiveCount}
  {duplicateCount}
  {longSentenceCount}
  {nominalizationCount}
  {hedgingCount}
  {adverbCount}
  {formatPosition}
  {goToPosition}
  {handleRemoveDuplicate}
/>

<Legend />

<IntegrationSection />
