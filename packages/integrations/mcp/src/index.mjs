import { actionDigest, evaluateAuthorization, generateSigner, signRecord, verifyPackage } from '../../../core/src/index.mjs';

export function createMcpBookingIntegration({ grant, principalSigner, agentSigner, providerSigner, provider = defaultProvider }) {
  const keyHints = Object.fromEntries([principalSigner, agentSigner, providerSigner].map((s) => [s.id, s.publicKey]));
  return {
    async callTool(name, action) {
      if (name !== 'book_hotel') throw new Error(`Unsupported MCP tool: ${name}`);
      const preflight = evaluateAuthorization(grant, action);
      if (preflight.status !== 'VERIFIED') return { allowed: false, executed: false, preflight, package: null, result: null };
      const execution = { id: `mcp-exec-${action.roomId}`, kind: 'execution', observed: true, sessionId: 'mcp-session-local', correlationId: 'mcp-trace-local', action, at: action.at, assertion: 'observed-tool-call' };
      const executionRecord = signRecord(execution, agentSigner);
      const providerResult = await provider(action);
      const acknowledgement = { id: `mcp-ack-${action.roomId}`, kind: 'provider_ack', provider: providerSigner.id, eventId: execution.id, correlationId: execution.correlationId, actionDigest: actionDigest(action), bookingId: providerResult.bookingId, status: providerResult.status, amountCents: action.amountCents, currency: action.currency, at: providerResult.at };
      const records = [executionRecord, signRecord(acknowledgement, providerSigner)];
      const pkg = { manifest: { version: '0.1.0', packageId: `mcp-${execution.id}`, createdAt: action.at, profile: 'agent-receipt.demo.v1', recordCount: records.length }, keyHints, authorization: signRecord({ ...grant, kind: 'authorization' }, principalSigner), records, metadata: { integration: 'mcp-local', simulated: true, noRealPurchase: true } };
      return { allowed: true, executed: true, preflight, package: pkg, result: providerResult, verification: verifyPackage(pkg, { trustedKeys: keyHints }) };
    }
  };
}

export function createLocalMcpBookingDemo() {
  const principalSigner = generateSigner('did:receipt:user:mcp-demo');
  const agentSigner = generateSigner('did:receipt:agent:mcp-demo');
  const providerSigner = generateSigner('did:receipt:provider:mcp-demo');
  const action = { type: 'hotel.book', resource: 'staywell://hotel/berlin/room', endpoint: 'https://sandbox.staywell.test/book', amountCents: 18000, currency: 'EUR', roomId: 'mcp-room-01', checkIn: '2026-11-03', checkOut: '2026-11-05', at: '2026-10-25T09:12:00.000Z' };
  const grant = { id: 'mcp-grant-01', kind: 'authorization', principal: principalSigner.id, agent: agentSigner.id, action: action.type, resource: action.resource, constraints: { maxAmountCents: 20000, currency: 'EUR', endpoints: [action.endpoint] }, validFrom: '2026-10-25T08:00:00.000Z', validUntil: '2026-10-25T18:00:00.000Z', delegation: { allowed: false, maxDepth: 0 }, revocation: { status: 'active', checkedAt: action.at }, approval: { id: 'mcp-approval-01', actionDigest: actionDigest(action), signedBy: principalSigner.id } };
  return { action, grant, signers: { principalSigner, agentSigner, providerSigner }, integration: createMcpBookingIntegration({ grant, principalSigner, agentSigner, providerSigner }) };
}

async function defaultProvider(action) { return { bookingId: `sandbox-${action.roomId}`, status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }; }
