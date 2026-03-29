import type { AnalysisResult } from '../src/core/analyzer.js';

export type Format = 'text' | 'json' | 'github';

export function formatText(filePath: string, result: AnalysisResult, noColor: boolean): string {
  const lines: string[] = [];
  const { issues } = result;

  const entries: Array<{ file: string; line: number; col: number; type: string; display: string }> = [];

  const getLineCol = (text: string, index: number) => {
    // We don't have the original text in AnalysisResult, so we use a simple approach
    return { line: 0, col: 0 };
  };

  // We need the original text to compute line/col. Since AnalysisResult doesn't carry it,
  // the caller must provide enriched data. For now, we format with index.
  for (const w of issues.weaselWords) {
    lines.push(`${filePath}:${w.index}  weasel-word  "${w.word}"`);
  }
  for (const p of issues.passiveVoice) {
    lines.push(`${filePath}:${p.index}  passive-voice  "${p.phrase}"`);
  }
  for (const d of issues.duplicateWords) {
    lines.push(`${filePath}:${d.index}  duplicate-word  "${d.word}"`);
  }
  for (const s of issues.longSentences) {
    lines.push(`${filePath}:${s.index}  long-sentence  ${s.wordCount} words`);
  }
  for (const n of issues.nominalizations) {
    lines.push(`${filePath}:${n.index}  nominalization  "${n.word}" → ${n.suggestion}`);
  }
  for (const h of issues.hedging) {
    lines.push(`${filePath}:${h.index}  hedging  "${h.phrase}"`);
  }
  for (const a of issues.adverbs) {
    lines.push(`${filePath}:${a.index}  filler-adverb  "${a.word}"`);
  }

  return lines.join('\n');
}

export function formatTextWithLineCol(
  filePath: string,
  text: string,
  result: AnalysisResult,
): string {
  const lines: string[] = [];
  const { issues } = result;

  const getLineCol = (index: number) => {
    const before = text.substring(0, index).split('\n');
    return { line: before.length, col: before[before.length - 1].length + 1 };
  };

  for (const w of issues.weaselWords) {
    const { line, col } = getLineCol(w.index);
    lines.push(`${filePath}:${line}:${col}  weasel-word  "${w.word}"`);
  }
  for (const p of issues.passiveVoice) {
    const { line, col } = getLineCol(p.index);
    lines.push(`${filePath}:${line}:${col}  passive-voice  "${p.phrase}"`);
  }
  for (const d of issues.duplicateWords) {
    const { line, col } = getLineCol(d.index);
    lines.push(`${filePath}:${line}:${col}  duplicate-word  "${d.word}"`);
  }
  for (const s of issues.longSentences) {
    const { line, col } = getLineCol(s.index);
    lines.push(`${filePath}:${line}:${col}  long-sentence  ${s.wordCount} words`);
  }
  for (const n of issues.nominalizations) {
    const { line, col } = getLineCol(n.index);
    lines.push(`${filePath}:${line}:${col}  nominalization  "${n.word}" → ${n.suggestion}`);
  }
  for (const h of issues.hedging) {
    const { line, col } = getLineCol(h.index);
    lines.push(`${filePath}:${line}:${col}  hedging  "${h.phrase}"`);
  }
  for (const a of issues.adverbs) {
    const { line, col } = getLineCol(a.index);
    lines.push(`${filePath}:${line}:${col}  filler-adverb  "${a.word}"`);
  }

  return lines.join('\n');
}

export function formatJson(files: Array<{ path: string; result: AnalysisResult }>): string {
  return JSON.stringify(files.map(f => ({
    file: f.path,
    ...f.result,
  })), null, 2);
}

export function formatGitHub(
  filePath: string,
  text: string,
  result: AnalysisResult,
): string {
  const lines: string[] = [];
  const { issues } = result;

  const getLineCol = (index: number) => {
    const before = text.substring(0, index).split('\n');
    return { line: before.length, col: before[before.length - 1].length + 1 };
  };

  for (const w of issues.weaselWords) {
    const { line, col } = getLineCol(w.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Weasel word: "${w.word}"`);
  }
  for (const p of issues.passiveVoice) {
    const { line, col } = getLineCol(p.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Passive voice: "${p.phrase}"`);
  }
  for (const d of issues.duplicateWords) {
    const { line, col } = getLineCol(d.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Duplicate word: "${d.word}"`);
  }
  for (const s of issues.longSentences) {
    const { line, col } = getLineCol(s.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Long sentence: ${s.wordCount} words`);
  }
  for (const n of issues.nominalizations) {
    const { line, col } = getLineCol(n.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Nominalization: "${n.word}" (try: ${n.suggestion})`);
  }
  for (const h of issues.hedging) {
    const { line, col } = getLineCol(h.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Hedging: "${h.phrase}"`);
  }
  for (const a of issues.adverbs) {
    const { line, col } = getLineCol(a.index);
    lines.push(`::warning file=${filePath},line=${line},col=${col}::Filler adverb: "${a.word}"`);
  }

  return lines.join('\n');
}

export function formatSummary(totalIssues: number, fileCount: number): string {
  if (totalIssues === 0) {
    return `No issues found in ${fileCount} file${fileCount !== 1 ? 's' : ''}.`;
  }
  return `Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} in ${fileCount} file${fileCount !== 1 ? 's' : ''}.`;
}
