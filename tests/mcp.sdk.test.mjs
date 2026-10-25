import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalMcpBookingDemo } from '../packages/integrations/mcp/src/index.mjs';
import { verifyPackage } from '../packages/core/src/index.mjs';
import { runOfficialMcpRoundTrip } from '../packages/integrations/mcp/src/official-sdk.mjs';

test('official MCP SDK server/client round trip records and verifies a valid booking', async () => {
  const demo = createLocalMcpBookingDemo();
  const roundTrip = await runOfficialMcpRoundTrip({ action: demo.action, demo });
  try {
    assert.ok(roundTrip.tools.tools.some((tool) => tool.name === 'book_hotel'));
    assert.equal(roundTrip.response.isError, undefined);
    assert.equal(roundTrip.providerCalls, 1);
    assert.equal(roundTrip.package.metadata.integration, 'official-mcp-sdk');
    assert.equal(verifyPackage(roundTrip.package, { trustedKeys: roundTrip.package.keyHints }).overall, 'VERIFIED');
  } finally { await roundTrip.close(); }
});

test('official MCP SDK enforcement blocks an unauthorized booking before provider execution', async () => {
  const demo = createLocalMcpBookingDemo();
  const roundTrip = await runOfficialMcpRoundTrip({ action: { ...demo.action, amountCents: 45000 }, demo });
  try {
    assert.equal(roundTrip.response.isError, true);
    assert.equal(roundTrip.providerCalls, 0);
    assert.equal(roundTrip.package, null);
    const body = JSON.parse(roundTrip.response.content[0].text);
    assert.equal(body.blocked, true);
    assert.equal(body.preflight.status, 'FAILED');
  } finally { await roundTrip.close(); }
});
