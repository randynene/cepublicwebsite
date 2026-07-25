// tools/eslint/rules/no-conditional-strings-in-jsx.js
//
// MYGRATR-DESIGN-1 Brief B v1.3 §6.4 — narrow coverage for the AST gap left
// by react/jsx-no-literals@7.37.5: `noStrings: true` does not flag a
// ConditionalExpression in a JSX expression container even when one or both
// branches are string literals (Brief B §6.4 F7 failure, surfaced by the
// fixture harness in tools/eslint/__tests__/ui-strings.test.mjs).
//
// What this rule catches:
//   <p>{cond ? "yes" : "no"}</p>           → flags 2 (both branches)
//   <p>{cond ? "yes" : value}</p>          → flags 1 (only the literal branch)
//   <p>{cond ? `Hello` : `World`}</p>      → flags 2 (template literals are strings)
//   <p>{cond ? value : other}</p>          → 0 flags (no literal branches)
//
// Options:
//   allowedStrings: string[]  — branches with these exact values are skipped
//                               (mirror the production allowedStrings list used
//                                by react/jsx-no-literals so visual punctuation
//                                like "*", "·", "—" stays accepted here too).
//
// CommonJS module — ESLint's plugin loader supports both CJS and ESM but
// CJS is the safer default for custom rules across plugin authors.

'use strict'

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow ConditionalExpression in JSX whose branches are string literals',
      recommended: false,
      url: null,
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowedStrings: {
            type: 'array',
            items: { type: 'string' },
            uniqueItems: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noConditionalStringInJSX:
        'String literal "{{value}}" in conditional branch of JSX expression. Use UI_STRINGS or extract to props/Sanity.',
    },
  },

  create(context) {
    const options = context.options[0] || {}
    const allowedStrings = new Set(options.allowedStrings || [])

    function literalValueIfDisallowed(node) {
      if (!node) return null
      if (node.type === 'Literal' && typeof node.value === 'string') {
        return allowedStrings.has(node.value) ? null : node.value
      }
      if (node.type === 'TemplateLiteral') {
        const cooked = node.quasis.map((q) => q.value.cooked).join('${...}')
        return allowedStrings.has(cooked) ? null : cooked
      }
      return null
    }

    return {
      // Direct ConditionalExpression inside JSXExpressionContainer.
      // Parenthesized forms are transparent in the AST and match the same selector.
      'JSXExpressionContainer > ConditionalExpression'(node) {
        for (const branch of [node.consequent, node.alternate]) {
          const value = literalValueIfDisallowed(branch)
          if (value !== null) {
            context.report({
              node: branch,
              messageId: 'noConditionalStringInJSX',
              data: { value },
            })
          }
        }
      },
    }
  },
}
