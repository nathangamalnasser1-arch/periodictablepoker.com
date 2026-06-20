import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dist = join(process.cwd(), 'dist');
const assets = join(dist, 'assets');

function readAllJs() {
  const files = readdirSync(assets).filter((f) => f.endsWith('.js'));
  return files.map((f) => readFileSync(join(assets, f), 'utf8')).join('\n');
}

const bundle = readAllJs();

const mustHave = [
  'Test all 50 molecules',
  'Molecule test',
  'One card per element',
  'CO₂',
];

const mustNotHave = [
  'Periodic Placement quiz',
];

for (const text of mustHave) {
  if (!bundle.includes(text)) {
    console.error(`smoke-build FAIL: missing "${text}" in dist bundle`);
    process.exit(1);
  }
}

for (const text of mustNotHave) {
  if (bundle.includes(text)) {
    console.error(`smoke-build FAIL: stale "${text}" still in dist bundle`);
    process.exit(1);
  }
}

console.log('smoke-build OK');
