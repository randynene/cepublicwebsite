import * as cheerio from 'cheerio';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { InteractionType } from '../../src/lib/audit-types';
import type { InteractionElement, InteractionState } from '../../src/lib/audit-types';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');
const PAGES_DIR = path.join(AUDIT_DIR, 'pages');
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;
const MODEL = 'claude-opus-4-7';

const CONTENT_INTERACTION_PATTERNS: Array<{ selector: string; type: InteractionType }> = [
  { selector: '[fs-accordion-element="content"]', type: InteractionType.ACCORDION },
  { selector: '[s-accordion="content"]', type: InteractionType.ACCORDION },
  { selector: '[data-accordion-content]', type: InteractionType.ACCORDION },
  { selector: 'details', type: InteractionType.ACCORDION },
  { selector: '[role="tabpanel"]', type: InteractionType.TAB },
  { selector: '[data-tab-content]', type: InteractionType.TAB },
  { selector: '.w-tab-pane', type: InteractionType.TAB },
  { selector: '[role="dialog"]', type: InteractionType.MODAL },
  { selector: '.modal__content, .modal-content', type: InteractionType.MODAL },
  { selector: '.filter__content, [data-filter-wrapper]', type: InteractionType.FILTER },
  { selector: '.swiper .swiper-slide', type: InteractionType.SLIDER },
];

const CONTENT_CLASS_PATTERNS: RegExp[] = [
  /accordion[-_]?(content|body|panel)/i,
  /tab[-_]?(content|panel|pane)/i,
  /modal[-_]?(content|body)/i,
  /expand[-_]?(content|body)/i,
  /collapse[-_]?(content)/i,
];

const COSMETIC_PATTERNS: Array<{ selector: string; description: string }> = [
  { selector: '[data-w-id]', description: 'Webflow interaction trigger' },
  { selector: '[data-aos]', description: 'AOS scroll animation' },
  { selector: '.w-nav, .w-dropdown', description: 'Webflow nav/dropdown' },
  { selector: '[class*="parallax"]', description: 'Parallax effect' },
];

function extractAllStates($el: cheerio.Cheerio<cheerio.Element>): InteractionState[] {
  const innerText = $el.text().trim();
  const innerHtml = $el.html() ?? '';
  const hasFaqPattern = innerHtml.includes('?') && $el.find('p, div').length > 1;
  const hasTable = $el.find('table').length > 0;
  const hasList = $el.find('ul, ol').length > 0;

  return [{
    stateName: 'content',
    innerHtml: innerHtml.slice(0, 4000),
    innerText: innerText.slice(0, 2000),
    containsStructuredData: hasTable || hasFaqPattern || hasList,
    structuredDataType: hasTable ? 'table' : hasFaqPattern ? 'faq' : hasList ? 'list' : undefined,
  }];
}

async function analyseWithClaude(html: string, url: string): Promise<InteractionElement[]> {
  if (!anthropic) return [];

  const $ = cheerio.load(html);
  $('script, style, svg, iframe').remove();
  const structuralHtml = $.html('body').slice(0, 15000);

  const prompt = `You are analysing the HTML structure of a webpage to identify interactive elements.
URL: ${url}

HTML structure (text content trimmed):
${structuralHtml}

Identify ALL interactive elements on this page. For each:
1. The CSS selector to target it
2. Type: accordion | tab | modal | filter | dropdown | slider | expandable | animation_cosmetic | hover_state
3. Whether it affects visible text content (content-affecting) or is purely cosmetic
4. The trigger event (click/hover/scroll)
5. A brief description of what it shows/hides

Look specifically for:
- Webflow "fold" patterns: fields that are conditionally shown based on another field's value
- Any pricing toggle patterns
- Any FAQ sections
- Any feature comparison tables inside toggles

Respond ONLY as a JSON array, no prose:
[{"selector": "...", "type": "...", "isContentAffecting": true/false, "triggerEvent": "...", "description": "..."}]`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    const jsonStart = clean.indexOf('[');
    const jsonEnd = clean.lastIndexOf(']');
    if (jsonStart === -1 || jsonEnd === -1) return [];
    const parsed = JSON.parse(clean.slice(jsonStart, jsonEnd + 1)) as Array<{
      selector: string; type: string; isContentAffecting: boolean; triggerEvent: string; description: string;
    }>;

    return parsed.map(item => ({
      type: item.type as InteractionType,
      selector: item.selector,
      triggerEvent: item.triggerEvent,
      isContentAffecting: item.isContentAffecting,
      animationDescription: !item.isContentAffecting ? item.description : undefined,
    }));
  } catch (err) {
    const errStr = String(err);
    if (errStr.includes('401') || errStr.includes('403') || errStr.includes('authentication')) {
      throw new Error(`Anthropic auth failed for ${url}: check ANTHROPIC_API_KEY`);
    }
    console.warn(`  Claude interaction analysis transient failure for ${url}: ${errStr.slice(0, 150)}`);
    return [];
  }
}

