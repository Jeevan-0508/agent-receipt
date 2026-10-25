import { actionDigest, createReceiptAgent, definePolicy, generateSigner } from '@agent-receipt/sdk';

const principalSigner = generateSigner('did:receipt:user:quickstart');
const agentSigner = generateSigner('did:receipt:agent:quickstart');
const providerSigner = generateSigner('did:receipt:provider:quickstart');
const action = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'quickstart-room', checkIn: '2026-11-03', checkOut: '2026-11-05', at: '2026-10-25T09:12:00.000Z' };
const policy = definePolicy({ id: 'quickstart-grant', principal: principalSigner.id, agent: agentSigner.id, action: action.type, resource: action.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active' }, approval: { id: 'quickstart-approval', actionDigest: actionDigest(action), signedBy: principalSigner.id } });
const receipt = createReceiptAgent({ policy, signers: { principalSigner, agentSigner, providerSigner } });
const outcome = await receipt.callTool({ name: 'book_hotel', action, invoke: async (exactAction) => ({ bookingId: `sandbox-${exactAction.roomId}`, status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }) });
console.log(JSON.stringify({ allowed: outcome.allowed, executed: outcome.executed, packageId: outcome.package?.manifest.packageId, verification: outcome.verification?.overall }, null, 2));
