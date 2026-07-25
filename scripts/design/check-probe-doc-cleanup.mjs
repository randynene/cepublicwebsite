// scripts/design/check-probe-doc-cleanup.mjs
// One-shot: verify the design1-token-probe-* doc(s) created by Sub-step 0c
// were cleaned up. If any remain, list their IDs so Jake can delete via Studio.

import 'dotenv/config';
import { createClient } from '@sanity/client';
import fs from 'node:fs';
import path from 'node:path';

const siteEnvPath = path.resolve('site/.env.local');
if (fs.existsSync(siteEnvPath)) {
  for (const line of fs.readFileSync(siteEnvPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
      process.env[m[1]] = val;
    }
  }
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const docs = await client.fetch(`*[_type == "probeCheck"]{_id}`);
if (docs.length === 0) {
  console.log('✓ No probeCheck docs remain. Cleanup succeeded.');
} else {
  console.log(`✗ ${docs.length} probeCheck doc(s) still present:`);
  for (const d of docs) console.log(' -', d._id);
}
