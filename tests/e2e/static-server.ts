import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { gzipSync } from 'node:zlib';

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
/** GitHub Pages처럼 텍스트 응답은 gzip으로 보낸다(Lighthouse 모바일 측정이 실제 배포와 비슷해지도록). */
const compressible = new Set(['.css', '.html', '.js', '.svg', '.xml']);

export function createStaticServer(root: string): Server {
  return createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;
    const relativePath = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
    const filePath = join(root, normalize(relativePath));
    const send = (status: number, body: Buffer, extension: string) => {
      const headers: Record<string, string> = { 'Content-Type': contentTypes[extension] ?? 'application/octet-stream' };
      const acceptsGzip = /\bgzip\b/.test(String(request.headers['accept-encoding'] ?? ''));
      if (acceptsGzip && compressible.has(extension)) {
        headers['Content-Encoding'] = 'gzip';
        headers.Vary = 'Accept-Encoding';
        body = gzipSync(body);
      }
      response.writeHead(status, headers);
      response.end(body);
    };

    try {
      send(200, await readFile(filePath), extname(filePath));
    } catch {
      send(404, await readFile(join(root, '404.html')), '.html');
    }
  });
}
