# Public beta checklist

Assessment date: 25 October 2026.

## Python verification

- Python 3.12+ is not installed on the current Windows workstation. `python` and `python3` resolve only to Microsoft Store execution aliases; `py` and `uv` are unavailable.
- No system setting or runtime installation was changed.
- The isolated workflow is documented in [`python/README.md`](../python/README.md): create a virtual environment, install `python/requirements.txt`, and run the verifier/tests.
- If local installation is approved, install Python 3.12 with `winget install --id Python.Python.3.12 --exact`, open a new terminal, then run the isolated commands in [`python/README.md`](../python/README.md). That command was not run by this validation.
- The GitHub workflow is configured for Python 3.12 and runs all seven shared vectors with `python -m pytest -q python/tests`.
- Local Python agreement result: unavailable because Python is not installed. GitHub CI executed Python 3.12.15 and reported **7 passed in 0.06s**. JavaScript agrees with all seven expected vector dispositions: **7/7**.

## Node and browser verification

- Node tests: **73/73 passing**.
- Playwright browser E2E: **passing** for loading, all seven scenarios, findings, provenance, responsive layout, console errors, and page errors.
- Official MCP SDK demo: valid call allowed and provider called once; unauthorized call blocked and provider called zero times; missing provider evidence is `INDETERMINATE`.
- CLI verification: travel and official-MCP packages report `overall: VERIFIED`.
- Lint: passing for 19 JavaScript modules.
- Production build: passing.
- Dependency audit: 0 vulnerabilities.
- Repository secret scan: passing.

## CI readiness

The workflow at [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) is configured with:

- Node 20, 22, and 24 matrix runs.
- Python 3.12.
- `npm ci`, tests, lint, Vite build, dependency audit, and secret scan.
- Python dependency installation and vector tests.
- Workflow-level `contents: read` permissions and disabled checkout credential persistence.

The first GitHub Actions run passed: [run 40225769466](https://github.com/Jeevan-0508/agent-receipt/actions/runs/40225769466). Node 20/22/24, Python 3.12, lint, build, audit, secret scan, and all vector tests passed. GitHub emitted only non-failing runner deprecation/migration annotations.

## Security release gate

Implemented and documented:

- Out-of-band trusted-key configuration; embedded `keyHints` are informational only.
- Ed25519 signatures over RFC 8785 canonical payloads.
- Exact action/approval binding, delegation attenuation, provider independence, and malformed-input failure behavior.
- Explicit revocation freshness limitations and no online revocation registry.
- Local official MCP transport boundary with no remote OAuth claim.
- Evidence provenance from authorization through observed execution and provider acknowledgement.
- Sensitive-data boundary documented: exact action parameters are exported as plaintext JSON; no encryption/redaction is provided.
- No independent security audit claim.

## Publication blockers

The validation gate is satisfied by the successful GitHub Actions run. Local Python execution remains optional and unavailable on this workstation.

Production deployment remains blocked on external security review, operational key custody, stateful replay prevention, fresh revocation infrastructure, and real transport/OAuth boundary testing.

## Repository publication hygiene

- MIT license included.
- README, installation, demo, architecture, screenshots, security policy, contributor guide, changelog, compatibility, and beta limitations included.
- No private credentials, private keys, personal files, or local absolute paths were found by repository scans.
- Generated build output and dependency directories remain ignored; the public screenshot is intentionally stored at `docs/assets/workbench.png`.

## Recommended GitHub metadata

Repository description:

> Local, offline-verifiable authorization-to-outcome evidence for AI agent tool calls, with an official MCP demo, signed packages, and an investigation workbench.

Suggested topics:

`ai-agents`, `agent-security`, `authorization`, `auditability`, `cryptography`, `ed25519`, `mcp`, `evidence`, `verifiable-logs`, `developer-tools`

## Exact publication commands — run only after approval

From the repository root:

```bash
git status --short
npm ci
npm run lint
npm run test:all
npm run build
npm audit --audit-level=high
npm run secret-scan
npm run mcp:demo
npm run verify -- examples/mcp-sdk/package.json
python -m venv .venv
python -m pip install -r python/requirements.txt
python -m pytest -q python/tests
```

After those checks and explicit approval, create or configure the GitHub repository, review the staged file list, commit, and push using the repository's approved remote. Do not include `.venv`, `node_modules`, `dist`, generated ignored demo packages, or credentials.
