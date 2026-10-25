# Official MCP integration tutorial

This tutorial uses the maintained `@modelcontextprotocol/sdk` with an in-process transport. It is deliberately local and simulated: no remote MCP endpoint, OAuth resource-server validation, payment credential, or real provider is involved.

## Run the complete example

```bash
npm ci
npm run mcp:demo
npm run verify -- examples/mcp-sdk/package.json --trusted-keys examples/mcp-sdk/trusted-keys.json
```

The demo creates an official MCP server and client, registers `book_hotel`, and invokes it twice. The handler evaluates the exact action before calling the simulated provider. The allowed call records the invocation and provider response, signs the records, exports JSON, and the CLI verifies the package using trusted keys supplied outside the package. The denied call never reaches the provider. A package without provider evidence remains `INDETERMINATE`.

## Where to adapt it

The reference implementation is in [`packages/integrations/mcp/src/official-sdk.mjs`](../packages/integrations/mcp/src/official-sdk.mjs). Keep these boundaries when adapting it:

1. Construct the exact action from the tool request before authorization.
2. Evaluate authorization before invoking a consequential provider function.
3. Attach stable session and correlation identifiers to execution and response records.
4. Sign the observed invocation and provider response with distinct signers where the trust model requires it.
5. Export the package and trusted-key configuration through a controlled channel.
6. Verify retrospectively with the CLI or another independent implementation.

Enforcement and retrospective verification are separate operations. A successful verifier result does not authorize an action after the fact, and an MCP transport success does not establish that a business outcome occurred.

## Security boundary

The demo's `InMemoryTransport` is not a network security boundary. The repository makes no claim about remote OAuth protection. Production adapters would need explicit authorization-server/resource-server validation, transport authentication, replay controls, durable key custody, revocation freshness, and coverage for actions that bypass instrumentation.
