// scripts/design/verify-sanity-image-builder.mjs
// HALT 7 Verifications 1 & 2 — confirm @sanity/image-url builder API +
// parseSanityImageRef against real CONTENT-1C migrated assets.

import imageUrlBuilder from '@sanity/image-url';
import { createClient } from '@sanity/client';
import fs from 'node:fs/promises';

// Read Sanity creds from project-root .env
const envText = await fs.readFile('.env', 'utf8').catch(() => '');
const env = Object.fromEntries(
  envText.split('\n').filter(l => l.includes('=')).map(l => {
    const idx = l.indexOf('=');
    return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
  }),
);

const projectId = env.SANITY_PROJECT_ID || 'lzbhll1u'; // CLAUDE.md confirmed
const dataset = env.SANITY_DATASET || 'production';

// ============================================================================
// Verification 1 — @sanity/image-url builder chaining API
// ============================================================================
console.log('=== Verification 1 — image-url builder chaining API ===\n');

const builder = imageUrlBuilder({ projectId, dataset });

// Test source — typical Sanity image shape
const fakeSource = {
  asset: { _ref: 'image-abc123def456-1200x800-jpg' },
  alt: 'test',
  hotspot: { x: 0.5, y: 0.5, height: 1, width: 1 },
  crop: { top: 0, bottom: 0, left: 0, right: 0 },
};

try {
  const url1 = builder.image(fakeSource).url();
  console.log(`  base URL: ${url1}`);

  const url2 = builder.image(fakeSource).width(800).url();
  console.log(`  width(800): ${url2}`);

  const url3 = builder.image(fakeSource).width(800).height(600).url();
  console.log(`  width+height: ${url3}`);

  const url4 = builder.image(fakeSource).width(800).height(600).quality(80).url();
  console.log(`  + quality(80): ${url4}`);

  const url5 = builder.image(fakeSource).width(800).height(600).quality(80).format('webp').url();
  console.log(`  + format(webp): ${url5}`);

  const url6 = builder.image(fakeSource).width(800).fit('crop').url();
  console.log(`  + fit(crop) for hotspot honoring: ${url6}`);

  console.log('\n  ✓ chaining API supports width / height / quality / format / fit');
} catch (e) {
  console.log(`  ✗ chaining failed: ${e.message}`);
}

// ============================================================================
// Verification 2 — parseSanityImageRef against real migrated _refs
// ============================================================================
console.log('\n=== Verification 2 — parseSanityImageRef against real CONTENT-1C migrated assets ===\n');

const supabaseUrl = env.SUPABASE_URL;
// We don't need Supabase here — read directly from Sanity via CLAUDE.md project config
const sanityToken = env.SANITY_API_TOKEN || env.SANITY_MIGRATION_WRITE_TOKEN;

if (!sanityToken) {
  console.log('  ⚠ No Sanity token in .env — falling back to public client.');
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: !sanityToken,
  ...(sanityToken ? { token: sanityToken } : {}),
});

function parseSanityImageRef(ref) {
  const m = ref.match(/^image-([a-f0-9]+)-(\d+)x(\d+)-(\w+)$/);
  if (!m) return null;
  return {
    hash: m[1],
    width: parseInt(m[2]),
    height: parseInt(m[3]),
    format: m[4],
  };
}

try {
  // Pull a sample of real image asset refs across multiple doc types
  const refs = await client.fetch(`
    *[
      _type in ["blogPost", "customerStory", "teamMember", "review", "compareBlog", "tool", "event", "download", "video", "benefitValue", "staffBenefit"]
      && !(_id match "smoke-test-*")
    ][0...50] {
      _type,
      _id,
      "imageRefs": [
        thumbnailImage.asset._ref,
        teamMemberImage.asset._ref,
        memberImage.asset._ref,
        companyLogo.asset._ref,
        backupImage.asset._ref,
        headerFooterImage.asset._ref,
        metaThumbnail.asset._ref,
        thumbnail.asset._ref,
        featuredImage.asset._ref,
        icon.asset._ref,
        openGraphImage.asset._ref
      ]
    }
  `);

  const allRefs = [];
  for (const doc of refs) {
    for (const r of doc.imageRefs || []) {
      if (r) allRefs.push({ docType: doc._type, docId: doc._id, ref: r });
    }
  }

  console.log(`  Sampled ${allRefs.length} real image-asset _refs across ${refs.length} docs`);

  let parsed = 0, failed = 0;
  const failedSamples = [];
  const formats = new Map();
  let minWidth = Infinity, maxWidth = 0, minHeight = Infinity, maxHeight = 0;

  for (const { docType, docId, ref } of allRefs) {
    const r = parseSanityImageRef(ref);
    if (r) {
      parsed++;
      formats.set(r.format, (formats.get(r.format) || 0) + 1);
      minWidth = Math.min(minWidth, r.width);
      maxWidth = Math.max(maxWidth, r.width);
      minHeight = Math.min(minHeight, r.height);
      maxHeight = Math.max(maxHeight, r.height);
    } else {
      failed++;
      if (failedSamples.length < 5) failedSamples.push({ docType, ref });
    }
  }

  console.log(`  parsed: ${parsed} / ${allRefs.length}  (failed: ${failed})`);
  console.log(`  formats observed: ${[...formats.entries()].map(([f, n]) => `${f}=${n}`).join(', ')}`);
  console.log(`  width range:  ${minWidth} – ${maxWidth}`);
  console.log(`  height range: ${minHeight} – ${maxHeight}`);
  if (failedSamples.length) {
    console.log(`\n  ⚠ Failed parse samples:`);
    failedSamples.forEach((f) => console.log(`     [${f.docType}] ${f.ref}`));
  } else {
    console.log(`\n  ✓ regex catches every real CE _ref shape`);
  }

  // Pick first parseable ref + generate URL via builder
  const sample = allRefs.find((a) => parseSanityImageRef(a.ref));
  if (sample) {
    console.log(`\n  Sample URL generation against real ref:`);
    const url = builder.image({ asset: { _ref: sample.ref } }).width(800).quality(80).url();
    console.log(`     ${url}`);
  }
} catch (e) {
  console.log(`  ✗ Sanity fetch failed: ${e.message}`);
  console.log('  Falling back to synthetic ref tests');
  const samples = [
    'image-abc123def456789-1200x800-jpg',
    'image-aaaa1111bbbb2222-1920x1080-png',
    'image-xyz-300x200-webp',  // edge — short hash
    'image-deadbeef-1024-jpg',  // edge — missing height
  ];
  samples.forEach((r) => {
    const out = parseSanityImageRef(r);
    console.log(`  ${r} → ${out ? JSON.stringify(out) : 'null'}`);
  });
}
