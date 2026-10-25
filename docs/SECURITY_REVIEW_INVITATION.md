# Security review invitation

AGENT//RECEIPT is an experimental developer beta and has not been independently security audited. Reviewers are invited to examine the authorization evaluator, canonical signing protocol, trust-anchor handling, delegation attenuation, replay limitations, MCP boundary, and independent Python verifier.

Start with [`THREAT_MODEL.md`](THREAT_MODEL.md), [`TRUST_BOUNDARIES.md`](TRUST_BOUNDARIES.md), [`EVIDENCE_FORMAT.md`](EVIDENCE_FORMAT.md), and [`SECURITY_REVIEW_GUIDE.md`](SECURITY_REVIEW_GUIDE.md). Reproduce the adversarial Node tests, the seven shared vectors, the MCP demo, and the packaged SDK test before drawing conclusions.

The project does not request testing against real financial systems or third-party services. Report suspected vulnerabilities privately using [`SECURITY.md`](../SECURITY.md), and include a minimal reproduction without credentials or personal data.
