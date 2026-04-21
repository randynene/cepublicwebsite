export enum UrlStatus {
  OK = '200',
  REDIRECT_301 = '301',
  REDIRECT_302 = '302',
  NOT_FOUND = '404',
  ERROR = 'error',
  EXCLUDED = 'excluded',
}

export enum TemplateType {
  HOME = 'HOME',
  TECHNOLOGY = 'TECHNOLOGY',
  SERVICE = 'SERVICE',
  BLOG = 'BLOG',
  COMPARE = 'COMPARE',
  CUSTOMER_STORY = 'CUSTOMER_STORY',
  TEAM_MEMBER = 'TEAM_MEMBER',
  VIDEO = 'VIDEO',
  REVIEW = 'REVIEW',
  BOOK_A_CALL = 'BOOK_A_CALL',
  DOWNLOAD = 'DOWNLOAD',
  TOOL = 'TOOL',
  STATIC = 'STATIC',
  TAXONOMY = 'TAXONOMY',
  UNKNOWN = 'UNKNOWN',
}

export enum ClassificationMethod {
  RULES = 'rules',
  LLM = 'llm',
  MANUAL = 'manual',
}

export enum InteractionType {
  ACCORDION = 'accordion',
  TAB = 'tab',
  MODAL = 'modal',
  FILTER = 'filter',
  DROPDOWN = 'dropdown',
  SLIDER = 'slider',
  EXPANDABLE = 'expandable',
  ANIMATION_COSMETIC = 'animation_cosmetic',
  HOVER_STATE = 'hover_state',
}

export interface CanonicalUrl {
  url: string;
  path: string;
  slug: string;
  status: UrlStatus;
  inSitemap: boolean;
  inFirecrawl: boolean;
  inScreamingFrog: boolean;
  locale: 'us' | 'uk' | 'unknown';
  isLocaleVariant: boolean;
  baseUrl?: string;
  redirectTarget?: string;
  source: 'sitemap' | 'firecrawl' | 'screaming_frog' | 'multiple';
  notes?: string;
}

export interface Breakpoint {
  name: 'mobile' | 'tablet' | 'desktop';
  width: number;
  height: number;
}

export interface ScreenshotRecord {
  url: string;
  templateType: TemplateType;
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  capturedAt: string;
  fullPageHeight: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface InteractionState {
  stateName: string;
  triggerText?: string;
  innerHtml?: string;
  innerText?: string;
  containsStructuredData: boolean;
  structuredDataType?: string;
}

export interface InteractionElement {
  type: InteractionType;
  selector: string;
  triggerEvent: string;
  isContentAffecting: boolean;
  states?: InteractionState[];
  animationDescription?: string;
}

export interface ImageRecord {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  isAboveFold: boolean;
  lazyLoaded: boolean;
}

export interface PageContent {
  url: string;
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  headings: { level: number; text: string }[];
  bodyText: string;
  internalLinks: string[];
  externalLinks: string[];
  images: ImageRecord[];
  structuredData: unknown[];
  canonicalTag?: string;
  robotsMeta?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  hreflangTags: { lang: string; href: string }[];
  customHeadCode?: string;
  rawHtml?: string;
}

export interface ThirdPartyScript {
  name: string;
  identifier: string;
  src?: string;
  loadLocation: 'head' | 'body_start' | 'body_end' | 'inline';
  scope: 'global' | string;
  rawSnippet: string;
  category: 'analytics' | 'tag_manager' | 'advertising' | 'chat' | 'consent' | 'heatmap' | 'ab_test' | 'social' | 'other';
}

export interface ScriptInventory {
  global: ThirdPartyScript[];
  perPage: Record<string, ThirdPartyScript[]>;
  summary: {
    hasGTM: boolean;
    gtmContainerIds: string[];
    hasGA4: boolean;
    ga4MeasurementIds: string[];
    hasLinkedIn: boolean;
    linkedInPartnerId?: string;
    hasCookieConsent: boolean;
    cookieConsentProvider?: string;
    hasChat: boolean;
    chatProvider?: string;
    hasHeatmap: boolean;
    heatmapProvider?: string;
    otherScripts: string[];
  };
}

export interface HubSpotFormField {
  name: string;
  label: string;
  fieldType: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  placeholder?: string;
  hidden: boolean;
}

export interface HubSpotForm {
  portalId: string;
  formGuid: string;
  formName: string;
  pageUrl: string;
  pagePath: string;
  fields: HubSpotFormField[];
  submitRedirectUrl?: string;
  inlineMessage?: string;
  notifyEmails: string[];
  connectedWorkflowIds: string[];
  connectedWorkflowNames: string[];
  connectedListIds: string[];
  connectedListNames: string[];
  apiVerified: boolean;
  apiVerifiedAt?: string;
  rawEmbedCode: string;
}

export interface TemplateClassification {
  url: string;
  path: string;
  templateType: TemplateType;
  classificationMethod: ClassificationMethod;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
  requiresManualReview: boolean;
  locale: 'us' | 'uk' | 'unknown';
  isLocaleVariant?: boolean;
  webflowCollectionSlug?: string;
  webflowItemSlug?: string;
}

export interface AuditAnomaly {
  severity: 'critical' | 'warning' | 'info';
  category: 'url' | 'template' | 'form' | 'script' | 'content' | 'interaction';
  description: string;
  affectedUrl?: string;
  affectedIdentifier?: string;
  recommendation: string;
}

export interface CollectionField {
  slug: string;
  displayName: string;
  type: string;
  required: boolean;
  isConditional: boolean;
  foldCondition?: string;
}

export interface CollectionRecord {
  slug: string;
  displayName: string;
  itemCount: number;
  fieldCount: number;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  templateType: TemplateType;
  fields: CollectionField[];
}
