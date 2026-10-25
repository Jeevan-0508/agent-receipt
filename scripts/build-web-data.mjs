import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runScenarios } from '../packages/core/src/scenarios.mjs';

const compact = runScenarios().map(({ id, label, summary, package: pkg, result }) => ({
  id, label, summary, package: pkg, result: {
    packageId: result.packageId, integrity: result.integrity, signatures: result.signatures,
    authorization: result.authorization, outcome: result.outcome, completeness: result.completeness,
    overall: result.overall, recordResults: result.recordResults
  }
}));
await mkdir(resolve('apps/web/src'), { recursive: true });
await writeFile(resolve('apps/web/src/scenarioData.json'), JSON.stringify(compact, null, 2));
console.log(`Generated ${compact.length} scenario packages for the workbench.`);
