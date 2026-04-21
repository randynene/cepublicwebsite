import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const AUDIT_DIR = path.join(process.cwd(), 'audit-output');

export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  label: string;
  href?: string;
  items: NavItem[];
  isCmsDriven: boolean;
  cmsItemCount?: number;
}

export interface GlobalComponentInventory {
  nav: {
    topLevelLinks: NavItem[];
    dropdownSections: NavSection[];
    ctaButton: { label: string; type: 'calendly' | 'link'; href?: string };
    mobileCtaButton: { label: string; type: 'calendly' | 'link'; href?: string };
    hasLocaleDropdown: boolean;
  };
  footer: {
    columns: Array<{ heading: string; links: NavItem[] }>;
    legalLinks: NavItem[];
    newsletterFormGuid?: string;
    copyrightText: string;
    hasLocaleDropdown: boolean;
    localeOptions: Array<{ label: string; href: string; hreflang: string }>;
  };
  announcementBar: {
    present: boolean;
    visible: boolean;
    text?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  claraWidget: {
    present: boolean;
    scriptSrc?: string;
    workspaceId?: string;
  };
  finsweetAttributes: {
    present: boolean;
    version?: string;
    usedFor: string[];
  };
  sourceUrl: string;
}

export async function buildGlobalComponentInventory(
  pageContents: Record<string, { rawHtml?: string; url?: string }>
): Promise<GlobalComponentInventory> {
  const homepage = pageContents['/'];
  const fallback = Object.entries(pageContents).find(([, p]) => p.rawHtml);
  const chosen = homepage?.rawHtml ? { html: homepage.rawHtml, url: homepage.url ?? 'https://cloudemployee.io/' }
                                    : fallback ? { html: fallback[1].rawHtml!, url: fallback[1].url ?? fallback[0] }
                                               : null;

  if (!chosen) {
    throw new Error('No page HTML available for global component extraction');
  }

  const $ = cheerio.load(chosen.html);

  const topLevelLinks: NavItem[] = [];
  $('nav.w-nav-menu .nav-link:not(.list)').each((_, el) => {
    const href = $(el).attr('href') ?? '#';
    const label = $(el).text().trim();
    if (label) topLevelLinks.push({ label, href });
  });

  const dropdownSections: NavSection[] = [];
  $('.nav-dropdown').each((_, dropdown) => {
    const triggerLink = $(dropdown).find('.nav-link.sub').first();
    const sectionLabel = triggerLink.text().trim();
    const sectionHref = triggerLink.attr('href') ?? '#';

    const items: NavItem[] = [];
    $(dropdown).find('.nav-link-dropdown, .footer-link').each((_, link) => {
      const label = $(link).find('.h6-nav, div').first().text().trim() || $(link).text().trim();
      const href = $(link).attr('href') ?? '#';
      if (label && href) items.push({ label, href });
    });

    const isCmsDriven = $(dropdown).find('.w-dyn-list').length > 0;
    const cmsItemCount = $(dropdown).find('.w-dyn-item').length;

    dropdownSections.push({
      label: sectionLabel,
      href: sectionHref,
      items,
      isCmsDriven,
      cmsItemCount,
    });
  });

  const footerColumns: GlobalComponentInventory['footer']['columns'] = [];
  $('.footer-links-wrap').each((_, col) => {
    const heading = $(col).find('.u-weight-med, .txt-link').first().text().trim();
    const links: NavItem[] = [];
    $(col).find('.footer-link').each((_, link) => {
      const label = $(link).text().trim();
      const href = $(link).attr('href') ?? '#';
      if (label) links.push({ label, href });
    });
    if (heading || links.length > 0) {
      footerColumns.push({ heading, links });
    }
  });

  const legalLinks: NavItem[] = [];
  $('.footer-link-list .footer-link').each((_, link) => {
    legalLinks.push({ label: $(link).text().trim(), href: $(link).attr('href') ?? '#' });
  });

  const newsletterForm = $('[data-webflow-hubspot-api-form-url]');
  const newsletterFormUrl = newsletterForm.attr('data-webflow-hubspot-api-form-url') ?? '';
  const guidMatch = newsletterFormUrl.match(/([a-f0-9-]{36})/);
  const newsletterFormGuid = guidMatch ? guidMatch[1] : undefined;

  const localeOptions: GlobalComponentInventory['footer']['localeOptions'] = [];
  $('.w-locales-item a').each((_, link) => {
    localeOptions.push({
      label: $(link).text().trim(),
      href: $(link).attr('href') ?? '#',
      hreflang: $(link).attr('hreflang') ?? '',
    });
  });

  const banner = $('.bar-notification').first();
  const bannerSection = banner.closest('.section');
  const bannerVisible = banner.length > 0 && !bannerSection.hasClass('hide');
  const announcementBar: GlobalComponentInventory['announcementBar'] = {
    present: banner.length > 0,
    visible: bannerVisible,
    text: banner.find('p').text().trim() || undefined,
    ctaLabel: banner.find('.txt-link-top div').first().text().trim() || undefined,
    ctaHref: banner.find('.txt-link').attr('href') || undefined,
  };

  let claraWidget: GlobalComponentInventory['claraWidget'] = { present: false };
  $('script[src*="clara"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const workspaceId = $(el).attr('data-workspace-id');
    claraWidget = { present: true, scriptSrc: src, workspaceId: workspaceId ?? undefined };
  });

