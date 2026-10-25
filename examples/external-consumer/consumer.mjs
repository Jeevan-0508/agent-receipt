import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { actionDigest, createReceiptAgent, definePolicy, generateSigner } from '@agent-receipt/sdk';

const outputDir = resolve(process.argv[2] ?? './receipt-output');
mkdirSync(outputDir, { recursive: true });
const principalSigner = generateSigner('did:receipt:user:external-demo');
const agentSigner = generateSigner('did:receipt:agent:external-demo');
const providerSigner = generateSigner('did:receipt:provider:external-demo');
const action = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'external-room', checkIn: '2026-11-03', checkOut: '2026-11-05', at: '2026-10-25T09:12:00.000Z' };
const policy = definePolicy({ id: 'external-grant', principal: principalSigner.id, agent: agentSigner.id, action: action.type, resource: action.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active' }, approval: { id: 'external-approval', actionDigest: actionDigest(action), signedBy: principalSigner.id } });
const receipt = createReceiptAgent({ policy, signers: { principalSigner, agentSigner, providerSigner } });
const outcome = await receipt.callTool({ name: 'book_hotel', action, invoke: async (exactAction) => ({ bookingId: `sandbox-${exactAction.roomId}`, status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }) });
if (outcome.verification?.overall !== 'VERIFIED') throw new Error(`Unexpected verification result: ${outcome.verification?.overall}`);
writeFileSync(resolve(outputDir, 'package.json'), `${JSON.stringify(outcome.package, null, 2)}\n`);
writeFileSync(resolve(outputDir, 'trusted-keys.json'), `${JSON.stringify(receipt.trustedKeys, null, 2)}\n`);
console.log(JSON.stringify({ package: resolve(outputDir, 'package.json'), trustedKeys: resolve(outputDir, 'trusted-keys.json'), executed: outcome.executed, verification: outcome.verification.overall }, null, 2));
