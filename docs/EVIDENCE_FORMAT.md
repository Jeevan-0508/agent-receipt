# Evidence package format

The demo profile is `agent-receipt.demo.v1`.

```json
{
  "manifest": { "version": "0.1.0", "packageId": "...", "profile": "agent-receipt.demo.v1" },
  "keyHints": { "did:...": "base64url SPKI" },
  "authorization": { "payload": {}, "signer": "did:...", "alg": "Ed25519", "signature": "...", "digest": "..." },
  "records": [{ "payload": {}, "signer": "did:...", "alg": "Ed25519", "signature": "...", "digest": "..." }],
  "metadata": { "simulated": true }
}
```

Signed payloads use RFC 8785 JSON Canonicalization Scheme through the `canonicalize` package, with recursively sorted object keys, deterministic number serialization, no insignificant whitespace, and finite JSON values. Money is represented as integer cents. The independent Python verifier uses the same RFC 8785 contract and the shared vectors in `test-vectors/v0.1`; this is profile-level interoperability, not compatibility with another receipt protocol.

`keyHints` are informational public-key references only. The verifier never trusts keys from the package itself. A verifier must supply an out-of-band trusted-key map; otherwise the package fails closed with `FAILED`.

The normative machine-readable shape is [`schemas/v0.1/evidence-package.schema.json`](../schemas/v0.1/evidence-package.schema.json). Semantic checks such as signer roles, action binding, provider independence, and trust-anchor selection remain verifier rules rather than JSON Schema constraints.
