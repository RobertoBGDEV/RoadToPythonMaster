// Runs every reference solution through the real UI + Pyodide worker and asserts "All tests passed".
// usage: node scripts/e2e-all-solutions.cjs   (needs `npm run build`)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const yaml = (() => { try { return require('js-yaml'); } catch { return null; } })();

async function loadProblems() {
  const { load } = await import('js-yaml');
  const dir = 'content/problems';
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).flatMap((f) => load(fs.readFileSync(path.join(dir, f), 'utf8')));
}

(async () => {
  const problems = await loadProblems();
  const only = process.argv[2];
  const srv = spawn('npx', ['vite', 'preview', '--port', '4175', '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  let failed = 0, n = 0;
  try {
    for (const p of problems) {
      if (only && p.id !== only) continue;
      await page.goto(`http://localhost:4175/#/problem/${p.id}`);
      await page.waitForSelector('.cm-content');
      await page.waitForFunction(() => /Submit/.test(document.body.innerText));
      await page.locator('.cm-content').first().click();
      await page.keyboard.press('Control+A');
      await page.keyboard.insertText(p.solution);
      await page.locator('.workspace .btn.primary').click();
      try {
        await page.waitForFunction(() => document.querySelector('.tests .summary, .pane.coding pre.output.error'), null, { timeout: 60000 });
        const txt = await page.locator('.tests .summary, .pane.coding pre.output.error').first().innerText();
        n++;
        if (!/All tests passed/.test(txt)) { failed++; console.log(`FAIL ${p.id}: ${txt.slice(0, 300)}`); }
      } catch (e) { failed++; console.log(`TIMEOUT ${p.id}`); await page.reload(); }
    }
    console.log(`${n - failed}/${n} reference solutions pass in the browser; page errors: ${errors.length}`);
    if (errors.length) console.log(errors.slice(0, 3));
  } finally {
    await browser.close(); srv.kill();
  }
  process.exitCode = failed || errors.length ? 1 : 0;
})();
