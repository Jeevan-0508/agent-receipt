# FAQ and troubleshooting

## Does this make an agent safe?

No. It demonstrates an authorization and evidence boundary. Signatures protect integrity and identify the signing key; they do not prove that a signer was truthful or that an uninstrumented action did not happen.

## Why does the CLI require `--trusted-keys`?

Trust is intentionally out of band. Package `keyHints` are informational and are never accepted as trust anchors automatically. Provision public keys from an independently controlled configuration, then pass that file to the CLI.

## Why is a missing provider acknowledgement `INDETERMINATE`?

An agent assertion establishes an observed claim, not an independently confirmed outcome. The verifier refuses to turn missing evidence into either success or failure.

## Why does the SDK require two tarballs?

The beta is not published to npm. `@agent-receipt/sdk` depends on the matching `@agent-receipt/core` version. Install both local tarballs together and do not mix versions. `npm run test:packages` validates this flow in a temporary project.

## Common fixes

- `npm ci` fails: use Node.js 20, 22, or 24 and remove an old `node_modules` directory before retrying.
- `overall: INDETERMINATE`: inspect missing evidence findings and confirm the provider acknowledgement is present and trusted.
- `overall: FAILED`: compare the exact action parameters, digest, signer IDs, validity window, and trusted public keys.
- Browser page is blank: run `npm run build` first, then use `npm run web:dev` and open the printed localhost URL. An HTTP response alone is not a browser test.
- Python is unavailable: use Python 3.12 in an isolated virtual environment or rely on the Python 3.12 CI job; do not install dependencies globally.
