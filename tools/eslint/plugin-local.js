// tools/eslint/plugin-local.js
//
// MYGRATR-DESIGN-1 Brief B v1.3 §6.4 — local ESLint plugin wrapper.
// Bundles the project's custom rules under the `local/` namespace so they
// can be referenced from site/eslint.config.mjs as `local/<rule-name>`.
//
// CommonJS — flat-config consumers import this via `import localPlugin from
// '../tools/eslint/plugin-local.js'`; Node's CJS/ESM interop handles the
// module.exports → default-import binding.

'use strict'

const noConditionalStringsInJsx = require('./rules/no-conditional-strings-in-jsx')

module.exports = {
  rules: {
    'no-conditional-strings-in-jsx': noConditionalStringsInJsx,
  },
}
