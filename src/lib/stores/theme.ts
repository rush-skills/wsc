import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type ThemeChoice = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const theme = writable<ThemeChoice>('system');

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
  currentTheme.subscribe((resolved) => {
    document.documentElement.setAttribute('data-theme', resolved);
  });
}
