// CONTENT-1E — CLI entrypoint for the verifier.
//
// Calls verifyContent1E() WITHOUT try/catch. On failure, the unhandled
// rejection propagates → process exits non-zero. Mirror of
// run-verify-content-1d.ts.
import { verifyContent1E } from './verify-content-1e'

verifyContent1E()
