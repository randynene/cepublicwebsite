import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import dotenv from 'dotenv';
import type { HubSpotForm, HubSpotFormField, AuditAnomaly } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const HS_BASE = 'https://api.hubapi.com';
const HS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN!;
const HS_PORTAL_ID = process.env.HUBSPOT_PORTAL_ID;
const limit = pLimit(2);

async function hsGet(endpoint: string): Promise<unknown> {
  const res = await fetch(`${HS_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${HS_TOKEN}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot API ${endpoint} returned ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function extractFormEmbeds(html: string): Array<{ portalId: string; formGuid: string; rawSnippet: string }> {
  const forms: Array<{ portalId: string; formGuid: string; rawSnippet: string }> = [];
  const $ = cheerio.load(html);
  const seen = new Set<string>();

  // 1) hbspt.forms.create({ ... })
  $('script').each((_, el) => {
    const code = $(el).html() ?? '';
    if (code.includes('hbspt.forms.create')) {
      const portalMatch = code.match(/portalId[:\s]*["']?(\d+)["']?/);
      const formMatch = code.match(/formId[:\s]*["']([a-f0-9-]{36})["']/);
      if (portalMatch && formMatch) {
        const key = `${portalMatch[1]}:${formMatch[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          const idx = code.indexOf('hbspt.forms.create');
          forms.push({
            portalId: portalMatch[1],
            formGuid: formMatch[1],
            rawSnippet: code.slice(Math.max(0, idx), idx + 500),
          });
        }
      }
    }
  });

  // 2) Webflow's native HubSpot integration: [data-webflow-hubspot-api-form-url] elements
  $('[data-webflow-hubspot-api-form-url]').each((_, el) => {
    const url = $(el).attr('data-webflow-hubspot-api-form-url') ?? '';
    const m = url.match(/\/submissions\/v3\/integration\/submit\/(\d+)\/([a-f0-9-]{36})/i)
           ?? url.match(/\/(\d+)\/([a-f0-9-]{36})/i);
    if (m) {
      const key = `${m[1]}:${m[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        forms.push({
          portalId: m[1],
          formGuid: m[2],
          rawSnippet: `<form data-webflow-hubspot-api-form-url="${url.slice(0, 200)}">`,
        });
      }
    }
  });

  return forms;
}

async function verifyFormInHubSpot(formGuid: string): Promise<{
  formName: string;
  fields: HubSpotFormField[];
  submitRedirectUrl?: string;
  inlineMessage?: string;
  notifyEmails: string[];
  connectedWorkflowIds: string[];
  connectedWorkflowNames: string[];
}> {
  const formData = await hsGet(`/forms/v2/forms/${formGuid}`) as Record<string, unknown>;

  const fields: HubSpotFormField[] = [];
  const groups = (formData.formFieldGroups as Array<{ fields: unknown[] }> | undefined) ?? [];
  const rawFields = groups.flatMap(group => group.fields);

  for (const f of rawFields as Array<Record<string, unknown>>) {
    fields.push({
      name: String(f.name ?? ''),
      label: String(f.label ?? ''),
      fieldType: String(f.fieldType ?? 'text'),
      required: Boolean(f.required),
      options: Array.isArray(f.options) ? (f.options as Array<{ label: string }>).map(o => o.label) : undefined,
      defaultValue: f.defaultValue ? String(f.defaultValue) : undefined,
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      hidden: String(f.fieldType) === 'hidden',
    });
  }

  const notifyEmails: string[] = [];
  const metaData = (formData.metaData as Array<{ name: string; value: string }> | undefined) ?? [];
  for (const meta of metaData) {
    if (meta.name === 'notifyRecipients') {
      notifyEmails.push(...meta.value.split(',').map(e => e.trim()).filter(Boolean));
    }
  }

  const thankYou = formData.thankYouMessageJson as Record<string, unknown> | undefined;
  const thankYouRedirect = thankYou?.redirectUrl as string | undefined;

  // Workflows connected to this form — paginate
  const allWorkflows: Array<Record<string, unknown>> = [];
  let after: string | undefined;
  const MAX_WF_PAGES = 20;
  let pageCount = 0;
  try {
    do {
      const qs = new URLSearchParams({ limit: '50' });
      if (after) qs.set('after', after);
      const page = await hsGet(`/automation/v3/workflows?${qs.toString()}`) as {
        workflows?: Array<Record<string, unknown>>;
        results?: Array<Record<string, unknown>>;
        paging?: { next?: { after?: string } };
      };
      const pageResults = page.workflows ?? page.results ?? [];
      allWorkflows.push(...pageResults);
      after = page.paging?.next?.after;
      pageCount++;
    } while (after && pageCount < MAX_WF_PAGES);
  } catch {
    // Workflows endpoint may be restricted by scope — skip silently
  }

  const connected = allWorkflows.filter(wf => JSON.stringify(wf.triggers ?? wf).includes(formGuid));
  const connectedWorkflowIds = connected.map(wf => String(wf.id));
  const connectedWorkflowNames = connected.map(wf => String(wf.name ?? 'Unknown'));

  return {
    formName: String(formData.name ?? 'Unknown'),
    fields,
    submitRedirectUrl: thankYouRedirect,
    inlineMessage: formData.inlineMessage ? String(formData.inlineMessage) : undefined,
    notifyEmails,
    connectedWorkflowIds,
    connectedWorkflowNames,
  };
}

export async function buildFormsInventory(
  pageContents: Record<string, { rawHtml?: string; url?: string; path?: string }>
): Promise<{ forms: HubSpotForm[]; anomalies: AuditAnomaly[] }> {
  const anomalies: AuditAnomaly[] = [];

  if (!HS_TOKEN) {
    anomalies.push({
      severity: 'warning',
      category: 'form',
      description: 'HUBSPOT_ACCESS_TOKEN missing — form embeds were extracted but not verified against HubSpot.',
      recommendation: 'Add HUBSPOT_ACCESS_TOKEN to .env and re-run Step 6.',
    });
  }

  const embedsByGuid = new Map<string, {
    portalId: string; formGuid: string; pageUrl: string; pagePath: string; rawSnippet: string;
  }>();

  for (const [urlPath, content] of Object.entries(pageContents)) {
    if (!content.rawHtml) continue;
    const embeds = extractFormEmbeds(content.rawHtml);
    for (const embed of embeds) {
      if (!embedsByGuid.has(embed.formGuid)) {
        embedsByGuid.set(embed.formGuid, {
          ...embed,
          pageUrl: content.url ?? `https://cloudemployee.io${urlPath}`,
          pagePath: urlPath,
        });
      }
    }
  }

  console.log(`Forms: found ${embedsByGuid.size} unique form GUIDs on-page`);

  const forms: HubSpotForm[] = [];

  if (!HS_TOKEN) {
    // Record but mark unverified
    for (const embed of embedsByGuid.values()) {
      forms.push({
        portalId: embed.portalId,
        formGuid: embed.formGuid,
        formName: 'UNVERIFIED — no HubSpot token',
        pageUrl: embed.pageUrl,
        pagePath: embed.pagePath,
        fields: [],
        notifyEmails: [],
        connectedWorkflowIds: [],
        connectedWorkflowNames: [],
        connectedListIds: [],
        connectedListNames: [],
        apiVerified: false,
        rawEmbedCode: embed.rawSnippet,
      });
    }
  } else {
    await Promise.all(
      Array.from(embedsByGuid.values()).map(embed =>
        limit(async () => {
          try {
            const verified = await verifyFormInHubSpot(embed.formGuid);
            forms.push({
              portalId: embed.portalId,
              formGuid: embed.formGuid,
              formName: verified.formName,
              pageUrl: embed.pageUrl,
              pagePath: embed.pagePath,
              fields: verified.fields,
              submitRedirectUrl: verified.submitRedirectUrl,
              inlineMessage: verified.inlineMessage,
              notifyEmails: verified.notifyEmails,
              connectedWorkflowIds: verified.connectedWorkflowIds,
              connectedWorkflowNames: verified.connectedWorkflowNames,
              connectedListIds: [],
              connectedListNames: [],
              apiVerified: true,
              apiVerifiedAt: new Date().toISOString(),
              rawEmbedCode: embed.rawSnippet,
            });
            console.log(`  OK ${verified.formName} on ${embed.pagePath}`);
          } catch (err) {
            anomalies.push({
              severity: 'critical',
              category: 'form',
              description: `Form GUID ${embed.formGuid} found on page ${embed.pagePath} but failed HubSpot API verification`,
              affectedUrl: embed.pageUrl,
              affectedIdentifier: embed.formGuid,
              recommendation: 'Verify this form exists and is active in HubSpot. If deleted, the page will show an empty form space post-migration.',
            });
            forms.push({
              portalId: embed.portalId,
              formGuid: embed.formGuid,
              formName: 'UNVERIFIED — API call failed',
              pageUrl: embed.pageUrl,
              pagePath: embed.pagePath,
              fields: [],
              notifyEmails: [],
              connectedWorkflowIds: [],
              connectedWorkflowNames: [],
              connectedListIds: [],
              connectedListNames: [],
              apiVerified: false,
              rawEmbedCode: embed.rawSnippet,
            });
            console.error(`  FAIL ${embed.formGuid} on ${embed.pagePath}: ${String(err).slice(0, 150)}`);
          }
        })
      )
    );
  }

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-forms.json'),
    JSON.stringify({ forms, anomalies, portalId: HS_PORTAL_ID, extractedAt: new Date().toISOString() }, null, 2)
  );

  console.log(`Forms inventory complete:`);
  console.log(`  Total forms found:     ${forms.length}`);
  console.log(`  Verified in HubSpot:   ${forms.filter(f => f.apiVerified).length}`);
  console.log(`  Failed verification:   ${forms.filter(f => !f.apiVerified).length}`);
  console.log(`  Critical anomalies:    ${anomalies.filter(a => a.severity === 'critical').length}`);

  return { forms, anomalies };
}
