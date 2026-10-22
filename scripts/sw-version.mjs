/**
 * Stamps out/sw.js with a version derived from the build, so each deploy gets
 * a new service worker and a fresh cache. Runs automatically after
 * `npm run build` (the `postbuild` script).
 *
 * The version hashes every exported file except the worker itself, so any
 * change to the app changes it. Next also writes a random build ID into the
 * export, so in practice every build gets a new version: a redeploy of the
 * same code just costs returning visitors one fresh precache.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const OUT = new URL('../out/', import.meta.url).pathname;
const WORKER = join(OUT, 'sw.js');
const PLACEHOLDER = "const CACHE = 'yliw-dev';";

const files = readdirSync(OUT, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => join(entry.parentPath, entry.name))
  .filter(file => file !== WORKER)
  .sort();

const hash = createHash('sha256');
for (const file of files) {
  hash.update(relative(OUT, file));
  hash.update(readFileSync(file));
}
const version = hash.digest('hex').slice(0, 12);

const worker = readFileSync(WORKER, 'utf8');
if (!worker.includes(PLACEHOLDER)) {
  throw new Error(`sw-version: ${PLACEHOLDER} not found in out/sw.js — update this script to match.`);
}
writeFileSync(WORKER, worker.replace(PLACEHOLDER, `const CACHE = 'yliw-${version}';`));
console.log(`sw-version: stamped out/sw.js with cache yliw-${version}`);
