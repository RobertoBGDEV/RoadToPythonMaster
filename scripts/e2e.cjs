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

    // 3a. Output without a trailing newline must not be lost (regression)
    await page.goto(base + 'console');
    await page.locator('.cm-content').first().click();
    await page.keyboard.press('Control+A');
    await page.keyboard.insertText('print("a", end="")\nprint("b", end="")');
    await page.waitForFunction(() => /Run/.test(document.querySelector('.btn.primary')?.textContent || ''), null, { timeout: 60000 });
    await page.locator('.btn.primary').first().click();
    await page.waitForFunction(() => document.querySelector('.output')?.textContent.trim() === 'ab', null, { timeout: 30000 });
    console.log('ok output without trailing newline');

    // 3b. Spaced repetition: an overdue solved problem shows up under Review
    await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('rtpm:v1'));
      st.problems['two-sum'].due = Date.now() - 1000;
      localStorage.setItem('rtpm:v1', JSON.stringify(st));
    });
    await page.goto(base + 'roadmap'); await page.goto(base + 'today');
    await page.reload();
    await page.waitForSelector('h1');
    assert.match(await page.locator('body').innerText(), /1 due/);
    console.log('ok review queue shows overdue problem');

    // 3c. Lesson completion awards XP and quiz works
    await page.goto(base + 'lesson/py-syntax');
    await page.locator('.quiz .opt').nth(1).click();
    assert.ok(await page.locator('.quiz .opt.right').count() >= 1);
    await page.locator('.footer-actions .btn.primary').click();
    await page.waitForFunction(() => /Completed/.test(document.querySelector('.footer-actions .btn')?.textContent || ''));
    console.log('ok lesson quiz + completion');

    // 3d. Pattern drill answers and scores
    await page.goto(base + 'drill');
    await page.locator('.options .opt').first().click();
    await page.waitForSelector('.options .opt.right');
    console.log('ok pattern drill');

    // 3e. Story bank save
    await page.goto(base + 'stories');
    await page.getByText('+ New story').click();
    await page.locator('.form input').first().fill('Migrated risk batch');
    await page.locator('.form textarea').first().fill('Nightly batch took 6h');
    await page.getByRole('button', { name: 'Save' }).click();
    assert.match(await page.locator('body').innerText(), /Migrated risk batch/);
    console.log('ok story bank');

    // 3f. Mock interview: starts, shows timer, finishes and records history
    await page.goto(base + 'mock');
    await page.getByRole('button', { name: 'Start mock' }).click();
    await page.waitForSelector('.clock');
    assert.match(await page.locator('.clock').innerText(), /4\d:\d\d|45:00/);
    await page.getByRole('button', { name: 'Finish' }).click();
    await page.waitForSelector('text=Mock finished');
    console.log('ok mock interview');

    // 3g. Export backup contains progress
    await page.goto(base + 'settings');
    const raw = await page.evaluate(() => localStorage.getItem('rtpm:v1'));
    const st = JSON.parse(raw);
    assert.ok(st.xp > 0 && st.stories.length === 1 && st.mocks.length === 1);
    console.log('ok progress persisted');

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
