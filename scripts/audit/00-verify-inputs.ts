import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_FILES = [
  'audit-output/screaming-frog-export.csv',
  'audit-output/screaming-frog-redirects.csv',
  'audit-output/webflow-redirects.csv',
  'audit-output/ce-inventory.json',
  'audit-output/ce-sitemap.json',
];

const REQUIRED_ENV = [
  'WEBFLOW_API_TOKEN',
  'WEBFLOW_SITE_ID',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIRECRAWL_API_KEY',
  'AHREFS_API_KEY',
];

const OPTIONAL_ENV = [
  'ANTHROPIC_API_KEY',
  'HUBSPOT_ACCESS_TOKEN',
  'HUBSPOT_PORTAL_ID',
];

export async function verifyInputs(): Promise<void> {
  let passed = true;

  console.log('=== MYGRATR-AUDIT-1: Pre-flight check ===\n');

  for (const file of REQUIRED_FILES) {
    const exists = fs.existsSync(path.join(process.cwd(), file));
    const status = exists ? 'OK  ' : 'MISS';
    if (!exists) passed = false;
    console.log(`  [${status}] ${file}`);
  }

  console.log('');

  for (const key of REQUIRED_ENV) {
    const exists = !!process.env[key];
    const status = exists ? 'OK  ' : 'MISS';
    if (!exists) passed = false;
    console.log(`  [${status}] ${key}`);
  }

  console.log('');
  for (const key of OPTIONAL_ENV) {
    const exists = !!process.env[key];
    const status = exists ? 'OK  ' : 'OPT ';
    console.log(`  [${status}] ${key} (optional for Steps 00–3e)`);
  }

  console.log('');

  if (!passed) {
    console.error('Pre-flight failed. Fix missing inputs before proceeding.');
    process.exit(1);
  }

  console.log('All required inputs verified. Proceeding to audit.\n');
}

import { fileURLToPath } from 'url';
import fs2 from 'fs';
if (process.argv[1] && fs2.existsSync(process.argv[1]) &&
    fileURLToPath(import.meta.url) === fs2.realpathSync(process.argv[1])) {
  verifyInputs();
}
