#!/usr/bin/env node
/**
 * Dependency-free static file server for the exported `out/` directory.
 *
 * Exists so `npm start` works on a machine with nothing but Node installed —
 * no `serve`, no `http-server`, no network access required.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const PORT = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

if (!existsSync(ROOT)) {
  console.error("No `out/` directory found. Run `npm run build` first.");
  process.exit(1);
}

/** Resolve a request path to a real file inside ROOT, or null. */
function resolveFile(pathname) {
  let rel = decodeURIComponent(pathname.split("?")[0]);
  if (rel.startsWith("/")) rel = rel.slice(1);

  const candidates =
    rel === "" || rel.endsWith("/")
      ? [join(rel, "index.html")]
      : extname(rel) === ""
        ? [join(rel, "index.html"), `${rel}.html`]
        : [rel];
  candidates.push("404.html");

  for (const candidate of candidates) {
    const absolute = resolve(ROOT, candidate);
    if (!absolute.startsWith(ROOT + sep) && absolute !== ROOT) continue;
    if (existsSync(absolute) && statSync(absolute).isFile()) return absolute;
  }
  return null;
}

createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404 Not Found");
    return;
  }
  const type = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
  const immutable = file.includes(`${sep}_next${sep}static${sep}`);
  res.writeHead(file.endsWith("404.html") ? 404 : 200, {
    "content-type": type,
    "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, HOST, () => {
  console.log(`\n  Hardware Spec Dashboard — serving ./out\n  → http://${HOST}:${PORT}\n`);
});
