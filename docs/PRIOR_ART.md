# Prior art and differentiation

Research snapshot: 25 October 2026. Draft status is called out because Internet-Drafts are work in progress and may change.

| Project / specification | What it provides | AGENT//RECEIPT relationship |
| --- | --- | --- |
| [RISK//REPLAY](https://github.com/Jeevan-0508/risk-replay) | Decision forensics, evidence inspection, and counterfactual replay. Its engines compare decisions after changing evidence or policy inputs. | Complementary, not a replacement. AGENT//RECEIPT does not replay model decisions; it verifies whether an exact action was authorized and whether an outcome has independent support. |
| [Obsigna / Agent Receipts](https://github.com/agent-receipts/obsigna) | Signed, chained audit trails, SDKs, daemon key custody, MCP proxy, cross-language conformance, and a verifier. | Reuse the idea of signed receipts and independent key custody where practical. AGENT//RECEIPT's testable product focus is the authorization-to-outcome evidence graph, explicit missing-evidence semantics, and approval/action binding. We must not claim a new receipt protocol where an existing profile fits. |
| [AERF](https://github.com/aerf-spec/aerf) | Draft evidence/receipt framework with issuer, parent, PDP, PEP, transparency-log, and threat-model concepts. | Align with its layered trust vocabulary. AERF itself states that a receipt is evidence, not enforcement, and documents residual risk around poisoned upstream context. |
| [Handshake Protocol](https://github.com/handshake-ai-protocol/spec) | Early-access protocol for agent identity, delegation, handshakes, and signed action receipts. | Treat as an interoperability candidate, not an implementation claim. The prototype keeps its local package profile narrow and labels compatibility as future work. |
| [Microsoft Agent Governance Toolkit](https://github.com/microsoft/agent-governance-toolkit) | Runtime policy enforcement, identity, sandboxing, audit, MCP gateways, and reliability tooling across languages. | Complementary runtime control plane. AGENT//RECEIPT is the portable verifier and investigation artifact after the runtime has produced evidence. |
| [Agent Delegation Receipts draft](https://datatracker.ietf.org/doc/draft-nelson-agent-delegation-receipts/) | Draft signed delegation records binding scope, boundaries, instructions, and validity. | Relevant for the authorization layer and future import/export mapping. It is not a stable standard and cannot be claimed as implemented here. |
| [Signed Permissions and Action Receipts draft](https://www.ietf.org/ietf-ftp/internet-drafts/draft-izmaylov-agent-permission-receipts-01.html) | Draft permission and action receipt content, Ed25519/ML-DSA, chains, acknowledgements, approvals, cancellation, and offline verification. | Strong prior art for the exact problem. This prototype should converge toward it rather than invent incompatible semantics; current code is a deliberately smaller demo profile and explicitly not a standards-conformance claim. |
| [Agent auditing architecture draft](https://datatracker.ietf.org/doc/draft-kuehlewind-audit-architecture/00/) | Draft architecture for distributed audit record generation, propagated audit context, attestations, stores, and transparency logs. | Informs the five evidence layers and the distinction between agent assertions and service records. |

## Standards and building blocks

- [RFC 8785 JCS](https://datatracker.ietf.org/doc/html/rfc8785) defines deterministic JSON serialization for hashable/signable JSON. The implementation uses the `canonicalize` package and publishes shared Node/Python vectors for the current profile; this does not claim compatibility with another receipt protocol.
- JWS/JOSE, COSE, Ed25519, W3C Verifiable Credentials, SCITT, OpenTelemetry context propagation, MCP OAuth authorization, OWASP agentic security guidance, and Google AP2 are integration or trust-boundary references, not certifications. The repository must distinguish established standards, recommendations, and drafts in future conformance work.

## Precise product gap

Existing projects tend to optimize for one of three points: runtime enforcement, signed action logging, or post-hoc decision analysis. AGENT//RECEIPT targets the seams between them. Its acceptance test is concrete: an offline verifier must separately report cryptographic integrity, authorization validity, execution observation, and outcome confirmation, including when evidence is absent or revoked.

## Originality concerns

The receipt, delegation, and audit concepts are heavily covered by active projects and drafts. The honest originality claim is therefore the workbench and verification model that connects these layers for investigation, not a novel primitive or universal receipt standard. Any future wire-format change should be compared against Obsigna, AERF, Handshake, and the IETF drafts before being proposed.

## Phase 2 implementation comparison

| Capability | Implemented here | Already available elsewhere | Remaining gap |
| --- | --- | --- | --- |
| Ed25519 signed action evidence | Yes, with RFC 8785 JCS, out-of-band trust input, and shared Node/Python v0.1 vectors | Obsigna and AERF already provide signed receipt formats and verifiers | No wire compatibility claim; profile remains private and narrow |
| Pre-action authorization enforcement | Official MCP SDK local server/client blocks the simulated booking before execution | Microsoft AGT and Obsigna MCP proxy provide broader runtime enforcement | No production network transport, OAuth validation, daemon/HSM custody, or remote policy service |
| Exact approval/action binding | Yes, action digest is checked by the verifier and adapter | Covered by the IETF permission-receipts draft's approval model | No import/export mapping to that draft |
| Independent outcome confirmation | Provider acknowledgement must be independently signed and bound to event, session, action digest, amount, and currency | AERF and IETF work discuss evidence/acknowledgement patterns | No transparency log, timestamp authority, or real external provider connector |
| Human investigation workbench | Yes: scenario explorer, timelines, provenance graph, findings | Obsigna ships a dashboard; RISK//REPLAY ships decision forensics | This UI is local/static and not yet backed by a persistent package store |
| Adversarial validation | 73 Node tests, seven shared vectors, and Playwright browser tests | AERF and Obsigna publish broader conformance material | Python execution is CI-only on this workstation; no external security review |

This comparison removes any claim that AGENT//RECEIPT is a new receipt protocol. The defensible distinction is the combination of a small offline verifier, explicit `INDETERMINATE` outcome semantics, exact action binding, and an investigation-oriented view over the evidence layers. That is a product integration gap, not a cryptographic or standards gap.
