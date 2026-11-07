// Browser smoke test: node scripts/e2e.cjs  (needs `npm run build` + Playwright; serves dist itself)
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const assert = require('node:assert');

(async () => {
  const srv = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  const base = 'http://localhost:4173/#/';
  try {
    // 1. Lesson snippet runs in Pyodide
    await page.goto(base + 'lesson/py-syntax');
    await page.locator('.runnable .btn.primary').first().click();
    await page.waitForSelector('.runnable .output .stdout', { timeout: 90000 });
    assert.match(await page.locator('.runnable .output').first().innerText(), /False/);
    console.log('ok lesson snippet');

    // 2. Problem: wrong answer fails, reference solution passes
    await page.goto(base + 'problem/two-sum');
    await page.locator('.workspace .btn.primary').click();
    await page.waitForSelector('.tests .summary', { timeout: 60000 });
    assert.match(await page.locator('.tests .summary').innerText(), /passed/);
    assert.ok(/❌/.test(await page.locator('.tests .summary').innerText()));
    console.log('ok starter fails');
    const sol = 'def two_sum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n';
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText(sol);
    await page.locator('.workspace .btn.primary').click();
    await page.waitForFunction(() => document.querySelector('.tests .summary')?.textContent.includes('All tests passed'), null, { timeout: 30000 });
    console.log('ok solution passes');
    await page.goto(base + 'today');
    assert.match(await page.locator('body').innerText(), /Day|solved|XP/);

    // 3. Infinite loop is interrupted and the runner recovers
    await page.goto(base + 'console');
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('while True:\n    pass\n');
    await page.locator('.btn.primary').first().click();
    await page.waitForSelector('.output .error', { timeout: 40000 });
    assert.match(await page.locator('.output .error').innerText(), /Time limit/);
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('print("alive")');
    await page.waitForFunction(() => /Run/.test(document.querySelector('.btn.primary')?.textContent || ''), null, { timeout: 60000 });
    await page.locator('.btn.primary').first().click();
    await page.waitForFunction(() => document.querySelector('.output')?.textContent.includes('alive'), null, { timeout: 30000 });
    console.log('ok infinite loop interrupted + recovered');

    // 4. Every top-level page renders without runtime errors
    for (const r of ['today', 'roadmap', 'problems', 'drill', 'mock', 'stories', 'settings']) {
      await page.goto(base + r);
      await page.waitForSelector('h1');
    }
    assert.deepStrictEqual(errors, []);
    console.log('ok all pages render');
  } catch (e) {
    await page.screenshot({ path: process.env.SHOT || '/tmp/e2e-fail.png' });
    console.error('E2E FAILED:', e.message, errors);
    process.exitCode = 1;
  } finally {
    await browser.close();
    srv.kill();
  }
})();
