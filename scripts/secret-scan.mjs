import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.git', '.vite']);
const suspicious = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bsk-[A-Za-z0-9]{20,}\b/
];
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (ignored.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}
const findings = [];
for (const path of walk(process.cwd())) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  if (suspicious.some((pattern) => pattern.test(text))) findings.push(path);
}
if (findings.length) {
  console.error(`Potential secret material found in: ${findings.join(', ')}`);
  process.exit(1);
}
console.log('Secret scan passed: no known private-key or credential patterns found.');
