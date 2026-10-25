import { actionDigest, evaluateAuthorization, signRecord, verifyPackage } from '../../core/src/index.mjs';

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value;
}

/**
 * Define the policy that will be enforced for a wrapped tool call.
 * The returned object is intentionally the portable authorization payload.
 */
export function definePolicy(policy) {
  const normalized = structuredClone(requireObject(policy, 'policy'));
  if (typeof normalized.id !== 'string' || typeof normalized.principal !== 'string' || typeof normalized.agent !== 'string') {
    throw new TypeError('policy.id, policy.principal, and policy.agent are required');
  }
  if (typeof normalized.action !== 'string' || typeof normalized.resource !== 'string') throw new TypeError('policy.action and policy.resource are required');
  if (!normalized.constraints || typeof normalized.constraints !== 'object') throw new TypeError('policy.constraints are required');
  if (!normalized.revocation) normalized.revocation = { status: 'active' };
  if (!normalized.delegation) normalized.delegation = { allowed: false, maxDepth: 0 };
  if (!normalized.approval) normalized.approval = {};
  return normalized;
}

/**
 * Create a small enforcement/evidence wrapper for selected consequential calls.
 * `invoke` is called only after the policy passes. It receives the exact action.
 */
export function createReceiptAgent({ policy, signers, sessionId = 'receipt-sdk-session', correlationId = 'receipt-sdk-trace' }) {
  const grant = definePolicy(policy);
  if (!signers?.principalSigner || !signers?.agentSigner || !signers?.providerSigner) throw new TypeError('principalSigner, agentSigner, and providerSigner are required');
  const trustedKeys = Object.fromEntries([signers.principalSigner, signers.agentSigner, signers.providerSigner].map((signer) => [signer.id, signer.publicKey]));
  let lastPackage = null;
  let providerCalls = 0;

  async function callTool({ name, action, invoke }) {
    if (typeof name !== 'string' || typeof invoke !== 'function') throw new TypeError('name and invoke are required');
    const exactAction = structuredClone(requireObject(action, 'action'));
    const preflight = evaluateAuthorization(grant, exactAction);
    if (preflight.status !== 'VERIFIED') return { allowed: false, executed: false, preflight, package: null, result: null };
    const execution = { id: `sdk-exec-${exactAction.roomId ?? name}`, kind: 'execution', observed: true, sessionId, correlationId, tool: name, action: exactAction, at: exactAction.at, assertion: 'observed-tool-call' };
    providerCalls += 1;
    const providerResult = await invoke(exactAction);
    const acknowledgement = { id: `sdk-ack-${exactAction.roomId ?? name}`, kind: 'provider_ack', provider: signers.providerSigner.id, eventId: execution.id, correlationId, actionDigest: actionDigest(exactAction), bookingId: providerResult?.bookingId, status: providerResult?.status, amountCents: exactAction.amountCents, currency: exactAction.currency, at: providerResult?.at };
    const records = [signRecord(execution, signers.agentSigner), signRecord(acknowledgement, signers.providerSigner)];
    lastPackage = { manifest: { version: '0.1.0', packageId: `sdk-${exactAction.roomId ?? name}`, createdAt: exactAction.at, profile: 'agent-receipt.demo.v1', recordCount: records.length }, keyHints: trustedKeys, authorization: signRecord({ ...grant, kind: 'authorization' }, signers.principalSigner), records, metadata: { integration: 'agent-receipt-sdk', tool: name, simulated: true, noRealPurchase: true } };
    return { allowed: true, executed: true, preflight, result: providerResult, package: lastPackage, verification: verifyPackage(lastPackage, { trustedKeys }) };
  }

  return {
    callTool,
    exportPackage() { return lastPackage ? structuredClone(lastPackage) : null; },
    verifyExportedPackage() { return lastPackage ? verifyPackage(lastPackage, { trustedKeys }) : null; },
    getProviderCallCount() { return providerCalls; },
    trustedKeys
  };
}

export { verifyPackage };
