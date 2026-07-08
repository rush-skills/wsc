import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './config.js';
import type { WscConfig } from './config.js';

export async function loadConfigFromFile(filePath: string): Promise<WscConfig> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`);
  }

  const errors = validateConfig(parsed);
  if (errors.length > 0) {
    throw new Error(`Invalid config in ${filePath}:\n  - ${errors.join('\n  - ')}`);
  }

  return parsed as WscConfig;
}

export async function findConfigFile(startDir: string): Promise<string | null> {
  let dir = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = join(dir, '.wscrc.json');
    try {
      await readFile(candidate, 'utf-8');
      return candidate;
    } catch {
      // not found, go up
    }
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Resolve a package's version at runtime by walking up from `startUrl`
 * (pass import.meta.url) to the nearest package.json with the given name.
 * Works from both source (tsx) and compiled dist layouts.
 */
export function readPackageVersion(startUrl: string, packageName: string): string {
  let dir = dirname(fileURLToPath(startUrl));
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
      if (pkg.name === packageName) return pkg.version;
    } catch {
      // keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return '0.0.0';
}
