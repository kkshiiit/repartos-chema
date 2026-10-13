import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const base = resolve('dist');
const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
};
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(base, '.' + pathname);
    if (!file.startsWith(base + '/') && file !== base) {
      res.writeHead(403);
      return res.end();
    }
    if (!extname(file)) file = resolve(base, 'index.html');
    let body;
    try {
      body = await readFile(file);
    } catch {
      res.writeHead(404);
      return res.end('No encontrado');
    }
    res.writeHead(200, {
      'Content-Type': mime[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(500);
    res.end('Error local');
  }
}).listen(8081, '0.0.0.0', () => console.log('Demo local: http://localhost:8081'));
