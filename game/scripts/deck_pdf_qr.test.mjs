import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const GAME_ROOT = join(import.meta.dirname, '..');
const SCRIPT = join(GAME_ROOT, 'scripts', 'deck_pdf_qr.py');

describe('deck_pdf_qr', () => {
  it('generates scannable QR images for both game URLs', () => {
    const stdout = execFileSync(
      'python',
      [
        '-c',
        [
          'import json',
          'from deck_pdf_qr import make_qr_image',
          'from PIL import Image',
          'urls = {',
          '  "ptp": "https://periodictablepoker.com",',
          '  "yko": "https://youknobtainium.web.app",',
          '}',
          'out = {}',
          'for key, url in urls.items():',
          '  img = make_qr_image(url, 120)',
          '  out[key] = {"size": img.size, "mode": img.mode}',
          'print(json.dumps(out))',
        ].join('\n'),
      ],
      { cwd: join(GAME_ROOT, 'scripts'), encoding: 'utf8' },
    );

    const result = JSON.parse(stdout.trim());
    expect(result.ptp).toEqual({ size: [120, 120], mode: 'RGB' });
    expect(result.yko).toEqual({ size: [120, 120], mode: 'RGB' });
  });
});
