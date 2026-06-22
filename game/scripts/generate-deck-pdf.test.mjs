import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { ELEMENTS } from '../src/data/elements.js';

const GAME_ROOT = join(import.meta.dirname, '..');
const SCRIPT = join(GAME_ROOT, 'scripts', 'generate-deck-pdf.py');
const TEST_PDF = join(GAME_ROOT, '..', 'Periodic Table Poker.test.pdf');
const TEST_LARGE_PDF = join(GAME_ROOT, '..', 'Periodic Table Poker (Large Cards).test.pdf');

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

describe('generate-deck-pdf', () => {
  it('loads 118 elements starting with H, He, Li', () => {
    expect(ELEMENTS).toHaveLength(118);
    expect(ELEMENTS.slice(0, 3).map((el) => el.symbol)).toEqual(['H', 'He', 'Li']);
  });

  it('generates a duplex-ready standard PDF with 16 pages', () => {
    if (existsSync(TEST_PDF)) unlinkSync(TEST_PDF);

    const stdout = runGenerator(['--output', TEST_PDF, '--report-json']);
    const report = JSON.parse(stdout.trim());

    expect(existsSync(TEST_PDF)).toBe(true);
    expect(statSync(TEST_PDF).size).toBeGreaterThan(0);

    expect(report.pages).toBe(16);
    expect(report.elements).toBe(118);
    expect(report.faces).toBe(120);
    expect(report.rulesCards).toBe(1);
    expect(report.qrCards).toBe(1);
    expect(report.sheets).toBe(8);
    expect(report.layout).toBe('standard');
    expect(report.first_symbols).toEqual(['H', 'He', 'Li']);
    expect(report.first_mass).toBe('1.008 u');
    expect(report.iron_mass).toBe('55.85 u');

    const pdf = readFileSync(TEST_PDF);
    expect(countPdfPages(pdf)).toBe(16);
  });

  it('generates a large half-page layout PDF with bigger cards', () => {
    if (existsSync(TEST_LARGE_PDF)) unlinkSync(TEST_LARGE_PDF);

    const stdout = runGenerator([
      '--layout',
      'large',
      '--output',
      TEST_LARGE_PDF,
      '--report-json',
    ]);
    const report = JSON.parse(stdout.trim());

    expect(existsSync(TEST_LARGE_PDF)).toBe(true);
    expect(report.layout).toBe('large');
    expect(report.faces).toBe(120);
    expect(report.pages).toBe(120);
    expect(report.sheets).toBe(60);
    expect(report.card_height_mm).toBeGreaterThan(90);
    expect(countPdfPages(readFileSync(TEST_LARGE_PDF))).toBe(120);
  });

  it('supports --dry-run with 2 pages', () => {
    const dryPath = join(GAME_ROOT, '..', 'Periodic Table Poker.dry.pdf');
    if (existsSync(dryPath)) unlinkSync(dryPath);

    const stdout = runGenerator(['--output', dryPath, '--dry-run', '--report-json']);
    const report = JSON.parse(stdout.trim());

    expect(report.pages).toBe(2);
    expect(report.sheets).toBe(1);
    expect(countPdfPages(readFileSync(dryPath))).toBe(2);

    unlinkSync(dryPath);
  });
});
