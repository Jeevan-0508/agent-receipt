# Trust boundaries

1. **Principal / approval boundary** — the principal signs an approval bound to the exact action parameters.
2. **Agent / instrumented tool boundary** — the SDK or adapter records the invocation; bypassed tools remain outside coverage.
3. **Provider boundary** — an independent provider key signs a confirmation; an agent assertion is not equivalent.
4. **Verifier boundary** — the verifier trusts only configured public keys and treats missing evidence as a first-class result.
5. **Operator boundary** — key custody, revocation publication, retention, and clock discipline are deployment responsibilities.
