# Architecture

The initial release is intentionally a small local monorepo:

```text
packages/core/       canonicalization, signing, authorization, verification, scenarios
packages/sdk/        documented JavaScript enforcement/evidence wrapper
packages/integrations/mcp/ official SDK and direct local MCP adapters
cli/                 offline demo and verifier commands
apps/web/            React/Vite investigation workbench
python/              independent Ed25519/RFC 8785 verifier and tests
schemas/             versioned evidence-package schema
test-vectors/        deterministic cross-language interoperability cases
examples/            exported simulated evidence packages and SDK/MCP demos
tests/               deterministic Node, integration, and browser test suite
docs/                research, security, format, compatibility, and limitations
```

The core has no database, network calls, or UI dependencies. A package is a JSON document containing a versioned manifest, trusted public keys, one signed authorization record, signed execution/provider records, and optional delegation evidence. The verifier produces separate statuses for integrity, authorization, outcome, completeness, and overall disposition.

The web app consumes scenario output serialized at build time. It is a viewer, not an authority: the CLI remains the independent verification path.
