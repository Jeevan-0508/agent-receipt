import { actionDigest, createReceiptAgent, definePolicy, generateSigner } from '@agent-receipt/sdk';

const principalSigner = generateSigner('did:receipt:user:typescript-demo');
const agentSigner = generateSigner('did:receipt:agent:typescript-demo');
const providerSigner = generateSigner('did:receipt:provider:typescript-demo');
const action = {
  type: 'hotel.book',
  resource: 'staywell://hotel/berlin/room',
  endpoint: 'https://sandbox.staywell.test/book',
  amountCents: 18000,
  currency: 'EUR',
  roomId: 'typescript-room',
  at: '2026-10-25T09:12:00.000Z'
};

const policy = definePolicy({
  id: 'typescript-grant',
  principal: principalSigner.id,
  agent: agentSigner.id,
  action: action.type,
  resource: action.resource,
  constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] },
  validFrom: '2026-10-25T08:00:00.000Z',
  validUntil: '2026-10-25T18:00:00.000Z',
  approval: { actionDigest: actionDigest(action) }
});

const receipt = createReceiptAgent({ policy, signers: { principalSigner, agentSigner, providerSigner } });
const result = await receipt.callTool({
  name: 'book_hotel',
  action,
  invoke: async (exactAction) => ({ bookingId: `sandbox-${exactAction.roomId}`, status: 'confirmed', at: '2026-10-25T09:12:03.000Z' })
});

if (result.verification?.overall !== 'VERIFIED') throw new Error('Expected a verified TypeScript example receipt');
console.log(result.verification.overall);
