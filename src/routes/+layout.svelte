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
      <div class="header-right">
        <nav class="main-nav">
          <a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>Editor</a>
          <a href="/words" class="nav-link" class:active={$page.url.pathname === '/words'}>Word Library</a>
          <a href="/docs" class="nav-link" class:active={$page.url.pathname === '/docs'}>Docs</a>
        </nav>
        <div class="theme-switcher">
          <button
            class={$theme === 'light' ? 'active' : ''}
            on:click={() => theme.set('light')}
            title="Light Theme"
          >
            <span class="icon">&#9728;&#65039;</span>
            <span class="label">Light</span>
          </button>
          <button
            class={$theme === 'dark' ? 'active' : ''}
            on:click={() => theme.set('dark')}
            title="Dark Theme"
          >
            <span class="icon">&#127769;</span>
            <span class="label">Dark</span>
          </button>
          <button
            class={$theme === 'system' ? 'active' : ''}
            on:click={() => theme.set('system')}
            title="System Theme"
          >
            <span class="icon">&#9881;&#65039;</span>
            <span class="label">System</span>
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
          improvements. You don't need to eliminate every highlight - just make
          conscious choices about your writing.
        </p>
        <p>
          <strong>Your privacy is protected</strong>: This tool runs entirely in
          your browser. Your text is never sent to any server, stored in
          databases, or shared with third parties. All analysis happens locally
          in your device.
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
        href="https://github.com/theserverlessdev/wsc"
        target="_blank"
        rel="noopener noreferrer"
        class="github-link"
        aria-label="GitHub repository"
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
