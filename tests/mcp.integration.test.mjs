import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalMcpBookingDemo } from '../packages/integrations/mcp/src/index.mjs';

test('MCP-shaped tool call enforces before execution and exports verifiable evidence', async () => {
  const demo = createLocalMcpBookingDemo();
  const response = await demo.integration.callTool('book_hotel', demo.action);
  assert.equal(response.allowed, true);
  assert.equal(response.executed, true);
  assert.equal(response.result.status, 'confirmed');
  assert.equal(response.verification.overall, 'VERIFIED');
});

test('MCP-shaped consequential call is blocked before provider execution', async () => {
  const demo = createLocalMcpBookingDemo();
  const action = { ...demo.action, amountCents: 45000 };
  const response = await demo.integration.callTool('book_hotel', action);
  assert.equal(response.allowed, false);
  assert.equal(response.executed, false);
  assert.equal(response.preflight.status, 'FAILED');
  assert.equal(response.package, null);
});
