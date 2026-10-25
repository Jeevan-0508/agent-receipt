# Release readiness

Assessment date: 25 October 2026.

## Implemented functionality

- Ed25519 signatures over RFC 8785 JCS canonical payloads.
- Out-of-band trusted-key verification; package `keyHints` are never trusted automatically.
- Authorization checks for action type, resource, endpoint, currency, integer-cent limits, validity windows, approval/action binding, revocation, and delegation attenuation.
- Signed execution records and independently signed, session-bound provider acknowledgements.
- Fail-closed malformed input handling, package/payload size limits, duplicate identifier detection, and explicit `VERIFIED`, `FAILED`, `INDETERMINATE`, and `NOT_CHECKED` statuses.
- Offline CLI, seven deterministic travel-booking scenarios, an official MCP SDK local server/client enforcement/recording integration, and a documented JavaScript SDK.
- Independent Python verifier source, versioned v0.1 schema, and seven shared interoperability vectors.
- React investigation workbench with scenario navigation, authorization checks, execution trail, provenance graph, findings, dark mode, and responsive layout.

## Validation results

| Check | Result |
| --- | --- |
| Unit, adversarial, integration, SDK, and interoperability tests | 73 passing |
| Playwright browser E2E | Passing: initial load, all seven scenarios, findings, provenance, responsive viewport, console/page errors |
| JavaScript syntax lint | Passing |
| Vite production build | Passing |
| CLI export and offline verification | Passing; valid package reports `overall: VERIFIED` |
| Scenario dispositions | 1 `VERIFIED`, 5 `FAILED`, 1 `INDETERMINATE` |
| Dependency audit | `npm audit --audit-level=high`: 0 vulnerabilities |
| Python verifier tests | Defined in CI for Python 3.12; not runnable locally because no Python interpreter is installed |
| Secret scan | Passing: repository scanner found no known private-key or credential patterns |
| Type checking | Not applicable: implementation is JavaScript/ES modules; no TypeScript source is used |

## Security findings fixed in Phase 2

| Severity | Finding | Disposition |
| --- | --- | --- |
| High | The package's embedded public keys could be mistaken for a trust root. | Fixed: verification now requires an out-of-band trusted-key map; `keyHints` are informational. |
| High | Authorization and delegation signatures were not included in package integrity decisions. | Fixed: both signed records are verified and their signer roles are checked. |
| High | Provider acknowledgements were not bound to the exact execution. | Fixed: event ID, correlation ID, action digest, amount, currency, provider identity, and signer independence are required. |
| High | Malformed packages could throw during verification. | Fixed: malformed inputs fail closed with structured results. |
| Medium | Payload/package sizes, duplicate IDs, timestamps, and numeric limits were under-validated. | Fixed with bounded sizes, duplicate detection, strict UTC timestamps, and safe integer cents. |
| Medium | The prototype serializer was only a hand-rolled sorted JSON approximation. | Fixed: RFC 8785 JCS implementation and deterministic Node/Python vector corpus added. |
| Low | Browser smoke testing was previously blocked and the favicon request was missing. | Fixed: Playwright E2E added and favicon asset supplied. |

- Embedded package key material could previously be treated as trust; verification now requires an out-of-band key map.
- Authorization and delegation signatures were previously omitted from integrity evaluation; both are now checked.
- Provider confirmations were previously not bound to the exact execution; event ID, correlation ID, action digest, amount, currency, signer independence, and provider identity are now checked.
- Malformed records and packages could throw; the verifier returns a failed result instead.
- Payload and package size limits, duplicate event IDs, invalid timestamps, unsafe amounts, unsupported algorithms, and invalid keys are now rejected.
- CLI malformed JSON now produces a controlled failure.

## Known limitations

- The package profile is not wire-compatible with Obsigna, AERF, Handshake, Microsoft Agent Governance Toolkit, or an IETF draft; no compatibility claim is made.
- No transparency log, timestamp authority, HSM/KMS, daemon-isolated signer, or network-backed revocation registry exists.
- The MCP integration is a real local official-SDK server/client path, but not a production network transport or OAuth implementation.
- The UI reads generated scenario data and has no persistent package store or upload workflow.
- The verifier authenticates signed statements; it cannot prove that a signer was truthful or that an instrumented boundary captured every action.
- The independent Python verifier and shared vectors are implemented; local Python execution is blocked by the missing runtime and the configured CI job has not been run from this workspace.

## Remaining release blockers

For a public production release: complete an external security review, implement stronger key custody and revocation freshness, add network MCP/OAuth boundary tests, and decide whether to map to an existing receipt profile rather than maintain a private profile. Before declaring the beta fully green, run the Python suite locally or record a successful CI run.

## Production-readiness assessment

**Local public-beta candidate: YES. Production deployment: NO.** The core is independently testable and the principal failure modes are covered, but Python 3.12 execution, operational trust services, key custody, and external review remain incomplete.
