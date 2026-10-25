import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScenario, runScenarios } from '../packages/core/src/scenarios.mjs';
import { verifyPackage } from '../packages/core/src/index.mjs';

const verify = (pkg) => verifyPackage(pkg, { trustedKeys: pkg.keyHints });

test('valid booking is independently verified', () => assert.equal(verify(buildScenario('valid-booking')).overall, 'VERIFIED'));
test('spending limit fails authorization', () => {
  const result = verify(buildScenario('spending-violation'));
  assert.equal(result.authorization.status, 'FAILED');
  assert.ok(result.authorization.findings.some((f) => f.code === 'amount-limit-exceeded'));
});
test('approval binding detects parameter substitution', () => {
  const result = verify(buildScenario('parameter-substitution'));
  assert.ok(result.authorization.findings.some((f) => f.code === 'approval-binding-failed'));
});
test('delegation cannot widen a non-delegable grant', () => {
  const result = verify(buildScenario('unauthorized-delegation'));
  assert.ok(result.authorization.findings.some((f) => f.code === 'delegation-not-allowed'));
});
test('tampered signed evidence fails integrity', () => {
  const pkg = buildScenario('valid-booking');
  pkg.records[1].payload.action.amountCents = 19000;
  assert.equal(verify(pkg).integrity, 'FAILED');
});
test('missing confirmation is indeterminate, not verified', () => assert.equal(verify(buildScenario('missing-provider-confirmation')).outcome.status, 'INDETERMINATE'));
test('revoked authority fails authorization', () => assert.equal(verify(buildScenario('revoked-authority')).authorization.status, 'FAILED'));
test('all seven scenarios execute', () => assert.equal(runScenarios().length, 7));
