const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || 'fc-3d1b5f1729824198ac0faadccc178196';
const BASE = 'https://api.firecrawl.dev/v1';

const headers = {
  Authorization: `Bearer ${FIRECRAWL_KEY}`,
  'Content-Type': 'application/json',
};

async function startCrawl() {
  console.log('Starting Firecrawl crawl of cloudemployee.io...');
  const res = await fetch(`${BASE}/crawl`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      url: 'https://cloudemployee.io',
      limit: 1500,
      scrapeOptions: { formats: [] }, // we only need URLs, skip content
    }),
  });
  const data = await res.json();
  if (!data.success && !data.id) {
    console.error('Failed to start crawl:', JSON.stringify(data, null, 2));
    process.exit(1);
  }
  console.log(`Crawl started. Job ID: ${data.id}`);
  return data.id;
}

async function pollCrawl(jobId) {
  const pollUrl = `${BASE}/crawl/${jobId}`;
  while (true) {
    const res = await fetch(pollUrl, { headers });
    const data = await res.json();
    const status = data.status;
    const completed = data.completed || 0;
    const total = data.total || 0;
    console.log(`  Status: ${status} — ${completed}/${total} pages`);

    if (status === 'completed') {
      // Collect all URLs from paginated results
      let urls = (data.data || []).map(d => d.metadata?.sourceURL || d.metadata?.url || d.url).filter(Boolean);
      let nextUrl = data.next;

      while (nextUrl) {
        console.log(`  Fetching next page of results...`);
        const nextRes = await fetch(nextUrl, { headers });
        const nextData = await nextRes.json();
        const moreUrls = (nextData.data || []).map(d => d.metadata?.sourceURL || d.metadata?.url || d.url).filter(Boolean);
        urls = urls.concat(moreUrls);
        nextUrl = nextData.next || null;
      }

      return { urls, total: data.total, completed: data.completed };
    }

    if (status === 'failed') {
      console.error('Crawl failed:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    // Wait 5 seconds before polling again
    await new Promise(r => setTimeout(r, 5000));
  }
}

async function main() {
  const jobId = await startCrawl();
  const result = await pollCrawl(jobId);

  // Dedupe and sort
  const uniqueUrls = [...new Set(result.urls)].sort();

  const report = {
    generatedAt: new Date().toISOString(),
    site: 'cloudemployee.io',
    totalUrls: uniqueUrls.length,
    crawlStats: { total: result.total, completed: result.completed },
    urls: uniqueUrls,
  };

  console.log(`\nCrawl complete: ${uniqueUrls.length} unique URLs found`);

  const outDir = path.join(__dirname, '..', 'audit-output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'ce-sitemap.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`Saved to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
