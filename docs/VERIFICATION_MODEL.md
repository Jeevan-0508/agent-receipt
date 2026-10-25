# Verification model

The verifier reports independent dimensions:

- `VERIFIED`: the available evidence passed the relevant check.
- `FAILED`: evidence was present and contradicted the check, or was cryptographically invalid.
- `INDETERMINATE`: evidence needed to establish the claim was absent or stale.
- `NOT_CHECKED`: the check is outside the selected profile.

Overall status is `FAILED` if any required dimension fails; otherwise `INDETERMINATE` if a required dimension cannot be established; otherwise `VERIFIED`.

This prevents a signed agent assertion from being displayed as a confirmed downstream outcome.
