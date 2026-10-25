# Security review guide

This guide is for an external reviewer evaluating the experimental developer beta. It is not a security certification and does not replace a formal threat-led review.

## Review boundaries

Focus on `packages/core/src/index.mjs`, `packages/sdk/src/index.mjs`, `packages/integrations/mcp/src/official-sdk.mjs`, `cli/receipt.mjs`, the Python verifier, and the evidence schema/vectors. The React workbench is a presentation layer; it must not be treated as an authority.

## Questions to test

1. Can a package substitute or alter an action without invalidating the approval digest or signed records?
2. Can embedded `keyHints` become a trust root, or can an unknown signer be accepted?
3. Can authorization, delegation, expiry, revocation, provider independence, or financial limits be bypassed?
4. Can malformed, oversized, cyclic, non-finite, duplicated, or contradictory evidence crash or mislead either verifier?
5. Can a provider acknowledgement be replayed across sessions or rebound to a different execution?
6. Does the official MCP adapter evaluate authorization before the provider callback and capture the actual tool response?
7. Do the JavaScript and Python verifiers agree on every shared vector without importing one another?

## Trust and data handling

Trusted public keys are supplied out of band. Signers are responsible for their own key custody and for the truthfulness of the statements they sign. The package records exact action parameters and provenance metadata as plaintext JSON; the beta does not encrypt or redact evidence. Do not use production personal, payment, or credential data.

Revocation is only as fresh as the evidence supplied. The beta has no online trust registry, transparency log, timestamp authority, stateful nonce service, HSM/KMS integration, remote MCP OAuth validation, or guarantee that uninstrumented actions did not occur.

## Reproduce the checks

```bash
npm ci
npm run lint
npm test
npm run test:clean-room
npm run test:e2e
npm run build
npm audit --audit-level=high
npm run secret-scan
python -m venv .venv
python -m pip install -r python/requirements.txt
python -m pytest -q python/tests
```

Report findings with a minimal reproduction and without sensitive evidence. Use the private maintainer channel described in `SECURITY.md` for vulnerabilities rather than opening a public issue.
