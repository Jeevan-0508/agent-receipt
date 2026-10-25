# External security-review handoff

Status: ready for an independent review of the current main branch. AGENT//RECEIPT is an **EXPERIMENTAL DEVELOPER BETA — NOT INDEPENDENTLY SECURITY AUDITED**. This document describes the implemented local release candidate; it is not an audit report, certification, or production-readiness statement.

## 1. System architecture and trust boundaries

The system records an authorization decision, a simulated tool invocation, and a provider response as a signed, portable JSON evidence package:

    principal approval -> agent/tool execution -> provider acknowledgement
            |                    |                         |
       principal key        agent key                 provider key
            \________________ signed JSON evidence ________________/
                                  |
                      offline verifier + CLI + Python verifier
                                  |
                         investigation workbench

The main components are:

- packages/core/src/index.mjs: canonicalization, Ed25519 signing and verification, authorization evaluation, evidence binding, delegation checks, and package dispositions.
- packages/sdk/src/index.mjs: the documented JavaScript wrapper that evaluates policy before invoking a selected tool and exports a signed package.
- packages/integrations/mcp/src/official-sdk.mjs: an in-process integration using the maintained official MCP SDK and in-memory transport.
- cli/receipt.mjs: package generation for the demo and independent CLI verification with an externally supplied trusted-key map.
- python/verify.py: a separate Python verifier using Python's standard library plus the established rfc8785 and cryptography packages; it does not import the JavaScript engine.
- apps/web: a read-only investigation workbench. It displays verifier findings and provenance; it is not an authorization authority.

Trust boundaries:

1. The principal or approval system decides what an agent may do and controls the principal signing key.
2. The agent and instrumented tool boundary is untrusted. A consequential call must be evaluated before the provider call in the enforcement integration.
3. The provider boundary is separate from the agent boundary. Provider acknowledgements require an independently trusted provider key and bind to the execution event.
4. The verifier trusts only the public keys supplied in its external trusted-key configuration. Package key hints are informational and cannot establish trust.
5. Operators are responsible for key custody, trust-map distribution, revocation freshness, clock assumptions, evidence retention, and protecting plaintext evidence.
6. The browser workbench, exported JSON, and repository examples are presentation or test artifacts; they do not add trust.

## 2. Prioritized threat model

| Priority | Threat | Implemented mitigation | Residual risk |
| --- | --- | --- | --- |
| Critical | A malicious agent changes action parameters or executes outside policy. | Pre-execution authorization; exact action digest; resource, endpoint, currency, amount, time, approval, role, and delegation checks. MCP enforcement blocks before the provider call. | An uninstrumented or separately deployed tool can bypass this local integration. |
| Critical | A compromised signer forges or widens authority. | Ed25519 verification, role separation, external trusted-key map, exact payload binding, attenuating delegation rules. | No HSM/KMS, threshold signing, key rotation, recovery, transparency log, or independent signer governance is included. |
| High | Untrusted evidence or a package key hint is substituted. | Canonical signed records, digest checks, duplicate-ID rejection, required record bindings, and external trust roots. | An operator can still configure the wrong trust map or accept an untrusted package outside the verifier. |
| High | A forged or copied provider acknowledgement is presented as an outcome. | Provider signer must be independently trusted and the acknowledgement binds to event ID, correlation ID, action digest, amount, currency, provider identity, and status. | A compromised or dishonest provider key can sign a false acknowledgement; signatures authenticate origin/integrity, not physical truth. |
| High | Delegation exceeds parent authority. | Delegation is checked for allowed actions, depth, scope, validity, and attenuation of financial limits. | Authority lifecycle and organizational approval outside the package are not modeled. |
| High | Missing, expired, revoked, or indeterminate trust evidence is treated as success. | Missing required outcome and unknown/indeterminate revocation do not produce VERIFIED; expired and revoked permissions fail. | Revocation freshness depends on the operator-supplied map and time source. |
| High | A valid package is replayed for another session or action. | IDs, correlation IDs, action digests, timestamps, duplicate detection, and cross-session acknowledgement checks are verified. | There is no stateful nonce service, global replay cache, timestamp authority, or transparency log. |
| Medium | Malformed, oversized, cyclic, non-finite, or unsupported input crashes or bypasses verification. | Bounded package/payload sizes, RFC 8785 canonicalization, Ed25519-only algorithm checks, defensive parsing, and fail-closed dispositions. | Availability protections are local process limits, not a hardened service boundary. |
| Medium | Plaintext evidence exposes sensitive action parameters. | Documentation explicitly warns that exported packages contain exact parameters and responses. | No encryption, redaction policy, tenant isolation, access-control service, or retention/deletion workflow is implemented. |
| Medium | Instrumentation is bypassed or the provider result is not captured. | SDK/MCP examples enforce and record the selected call; absent outcome evidence becomes INDETERMINATE. | Coverage is not universal for arbitrary agents, tools, subprocesses, or network traffic. |
| Low | UI or documentation overstates verification. | Experimental-beta language, actual findings/provenance in the workbench, and explicit non-guarantees. | Reviewers should still treat the verifier and trust configuration as authoritative, not visual status alone. |

