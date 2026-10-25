import { mkdirSync, writeFileSync } from 'node:fs';
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { actionDigest, signRecord } from '../packages/core/src/index.mjs';

const outDir = new URL('../test-vectors/v0.1/', import.meta.url);
mkdirSync(outDir, { recursive: true });
const seeds = {
  principal: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
  agent: '202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f',
  provider: '404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5d5e5f'
};

function fixedSigner(id, seedHex) {
  const privateKey = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seedHex, 'hex')]), format: 'der', type: 'pkcs8' });
  const publicKey = createPublicKey(privateKey).export({ type: 'spki', format: 'der' }).toString('base64url');
  return { id, privateKey, publicKey };
}

const signers = {
  principal: fixedSigner('did:receipt:user:vector', seeds.principal),
  agent: fixedSigner('did:receipt:agent:vector', seeds.agent),
  provider: fixedSigner('did:receipt:provider:vector', seeds.provider)
};
const keyHints = Object.fromEntries(Object.values(signers).map((s) => [s.id, s.publicKey]));
const baseAction = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'vector-room', checkIn: '2026-11-03', checkOut: '2026-11-05', at: '2026-10-25T09:12:00.000Z' };
const baseGrant = { id: 'vector-grant', principal: signers.principal.id, agent: signers.agent.id, action: 'hotel.book', resource: baseAction.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [baseAction.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active', checkedAt: baseAction.at } };

function packageFor(id, action = baseAction, { ack = true, delegation = null } = {}) {
  const grant = { ...baseGrant, approval: { id: 'vector-approval', actionDigest: actionDigest(action), signedBy: signers.principal.id } };
  const execution = { id: `${id}-execution`, kind: 'execution', observed: true, sessionId: 'vector-session', correlationId: 'vector-trace', action, at: action.at, assertion: 'observed-tool-call' };
  const records = [signRecord(execution, signers.agent)];
  if (ack) records.push(signRecord({ id: `${id}-ack`, kind: 'provider_ack', provider: signers.provider.id, eventId: execution.id, correlationId: execution.correlationId, actionDigest: actionDigest(action), bookingId: `${id}-booking`, status: 'confirmed', amountCents: action.amountCents, currency: action.currency, at: '2026-10-25T09:12:03.000Z' }, signers.provider));
  return { manifest: { version: '0.1.0', packageId: `vector-${id}`, createdAt: baseAction.at, profile: 'agent-receipt.demo.v1', recordCount: records.length }, keyHints, authorization: signRecord({ ...grant, kind: 'authorization' }, signers.principal), records, delegation, metadata: { vector: id, simulated: true, noRealPurchase: true } };
}

const valid = packageFor('valid');
const tampered = structuredClone(valid);
tampered.manifest.packageId = 'vector-tampered-evidence';
tampered.metadata.vector = 'tampered-evidence';
tampered.records[0].payload.action.amountCents = 19000;
const violation = packageFor('authorization-violation', { ...baseAction, amountCents: 45000 });
const delegation = packageFor('delegation-failure', baseAction, { delegation: null });
delegation.delegation = signRecord({ id: 'delegation-failure-delegation', kind: 'delegation', from: signers.agent.id, to: 'did:receipt:agent:helper', depth: 1, amountCents: 20000, at: baseAction.at }, signers.agent);
const expiredAction = { ...baseAction, at: '2026-10-26T09:12:00.000Z' };
const expired = packageFor('expired-permission', expiredAction);
const missing = packageFor('missing-confirmation', baseAction, { ack: false });
const invalidTrust = { ...valid, manifest: { ...valid.manifest, packageId: 'vector-invalid-trust-anchor' }, metadata: { ...valid.metadata, vector: 'invalid-trust-anchor' } };
const invalidTrustKeys = { ...keyHints, [signers.provider.id]: keyHints[signers.agent.id] };

const cases = [
  ['valid', valid, keyHints, 'VERIFIED'],
  ['tampered-evidence', tampered, keyHints, 'FAILED'],
  ['authorization-violation', violation, keyHints, 'FAILED'],
  ['delegation-failure', delegation, keyHints, 'FAILED'],
  ['expired-permission', expired, keyHints, 'FAILED'],
  ['missing-confirmation', missing, keyHints, 'INDETERMINATE'],
  ['invalid-trust-anchor', invalidTrust, invalidTrustKeys, 'FAILED']
];
for (const [name, pkg, trustedKeys, expected] of cases) writeFileSync(new URL(`${name}.json`, outDir), `${JSON.stringify({ version: '0.1', case: name, expected, trustedKeys, package: pkg }, null, 2)}\n`);
console.log(`Generated ${cases.length} v0.1 interoperability vectors in ${outDir.pathname}`);
