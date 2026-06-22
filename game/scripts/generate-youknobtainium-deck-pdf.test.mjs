import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const GAME_ROOT = join(import.meta.dirname, '..');
const SCRIPT = join(GAME_ROOT, 'scripts', 'generate-youknobtainium-deck-pdf.py');
const CARDS_JSON = join(GAME_ROOT, 'scripts', 'youknobtainium-cards.json');
const TEST_PDF = join(GAME_ROOT, '..', 'youknObtainium Deck.test.pdf');

function runGenerator(args = []) {
  return execFileSync('python', [SCRIPT, ...args], {
    cwd: GAME_ROOT,
    encoding: 'utf8',
  });
}

function countPdfPages(buffer) {
  const text = buffer.toString('latin1');
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 0;
}

describe('generate-youknobtainium-deck-pdf', () => {
  it('loads card JSON with 118 elements and 10 action cards', () => {
    const data = JSON.parse(readFileSync(CARDS_JSON, 'utf8'));
    expect(data.elements).toHaveLength(118);
    expect(data.actionCards).toHaveLength(10);
    expect(data.rulesCards).toHaveLength(2);
    expect(data.deck).toHaveLength(130);
    expect(data.elements.slice(0, 3).map((el) => el.sym)).toEqual(['H', 'He', 'Li']);
  });

  it('generates a duplex-ready PDF with 18 pages', () => {
    if (existsSync(TEST_PDF)) unlinkSync(TEST_PDF);

    const stdout = runGenerator(['--output', TEST_PDF, '--report-json']);
    const report = JSON.parse(stdout.trim());

    expect(existsSync(TEST_PDF)).toBe(true);
    expect(statSync(TEST_PDF).size).toBeGreaterThan(0);

    expect(report.pages).toBe(18);
    expect(report.sheets).toBe(9);
    expect(report.faces).toBe(131);
    expect(report.elements).toBe(118);
    expect(report.actionCards).toBe(10);
    expect(report.rulesCards).toBe(2);
    expect(report.qrCards).toBe(1);
    expect(report.first_symbols).toEqual(['H', 'He', 'Li']);

    expect(countPdfPages(readFileSync(TEST_PDF))).toBe(18);
  });

  it('supports --dry-run with 2 pages', () => {
    const dryPath = join(GAME_ROOT, '..', 'youknObtainium Deck.dry.pdf');
    if (existsSync(dryPath)) unlinkSync(dryPath);

    const stdout = runGenerator(['--output', dryPath, '--dry-run', '--report-json']);
    const report = JSON.parse(stdout.trim());

    expect(report.pages).toBe(2);
    expect(report.sheets).toBe(1);
    expect(countPdfPages(readFileSync(dryPath))).toBe(2);

    unlinkSync(dryPath);
  });
});
