# Compatibility policy

The current wire contract is `agent-receipt.demo.v1` with schema version `0.1.0`. Packages are JSON documents and can be verified offline when the verifier has an out-of-band trusted-key map. `keyHints` are not trust roots.

Compatibility rules:

1. A verifier supports only the profile and version it explicitly recognizes.
2. A new security-relevant field must be covered by the canonical signed payload and a negative vector.
3. Breaking changes require a new schema/vector directory and a changelog entry.
4. No compatibility with another receipt protocol is claimed without an import/export mapping and independent conformance tests.

The Node CLI and Python verifier currently agree on the seven v0.1 shared vectors. The official MCP SDK integration is an adapter that emits this profile; it is not an MCP wire-format extension.
