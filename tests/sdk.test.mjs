import test from 'node:test';
import assert from 'node:assert/strict';
import { actionDigest, generateSigner } from '../packages/core/src/index.mjs';
import { createReceiptAgent, definePolicy } from '../packages/sdk/src/index.mjs';

function setup() {
  const principalSigner = generateSigner('did:receipt:user:sdk-test');
  const agentSigner = generateSigner('did:receipt:agent:sdk-test');
  const providerSigner = generateSigner('did:receipt:provider:sdk-test');
  const action = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'sdk-room', checkIn: '2026-11-03', checkOut: '2026-11-05', at: '2026-10-25T09:12:00.000Z' };
  const policy = definePolicy({ id: 'sdk-grant', principal: principalSigner.id, agent: agentSigner.id, action: action.type, resource: action.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active' }, approval: { actionDigest: actionDigest(action), signedBy: principalSigner.id } });
  return { action, receipt: createReceiptAgent({ policy, signers: { principalSigner, agentSigner, providerSigner } }) };
}

test('public SDK enforces, captures, exports, and verifies a package', async () => {
  const { action, receipt } = setup();
  const result = await receipt.callTool({ name: 'book_hotel', action, invoke: async () => ({ bookingId: 'sdk-booking', status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }) });
  assert.equal(result.allowed, true);
  assert.equal(result.executed, true);
  assert.equal(result.verification.overall, 'VERIFIED');
  assert.equal(receipt.exportPackage().metadata.integration, 'agent-receipt-sdk');
  assert.equal(receipt.verifyExportedPackage().overall, 'VERIFIED');
});

test('public SDK blocks an out-of-policy call before invoke', async () => {
  const { action, receipt } = setup();
  let invoked = false;
  const result = await receipt.callTool({ name: 'book_hotel', action: { ...action, amountCents: 45000 }, invoke: async () => { invoked = true; return { status: 'confirmed' }; } });
  assert.equal(result.allowed, false);
  assert.equal(result.executed, false);
  assert.equal(invoked, false);
  assert.equal(receipt.getProviderCallCount(), 0);
});
