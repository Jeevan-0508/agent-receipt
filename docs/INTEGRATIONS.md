# Integrations

There are two local integration layers. `packages/integrations/mcp/src/index.mjs` is a small direct adapter used by the existing scenarios. `packages/integrations/mcp/src/official-sdk.mjs` uses the maintained `@modelcontextprotocol/sdk` `McpServer`, `Client`, and `InMemoryTransport` APIs. `npm run mcp:demo` exercises the latter: authorization is evaluated inside the registered `book_hotel` handler before the simulated provider is called; the actual MCP invocation and provider response are signed into a portable package; the CLI verifies the exported package afterward. Enforcement and retrospective verification are separate operations.

An instrumented tool adapter emits an execution payload with a session ID, correlation ID, exact action parameters, and an `observed-tool-call` assertion. This repository does not implement remote OAuth protection and makes no OAuth security claim. A production adapter should preserve MCP authorization semantics and attach the same correlation ID to tool calls; it must not infer that an OAuth token alone proves the business action outcome.

Future adapters should map OpenTelemetry trace context and provider acknowledgements into the package without treating telemetry as independent confirmation unless the signer and trust boundary are distinct.
