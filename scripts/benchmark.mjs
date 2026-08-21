import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { gzipSync } from 'node:zlib';

const budgets = { core: 9_200, full: 13_300, css: 4_500 };
const artifacts = {
  core: await readFile(new URL('../dist/core.mjs', import.meta.url)),
  full: await readFile(new URL('../dist/index.mjs', import.meta.url)),
  css: await readFile(new URL('../dist/styles.css', import.meta.url)),
};
const sizes = Object.fromEntries(
  Object.entries(artifacts).map(([name, source]) => [name, gzipSync(source).byteLength])
);
const failed = Object.entries(sizes).filter(([name, bytes]) => bytes > budgets[name]);

console.table(
  Object.entries(sizes).map(([entry, gzipBytes]) => ({ entry, gzipBytes, budget: budgets[entry] }))
);

const { cleanup, toast } = await import('../dist/core.mjs');
const started = performance.now();
for (let index = 0; index < 10_000; index += 1) {
  toast({ id: `benchmark-${index}`, title: 'Benchmark', duration: 0 });
  cleanup();
}
const elapsed = performance.now() - started;
console.log(`10,000 create + cleanup operations: ${elapsed.toFixed(1)}ms`);

if (failed.length) {
  throw new Error(`Bundle budget exceeded: ${failed.map(([name]) => name).join(', ')}`);
}
