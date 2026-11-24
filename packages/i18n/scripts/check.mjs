// CI check (ADR 0006): both locale files have the same keys, no empty strings, and the same
// {{placeholders}} in every string. Polish plural keys (_one/_few/_many/_other) are required for
// every base key that has any plural form.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '../src/locales');
const load = (n) => JSON.parse(readFileSync(join(dir, n), 'utf8'));
const en = load('en_US.json');
const pl = load('pl_PL.json');

const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? flat(v, p + k + '.') : [[p + k, v]]));
const E = new Map(flat(en));
const P = new Map(flat(pl));
const errors = [];

for (const k of E.keys()) if (!P.has(k)) errors.push(`missing in pl_PL: ${k}`);
for (const k of P.keys()) if (!E.has(k)) errors.push(`missing in en_US: ${k}`);
for (const [name, m] of [['en_US', E], ['pl_PL', P]]) {
  for (const [k, v] of m) if (typeof v !== 'string' || v.trim() === '') errors.push(`${name}: empty value ${k}`);
}
const ph = (s) => [...String(s).matchAll(/{{\s*(\w+)\s*}}/g)].map((x) => x[1]).sort().join(',');
for (const [k, v] of E) if (P.has(k) && ph(v) !== ph(P.get(k))) errors.push(`placeholder mismatch: ${k}`);

const bases = new Set([...P.keys()].filter((k) => /_(one|few|many|other)$/.test(k)).map((k) => k.replace(/_(one|few|many|other)$/, '')));
for (const b of bases) for (const f of ['one', 'few', 'many', 'other']) if (!P.has(`${b}_${f}`)) errors.push(`pl_PL plural form missing: ${b}_${f}`);

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`i18n ok: ${E.size} keys in both locales`);
