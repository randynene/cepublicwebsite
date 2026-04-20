# CONVENTIONS.md

## Established in MYGRATR-0

### File Locations
- Product code → /src/
- One-off scripts → /scripts/
- Audit artefacts → /audit-output/
- Session briefs → /briefs/active/ (archive after phase closes)
- Context docs → repo root

### TypeScript
- Strict mode always on
- No `any` types — use `unknown` and narrow
- Zod for all external data validation
- Interfaces over types for object shapes
- Enums for all fixed value sets

### Environment
- dotenv loaded once at entry point only
- Never commit .env
- Service role key only in admin scripts and migrations
- Never use service role key in product code

### Supabase
- Every query includes org_id filter
- RLS always enabled — never bypass in product code
- Use fixed UUIDs for seeded data (CE pattern)

### Git
- Commit after every working step — not at end of session
- Format: type(scope): description
- Types: feat, fix, chore, docs, refactor, test

### Naming
- Files: kebab-case
- TypeScript interfaces/enums: PascalCase
- Variables/functions: camelCase
- Database columns/tables: snake_case
- Environment variables: SCREAMING_SNAKE_CASE

### Context File Updates
- After every phase: CHANGELOG → PHASE_HISTORY → CONVENTIONS →
  FEATURE_MAP → CLAUDE.md → SCHEMA.md → REGISTRY.md
- Move completed brief from briefs/active/ to briefs/archive/
- Open fresh Claude Code chat for post-phase audit
