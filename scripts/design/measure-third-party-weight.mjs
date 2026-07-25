// scripts/design/measure-third-party-weight.mjs
// DEV-6 pre-flight per HALT-4 cycle.
//
// Measures CE's current third-party-script transfer weight (gzipped
// on the wire). Source: audit-output/ce-scripts.json `global` array
// (with-src entries) + 2 additional GSAP plugins from the earlier
// live probe (ScrollTrigger.min.js, ScrollToPlugin.min.js).
//
// Methodology: HTTP request with `Accept-Encoding: gzip, deflate, br`,
// follow redirects, count raw bytes received without auto-decompress.
// Reports compressed size (= what users actually download).

import { request } from 'node:https';
import { request as httpRequest } from 'node:http';
import fs from 'node:fs';
import { URL } from 'node:url';

const audit = JSON.parse(fs.readFileSync('audit-output/ce-scripts.json', 'utf8'));
const auditScripts = audit.global
  .filter((s) => s.src && /^https?:/.test(s.src))
  .map((s) => ({ name: s.name, category: s.category, src: s.src }));

// Add the 2 GSAP plugins observed in the live <head> probe (DESIGN-1 Step 1).
const additionalScripts = [
  { name: 'GSAP ScrollTrigger', category: 'animation', src: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js' },
  { name: 'GSAP ScrollToPlugin', category: 'animation', src: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollToPlugin.min.js' },
];

const allScripts = [...auditScripts, ...additionalScripts];

// Fetch a URL with gzip preference, count raw bytes received.
function measure(url, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 5) return resolve({ url, error: 'too many redirects' });
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? request : httpRequest;
    const req = lib({
      method: 'GET',
      hostname: u.hostname,
      path: u.pathname + u.search,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 mygratr-design-1-perf-probe',
      },
      timeout: 15_000,
    }, (res) => {
      const status = res.statusCode || 0;
      // Follow 30x redirects
      if (status >= 300 && status < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        return measure(next, redirectCount + 1).then(resolve);
      }
      let bytes = 0;
      res.on('data', (chunk) => { bytes += chunk.length; });
      res.on('end', () => {
        resolve({
          url,
          status,
          encoding: res.headers['content-encoding'] || '(none)',
          bytes,
          contentLength: res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : null,
        });
      });
      res.on('error', (err) => resolve({ url, error: err.message }));
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'timeout' }); });
    req.end();
  });
}

console.log(`Measuring ${allScripts.length} third-party scripts (with-src only; inline scripts have zero fetch weight) …\n`);

const results = [];
let totalBytes = 0;
for (const s of allScripts) {
  const r = await measure(s.src);
  const kb = r.bytes ? (r.bytes / 1024).toFixed(2) : '—';
  const status = r.status ?? r.error ?? '?';
  console.log(
    s.name.padEnd(26),
    String(status).padEnd(6),
    String(r.encoding ?? '?').padEnd(8),
    `${kb} KB`.padEnd(12),
    s.src.slice(0, 80),
  );
  results.push({ ...s, ...r, kb: r.bytes ? r.bytes / 1024 : 0 });
  if (r.bytes && r.status >= 200 && r.status < 300) totalBytes += r.bytes;
}

console.log('\n--- summary ---');
const totalKb = totalBytes / 1024;
console.log('Total third-party weight (gzipped, on the wire):', totalKb.toFixed(2), 'KB');
console.log('Target (proposed):                                 250.00 KB');
console.log('Headroom:                                          ', (250 - totalKb).toFixed(2), 'KB',  totalKb < 250 ? '(under target)' : '(OVER target)');

console.log('\n--- by category ---');
const byCat = new Map();
for (const r of results) {
  if (!r.bytes) continue;
  const e = byCat.get(r.category) || { count: 0, bytes: 0 };
  e.count++;
  e.bytes += r.bytes;
  byCat.set(r.category, e);
}
for (const [cat, e] of [...byCat.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${cat.padEnd(15)} ${e.count} script(s)  ${(e.bytes / 1024).toFixed(2)} KB`);
}

// Persist to audit-output/design-1/
fs.mkdirSync('audit-output/design-1', { recursive: true });
fs.writeFileSync(
  'audit-output/design-1/third-party-weight.json',
  JSON.stringify({
    measuredAt: new Date().toISOString(),
    totalKb,
    target: 250,
    scripts: results.map((r) => ({
      name: r.name,
      category: r.category,
      src: r.src,
      status: r.status,
      encoding: r.encoding,
      kb: r.kb,
      error: r.error,
    })),
  }, null, 2),
);
console.log('\nWrote audit-output/design-1/third-party-weight.json');
