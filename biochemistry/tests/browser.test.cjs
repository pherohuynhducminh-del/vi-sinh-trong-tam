const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');

let server;
let url;
let serverOnline = true;
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json'
};

before(async () => {
  server = createServer(async (request, response) => {
    if (!serverOnline) return request.socket.destroy();
    const match = request.url.match(/^\/biochemistry\/([a-z0-9.-]*)$/);
    if (!match) return response.writeHead(404).end();
    const file = match[1] || 'index.html';
    try {
      const body = await readFile(path.join(__dirname, '..', file));
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = 'http://127.0.0.1:' + server.address().port + '/biochemistry/';
});

after(() => new Promise(resolve => server.close(resolve)));

for (const [name, engine, profiles] of [
  ['Chromium', chromium, [['desktop', {}], ['Android', devices['Pixel 7']]]],
  ['WebKit', webkit, [['desktop', {}], ['iPhone', devices['iPhone 15']], ['iPad', devices['iPad Pro 11']]]]
]) {
  test(name, async t => {
    const executablePath = name === 'Chromium' ? process.env.CHROMIUM_EXECUTABLE : undefined;
    const browser = await engine.launch({ executablePath });
    try {
      for (const [profile, options] of profiles) {
        await t.test(profile, async () => {
          const context = await browser.newContext(options);
          try {
            const page = await context.newPage();
            page.setDefaultTimeout(10000);
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('dialog', dialog => dialog.accept());
            await page.goto(url);
            assert.match(await page.locator('#qTitle').innerText(), /Câu 1 \/ 296/);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
            const firstOption = page.locator('#options .opt').first();
            if (options.hasTouch) await firstOption.tap();
            else await firstOption.click();
            assert.equal(await page.locator('#feedback').isVisible(), true);
            await page.locator('#markBtn').click();
            await page.locator('#themeBtn').click();
            await page.reload();
            assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
            assert.equal(await page.locator('#options .selected').count(), 1);
            assert.match(await page.locator('#markBtn').innerText(), /Đã đánh dấu/);
            await page.locator('#search').fill('8');
            assert.match(await page.locator('#question .formula').innerText(), /OD₀/);
            await page.locator('#search').clear();
            await page.locator('[data-mode="study"]').click();
            await page.locator('[data-study-topic]').first().click();
            await page.locator('#checkBtn').click();
            assert.equal(await page.locator('#feedback').isVisible(), true);
            await page.locator('[data-mode="answers"]').click();
            assert.match(await page.locator('#answerCount').innerText(), /296/);
            await page.locator('[data-mode="flashcards"]').click();
            await page.locator('#flashFlip').click();
            assert.equal(await page.locator('#flashBack').isVisible(), true);
            await page.locator('[data-mode="stats"]').click();
            assert.equal(await page.locator('#statsArea').isVisible(), true);
            await page.locator('[data-mode="exam"]').click();
            await page.locator('#examKeyOnly').check();
            await page.locator('#examAction').click();
            await page.locator('#options .opt').first().click();
            await page.reload();
            assert.equal(await page.locator('#examLive').isVisible(), true);
            assert.equal(await page.locator('#examAnswered').innerText(), '1');
            await page.locator('#examAction').click();
            assert.equal(await page.locator('#examResult').isVisible(), true);
            await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
            serverOnline = false;
            await page.reload();
            assert.equal(await page.locator('#examResult').isVisible(), true);
            assert.deepEqual(errors, []);
          } finally {
            serverOnline = true;
            await context.close();
          }
        });
      }
      await t.test('legacy v4.1 storage', async () => {
        const context = await browser.newContext();
        try {
          const page = await context.newPage();
          await page.addInitScript(() => {
            localStorage.setItem('mcqhs2_v41', JSON.stringify({ current: 8, marked: [8] }));
            localStorage.setItem('mcqhs2_v41_prefs', JSON.stringify({ theme: 'dark' }));
            localStorage.setItem('clinical-quiz:mcqhs2_v5', '{"current":296}');
          });
          await page.goto(url);
          assert.match(await page.locator('#qTitle').innerText(), /Câu 8 \/ 296/);
          assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
          assert.match(await page.locator('#markBtn').innerText(), /Đã đánh dấu/);
          assert.equal(await page.evaluate(() =>
            localStorage.getItem('clinical-quiz:mcqhs2_v5')), '{"current":296}');
        } finally {
          await context.close();
        }
      });
    } finally {
      await browser.close();
    }
  });
}
