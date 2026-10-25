# Security policy

Do not include secrets, private keys, credentials, or personal data in issues or pull requests. For a suspected vulnerability, provide a minimal reproduction and affected commit through a private maintainer channel before public disclosure. This project is experimental and has not received an independent security audit.

The supported security model is documented in [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md), [`docs/TRUST_BOUNDARIES.md`](docs/TRUST_BOUNDARIES.md), and [`docs/BETA_READINESS.md`](docs/BETA_READINESS.md). In particular:

- Trusted public keys must be supplied out of band; package `keyHints` are not trust roots.
- Ed25519 signatures authenticate signed bytes and key possession, not truthfulness.
- Revocation is only as fresh as the supplied evidence; there is no online revocation registry.
- The MCP demonstration is local and simulated; it does not implement remote OAuth or real transactions.
- Instrumentation cannot prove that an action bypassed the enforcement boundary did not occur.
- Evidence packages contain exact action parameters and provenance metadata. The beta does not encrypt or redact packages; treat exports as sensitive and do not place production personal or payment data in them.

This policy does not promise a response-time SLA or a security guarantee for production use.
