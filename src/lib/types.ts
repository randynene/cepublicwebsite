import { z } from 'zod';

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum MigrationStatus {
  PENDING = 'pending',
  AUDIT = 'audit',
  SCHEMA = 'schema',
  SCAFFOLD = 'scaffold',
  CONTENT = 'content',
  BUILDING = 'building',
  QA = 'qa',
  LAUNCH = 'launch',
  CUTOVER = 'cutover',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

export enum PhaseStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETE = 'complete',
  FAILED = 'failed',
  ESCALATED = 'escalated',
}

export enum TemplateType {
  HOME = 'home',
  TECHNOLOGY = 'technology',
  SERVICE = 'service',
  BLOG = 'blog',
  COMPARE = 'compare',
  CUSTOMER_STORY = 'customer_story',
  TEAM_MEMBER = 'team_member',
  VIDEO = 'video',
  REVIEW = 'review',
  BOOK_A_CALL = 'book_a_call',
  DOWNLOAD = 'download',
  TOOL = 'tool',
  STATIC = 'static',
  UNKNOWN = 'unknown',
}

export enum Locale {
  US = 'us',
  UK = 'uk',
}

export enum MigrationTier {
  INTERNAL = 'internal',
  GUIDED = 'guided',
  DFY = 'dfy',
}

// ─── Core Domain Interfaces ───────────────────────────────────────────────────

export interface Organisation {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Migration {
  id: string;
  orgId: string;
  sourceDomain: string;
  targetDomain?: string;
  status: MigrationStatus;
  currentPhase: string;
  tier: MigrationTier;
  startedAt: Date;
  completedAt?: Date;
  metadata: Record<string, unknown>;
}

// ─── Audit Interfaces ─────────────────────────────────────────────────────────

export interface FieldRecord {
  id: string;
  slug: string;
  displayName: string;
  type: string;
  required: boolean;
}

export interface CollectionRecord {
  id: string;
  slug: string;
  displayName: string;
  singularName: string;
  fieldCount: number;
  itemCount: number;
  fields: FieldRecord[];
}

export interface PageRecord {
  url: string;
  slug: string;
  title: string;
  locale: Locale;
  templateType: TemplateType;
  isIndexable: boolean;
  screenshotPaths: Partial<Record<'mobile' | 'tablet' | 'desktop', string>>;
}

export interface FormRecord {
  pageUrl: string;
  formName: string;
  fields: string[];
  action: string;
}

export interface CustomCodeRecord {
  pageUrl: string;
  scripts: string[];
  embeds: string[];
}

export interface AuditManifest {
  migrationId: string;
  totalPages: number;
  totalCollections: number;
  totalCmsItems: number;
  totalForms: number;
  pageInventory: PageRecord[];
  collectionInventory: CollectionRecord[];
  formInventory: FormRecord[];
  customCodeInventory: CustomCodeRecord[];
  rawSitemapUrls: string[];
  generatedAt: Date;
}

// ─── QA Interfaces ────────────────────────────────────────────────────────────

export interface LighthouseScores {
  performance: number;
  seo: number;
  accessibility: number;
  bestPractices: number;
}

export interface QAResult {
  templateType: TemplateType;
  pageUrl: string;
  passed: boolean;
  visualDiffScore: number;
  contentDiffPassed: boolean;
  metaDiffPassed: boolean;
  structuredDataDiffPassed: boolean;
  lighthouseScores: LighthouseScores;
  failureReasons: string[];
  attemptNumber: number;
  runAt: Date;
}

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface CmsAdapter {
  fetchContent(collectionId: string): Promise<unknown[]>;
  listCollections(): Promise<CollectionRecord[]>;
  verifyConnection(): Promise<boolean>;
}

// ─── Zod Schemas (for runtime validation) ────────────────────────────────────

export const FieldRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export const CollectionRecordSchema = z.object({
  id: z.string(),
  slug: z.string(),
  displayName: z.string(),
  singularName: z.string(),
  fieldCount: z.number(),
  itemCount: z.number(),
  fields: z.array(FieldRecordSchema),
});

export const PageRecordSchema = z.object({
  url: z.string().url(),
  slug: z.string(),
  title: z.string(),
  locale: z.nativeEnum(Locale),
  templateType: z.nativeEnum(TemplateType),
  isIndexable: z.boolean(),
  screenshotPaths: z.record(z.string(), z.string()),
});
