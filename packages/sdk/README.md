# AGENT//RECEIPT JavaScript SDK

The SDK is a small public wrapper around the existing verifier. It does not make network calls or custody keys.

```js
import { actionDigest, generateSigner } from '../../packages/core/src/index.mjs';
import { createReceiptAgent, definePolicy } from '../../packages/sdk/src/index.mjs';

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