export async function buildInteractionInventory(
  pageContents: Record<string, { rawHtml?: string; url?: string }>
): Promise<Record<string, InteractionElement[]>> {
  const inventory: Record<string, InteractionElement[]> = {};
  let pagesWithClaude = 0;
  let claudeFailed = 0;
  let claudeSkippedNoKey = 0;
  const pageKeys = Object.keys(pageContents);

  for (const urlPath of pageKeys) {
    const content = pageContents[urlPath];
    if (!content.rawHtml) continue;

    const $ = cheerio.load(content.rawHtml);
    const elements: InteractionElement[] = [];

    // Tier 1: known selectors
    for (const pattern of CONTENT_INTERACTION_PATTERNS) {
      $(pattern.selector).each((_, el) => {
        const states = extractAllStates($(el));
        elements.push({
          type: pattern.type,
          selector: pattern.selector,
          triggerEvent: 'click',
          isContentAffecting: true,
          states,
        });
      });
    }

    // Tier 1: class-name heuristics
    $('[class]').each((_, el) => {
      const className = $(el).attr('class') ?? '';
      for (const classPattern of CONTENT_CLASS_PATTERNS) {
        if (classPattern.test(className)) {
          const states = extractAllStates($(el));
          elements.push({
            type: InteractionType.EXPANDABLE,
            selector: `.${className.split(' ')[0]}`,
            triggerEvent: 'click',
            isContentAffecting: true,
            states,
          });
          break;
        }
      }
    });

    // Cosmetic patterns (record presence only)
    for (const pattern of COSMETIC_PATTERNS) {
      const count = $(pattern.selector).length;
      if (count > 0) {
        elements.push({
          type: InteractionType.ANIMATION_COSMETIC,
          selector: pattern.selector,
          triggerEvent: 'scroll',
          isContentAffecting: false,
          animationDescription: `${pattern.description} (${count} instances)`,
        });
      }
    }

    // Tier 2: Claude for Technology pages and complex-interaction pages (if key available)
    const isTechnologyPage = urlPath.includes('/technology/');
    const contentAffecting = elements.filter(e => e.isContentAffecting).length;
    const needsClaude = (isTechnologyPage || contentAffecting > 3);

    if (needsClaude) {
      if (!anthropic) {
        claudeSkippedNoKey++;
      } else {
        pagesWithClaude++;
        const url = content.url ?? `https://cloudemployee.io${urlPath}`;
        try {
          const claudeElements = await analyseWithClaude(content.rawHtml, url);
          for (const ce of claudeElements) {
            const alreadyFound = elements.some(e => e.selector === ce.selector && e.type === ce.type);
            if (!alreadyFound) elements.push(ce);
          }
        } catch (err) {
          claudeFailed++;
          console.error(`  Claude error on ${urlPath}: ${String(err).slice(0, 150)}`);
          // Fatal auth/quota errors: rethrow
          if (String(err).includes('auth failed') || String(err).includes('quota exhausted')) throw err;
        }
      }
    }

    if (elements.length > 0) {
      inventory[urlPath] = elements;

      const slug = urlPath.replace(/^\/|\/$/g, '').replace(/\//g, '__').replace(/[^a-z0-9_]/gi, '-').replace(/-+/g, '-') || 'home';
      const pageDir = path.join(PAGES_DIR, slug);
      fs.mkdirSync(pageDir, { recursive: true });
      fs.writeFileSync(path.join(pageDir, 'interactions.json'), JSON.stringify(elements, null, 2));
    }
  }

  const summary = {
    pagesAnalysed: pageKeys.length,
    pagesWithInteractions: Object.keys(inventory).length,
    pagesWithClaudeAnalysis: pagesWithClaude,
    pagesSkippedClaudeNoKey: claudeSkippedNoKey,
    claudeFailures: claudeFailed,
    totalContentAffectingElements: Object.values(inventory).flat().filter(e => e.isContentAffecting).length,
    totalCosmeticElements: Object.values(inventory).flat().filter(e => !e.isContentAffecting).length,
    analysedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(AUDIT_DIR, 'ce-interactions-summary.json'), JSON.stringify(summary, null, 2));

  console.log(`Interaction inventory complete:`);
  console.log(`  Pages with interactions:       ${summary.pagesWithInteractions}/${summary.pagesAnalysed}`);
  console.log(`  Pages with Claude analysis:    ${summary.pagesWithClaudeAnalysis}`);
  if (summary.pagesSkippedClaudeNoKey > 0) {
    console.log(`  Pages SKIPPED Claude (no key): ${summary.pagesSkippedClaudeNoKey}`);
  }
  console.log(`  Content-affecting elements:    ${summary.totalContentAffectingElements}`);
  console.log(`  Cosmetic elements:             ${summary.totalCosmeticElements}`);

  return inventory;
}
