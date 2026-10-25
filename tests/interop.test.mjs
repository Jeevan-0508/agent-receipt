import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { verifyPackage } from '../packages/core/src/index.mjs';

test('JavaScript verifier agrees with every v0.1 shared vector', () => {
  const root = new URL('../test-vectors/v0.1/', import.meta.url);
  for (const file of readdirSync(root).filter((name) => name.endsWith('.json'))) {
    const vector = JSON.parse(readFileSync(new URL(file, root), 'utf8'));
    const result = verifyPackage(vector.package, { trustedKeys: vector.trustedKeys });
    assert.equal(result.overall, vector.expected, file);
  }
});
