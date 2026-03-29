import { cac } from 'cac';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { glob } from 'tinyglobby';
import { analyzeText } from '../src/core/analyzer.js';
import { allWeaselWords, hedgingPhrases, fillerAdverbs, nominalizations } from '../src/core/words.js';
import { findConfigFile, loadConfigFromFile } from '../src/core/config-node.js';
import { mergeConfig } from '../src/core/config.js';
import type { WscConfig } from '../src/core/config.js';
import { formatTextWithLineCol, formatJson, formatGitHub, formatSummary } from './formatter.js';
import type { AnalysisResult } from '../src/core/analyzer.js';

export async function run(argv: string[] = process.argv): Promise<number> {
  const cli = cac('wsc');

  cli.command('check [...files]', 'Check files for writing style issues')
    .option('--config <path>', 'Path to .wscrc.json config file')
    .option('--format <format>', 'Output format: text, json, github', { default: 'text' })
    .option('--no-color', 'Disable colored output')
    .option('--quiet', 'Only show summary')
    .option('--max-warnings <n>', 'Exit with code 1 if more than N issues', { default: -1 })
    .option('--stdin', 'Read from stdin instead of files')
    .action(async (files: string[], options: any) => {
      let config: WscConfig | undefined;

      if (options.config) {
        config = await loadConfigFromFile(resolve(options.config));
      }

      if (options.stdin) {
        const text = await readStdin();
        if (!config) {
          const configPath = await findConfigFile(process.cwd());
          if (configPath) config = await loadConfigFromFile(configPath);
        }
        const result = analyzeText(text, config);
        if (!options.quiet) {
          if (options.format === 'json') {
            process.stdout.write(formatJson([{ path: '<stdin>', result }]) + '\n');
          } else if (options.format === 'github') {
            const output = formatGitHub('<stdin>', text, result);
            if (output) process.stdout.write(output + '\n');
          } else {
            const output = formatTextWithLineCol('<stdin>', text, result);
            if (output) process.stdout.write(output + '\n');
          }
        }
        process.stdout.write(formatSummary(result.summary.total, 1) + '\n');
        return exitCode(result.summary.total, options.maxWarnings);
      }

      if (!files || files.length === 0) {
        process.stderr.write('Error: No files specified. Use --stdin to read from stdin.\n');
        return 2;
      }

      const resolvedFiles = await glob(files, { cwd: process.cwd(), absolute: true });
      if (resolvedFiles.length === 0) {
        process.stderr.write('Error: No files matched the given patterns.\n');
        return 2;
      }

      let totalIssues = 0;
      const jsonResults: Array<{ path: string; result: AnalysisResult }> = [];

      for (const filePath of resolvedFiles) {
        const text = await readFile(filePath, 'utf-8');

        let fileConfig = config;
        if (!fileConfig) {
          const configPath = await findConfigFile(dirname(filePath));
          if (configPath) fileConfig = await loadConfigFromFile(configPath);
        }

        const result = analyzeText(text, fileConfig);
        totalIssues += result.summary.total;

        if (options.format === 'json') {
          jsonResults.push({ path: filePath, result });
        } else if (!options.quiet && result.summary.total > 0) {
          if (options.format === 'github') {
            process.stdout.write(formatGitHub(filePath, text, result) + '\n');
          } else {
            process.stdout.write(formatTextWithLineCol(filePath, text, result) + '\n');
          }
        }
      }

      if (options.format === 'json' && !options.quiet) {
        process.stdout.write(formatJson(jsonResults) + '\n');
      }

      if (options.format !== 'json') {
        process.stdout.write(formatSummary(totalIssues, resolvedFiles.length) + '\n');
      }

      return exitCode(totalIssues, options.maxWarnings);
    });

  cli.command('list [detector]', 'List word lists for a detector')
    .action(async (detector?: string) => {
      if (!detector) {
        process.stdout.write('Available detectors: weaselWords, passiveVoice, duplicateWords, longSentences, nominalizations, hedging, adverbs\n');
        return 0;
      }

      switch (detector) {
        case 'weaselWords':
          process.stdout.write(allWeaselWords.join('\n') + '\n');
          break;
        case 'hedging':
          process.stdout.write(hedgingPhrases.join('\n') + '\n');
          break;
        case 'adverbs':
          process.stdout.write(fillerAdverbs.join('\n') + '\n');
          break;
        case 'nominalizations':
          process.stdout.write(nominalizations.map(n => `${n.word} → ${n.suggestion}`).join('\n') + '\n');
          break;
        default:
          process.stdout.write(`Detector "${detector}" does not have a configurable word list.\n`);
      }
      return 0;
    });

  cli.command('init', 'Create a .wscrc.json config file')
    .action(async () => {
      const configPath = resolve('.wscrc.json');
      const config = {
        $schema: 'https://wsc.theserverless.dev/schema.json',
        detectors: {
          weaselWords: { enabled: true },
          passiveVoice: { enabled: true },
          duplicateWords: { enabled: true },
          longSentences: { enabled: true, maxWords: 30 },
          nominalizations: { enabled: true },
          hedging: { enabled: true },
          adverbs: { enabled: true },
        },
      };
      await writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
      process.stdout.write(`Created ${configPath}\n`);
      return 0;
    });

  cli.help();
  cli.version('1.0.0');

  try {
    cli.parse(argv, { run: false });
    await cli.runMatchedCommand();
  } catch (err: any) {
    if (err.message) {
      process.stderr.write(`Error: ${err.message}\n`);
    }
    return 2;
  }

  return 0;
}

function exitCode(totalIssues: number, maxWarnings: number): number {
  if (totalIssues === 0) return 0;
  if (maxWarnings >= 0 && totalIssues > maxWarnings) return 1;
  if (maxWarnings < 0) return totalIssues > 0 ? 1 : 0;
  return 0;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}
