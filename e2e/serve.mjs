/**
 * Serves the static export in out/ the way production does, with no
 * dependency: clean URLs (/calendar -> calendar.html, like Cloudflare's
 * static assets), index.html for /, and 404.html for anything else.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../out/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain',
};

async function resolve(pathname) {
  const safe = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = safe.endsWith('/') ? [join(safe, 'index.html')] : [safe, `${safe}.html`, join(safe, 'index.html')];
  for (const candidate of candidates) {
    const file = join(ROOT, candidate);
    if (!file.startsWith(ROOT)) continue;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {}
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const file = await resolve(pathname);
  const target = file ?? join(ROOT, '404.html');
  res.writeHead(file ? 200 : 404, { 'content-type': TYPES[extname(target)] ?? 'application/octet-stream' });
  res.end(await readFile(target));
}).listen(PORT, () => console.log(`serving out/ on http://127.0.0.1:${PORT}`));
