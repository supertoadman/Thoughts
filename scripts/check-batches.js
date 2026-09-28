import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { THOUGHTS as BASELINE_THOUGHTS } from '../data.js';
import { selectActiveBatches, validateBatch } from '../batch-loader.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'batches');
const manifest = JSON.parse(await readFile(path.join(directory, 'index.json'), 'utf8'));
selectActiveBatches(manifest);

const usedIds = new Set(BASELINE_THOUGHTS.map(item => item.id));
let thoughtCount = 0;
for (const entry of manifest.batches) {
  const batch = JSON.parse(await readFile(path.join(directory, entry.file), 'utf8'));
  thoughtCount += validateBatch(batch, entry, usedIds).length;
}
console.log(`Valid: ${BASELINE_THOUGHTS.length} baseline thoughts and ${thoughtCount} thoughts in ${manifest.batches.length} batches.`);
