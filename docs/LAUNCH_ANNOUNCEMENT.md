# Technical launch draft — do not post without approval

AGENT//RECEIPT is now prepared as an experimental developer beta for local, offline-verifiable authorization-to-outcome evidence around AI agent tool calls.

The beta includes signed JSON evidence, an independent Python verifier, a maintained official MCP SDK round trip, a JavaScript SDK, paired local tarball installation, a CLI, and a React investigation workbench. It is intentionally not a production enforcement system: there is no remote OAuth validation, durable key custody, online revocation, stateful replay prevention, real provider, or independent security audit.

The useful question is narrow: can a developer preserve the exact authority, observed invocation, and separately signed outcome needed to verify a simulated action later?
