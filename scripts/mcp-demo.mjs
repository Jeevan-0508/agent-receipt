import { mkdirSync, writeFileSync } from 'node:fs';
import { createLocalMcpBookingDemo } from '../packages/integrations/mcp/src/index.mjs';
import { runOfficialMcpRoundTrip } from '../packages/integrations/mcp/src/official-sdk.mjs';
import { verifyPackage } from '../packages/core/src/index.mjs';
import { buildScenario } from '../packages/core/src/scenarios.mjs';

const outputDir = new URL('../examples/mcp-sdk/', import.meta.url);
mkdirSync(outputDir, { recursive: true });
const demo = createLocalMcpBookingDemo();
const roundTrip = await runOfficialMcpRoundTrip({ action: demo.action, demo });
const blockedRoundTrip = await runOfficialMcpRoundTrip({ action: { ...demo.action, amountCents: 45000 }, demo });
writeFileSync(new URL('package.json', outputDir), `${JSON.stringify(roundTrip.package, null, 2)}\n`);
writeFileSync(new URL('trusted-keys.json', outputDir), `${JSON.stringify(roundTrip.package.keyHints, null, 2)}\n`);
const insufficient = buildScenario('missing-provider-confirmation');
console.log(JSON.stringify({ transport: 'official-mcp-sdk-in-memory', tools: roundTrip.tools.tools.map((tool) => tool.name), allowed: { valid: JSON.parse(roundTrip.response.content[0].text).blocked === false, unauthorized: JSON.parse(blockedRoundTrip.response.content[0].text).blocked === false }, providerCalls: { valid: roundTrip.providerCalls, unauthorized: blockedRoundTrip.providerCalls }, package: new URL('package.json', outputDir).pathname, verification: JSON.parse(roundTrip.response.content[0].text).verification, insufficientEvidence: verifyPackage(insufficient, { trustedKeys: insufficient.keyHints }).overall }, null, 2));
await roundTrip.close();
await blockedRoundTrip.close();
