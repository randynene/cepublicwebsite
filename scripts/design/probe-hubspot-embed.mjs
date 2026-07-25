// scripts/design/probe-hubspot-embed.mjs
// HALT 6 — C6 HubSpotFormEmbed probe (Hard Rule #2).
//
// Goals:
//   1. Capture the script URL CE loads (js.hsforms.net family — version + region)
//   2. Capture hbspt.forms.create() parameters (portalId, formId, region)
//   3. Capture the mounted DOM structure (.hs-form / .hs-form-field /
//      .hs-input class names + computed styles for our overrides)
//   4. Capture submission events fired (GTM dataLayer pushes? GA4 events?)
//   5. Identify which env vars CE uses for portalId

import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const PAGES = [
  // Highest-density inline embeds per audit-output grep (38 pages total).
  'https://cloudemployee.io/start-hiring/contact-info',
  'https://cloudemployee.io/price-comparison-calculator',
  'https://cloudemployee.io/staff-augmentation/what-is-staff-augmentation',
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const aggregate = {};
  try {
    for (const url of PAGES) {
      const slug = url.split('cloudemployee.io')[1] || '/';
      console.log(`\n=== ${slug} ===`);
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const p = await ctx.newPage();

      // Capture network requests for HubSpot script URL family
      const hubspotRequests = [];
      p.on('request', (req) => {
        const u = req.url();
        if (/hsforms|hubspot|hsappstatic/.test(u)) {
          hubspotRequests.push({ url: u, resourceType: req.resourceType() });
        }
      });

      // Capture console for hbspt.forms.create() args (some sites log them)
      const consoleLogs = [];
      p.on('console', (msg) => {
        const text = msg.text();
        if (/hbspt|hsform|portalId|formId/.test(text)) consoleLogs.push(text.slice(0, 200));
      });

      try { await p.goto(url, { waitUntil: 'networkidle', timeout: 60_000 }); }
      catch { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 }); }
      await p.waitForTimeout(3000); // give HubSpot script time to load + render

      // 1. Script URLs
      const scripts = await p.evaluate(() => {
        return Array.from(document.querySelectorAll('script[src]'))
          .map((s) => s.getAttribute('src'))
          .filter((s) => s && /hsforms|hubspot/.test(s));
      });

      // 2. hbspt.forms.create() params — search the rendered HTML for form-id refs
      const embedParams = await p.evaluate(() => {
        const out = [];
        // Look for div containers with HubSpot embed attributes
        document.querySelectorAll('[data-form-id], [data-portal-id], .hs-form, .hbspt-form, [data-hsfc-id]').forEach((el) => {
          out.push({
            tag: el.tagName.toLowerCase(),
            classes: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
            id: el.id || null,
            'data-form-id': el.getAttribute('data-form-id'),
            'data-portal-id': el.getAttribute('data-portal-id'),
            'data-hsfc-id': el.getAttribute('data-hsfc-id'),
            'data-region': el.getAttribute('data-region'),
            innerHTMLPreview: (el.innerHTML || '').slice(0, 200),
          });
        });
        // Also scrape any inline <script> for hbspt.forms.create() calls
        const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'))
          .map((s) => s.textContent || '')
          .filter((t) => /hbspt\.forms\.(create|embed)/.test(t));
        return { embedDivs: out, inlineCalls: inlineScripts.map((s) => s.slice(0, 600)) };
      });

      // 3. Mounted hs-form DOM structure
      const mountedForm = await p.evaluate(() => {
        const form = document.querySelector('.hs-form, form.hs-form, .hbspt-form form');
        if (!form) return null;
        const fields = Array.from(form.querySelectorAll('.hs-form-field')).slice(0, 5);
        return {
          formClasses: typeof form.className === 'string' ? form.className.slice(0, 140) : '',
          fieldCount: form.querySelectorAll('.hs-form-field').length,
          fields: fields.map((f) => {
            const label = f.querySelector('label.hs-form-label, label');
            const input = f.querySelector('input, textarea, select');
            const inputCs = input ? getComputedStyle(input) : null;
            return {
              fieldClasses: typeof f.className === 'string' ? f.className.slice(0, 120) : '',
              labelText: label ? (label.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50) : null,
              inputTag: input ? input.tagName.toLowerCase() : null,
              inputType: input ? input.getAttribute('type') : null,
              inputClasses: input && typeof input.className === 'string' ? input.className.slice(0, 100) : '',
              inputStyle: inputCs ? {
                padding: [inputCs.paddingTop, inputCs.paddingRight, inputCs.paddingBottom, inputCs.paddingLeft].join(' '),
                border: `${inputCs.borderTopWidth} ${inputCs.borderTopStyle} ${inputCs.borderTopColor}`,
                borderRadius: inputCs.borderRadius,
                fontSize: inputCs.fontSize,
                height: inputCs.height,
                color: inputCs.color,
                background: inputCs.backgroundColor,
              } : null,
            };
          }),
          submitButton: (() => {
            const btn = form.querySelector('input[type="submit"], button[type="submit"]');
            if (!btn) return null;
            const cs = getComputedStyle(btn);
            return {
              tag: btn.tagName.toLowerCase(),
              classes: typeof btn.className === 'string' ? btn.className.slice(0, 100) : '',
              value: btn.getAttribute('value') || btn.textContent?.trim().slice(0, 40),
              fontSize: cs.fontSize,
              borderRadius: cs.borderRadius,
              background: cs.backgroundColor,
              color: cs.color,
              height: cs.height,
            };
          })(),
        };
      });

      // 4. dataLayer pushes related to forms
      const dataLayerHints = await p.evaluate(() => {
        // @ts-ignore
        const dl = window.dataLayer || [];
        return dl.filter((e) => /form|submit|hubspot/i.test(JSON.stringify(e))).slice(0, 5);
      });

      aggregate[slug] = {
        scriptsRendered: scripts,
        networkRequests: hubspotRequests.slice(0, 10),
        embedParams,
        mountedForm,
        dataLayerHints,
        consoleLogs: consoleLogs.slice(0, 5),
      };

      console.log(`  Scripts loaded: ${scripts.length} | Network: ${hubspotRequests.length}`);
      console.log(`  Embed divs: ${embedParams.embedDivs.length} | Inline create() calls: ${embedParams.inlineCalls.length}`);
      console.log(`  Mounted form: ${mountedForm ? `${mountedForm.fieldCount} fields` : '(none — form may not have rendered yet)'}`);
      console.log(`  dataLayer hints: ${dataLayerHints.length}`);

      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  // Detailed surface for first page with mounted form
  console.log('\n=== HUBSPOT EMBED — detailed findings ===');
  for (const slug of Object.keys(aggregate)) {
    const d = aggregate[slug];
    console.log(`\n--- ${slug} ---`);
    console.log('  Script URLs (rendered):');
    d.scriptsRendered.forEach((s) => console.log(`    ${s}`));
    console.log('  Network requests (first 5):');
    d.networkRequests.slice(0, 5).forEach((r) => console.log(`    [${r.resourceType}] ${r.url.slice(0, 120)}`));

    if (d.embedParams.embedDivs.length) {
      console.log('  Embed div(s):');
      d.embedParams.embedDivs.slice(0, 2).forEach((e) => {
        console.log(`    <${e.tag} class="${e.classes}" id="${e.id || ''}" data-form-id="${e['data-form-id']}" data-portal-id="${e['data-portal-id']}" data-region="${e['data-region']}">`);
      });
    }
    if (d.embedParams.inlineCalls.length) {
      console.log('  Inline hbspt.forms.create() snippet:');
      d.embedParams.inlineCalls.slice(0, 1).forEach((s) => {
        console.log(`    ${s.replace(/\s+/g, ' ').slice(0, 400)}`);
      });
    }
    if (d.mountedForm) {
      console.log(`  Mounted form: ${d.mountedForm.fieldCount} fields, classes="${d.mountedForm.formClasses.slice(0,60)}"`);
      d.mountedForm.fields.slice(0, 3).forEach((f, i) => {
        console.log(`    field[${i}] label="${f.labelText}" input=${f.inputTag} type=${f.inputType}`);
        if (f.inputStyle) {
          console.log(`      padding=${f.inputStyle.padding} border=${f.inputStyle.border} radius=${f.inputStyle.borderRadius}`);
          console.log(`      fontSize=${f.inputStyle.fontSize} height=${f.inputStyle.height} bg=${f.inputStyle.background}`);
        }
      });
      if (d.mountedForm.submitButton) {
        const b = d.mountedForm.submitButton;
        console.log(`    submit: <${b.tag} class="${b.classes.slice(0,50)}"> "${b.value}"`);
        console.log(`      bg=${b.background} color=${b.color} radius=${b.borderRadius} height=${b.height}`);
      }
    }
    if (d.dataLayerHints.length) {
      console.log('  dataLayer events:');
      d.dataLayerHints.forEach((e) => console.log(`    ${JSON.stringify(e).slice(0, 150)}`));
    }
  }

  await fs.mkdir('audit-output/design-1', { recursive: true });
  await fs.writeFile('audit-output/design-1/hubspot-embed-probe.json', JSON.stringify(aggregate, null, 2));
  console.log('\nWrote audit-output/design-1/hubspot-embed-probe.json');
}

main().catch((err) => { console.error(err); process.exit(1); });
