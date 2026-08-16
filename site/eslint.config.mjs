// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// MYGRATR-DESIGN-1 Brief B §6.4 — local custom rules (currently:
// no-conditional-strings-in-jsx, which covers the ConditionalExpression
// AST gap left by react/jsx-no-literals@7.37.5).
import localPlugin from "../tools/eslint/plugin-local.js";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // MYGRATR-DESIGN-1 Brief B §6.2 — UI_STRINGS lint rule.
  // eslint-config-next/typescript already registers eslint-plugin-react;
  // do NOT re-register (CMA F-7 v1.3 — explicit re-registration would conflict).
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { local: localPlugin },
    rules: {
      // CMA F-6 v1.3: noStrings catches JSXExpressionContainer literal text
      // (template literals with expressions, expression-level concatenation,
      // string concatenation) which the rule's default does NOT catch.
      // allowedStrings holds visual-punctuation chars that aren't UI text:
      //   "*" is the required-field asterisk per form-field/index.tsx (Group B).
      "react/jsx-no-literals": ["error", {
        noStrings: true,
        allowedStrings: ["", " ", "·", "—", "–", "*"],
        ignoreProps: true,
      }],
      // §6.4 fixture F7 surfaced that react/jsx-no-literals@7.37.5 does NOT
      // recurse into ConditionalExpression branches in JSXExpressionContainer
      // (i.e. `<p>{cond ? "yes" : "no"}</p>` is not flagged despite noStrings).
      // Narrow custom rule below covers exactly that gap. Mirror the upstream
      // allowedStrings list so visual-punctuation accepts behave consistently.
      "local/no-conditional-strings-in-jsx": ["error", {
        allowedStrings: ["", " ", "·", "—", "–", "*"],
      }],
    },
  },
  {
    // D3 v1.3 exemptions — story files, tests, demo route, framework
    // error/not-found templates (F-14), and the generated ui-strings.ts (F-15).
    // BvR #24: Brief A Pair-rule canonized bare "stories.tsx" for folder-per-primitive;
    // Brief B v1.3 inherited a glob assuming flat-file `<name>.stories.tsx` convention.
    // Both patterns listed below explicitly so customer-2 brief readers understand both shapes.
    files: [
      "**/*.stories.tsx",
      "**/stories.tsx",
      "**/*.test.{ts,tsx}",
      "src/app/demo/**",
      "src/app/**/error.tsx",
      "src/app/**/not-found.tsx",
      "src/app/global-error.tsx",
      // Vendor analytics SDK init code lives entirely in this file; not UI text.
      // Same pattern as global-error.tsx — framework/infrastructure file, not
      // chrome scope. If this file ever grows to include user-facing text,
      // revisit the exemption (Group D decision, Brief B §6.3).
      "src/components/third-party-scripts.tsx",
      // Same exemption, same reason: this file is the consent-gated half of the
      // vendor SDK init code that used to live entirely in third-party-scripts
      // .tsx. It holds inline LinkedIn/Meta/Hotjar bootstrap snippets and no
      // user-facing text. The consent BANNER (consent/cookie-banner.tsx) is
      // deliberately NOT exempted - that one is all chrome copy and belongs
      // under UI_STRINGS.
      "src/components/consent/gated-scripts.tsx",
      "**/ui-strings.ts",
    ],
    rules: {
      "react/jsx-no-literals": "off",
      "local/no-conditional-strings-in-jsx": "off",
    },
  },
  // Override default ignores of eslint-config-next + add storybook-static (BvR #25).
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // BvR #25: ESLint walks the entire project from root; build-artefact dirs
    // must be explicit in globalIgnores even when .gitignore covers them.
    "storybook-static/**",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
