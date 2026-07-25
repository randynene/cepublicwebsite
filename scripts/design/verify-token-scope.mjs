// scripts/design/verify-token-scope.mjs
// Sub-step 0c per MYGRATR-DESIGN-1 brief v1.5 §5/Step 0.
// Plain Node ESM — no tsx dependency (consistent with F1 v1.5 — runtime
// tooling stays out of devDeps unless on critical path).
//
// Verifies SANITY_API_READ_TOKEN is viewer-scoped (read-only).
// Per F4 v1.5: ONLY 403 or 401 reliably proves read-only. Other non-2xx
// statuses are inconclusive (write-capable token may have hit them for
// unrelated reasons).
//
// Per F7: uses create() with a unique ID (not patch() against nonexistent
// _id, which can return 404 = false "manual verification" outcome for
// write-capable tokens). create() forces an actual write attempt.

import 'dotenv/config';
import { createClient } from '@sanity/client';

// Read token from site/.env.local — root .env doesn't carry it.
// dotenv won't find it automatically; load explicitly.
import fs from 'node:fs';
import path from 'node:path';

const siteEnvPath = path.resolve('site/.env.local');
if (fs.existsSync(siteEnvPath)) {
  for (const line of fs.readFileSync(siteEnvPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      let val = m[2];
      // Strip surrounding quotes if present.
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
}

const probe = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2025-01-01',
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
});

const probeId = `design1-token-probe-${Date.now()}`;
try {
  await probe.create({ _id: probeId, _type: 'probeCheck', ephemeral: true });
  // If we reach here, the token has WRITE permissions. Clean up before throwing.
  try { await probe.delete(probeId); } catch { /* best-effort cleanup */ }
  throw new Error('Token has WRITE permissions — rotate to viewer-scoped before proceeding');
} catch (err) {
  if (err.message?.includes('WRITE permissions')) throw err;
  // Per F4 (v1.5 — tightened from v1.4) — ONLY 403 or 401 reliably proves read-only.
  // Other non-2xx (400 schema, 409 ID conflict, 422 validation, 429 rate-limit) do NOT prove read-only;
  // a write-capable token could have hit one of those for unrelated reasons.
  if (err.statusCode === 403 || err.statusCode === 401) {
    console.log('✓ Token is read-only (statusCode:', err.statusCode + ')');
    process.exit(0);
  }
  throw new Error(
    `Token scope probe inconclusive (statusCode: ${err.statusCode}). ` +
    `Only 403/401 reliably proves read-only. Verify manually in Sanity management console before proceeding.`
  );
}
