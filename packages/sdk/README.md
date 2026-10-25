# AGENT//RECEIPT JavaScript SDK

The SDK is a small public wrapper around the existing verifier. It does not make network calls or custody keys.

```js
import { actionDigest, createReceiptAgent, definePolicy, generateSigner } from '@agent-receipt/sdk';

const principalSigner = generateSigner('did:receipt:user:demo');
const agentSigner = generateSigner('did:receipt:agent:demo');
const providerSigner = generateSigner('did:receipt:provider:demo');
const action = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'room-1', at: '2026-10-25T09:12:00.000Z' };
const policy = definePolicy({ id: 'grant-1', principal: principalSigner.id, agent: agentSigner.id, action: action.type, resource: action.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', approval: { actionDigest: actionDigest(action) } });
const receipt = createReceiptAgent({ policy, signers: { principalSigner, agentSigner, providerSigner } });
const result = await receipt.callTool({ name: 'book_hotel', action, invoke: async () => ({ bookingId: 'sandbox-1', status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }) });
console.log(result.verification.overall); // VERIFIED
```

`definePolicy(policy)` validates the required authorization shape. `createReceiptAgent()` returns `callTool({ name, action, invoke })`; `invoke` is called only after authorization succeeds. The result contains the preflight decision, provider result, signed `package`, and an immediate verification result. `exportPackage()` returns the last package and `verifyExportedPackage()` checks it with the external trusted keys held by the wrapper.

The package can be saved as JSON and checked independently with:

```bash
npm run verify -- path/to/package.json
```

This SDK is a local beta API. It does not provide remote OAuth, durable key custody, replay protection, or a real payment connector.

## TypeScript and package compatibility

The package exports declarations for the public API. A typechecked example is in [`examples/typescript-consumer/consumer.ts`](../../examples/typescript-consumer/consumer.ts).

For this unpublished beta, the reproducible distribution is a pair of local tarballs. From the repository root, build and install them into an independent project:

```bash
npm pack ./packages/core --pack-destination ./tmp-packages
npm pack ./packages/sdk --pack-destination ./tmp-packages
npm install ./tmp-packages/agent-receipt-core-0.1.0-beta.1.tgz ./tmp-packages/agent-receipt-sdk-0.1.0-beta.1.tgz
```

The SDK depends on the matching core tarball (`0.1.0-beta.1`); do not mix versions. `npm run test:packages` performs the complete install, execution, and independent CLI verification in a temporary project. No npm publication is implied.

## Local installation from a checkout

The beta is intentionally installable from a repository checkout rather than published to npm:

```bash
npm install "../Receipt/packages/core" "../Receipt/packages/sdk"
```

The package exposes a stable `@agent-receipt/sdk` entry point and brings in the local `@agent-receipt/core` package. Consumers should not import files from `packages/*/src` directly.
