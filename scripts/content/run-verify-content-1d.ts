// CONTENT-1D §9 — CLI entrypoint for the verifier.
//
// Calls verifyContent1D() WITHOUT try/catch. On failure, the unhandled
// rejection propagates → process exits non-zero.
//
// Default mode: full check including state (post-Step-8). For pre-Step-8
// runs use `--skip-state-check`.
import { verifyContent1D } from './verify-content-1d'

const skipStateCheck = process.argv.includes('--skip-state-check')

verifyContent1D({ skipStateCheck })
