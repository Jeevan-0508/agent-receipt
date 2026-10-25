import { actionDigest, generateSigner, signRecord, verifyPackage } from './index.mjs';

const principal = 'did:receipt:user:maya';
const agent = 'did:receipt:agent:atlas';
const provider = 'did:receipt:provider:staywell';
const at = '2026-10-25T09:12:00.000Z';
const grantBase = { id: 'grant-hotel-200', principal, agent, action: 'hotel.book', resource: 'staywell://hotel/berlin/room', constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: ['https://sandbox.staywell.test/book'] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active', checkedAt: at }, approval: {} };

function action(amountCents = 18000) { return { type: 'hotel.book', resource: grantBase.resource, endpoint: 'https://sandbox.staywell.test/book', amountCents, currency: 'EUR', roomId: 'room-berlin-king-01', checkIn: '2026-11-03', checkOut: '2026-11-05', at }; }

export function buildScenario(name) {
  const principalSigner = generateSigner(principal);
  const agentSigner = generateSigner(agent);
  const providerSigner = generateSigner(provider);
  const signers = { [principal]: principalSigner, [agent]: agentSigner, [provider]: providerSigner };
  let a = name === 'spending-violation' ? action(45000) : action();
  if (name === 'parameter-substitution') a = { ...a, roomId: 'room-berlin-suite-09' };
  const grant = structuredClone(grantBase);
  if (name === 'parameter-substitution') grant.approval = { id: 'approval-180', actionDigest: actionDigest(action(18000)), signedBy: principal };
  else grant.approval = { id: 'approval-180', actionDigest: actionDigest(a), signedBy: principal };
  if (name === 'revoked-authority') grant.revocation = { status: 'revoked', checkedAt: at, evidence: 'revoke-2026-10-25-0900' };
  if (name === 'missing-provider-confirmation') grant.approval = { id: 'approval-180', actionDigest: actionDigest(a), signedBy: principal };
  const records = [];
  records.push(signRecord({ id: 'exec-search-01', kind: 'execution', observed: true, sessionId: 'sess-travel-42', correlationId: 'trace-7f4d', action: { ...a, type: 'hotel.search', amountCents: 0 }, at: '2026-10-25T09:10:00.000Z', assertion: 'observed-tool-call' }, agentSigner));
  const execution = { id: 'exec-book-01', kind: 'execution', observed: true, sessionId: 'sess-travel-42', correlationId: 'trace-7f4d', action: a, at, assertion: 'observed-tool-call' };
  records.push(signRecord(execution, agentSigner));
  if (name === 'unauthorized-delegation') {
    const delegation = { id: 'delegation-01', kind: 'delegation', from: agent, to: 'did:receipt:agent:helper', depth: 1, amountCents: 20000, at };
    const pkg = basePackage(name, grant, records, signers, signRecord(delegation, agentSigner), null);
    return pkg;
  }
  const shouldAck = !['spending-violation', 'parameter-substitution', 'missing-provider-confirmation', 'revoked-authority'].includes(name);
  if (shouldAck) records.push(signRecord({ id: 'ack-staywell-01', kind: 'provider_ack', provider, eventId: execution.id, correlationId: execution.correlationId, actionDigest: actionDigest(a), bookingId: 'booking-sandbox-913', status: 'confirmed', amountCents: a.amountCents, currency: a.currency, at: '2026-10-25T09:12:03.000Z' }, providerSigner));
  return basePackage(name, grant, records, signers, null, shouldAck);
}

function basePackage(name, grant, records, signers, delegation, shouldAck) {
  const pkg = { manifest: { version: '0.1.0', packageId: `travel-booking-${name}`, createdAt: at, profile: 'agent-receipt.demo.v1', recordCount: records.length }, keyHints: Object.fromEntries(Object.entries(signers).map(([id, signer]) => [id, signer.publicKey])), authorization: signRecord({ ...grant, kind: 'authorization' }, signers[principal]), records, delegation, metadata: { scenario: name, simulated: true, noRealPurchase: true } };
  return pkg;
}

export const SCENARIOS = [
  ['valid-booking', 'Valid booking', 'Signed provider confirmation supports the reported outcome.'],
  ['spending-violation', 'Spending violation', '€450 booking exceeds the €200 authority limit.'],
  ['parameter-substitution', 'Parameter substitution', 'Approval for €180 is reused with altered parameters.'],
  ['unauthorized-delegation', 'Unauthorized delegation', 'Agent attempts to delegate a non-delegable grant.'],
  ['tampered-evidence', 'Tampered evidence', 'A signed execution record is modified after issuance.'],
  ['missing-provider-confirmation', 'Missing provider confirmation', 'Agent reports success without an independent acknowledgement.'],
  ['revoked-authority', 'Revoked authority', 'A grant is revoked before a new action.']
];

export function runScenarios() {
  return SCENARIOS.map(([id, label, summary]) => {
    const pkg = buildScenario(id === 'tampered-evidence' ? 'valid-booking' : id);
    if (id === 'tampered-evidence') pkg.records[1].payload.action.amountCents = 19000;
    const result = verifyPackage(pkg, { trustedKeys: pkg.keyHints });
    return { id, label, summary, package: pkg, result };
  });
}
