# External consumer example

This example uses only the stable `@agent-receipt/sdk` package entry point. It does not import files from the repository's `packages/*/src` directories.

From the repository root after `npm install`:

```bash
node examples/external-consumer/consumer.mjs examples/external-consumer/output
npm run verify -- examples/external-consumer/output/package.json --trusted-keys examples/external-consumer/output/trusted-keys.json
```

The output directory is generated and ignored. The provider is simulated; no payment credentials or real transaction are used.