## 3. Cryptographic verification checklist

Reviewers should confirm each item in code and in the adversarial tests:

- Ed25519 is the only supported signature algorithm; no project-defined cryptographic algorithm is used.
- Signed payloads are serialized with RFC 8785-compatible canonical JSON before hashing and signing.
- The signed payload includes all security-relevant authorization, execution, provider, identity, binding, and timing fields.
- Record digests and signatures are checked over the canonical payload, not over presentation formatting.
- Principal, agent, and provider signing roles are distinct and checked against the configured trust map.
- Package key hints never replace the verifier's externally supplied trust roots.
- Approval signatures bind to the exact action digest, including parameters that affect the consequential action.
- Provider acknowledgements bind to the exact execution event, correlation ID, action digest, amount, currency, provider identity, and status.
- Expired, not-yet-valid, revoked, unknown, or indeterminate permissions cannot produce VERIFIED.
- Delegated authority cannot widen parent scope, financial limits, or delegation depth.
- Missing required evidence produces INDETERMINATE, not VERIFIED.
- Unsupported algorithms, malformed keys/signatures, malformed JSON, duplicate identifiers, contradictory evidence, oversized input, and invalid numeric/timestamp values fail closed.
- JavaScript and Python agree on the seven versioned interoperability vectors.
- The implementation distinguishes evidence integrity and signer authenticity from proof that an underlying real-world event was true.

## 4. Known limitations and unsupported production controls

The following are explicit release limitations:

- No external security audit or independent security review has been completed.
- This beta has no managed key custody, HSM/KMS integration, rotation, recovery, threshold approval, key transparency, or secure signer enrollment.
- Trust-key provisioning is out of band. A verifier is only as trustworthy as the public-key map and its distribution.
- Revocation is not an online, freshness-protected service. Replay resistance has no global state, nonce authority, or transparency log.
- The MCP example is local, in-process, and simulated. Remote MCP transport, OAuth, mTLS, deployment isolation, and production policy enforcement are unsupported.
- The provider is simulated. A signed acknowledgement does not prove that money, inventory, or an external side effect actually changed.
- The system cannot detect an agent or tool that operates outside the instrumented enforcement path.
- Evidence is plaintext JSON containing exact parameters and responses. Encryption, redaction, PII classification, tenant isolation, secure retention, and deletion are not implemented.
- The browser application is an investigation viewer, not an access-control boundary or policy enforcement point.
- No real purchases, financial transactions, regulated attestations, compliance certification, availability SLA, or hosted service is provided.
- The versioned profile is the documented agent-receipt.demo.v1 format. Schema validation and semantic verification are separate; the verifier's rules remain required.

See docs/ARCHITECTURE.md, docs/TRUST_BOUNDARIES.md, docs/THREAT_MODEL.md, docs/VERIFICATION_MODEL.md, docs/EVIDENCE_FORMAT.md, docs/BETA_READINESS.md, docs/FINAL_RELEASE_ASSESSMENT.md, and SECURITY.md for detailed assumptions and beta disclosures.

## 5. Reproduction instructions

Run from the repository root with Node.js 20, 22, or 24. Use a clean checkout and do not place production credentials or real evidence in the repository.

### Node, integration, adversarial, and build checks

    npm ci
    npm run lint
    npm test
    npm run test:all
    npm run test:clean-room
    npm run test:packages
    npm run typecheck:consumer
    npm run build
    npm audit --audit-level=high
    npm run secret-scan

The focused adversarial suites can be run with:

    node --test tests/security.test.mjs
    node --test tests/core.test.mjs tests/interop.test.mjs tests/mcp.integration.test.mjs tests/mcp.sdk.test.mjs tests/sdk.test.mjs

### Independent Python verifier

Use Python 3.12 or newer in an isolated environment:

    python -m venv .venv

On macOS/Linux:

    source .venv/bin/activate

On Windows PowerShell:

    .\.venv\Scripts\Activate.ps1

Then run:

    python -m pip install -r python/requirements.txt
    python -m pytest -q python/tests
    python python/verify.py test-vectors/v0.1/valid.json

