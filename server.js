import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/data.js', ['data.js', 'text/javascript; charset=utf-8']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml']]
]);

http.createServer(async (request, response) => {
  const route = new URL(request.url, `http://${request.headers.host}`).pathname;
  const file = files.get(route);
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const content = await readFile(path.join(root, file[0]));
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    response.writeHead(500); response.end('Could not load demo');
  }
}).listen(port, '127.0.0.1', () => console.log(`Thoughts demo: http://127.0.0.1:${port}`));
