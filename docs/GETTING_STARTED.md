# Getting started

Requirements: Node.js 20 or newer. Python 3.12 or newer is needed only for the independent verifier tests.

## Windows PowerShell

```powershell
git clone https://github.com/Jeevan-0508/agent-receipt.git
Set-Location agent-receipt
npm ci
npm run mcp:demo
npm run verify -- examples/mcp-sdk/package.json
npm run test:packages
```

## macOS or Linux

```bash
git clone https://github.com/Jeevan-0508/agent-receipt.git
cd agent-receipt
npm ci
npm run mcp:demo
npm run verify -- examples/mcp-sdk/package.json
npm run test:packages
```

The MCP demo starts an official MCP SDK client and server over a local in-memory transport, evaluates authorization before a simulated provider call, records the response, exports a signed package, and prints the verification disposition. The follow-up CLI command verifies the exported package independently. It uses no payment credentials and makes no real transaction.

## Use the SDK from a checkout

The stable consumer entry point is `@agent-receipt/sdk`; consumers should not import repository source paths:

```bash
npm install ./packages/core ./packages/sdk
node examples/external-consumer/consumer.mjs ./examples/external-consumer/output
npm run verify -- examples/external-consumer/output/package.json --trusted-keys examples/external-consumer/output/trusted-keys.json
```

The clean-room CI test repeats this from a temporary project outside the monorepo.

## Trust and data boundaries

The exported `trusted-keys.json` is an out-of-band trust configuration for the demonstration. In a real deployment, provision principal, agent, and provider public keys through an independently controlled channel; never trust the package's `keyHints` automatically. The principal signs the authorization, the agent signs observed execution, and the provider signs the outcome acknowledgement. Packages contain exact action parameters as plaintext JSON and are not encrypted or redacted. This beta is unsuitable for production enforcement because it lacks durable key custody, online revocation, stateful replay prevention, remote MCP/OAuth validation, and coverage for actions that bypass the instrumented boundary.