Run the seven shared vectors directly.

On Windows PowerShell:

    Get-ChildItem test-vectors/v0.1/*.json | ForEach-Object { python python/verify.py $_.FullName }

On macOS/Linux:

    for f in test-vectors/v0.1/*.json; do python python/verify.py "$f"; done

Expected dispositions are documented in each vector and in python/README.md; the JavaScript interoperability test checks the same files.

### MCP demonstration

Run:

    npm run mcp:demo
    npm run verify -- examples/mcp-sdk/package.json --trusted-keys examples/mcp-sdk/trusted-keys.json

The expected demonstration result is one authorized provider call, zero provider calls for the blocked unauthorized action, a VERIFIED exported package, and an INDETERMINATE package when the provider evidence is intentionally insufficient. The script uses only simulated local actions and writes its ignored output below examples/mcp-sdk/.

### Browser workbench

Install the browser used by the end-to-end test and run:

    npx playwright install chromium
    npm run test:e2e

The test starts Vite itself and checks initial loading, all seven scenarios, actual findings and provenance, responsive layouts, basic accessible names, console errors, runtime page errors, and broken assets. For manual inspection:

    npm run web:dev

### Current validation record

The final main-branch GitHub Actions run is [40228428527](https://github.com/Jeevan-0508/agent-receipt/actions/runs/40228428527), which passed Node 20/22/24, Python 3.12, browser, packaging, typecheck, build, audit, and secret-scan jobs. Local Node, browser, package, build, audit, secret-scan, MCP, and CLI checks also passed. Python 3.12 was not installed in the local Windows environment at hand; the Python commands above are validated by the CI job and should be rerun by the reviewer locally.

## 6. Guarantee-to-implementation review guide

| Security property to review | Implementation | Corresponding tests |
| --- | --- | --- |
| Canonical signed bytes and digest integrity | packages/core/src/index.mjs: canonicalize, canonicalBytes, signRecord, verifyRecord | tests/security.test.mjs tampered evidence/digest, malformed input, unsupported algorithm; tests/interop.test.mjs; Python tests |
| Trust roots are external, not package hints | verifyRecord and verifyPackage trusted-key handling | Embedded key-hint, unknown signer, empty trust, and changed-hint tests in tests/security.test.mjs |
| Pre-execution MCP authorization | packages/integrations/mcp/src/official-sdk.mjs and evaluateAuthorization | tests/mcp.integration.test.mjs, tests/mcp.sdk.test.mjs, scripts/mcp-demo.mjs |
| Exact approval-to-action binding | actionDigest and authorization approval checks | Parameter substitution and exact approval digest tests in tests/core.test.mjs and tests/security.test.mjs |
| Limits, validity, revocation, and required confirmations | evaluateAuthorization and package disposition rules | Spending-limit, expiry, invalid-window, revocation, missing-confirmation, and indeterminate tests |
| Delegation attenuation | Delegation checks in evaluateAuthorization and package verification | Unauthorized, widened, depth, and in-scope delegation tests |
| Provider outcome provenance | Provider record checks in verifyPackage | Provider signer, identity, event, correlation, action digest, amount, currency, status, contradiction, and cross-session tests |
| Missing outcome is not success | Required execution/provider records and disposition model | Missing confirmation tests, Python missing-evidence vector, MCP insufficient-evidence demonstration |
| Defensive verifier behavior | Size bounds, JSON parsing, canonicalization, algorithm and numeric checks | Oversized package/payload, malformed CLI JSON, cyclic/non-finite, duplicate-ID, and unsupported-key tests |
| Cross-language interoperability | python/verify.py, python/tests, and test-vectors/v0.1 | Seven shared vectors plus tests/interop.test.mjs |
| Public developer wrapper | packages/sdk/src/index.mjs and package exports | tests/sdk.test.mjs, npm run test:clean-room, npm run test:packages, npm run typecheck:consumer |

## 7. Private vulnerability disclosure

Do not open a public issue, pull request, discussion, or include secrets, private keys, personal data, or production evidence in a report. Check the repository's GitHub Security tab for the **Report a vulnerability** workflow. If it is not enabled, contact the Jeevan-0508 maintainer privately through GitHub and request a secure reporting channel before sending sensitive material. Do not assume that ordinary issue comments or email are confidential.

Include, after sanitizing all evidence:

1. A short title, affected commit, component, and trust boundary.
2. Impact, attack preconditions, and the smallest reproducible steps.
3. Expected versus observed disposition or execution behavior.
4. Environment, Node/Python versions, commands, and whether the issue reproduces from a clean checkout.
5. A minimal sanitized fixture or patch, if safe to share.
6. Whether the issue can cause unauthorized execution, false VERIFIED, signer compromise, replay, disclosure, or denial of service.

Maintainers should acknowledge receipt, reproduce privately, assign severity, add a regression test, fix or document the limitation, update affected security documentation, and coordinate disclosure. No response-time or remediation SLA is promised by this experimental beta.

## 8. Proposed review scope and acceptance criteria

In scope:

- Canonicalization, signatures, key roles, trust provisioning, package bindings, authorization, delegation, expiry, revocation, replay, and disposition semantics.
- The local MCP enforcement path and the distinction between enforcement and retrospective verification.
- JavaScript/Python vector compatibility, CLI behavior, package exports, and security-relevant browser claims.
- Plaintext evidence handling, CI security checks, documentation claims, and test gaps that could change the security posture.

Out of scope:

- Security claims for remote OAuth/MCP deployments or real providers, which are explicitly unsupported.
- Real financial transactions, production infrastructure, regulatory certification, and availability guarantees.
- Feature requests that do not affect the documented security properties.

Acceptance criteria:

- Every Critical or High finding is fixed, explicitly risk-accepted by the project owner, or clearly excluded with rationale.
- Each fixed finding has a regression test or a documented reason a test is not meaningful.
- JavaScript and Python agree on all versioned vectors, including negative and indeterminate cases.
- No missing, unknown, untrusted, expired, revoked, contradictory, or malformed evidence can produce VERIFIED.
- Final documentation describes the tested commit, assumptions, residual risk, and unsupported controls without audit or production claims.
- All relevant local and CI checks pass from a clean checkout.

Severity definitions:

- **Critical:** unauthorized consequential execution, arbitrary code execution, signer/private-key compromise, or attacker-controlled evidence incorrectly accepted as VERIFIED under a supported trust configuration.
- **High:** trust substitution, signer-role confusion, binding or delegation bypass, incorrect financial/endpoint limits, replay that defeats a documented guarantee, or material sensitive-data exposure.
- **Medium:** bounded denial of service, stale-revocation or timing weakness within the documented model, partial confidentiality loss, or a meaningful integrity failure requiring notable preconditions.
- **Low:** limited-impact hardening, non-authoritative UI misleadingness, documentation ambiguity, or issues without a security-impacting bypass.

## 9. Finding-resolution checklist

For every review finding:

- Record an identifier, title, reporter, commit, component, trust boundary, severity, and affected version.
- Reproduce from a clean checkout with sanitized inputs; never use production credentials or private evidence.
- Confirm the security impact and whether the issue changes enforcement, verification, provenance, confidentiality, or availability.
- Classify the finding against the threat model and decide whether it is in scope.
- Add a minimal regression test, including cross-language coverage where the evidence format is involved.
- Implement the smallest fail-closed fix that preserves the versioned compatibility vectors, or document a reasoned risk acceptance.
- Rerun the focused test, the relevant Node/Python/MCP/browser checks, and the complete required CI suite.
- Review schema, format, CLI, SDK, README, and security-document changes for compatibility and accurate claims.
- Record residual risk, affected commit, validation evidence, and any migration or operator action.
- Keep details private until the maintainer and reporter agree on disclosure timing.

## Exact starting instructions for an independent reviewer

Use a fresh checkout and begin with:

    git clone https://github.com/Jeevan-0508/agent-receipt.git
    cd agent-receipt
    git checkout main
    npm ci
    npm run lint
    npm run test:all
    node --test tests/security.test.mjs
    npm run test:clean-room
    npm run test:packages
    npm run mcp:demo
    npm run verify -- examples/mcp-sdk/package.json --trusted-keys examples/mcp-sdk/trusted-keys.json
    npm run build
    npm audit --audit-level=high
    npm run secret-scan

Next, create an isolated Python 3.12+ environment, install python/requirements.txt, run python -m pytest -q python/tests, and execute every file in test-vectors/v0.1/. Install Chromium with Playwright and run npm run test:e2e. Read docs/TRUST_BOUNDARIES.md, docs/THREAT_MODEL.md, docs/VERIFICATION_MODEL.md, docs/EVIDENCE_FORMAT.md, and this handoff before reviewing code. Start with the Critical and High threats above, attempt the smallest sanitized bypass against the named trust boundary, compare JavaScript and Python dispositions, and report any suspected vulnerability through the private procedure in Section 7. Do not treat a green test, a browser badge, or a signed package as proof that the underlying real-world event occurred.
