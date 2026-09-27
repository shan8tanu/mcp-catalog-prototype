// Copies the data files the app loads to public/data/, byte-for-byte.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const FILES = ['servers.json', 'tool-details.json', 'synonyms.json'];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'public', 'data');
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const f of FILES) copyFileSync(join(root, 'data', f), join(dest, f));
console.log(`Copied ${FILES.join(', ')} to public/data/`);
