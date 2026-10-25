import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../', import.meta.url));
const npmCommand = process.env.npm_execpath ? process.execPath : process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmPrefixArgs = process.env.npm_execpath ? [process.env.npm_execpath] : [];
const server = spawn(npmCommand, [...npmPrefixArgs, '--workspace', 'apps/web', 'run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], { cwd: root, shell: false, windowsHide: true, stdio: 'ignore' });
async function waitForServer() { for (let i = 0; i < 40; i += 1) { try { const response = await fetch('http://127.0.0.1:4173/'); if (response.ok) return; } catch {} await new Promise((resolve) => setTimeout(resolve, 250)); } throw new Error('Vite server did not start'); }
await waitForServer();
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = []; const pageErrors = [];
page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
page.on('pageerror', (error) => pageErrors.push(error.message));
try {
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
  await page.getByText('AGENT//RECEIPT', { exact: true }).waitFor();
  const expected = { 'Valid booking': 'VERIFIED', 'Spending violation': 'FAILED', 'Parameter substitution': 'FAILED', 'Unauthorized delegation': 'FAILED', 'Tampered evidence': 'FAILED', 'Missing provider confirmation': 'INDETERMINATE', 'Revoked authority': 'FAILED' };
  for (const label of Object.keys(expected)) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    await page.getByText(label, { exact: true }).waitFor();
    assert.equal(await page.locator('button.scenario.active').getAttribute('data-status'), expected[label]);
  }
  await page.getByRole('button', { name: 'Verification findings' }).click();
  await page.getByText('Evidence-backed conclusions').waitFor();
  await page.getByRole('button', { name: 'Provenance graph' }).click();
  await page.getByText('Follow each conclusion to its source').waitFor();
  await page.setViewportSize({ width: 560, height: 900 });
  await page.getByRole('button', { name: 'Overview' }).click();
  assert.equal(await page.title(), 'AGENT//RECEIPT — Evidence workbench');
  const unnamedButtons = await page.locator('button').evaluateAll((buttons) => buttons.filter((button) => !(button.textContent?.trim() || button.getAttribute('aria-label'))).length);
  assert.equal(unnamedButtons, 0, 'all buttons should have accessible names');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  assert.equal(overflow, true, 'responsive layout should not overflow horizontally');
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(pageErrors, []);
  console.log('Browser E2E passed: loading, seven scenarios, findings, provenance, responsive viewport, console/page errors.');
} finally {
  await browser.close();
  if (process.platform === 'win32' && server.pid) spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill('SIGTERM');
}
