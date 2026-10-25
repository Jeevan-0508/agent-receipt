# Threat model

## Assets

- The exact authorization scope and approval/action binding.
- Evidence integrity and signer identity.
- The relationship between an observed execution event and a downstream acknowledgement.
- Revocation state and the verifier's freshness assumptions.

## Trust assumptions

- Trusted public keys are configured out of band and are not inferred from the package's `keyHints`.
- Ed25519 is implemented by the platform cryptography library.
- A provider acknowledgement is an independently keyed statement, not proof that the provider's internal systems were honest.
- The verifier parses bounded JSON and rejects malformed records.

## Threats and mitigations

| Threat | Detection / mitigation | Residual risk |
| --- | --- | --- |
| Field tampering | Signature and digest verification | Key compromise or incorrect trusted key |
| Forged trusted-looking signer | Explicit trusted-key map | Key distribution remains an operational problem |
| Parameter substitution | Approval digest is compared to the exact action object | An approval can be overly broad if issued that way |
| Overspending or wrong endpoint | Deterministic scope evaluator | Only actions reaching the enforcement boundary are evaluated |
| Unauthorized delegation | Delegation must be allowed and cannot widen limits | No runtime adapter is enforced by the offline package alone |
| Missing outcome evidence | `INDETERMINATE`, never `VERIFIED` | Verifier cannot discover an acknowledgement that was never supplied |
| Revoked grant | Revocation status is evaluated | Offline stale or absent revocation evidence creates uncertainty |
| Replay | IDs, timestamps, validity windows, and correlation IDs are recorded | Full replay prevention needs state, nonce, and/or transparency log support |

Signatures authenticate bytes; they do not make a statement true. A malicious signer can produce a valid signature over a false claim.
