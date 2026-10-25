import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as z from 'zod/v4';
import { actionDigest, evaluateAuthorization, signRecord, verifyPackage } from '../../../core/src/index.mjs';

const toolInputSchema = {
  roomId: z.string(),
  amountCents: z.number().int(),
  currency: z.string(),
  resource: z.string(),
  endpoint: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  at: z.string()
};

export function createOfficialMcpServer({ grant, signers, provider = defaultProvider }) {
  const keyHints = Object.fromEntries(Object.values(signers).map((signer) => [signer.id, signer.publicKey]));
  let lastPackage = null;
  let providerCalls = 0;
  const server = new McpServer({ name: 'agent-receipt-demo-server', version: '0.1.0' }, { maxToolInputElements: 32 });
  server.registerTool('book_hotel', {
    description: 'Book a simulated hotel room after AGENT//RECEIPT authorization checks.',
    inputSchema: toolInputSchema
  }, async (args) => {
    const action = { type: 'hotel.book', ...args };
    const preflight = evaluateAuthorization(grant, action);
    if (preflight.status !== 'VERIFIED') {
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ blocked: true, preflight }) }] };
    }
    const execution = { id: `mcp-sdk-exec-${action.roomId}`, kind: 'execution', observed: true, sessionId: 'mcp-sdk-session', correlationId: 'mcp-sdk-trace', action, at: action.at, assertion: 'observed-tool-call' };
    providerCalls += 1;
    const providerResult = await provider(action);
    const acknowledgement = { id: `mcp-sdk-ack-${action.roomId}`, kind: 'provider_ack', provider: signers.providerSigner.id, eventId: execution.id, correlationId: execution.correlationId, actionDigest: actionDigest(action), bookingId: providerResult.bookingId, status: providerResult.status, amountCents: action.amountCents, currency: action.currency, at: providerResult.at };
    const records = [signRecord(execution, signers.agentSigner), signRecord(acknowledgement, signers.providerSigner)];
    lastPackage = { manifest: { version: '0.1.0', packageId: `mcp-sdk-${action.roomId}`, createdAt: action.at, profile: 'agent-receipt.demo.v1', recordCount: records.length }, keyHints, authorization: signRecord({ ...grant, kind: 'authorization' }, signers.principalSigner), records, metadata: { integration: 'official-mcp-sdk', simulated: true, noRealPurchase: true } };
    const verification = verifyPackage(lastPackage, { trustedKeys: keyHints });
    return { content: [{ type: 'text', text: JSON.stringify({ blocked: false, providerResult, packageId: lastPackage.manifest.packageId, verification: verification.overall }) }] };
  });
  return { server, getLastPackage: () => lastPackage, getProviderCallCount: () => providerCalls, keyHints };
}

export async function runOfficialMcpRoundTrip({ action, demo }) {
  const serverHandle = createOfficialMcpServer({ grant: demo.grant, signers: demo.signers });
  const client = new Client({ name: 'agent-receipt-demo-client', version: '0.1.0' }, { capabilities: {} });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await serverHandle.server.connect(serverTransport);
  await client.connect(clientTransport);
  const tools = await client.listTools();
  const response = await client.callTool({ name: 'book_hotel', arguments: action });
  return { client, mcpServer: serverHandle.server, response, tools, package: serverHandle.getLastPackage(), providerCalls: serverHandle.getProviderCallCount(), close: async () => { await client.close(); await serverHandle.server.close(); } };
}

async function defaultProvider(action) { return { bookingId: `mcp-sdk-${action.roomId}`, status: 'confirmed', at: '2026-10-25T09:12:03.000Z' }; }
