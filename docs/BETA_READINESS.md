# Developer beta readiness

Assessment date: 25 October 2026.

## Implemented and tested

- Core authorization-to-outcome verifier with explicit `VERIFIED`, `FAILED`, and `INDETERMINATE` results.
- Ed25519 signatures over RFC 8785 canonical payloads, external trust anchors, exact action/approval binding, delegated-scope attenuation, expiry/revocation checks, provider independence, correlation binding, duplicate-ID detection, and bounded input handling.
- Official MCP SDK local server/client path using `McpServer`, `Client`, and `InMemoryTransport`. A registered `book_hotel` call is blocked before the simulated provider when authorization fails.
- Portable package export and independent CLI verification.
- Public JavaScript SDK: `definePolicy()` and `createReceiptAgent().callTool()`.
- Independent Python verifier source and shared v0.1 test vectors.
- React investigation workbench and Playwright browser coverage for loading, all seven scenarios, findings, provenance, responsive layout, console errors, and runtime page errors.
- CI definition for Node 20/22/24, Python 3.12, dependency auditing, syntax linting, and repository secret-pattern scanning.

## Implemented but not independently reviewed

- Cryptographic protocol design and threat model have adversarial local tests, but have not received an external security review.
- The Python verifier is a separate implementation and has deterministic shared vectors. This workstation cannot execute Python, but GitHub Actions verified all seven vectors on Python 3.12.15 (`7 passed`).
- The official MCP SDK integration demonstrates local protocol plumbing; it is not a production network deployment.

## Planned

- External review of the evidence protocol, key lifecycle, replay model, and trust-anchor distribution.
- Stateful nonce/replay prevention and a transparency or timestamp service.
- KMS/HSM or daemon-isolated signing, durable revocation publication, package retention, and production observability.
- Import/export mapping to an existing receipt profile where useful.
- Full transport-level MCP integration and remote OAuth validation, if a deployment needs them.

## Unsupported and non-guarantees

- No real purchase, external financial transaction, or payment credential is used.
- No remote MCP service, OAuth resource-server validation, hosted trust registry, transparency log, or timestamp authority is implemented.
- Signatures prove control of a key and integrity of a statement; they do not prove that a signer was truthful or that an uninstrumented action did not occur.
- The package is not wire-compatible with Obsigna, AERF, Handshake, Microsoft Agent Governance Toolkit, or IETF drafts.

## Release decision

The repository is suitable for a public developer beta and external review preparation. It is not production-ready for consequential transactions. The remaining release blockers are an external security review and an operational trust/key-custody design; replay, revocation, and network OAuth limitations remain documented.
