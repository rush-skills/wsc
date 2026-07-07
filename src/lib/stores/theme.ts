import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'wsc-theme';

function initialChoice(): ThemeChoice {
  if (browser) {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  }
  return 'system';
}

export const theme = writable<ThemeChoice>(initialChoice());

export const currentTheme = derived(theme, ($theme): ResolvedTheme => {
  if ($theme === 'system') {
    if (browser) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return $theme;
});

if (browser) {
  // Persist the user's choice across reloads.
  theme.subscribe((choice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
  });

  // Apply the resolved theme to <html> — the single source of truth for the
  // whole page. The CSS variables cascade to everything (header + editor
  // included), so there is no second data-theme on an inner wrapper to fall out
  // of sync with (which previously left the content light while dark was on).
  currentTheme.subscribe((resolved) => {
    document.documentElement.setAttribute('data-theme', resolved);
  });

  // When following the system and the OS theme flips, re-resolve.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    theme.update((t) => t);
  });
}
