# Independent Python verifier

The verifier in `verify.py` is intentionally independent of the JavaScript engine. It reads the versioned JSON package, canonicalizes signed payloads with RFC 8785, verifies Ed25519 signatures with `cryptography`, and applies the v0.1 authorization/outcome checks.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r python/requirements.txt
python python/verify.py test-vectors/v0.1/valid.json
pytest -q python/tests
```

The shared vectors cover valid signatures, tampered evidence, authorization violations, delegation failures, expired permissions, missing provider confirmation, and invalid trust anchors. The verifier accepts either a standalone package plus a separate trusted-key map or a vector document containing `package` and `trustedKeys`.
