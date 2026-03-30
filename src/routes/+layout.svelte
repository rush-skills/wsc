<script lang="ts">
  import { theme, currentTheme } from '$lib/stores/theme';
  import '../styles/main.scss';
  import { slide } from 'svelte/transition';
  import { page } from '$app/stores';

  let showAbout = false;

  function toggleAbout() {
    showAbout = !showAbout;
  }
</script>

<div class="container" data-theme={$currentTheme}>
  <header>
    <div class="header-top">
      <div class="logo-title">
        <a href="/" class="logo-link">
          <img
            src="/images/logo-small.png"
            alt="Writing Style Checker Logo"
            class="logo"
          />
        </a>
        <div class="title-container">
          <a href="/" class="title-link"><h1>Writing Style Checker</h1></a>
          <div class="subtitle-container">
            <button
              class="subtitle-button"
              on:click={toggleAbout}
              aria-expanded={showAbout}
            >
              <p class="subtitle">
                Improve your technical writing
              </p>
              <span class="dropdown-arrow" class:open={showAbout}>
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
      <div class="header-right">
        <nav class="main-nav">
          <a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>Editor</a>
          <a href="/words" class="nav-link" class:active={$page.url.pathname === '/words'}>Words</a>
          <a href="/docs" class="nav-link" class:active={$page.url.pathname === '/docs'}>Docs</a>
        </nav>
        <div class="theme-switcher">
          <button
            class={$theme === 'light' ? 'active' : ''}
            on:click={() => theme.set('light')}
            title="Light Theme"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button
            class={$theme === 'dark' ? 'active' : ''}
            on:click={() => theme.set('dark')}
            title="Dark Theme"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button
            class={$theme === 'system' ? 'active' : ''}
            on:click={() => theme.set('system')}
            title="System Theme"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
        </div>
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
          improvements.
        </p>
        <p>
          <strong>Your privacy is protected</strong>: all analysis runs
          entirely in your browser. Your text is never sent to any server.
        </p>
      </div>
    {/if}
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <p>
      Based on <a
        href="https://matt.might.net/articles/shell-scripts-for-passive-voice-weasel-words-duplicates/"
        target="_blank"
        rel="noopener noreferrer"
      >Shell scripts for passive voice, weasel words, duplicates</a>
      by
      <a href="https://matt.might.net" target="_blank" rel="noopener noreferrer">Matt Might</a>
    </p>
    <p class="footer-credits">
      Made by <a
        href="https://anks.in"
        target="_blank"
        rel="noopener noreferrer">Ankur Singh</a
      >
      <a
        href="https://github.com/theserverlessdev/wsc"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
        aria-label="GitHub repository"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
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
