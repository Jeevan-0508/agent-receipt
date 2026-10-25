import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tempProject = mkdtempSync(join(tmpdir(), 'agent-receipt-package-test-'));
const npmCommand = process.env.npm_execpath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmPrefixArgs = process.env.npm_execpath ? [process.env.npm_execpath] : [];
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' && command.endsWith('.cmd'), stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed:\n${result.stdout ?? ''}\n${result.stderr ?? result.error?.message ?? ''}`);
  return result.stdout;
}

try {
  run(npmCommand, [...npmPrefixArgs, 'pack', './packages/core', '--pack-destination', tempProject], root);
  run(npmCommand, [...npmPrefixArgs, 'pack', './packages/sdk', '--pack-destination', tempProject], root);
  writeFileSync(join(tempProject, 'package.json'), JSON.stringify({ private: true, type: 'module' }, null, 2));
  const coreTarball = join(tempProject, 'agent-receipt-core-0.1.0-beta.1.tgz');
  const sdkTarball = join(tempProject, 'agent-receipt-sdk-0.1.0-beta.1.tgz');
  run(npmCommand, [...npmPrefixArgs, 'install', '--no-audit', '--no-fund', coreTarball, sdkTarball], tempProject);
  const consumer = readFileSync(resolve(root, 'examples/external-consumer/consumer.mjs'), 'utf8');
  writeFileSync(join(tempProject, 'consumer.mjs'), consumer);
  const outputDir = join(tempProject, 'receipt-output');
  const consumerOutput = run(process.execPath, ['consumer.mjs', outputDir], tempProject);
  const packagePath = join(outputDir, 'package.json');
  const trustedKeysPath = join(outputDir, 'trusted-keys.json');
  const cliOutput = run(process.execPath, [resolve(root, 'cli/receipt.mjs'), 'verify', packagePath, '--trusted-keys', trustedKeysPath], root);
  if (!cliOutput.includes('overall: VERIFIED')) throw new Error(`CLI did not independently verify the tarball package:\n${cliOutput}`);
  console.log('Packaged SDK test passed: core and SDK tarballs installed in an independent project, generated a signed package, and the existing CLI reported overall: VERIFIED.');
  console.log(consumerOutput.trim());
} finally {
  rmSync(tempProject, { recursive: true, force: true });
}
