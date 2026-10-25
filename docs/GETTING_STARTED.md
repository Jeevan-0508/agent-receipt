# Getting started

```bash
npm install
npm run demo
npm run verify -- examples/travel-booking/package.json
npm run mcp:demo
npm run verify -- examples/mcp-sdk/package.json
npm run test
npm run web:dev
```

The demo creates a fresh in-memory Ed25519 key set and exports only public keys in the package. All provider actions are simulated and use integer euro cents.

For the five-minute developer path, `npm run mcp:demo` starts an official MCP SDK client and server over a local in-memory transport, calls the `book_hotel` tool, records the simulated provider response, exports `examples/mcp-sdk/package.json`, and prints the verification disposition. The follow-up `npm run verify` is an independent CLI verification step.