  let finsweetVersion: string | undefined;
  const finsweetUsages: string[] = [];
  $('script[src*="finsweet"]').each((_, el) => {
    const src = $(el).attr('src') ?? '';
    const versionMatch = src.match(/@(\d+\.\d+\.\d+)/);
    if (versionMatch) finsweetVersion = versionMatch[1];
  });

  if ($('[fs-list-combine]').length > 0) finsweetUsages.push('list-combine');
  if ($('[fs-list-element]').length > 0) finsweetUsages.push('list');
  if ($('[fs-accordion-element]').length > 0) finsweetUsages.push('accordion');
  if ($('[fs-cc-cookieconsent]').length > 0) finsweetUsages.push('cookie-consent');

  const inventory: GlobalComponentInventory = {
    nav: {
      topLevelLinks,
      dropdownSections,
      ctaButton: {
        label: $('[calendly-call="1"]:not(.mobile-only)').first().find('.switch-text').text().trim(),
        type: 'calendly',
      },
      mobileCtaButton: {
        label: $('[calendly-call="1"].mobile-only').first().find('.switch-text').text().trim(),
        type: 'calendly',
      },
      hasLocaleDropdown: $('.w-locales-list').length > 0,
    },
    footer: {
      columns: footerColumns,
      legalLinks,
      newsletterFormGuid,
      copyrightText: $('.u-white-text-3').first().text().trim(),
      hasLocaleDropdown: localeOptions.length > 0,
      localeOptions,
    },
    announcementBar,
    claraWidget,
    finsweetAttributes: {
      present: finsweetVersion !== undefined || finsweetUsages.length > 0,
      version: finsweetVersion,
      usedFor: [...new Set(finsweetUsages)],
    },
    sourceUrl: chosen.url,
  };

  fs.writeFileSync(
    path.join(AUDIT_DIR, 'ce-global-components.json'),
    JSON.stringify(inventory, null, 2)
  );

  console.log('Global component inventory complete:');
  console.log(`  Source page:         ${chosen.url}`);
  console.log(`  Nav top-level links: ${topLevelLinks.length}`);
  console.log(`  Nav dropdowns:       ${dropdownSections.length}`);
  console.log(`  Footer columns:      ${footerColumns.length}`);
  console.log(`  Newsletter form:     ${newsletterFormGuid ?? 'not found'}`);
  console.log(`  Clara widget:        ${claraWidget.present} (${claraWidget.workspaceId ?? 'no workspace id'})`);
  console.log(`  Finsweet:            ${inventory.finsweetAttributes.present} (${inventory.finsweetAttributes.usedFor.join(', ') || 'none'})`);
  console.log(`  Announcement bar:    present=${announcementBar.present}, visible=${announcementBar.visible}`);

  return inventory;
}
