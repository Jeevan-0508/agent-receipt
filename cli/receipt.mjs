#!/usr/bin/env node
import { mkdir, readFile, stat } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runScenarios } from '../packages/core/src/scenarios.mjs';
import { verifyPackage, STATUS } from '../packages/core/src/index.mjs';

const command = process.argv[2] ?? 'demo';
if (command === 'demo') {
  const scenarios = runScenarios();
  await mkdir(resolve('examples/travel-booking'), { recursive: true });
  await writeFile(resolve('examples/travel-booking/package.json'), JSON.stringify(scenarios[0].package, null, 2));
  await writeFile(resolve('examples/travel-booking/trusted-keys.json'), JSON.stringify(scenarios[0].package.keyHints, null, 2));
  for (const scenario of scenarios) console.log(`${scenario.label.padEnd(28)} ${scenario.result.overall}`);
  console.log('\nWrote examples/travel-booking/package.json');
} else if (command === 'verify') {
  const file = process.argv[3];
  if (!file) { console.error('Usage: npm run verify -- <package.json>'); process.exit(2); }
  const packagePath = resolve(file);
  const packageStat = await stat(packagePath);
  if (packageStat.size > 1_000_000) { console.error('Package exceeds 1000000 bytes.'); process.exit(1); }
  let pkg;
  try { pkg = JSON.parse(await readFile(packagePath, 'utf8')); } catch { console.error('Invalid JSON evidence package.'); process.exit(1); }
  const trustPathArg = process.argv[4] === '--trusted-keys' ? process.argv[5] : resolve(packagePath, '..', 'trusted-keys.json');
  let trustedKeys;
  try { trustedKeys = JSON.parse(await readFile(trustPathArg, 'utf8')); } catch { trustedKeys = undefined; }
  const result = verifyPackage(pkg, { trustedKeys });
  console.log('AGENT//RECEIPT verifier');
  console.log(`package: ${result.packageId}`);
  console.log(`integrity: ${result.integrity}`);
  console.log(`signatures: ${result.signatures}`);
  console.log(`authorization: ${result.authorization.status}`);
  console.log(`outcome: ${result.outcome.status}`);
  console.log(`completeness: ${result.completeness}`);
  console.log(`overall: ${result.overall}`);
  if (result.overall !== STATUS.VERIFIED) process.exitCode = 1;
} else { console.error(`Unknown command: ${command}`); process.exit(2); }
