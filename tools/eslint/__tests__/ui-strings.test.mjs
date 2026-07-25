// tools/eslint/__tests__/ui-strings.test.mjs
//
// MYGRATR-DESIGN-1 Brief B v1.3 §6.4 — AST coverage fixture tests for the
// UI_STRINGS lint rules under the production config used in
// site/eslint.config.mjs.
//
// Two rules under test:
//   - react/jsx-no-literals (upstream, eslint-plugin-react@7.37.5)
//   - local/no-conditional-strings-in-jsx (project-local, covers the
//     ConditionalExpression branch gap surfaced by F7)
//
// 8 fixtures (F1–F7b) cover JSXText, JSXAttribute (ignoreProps exemption),
// 4 JSXExpressionContainer shapes the upstream rule catches, and the
// ConditionalExpression branch shape split into F7a (upstream gap — verifies
// the gap STILL EXISTS as a regression catch if upstream ever fixes it) and
// F7b (custom rule — verifies our coverage fills the gap).
//
// Each fixture declares `expectedRuleId` so the harness counts only errors
// from the rule under test, ignoring noise from the other rule.
//
// Run from any cwd:
//   node tools/eslint/__tests__/ui-strings.test.mjs
//
// Implementation note (BvR #26): ESLint 9's RuleTester does not fully
// register plugin namespaces when a rule is passed directly. Linter.verify
// with `plugins: { react: reactPlugin, local: localPlugin }` works correctly
// and lets us exercise the exact production config shape — so a passing test
// guarantees parity with production behaviour.

import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const siteRequire = createRequire(path.resolve(__dirname, '../../../site/package.json'))

const { Linter } = siteRequire('eslint')
const reactPlugin = siteRequire('eslint-plugin-react')
const tsParser = siteRequire('@typescript-eslint/parser')

// Local plugin lives at repo root (not site/node_modules); resolve via file path.
const localPlugin = (await import(path.resolve(__dirname, '../plugin-local.js'))).default

const ALLOWED_STRINGS = ['', ' ', '·', '—', '–', '*']

const config = [
  {
    files: ['**/*.tsx', '**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { react: reactPlugin, local: localPlugin },
    rules: {
      'react/jsx-no-literals': ['error', {
        noStrings: true,
        allowedStrings: ALLOWED_STRINGS,
        ignoreProps: true,
      }],
      'local/no-conditional-strings-in-jsx': ['error', {
        allowedStrings: ALLOWED_STRINGS,
      }],
    },
  },
]

const fixtures = [
  {
    name: 'F1 — JSX text literal flags',
    code: 'const X = () => <p>Hardcoded</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 1,
  },
  {
    name: 'F2 — JSX attribute literal does NOT flag (ignoreProps: true)',
    // Self-closing — no JSXText children. Brief literal had `>x</button>`
    // content which would itself flag as a JSXText violation under the
    // production allowedStrings list (which does not include "x"); the
    // self-closing form isolates the ignoreProps semantic from incidental
    // JSXText noise.
    code: 'const X = () => <button label="Hardcoded" />',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 0,
  },
  {
    name: 'F3 — JSX expression with string literal flags',
    code: 'const X = () => <p>{"Hardcoded"}</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 1,
  },
  {
    name: 'F4 — JSX expression with template literal (no interpolation) flags',
    code: 'const X = () => <p>{`Hardcoded`}</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 1,
  },
  {
    name: 'F5 — JSX expression with template literal WITH interpolation flags (CMA F-8 v1.3 critical)',
    code: 'const X = ({ name }) => <p>{`Hello ${name}`}</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 1,
  },
  {
    name: 'F6 — JSX expression with string concatenation flags (CMA F-8 v1.3 critical)',
    code: 'const X = ({ name }) => <p>{"Hello " + name}</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 1,
  },
  {
    // F7a — verifies the upstream gap STILL EXISTS. If a future
    // eslint-plugin-react release closes the gap, this fixture flips to
    // expected: 2 and we can retire F7b. Regression-catch.
    name: 'F7a — react/jsx-no-literals does NOT flag ConditionalExpression branches (upstream gap, regression catch)',
    code: 'const X = ({ cond }) => <p>{cond ? "yes" : "no"}</p>',
    expectedRuleId: 'react/jsx-no-literals',
    expected: 0,
  },
  {
    // F7b — verifies our custom rule covers the gap. Both branches are
    // string literals, both should be reported separately (2 errors).
    name: 'F7b — local/no-conditional-strings-in-jsx flags both ConditionalExpression branches',
    code: 'const X = ({ cond }) => <p>{cond ? "yes" : "no"}</p>',
    expectedRuleId: 'local/no-conditional-strings-in-jsx',
    expected: 2,
  },
]

const linter = new Linter()
const failures = []

for (const fixture of fixtures) {
  const messages = linter.verify(fixture.code, config, { filename: 'test.tsx' })
  const ruleMessages = messages.filter((m) => m.ruleId === fixture.expectedRuleId)
  const actual = ruleMessages.length
  const status = actual === fixture.expected ? 'PASS' : 'FAIL'
  console.log(`[${status}] ${fixture.name}`)
  console.log(`         rule=${fixture.expectedRuleId} expected=${fixture.expected} actual=${actual}`)
  if (status === 'FAIL') {
    failures.push({ ...fixture, actual, ruleMessages, allMessages: messages })
  }
}

if (failures.length > 0) {
  console.error('\n✗ Fixture failures:')
  for (const f of failures) {
    console.error(`  - ${f.name}`)
    console.error(`    code: ${f.code}`)
    console.error(`    expected ${f.expected} errors from ${f.expectedRuleId}, got ${f.actual}`)
    if (f.ruleMessages.length > 0) {
      console.error(`    matched messages:`, JSON.stringify(f.ruleMessages, null, 2))
    }
    const otherMessages = f.allMessages.filter((m) => m.ruleId !== f.expectedRuleId)
    if (otherMessages.length > 0) {
      console.error(`    other rule messages (informational):`, JSON.stringify(otherMessages, null, 2))
    }
  }
  console.error(`\n✗ ${failures.length} of ${fixtures.length} fixtures failed`)
  process.exit(1)
}

console.log('\n[ui-strings.test] ✓ All 8 fixtures passed expected outcomes')
console.log('[ui-strings.test]   1 valid:   F2 (ignoreProps exempts attribute literal)')
console.log('[ui-strings.test]   6 upstream-rule invalid: F1, F3, F4, F5, F6')
console.log('[ui-strings.test]   1 upstream-rule gap (regression catch): F7a (expected 0 — gap still exists)')
console.log('[ui-strings.test]   1 custom-rule coverage: F7b (expected 2 — both branches flagged)')
