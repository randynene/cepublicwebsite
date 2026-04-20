const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- Config ---
const WF_BASE = 'https://api.webflow.com/v2';
const WF_TOKEN = 'bb49fb9226b4a223b5f0712f8bb4b67770ee6717429627373961e581392c4e56';
const SITE_ID = '673326831abed6267051fa11';
const SUPABASE_URL = 'https://xpzrhzfzppypxbipvyzm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwenJoemZ6cHB5cHhiaXB2eXptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY1NTgwNiwiZXhwIjoyMDkyMjMxODA2fQ.MXTmIEuMcSVUBpcN33MOZSdbspCt5S3k2B_abq_O9Xo';

const headers = {
  Authorization: `Bearer ${WF_TOKEN}`,
  'accept': 'application/json',
};

async function wfGet(endpoint) {
  const res = await fetch(`${WF_BASE}${endpoint}`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Webflow API error ${res.status} on ${endpoint}: ${text}`);
  }
  return res.json();
}

async function wfPaginate(endpoint, dataKey) {
  let items = [];
  let offset = 0;
  const limit = 100;
  while (true) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${sep}limit=${limit}&offset=${offset}`;
    const data = await wfGet(url);
    const page = data[dataKey] || [];
    items = items.concat(page);
    const total = data.pagination?.total;
    if (total != null) {
      console.log(`  ... fetched ${items.length}/${total}`);
      if (items.length >= total) break;
    } else {
      if (page.length < limit) break;
    }
    offset += limit;
  }
  return items;
}

async function main() {
  console.log('--- Webflow Inventory Report ---\n');

  // 1. Site details
  console.log('Fetching site details...');
  const site = await wfGet(`/sites/${SITE_ID}`);

  // Locales
  let locales = [];
  try {
    const localeData = await wfGet(`/sites/${SITE_ID}/locales`);
    locales = localeData.locales || [];
  } catch (e) {
    console.log('  (locales endpoint not available or no locales)');
  }

  // 2. Pages
  console.log('Fetching pages...');
  const pages = await wfPaginate(`/sites/${SITE_ID}/pages`, 'pages');
  console.log(`  Found ${pages.length} pages`);

  // 3. Collections
  console.log('Fetching CMS collections...');
  const collectionsData = await wfGet(`/sites/${SITE_ID}/collections`);
  const collections = collectionsData.collections || [];
  console.log(`  Found ${collections.length} collections`);

  // 4. Collection fields + item counts
  console.log('Fetching collection fields and item counts...');
  const collectionDetails = [];
  for (const col of collections) {
    const detail = await wfGet(`/collections/${col.id}`);
    const fields = detail.fields || [];

    // Get item count
    let itemCount = 0;
    try {
      const itemsData = await wfGet(`/collections/${col.id}/items?limit=1&offset=0`);
      itemCount = itemsData.pagination?.total || itemsData.total || 0;
    } catch (e) {
      // Some collections may not support items listing
    }

    collectionDetails.push({
      id: col.id,
      slug: detail.slug,
      displayName: detail.displayName,
      singularName: detail.singularName,
      fieldCount: fields.length,
      itemCount,
      fields: fields.map(f => ({
        id: f.id,
        slug: f.slug,
        displayName: f.displayName,
        type: f.type,
        required: f.isRequired || false,
        validations: f.validations || {},
      })),
    });
    console.log(`  ${detail.displayName}: ${fields.length} fields, ${itemCount} items`);
  }

  // 5. Custom code
  console.log('Fetching custom code...');
  let customCode = [];
  try {
    const codeData = await wfGet(`/sites/${SITE_ID}/custom_code`);
    customCode = codeData.scripts || codeData.registeredScripts || [];
  } catch (e) {
    console.log('  (custom code endpoint returned error, trying alternate)');
    try {
      const codeData = await wfGet(`/sites/${SITE_ID}/registered_scripts`);
      customCode = codeData.registeredScripts || [];
    } catch (e2) {
      console.log('  (no custom code endpoints available)');
    }
  }

  // 6. Forms
  console.log('Fetching forms...');
  let forms = [];
  try {
    const formsData = await wfGet(`/sites/${SITE_ID}/forms`);
    forms = formsData.forms || [];
  } catch (e) {
    console.log('  (forms endpoint not available)');
  }

  // 7. Supabase connection check
  console.log('\nVerifying Supabase connection...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  let supabaseStatus = 'unknown';
  try {
    const { data, error } = await supabase.from('_dummy_ping').select('*').limit(1);
    // Even a "relation does not exist" error means the connection works
    supabaseStatus = error ? `connected (table check: ${error.message})` : 'connected';
  } catch (e) {
    supabaseStatus = `error: ${e.message}`;
  }
  console.log(`  Supabase: ${supabaseStatus}`);

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    supabaseStatus,
    site: {
      id: site.id,
      name: site.displayName || site.name,
      shortName: site.shortName,
      domain: site.defaultDomain || site.domain,
      publishedDomains: site.customDomains || site.publishedDomains || [],
      locales,
    },
    pages: pages.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      parentId: p.parentId || null,
      draft: p.draft || false,
    })),
    collections: collectionDetails,
    customCode,
    forms,
    summary: {
      totalPages: pages.length,
      totalCollections: collections.length,
      cmsItemsPerCollection: collectionDetails.reduce((acc, c) => {
        acc[c.displayName] = c.itemCount;
        return acc;
      }, {}),
      totalCustomCodeBlocks: customCode.length,
      totalForms: forms.length,
    },
  };

  // Output
  console.log('\n=== INVENTORY REPORT ===\n');
  console.log(JSON.stringify(report, null, 2));

  // Save to file
  const outDir = path.join(__dirname, '..', 'audit-output');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'ce-inventory.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
