# Limitations

- This repository is a public-beta foundation, not a production security review.
- The implementation uses RFC 8785 JCS for canonicalization and publishes seven shared Node/Python v0.1 vectors; the Python suite must still be executed in a Python 3.12+ environment before claiming a fully green local validation.
- The CLI has no network-backed trust registry, transparency log, HSM, or fresh revocation service.
- The demo uses generated ephemeral keys and a simulated provider.
- Instrumentation cannot prove actions that bypass the adapter.
- Evidence packages are portable JSON and are not encrypted or automatically redacted; production personal, payment, or credential data must not be placed in demo exports.
- No claims are made about hidden model reasoning, regulatory compliance, or real-world outcome truth.
- The React app is a local investigation surface; the CLI is the independent verifier.
