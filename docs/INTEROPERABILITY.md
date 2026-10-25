# Interoperability and compatibility

## Implemented contract

The repository defines the versioned `agent-receipt.demo.v1` profile in [`schemas/v0.1/evidence-package.schema.json`](../schemas/v0.1/evidence-package.schema.json). Signed payloads use RFC 8785 JSON Canonicalization Scheme, Ed25519, base64url-encoded SPKI public keys, and SHA-256 digests over the canonical bytes.

The JavaScript verifier and the independent Python verifier consume the same seven deterministic packages under [`test-vectors/v0.1`](../test-vectors/v0.1): valid, tampered evidence, authorization violation, delegation failure, expired permission, missing confirmation, and invalid trust anchor. The JavaScript suite checks all seven. A Python 3.12 CI job is configured for the same cases, but it cannot be executed on the current Windows workstation because no Python interpreter is installed.

The shared contract is deliberately narrower than a general receipt protocol. The Python implementation verifies the signed record structure, trusted Ed25519 keys, exact action digest, authorization constraints, delegation attenuation, provider binding, and the three relevant dispositions (`VERIFIED`, `FAILED`, `INDETERMINATE`). It does not import JavaScript code.

## Compatibility status

| Package or protocol | Status |
| --- | --- |
| AGENT//RECEIPT v0.1 JSON profile | Supported by the Node CLI and Python verifier |
| RFC 8785 JCS | Used for signed payload serialization; shared vectors cover the profile's current JSON types |
| Ed25519 | Supported through Node `crypto` and Python `cryptography` |
| Official MCP SDK local transport | Tested with `@modelcontextprotocol/sdk` `McpServer`, `Client`, and `InMemoryTransport` |
| Obsigna, AERF, Handshake, IETF permission receipts | Not wire-compatible; no conformance claim |
| MCP remote OAuth | Unsupported; the demo is local and does not validate OAuth tokens |

Future profile changes must add a new schema/vector directory or an explicit migration document. A verifier must reject an unsupported profile/version rather than silently treating it as compatible.
