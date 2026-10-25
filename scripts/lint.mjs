import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : path.endsWith('.mjs') ? [path] : [];
  });
}
const targets = files(process.cwd());
for (const target of targets) {
  const result = spawnSync(process.execPath, ['--check', target], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`JavaScript syntax lint passed for ${targets.length} files.`);
