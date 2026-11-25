const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium, webkit, devices } = require('playwright');

let server, url;
let online = true;
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.webmanifest': 'application/manifest+json'
};
before(async () => {
  server = createServer(async (request, response) => {
    if (!online) return request.socket.destroy();
    const match = request.url.match(/^\/biochemistry\/([a-z0-9.-]*)$/);
    if (!match) return response.writeHead(404).end();
    const file = match[1] || 'index.html';
    try {
      const data = await readFile(path.join(__dirname, '..', file));
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] }).end(data);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = 'http://127.0.0.1:' + server.address().port + '/biochemistry/';
});
after(() => new Promise(resolve => server.close(resolve)));

const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('mcqhs2_v5')));
const bank = page => page.evaluate(() => QUESTIONS.map(q => ({
  id: q.id, topic: topicFor(q), chapter: chapterFor(q), key: getKey(q), options: q.options
})));
const button = (page, scope, action) =>
  page.locator(`[data-learning-action="${action}"][data-scope="${scope}"]`).first();
async function launch(page, scope, action) {
  const target = button(page, scope, action);
  const details = target.locator('xpath=ancestor::details[1]');
  if (await details.count() && !await target.isVisible()) await details.locator('summary').click();
  await target.click();
}
async function jump(page, id) {
  await page.locator('#mobileJump').click();
  await page.locator('#questionGrid button').getByText(String(id), { exact: true }).click();
}
const back = page => page.locator('#studyBackBtn').click();
const choose = (page, label) => page.locator('#options .opt').filter({
  has: page.locator('.letter').getByText(label + '.', { exact: true })
}).click();

for (const [name, engine, profiles] of [
  ['Chromium', chromium, [['desktop', {}], ['Android', devices['Pixel 7']]]],
  ['WebKit', webkit, [
    ['iPhone', devices['iPhone 15']], ['iPad', devices['iPad Pro 11']],
    ['iPad-ngang', devices['iPad Pro 11 landscape']]
  ]]
]) {
  test(name, { timeout: 95000 }, async t => {
    const browser = await engine.launch({
      executablePath: name === 'Chromium' ? process.env.CHROMIUM_EXECUTABLE : undefined
    });
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
            if (process.env.SCREENSHOT_DIR && profile === 'iPad-ngang') {
              await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, 'Hoa_Sinh_2_iPad-ngang.png') });
            }
            const all = await bank(page);
            assert.equal(all.length, 296);
            assert.equal(all.filter(q => q.key === null).length, 8);
            const chapters = await page.locator('[data-chapter] h3').allTextContents();
            assert.deepEqual(chapters.slice(0, 4).map(text => text.split(' · ')[1]),
              ['Kỹ thuật xét nghiệm', 'Hóa sinh chuyển hóa', 'Chức năng cơ quan', 'Enzyme và phương pháp']);
            assert.equal(await page.locator('[data-mode="practice"]').count(), 0);
            assert.equal(await page.locator('#examSetup').isVisible(), false);
            assert.equal(await page.locator('#exportProgress').isVisible(), false);
            const chapter = all[0].chapter;
            const topic = all[0].topic;
            const chapterIds = all.filter(q => q.chapter === chapter).map(q => q.id);
            const topicIds = all.filter(q => q.topic === topic).map(q => q.id);
            const widthFits = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
            assert.equal(await widthFits(), true);
            // An explicitly filtered one-question session must not affect the next chapter or topic.
            await page.locator('#advancedLearning summary').click();
            await page.locator('#learningSearch').fill('8');
            await page.locator('#learningFilter button[type=submit]').click();
            assert.deepEqual((await state(page)).learning.ids, [8]);
            assert.match(await page.locator('#question .formula').innerText(), /OD₀/);
            await back(page);
            await launch(page, chapter, 'all');
            assert.deepEqual((await state(page)).learning.ids, chapterIds);
            await back(page);
            await launch(page, topic, 'all');
            assert.deepEqual((await state(page)).learning.ids, topicIds);
            assert.equal(await page.locator('body').evaluate(body => body.classList.contains('focus')), true);
            assert.equal(await widthFits(), true);
            const option = page.locator('#options .opt').nth(1);
            assert.ok((await option.boundingBox()).height >= 58);
            if (options.hasTouch) await option.tap(); else await option.click();
            assert.match(await page.locator('#feedback').innerText(), /Chưa đúng/);
            await page.locator('#focusExplainBtn').click();
            assert.equal(await page.locator('#explanationPanel').isVisible(), true);
            await page.locator('#focusExplainBtn').click();
            await page.locator('#markBtn').click();
            await page.locator('#nextBtn').click();
            const saved = (await state(page)).learning;
            await back(page);
            await page.reload();
            await page.locator('[data-learning-resume]').click();
            assert.equal((await state(page)).learning.current, saved.current);
            assert.deepEqual((await state(page)).learning.ids, topicIds);
            await back(page);

            // The same unresolved question is reachable from all three review entry points.
            await page.locator('[data-mode="review"]').click();
            await launch(page, 'all', 'wrong');
            assert.deepEqual((await state(page)).learning.ids, [1]);
            await back(page);
            await launch(page, chapter, 'wrong');
            assert.deepEqual((await state(page)).learning.ids, [1]);
            await back(page);
            await launch(page, topic, 'wrong');
            await choose(page, 'A');
            assert.match(await page.locator('#feedback').innerText(), /Chính xác/);
            const corrected = await state(page);
            assert.deepEqual(corrected.wrong, []);
            assert.equal(corrected.wrongHistory['1'].wrong, 1);
            assert.equal(corrected.wrongHistory['1'].corrected, 1);
            assert.equal(corrected.wrongHistory['1'].attempts[0].answer, 'B');
            assert.deepEqual(corrected.learning.ids, [1]);
            await back(page);
            assert.equal(await button(page, 'all', 'wrong').isDisabled(), true);
            await page.locator('[data-mode="stats"]').click();
            assert.match(await page.locator('#statsContent').innerText(), /1 lượt sai.*1 câu từng được khắc phục.*0 câu cần ôn/);
            await page.locator('[data-mode="study"]').click();
            for (const scope of [topic, chapter, 'all']) {
              await launch(page, scope, 'unanswered');
              assert.ok(!(await state(page)).learning.ids.includes(1));
              await back(page);
              await launch(page, scope, 'done');
              assert.deepEqual((await state(page)).learning.ids, [1]);
              await back(page);
            }
            await launch(page, 'all', 'marked');
            assert.deepEqual((await state(page)).learning.ids, [1]);
            await back(page);
            await launch(page, 'all', 'redo');
            assert.equal((await state(page)).learning.ids.length, 296);
            assert.equal((await state(page)).answers['1'], 'A');
            assert.equal(await page.locator('#options .selected').count(), 0);
            await back(page);
            await launch(page, 'all', 'random');
            const random = (await state(page)).learning.ids;
            assert.deepEqual(random.slice().sort((a, b) => a - b), all.map(q => q.id));
            assert.notDeepEqual(random, all.map(q => q.id));
            await back(page);
            await launch(page, 'all', 'nokey');
            const noKey = all.filter(q => q.key === null);
            assert.deepEqual((await state(page)).learning.ids, noKey.map(q => q.id));
            assert.match(await page.locator('#feedback').innerText(), /chưa có đáp án/);
            if (noKey[0].options.length) await choose(page, noKey[0].options[0].label);
            else await page.locator('#checkBtn').click();
            assert.deepEqual((await state(page)).wrong, []);
            await back(page);

            await page.locator('[data-mode="settings"]').click();
            await page.locator('#instantToggle').uncheck();
            await page.locator('#themeBtn').click();
            await page.locator('[data-mode="study"]').click();
            await launch(page, 'all', 'all');
            await choose(page, 'A');
            assert.equal(await page.locator('#feedback').isVisible(), false);
            await page.locator('#checkBtn').click();
            assert.match(await page.locator('#feedback').innerText(), /Chính xác/);
            const multi = all.find(q => Array.isArray(q.key));
            await jump(page, multi.id);
            for (const label of multi.key) await choose(page, label);
            await page.locator('#checkBtn').click();
            assert.match(await page.locator('#feedback').innerText(), /Chính xác/);
            assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
            if (process.env.SCREENSHOT_DIR && ['iPhone', 'iPad'].includes(profile)) {
              if (profile === 'iPad') await page.locator('#themeBtn').click();
              await back(page);
              await launch(page, 'all', 'all');
              await choose(page, 'A');
              await page.locator('#checkBtn').click();
              await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `Hoa_Sinh_2_${profile}.png`) });
            }
            await back(page);
            await page.locator('[data-mode="flashcards"]').click();
            await page.locator('#flashFlip').click();
            assert.equal(await page.locator('#flashBack').isVisible(), true);
            await page.locator('[data-mode="answers"]').click();
            assert.match(await page.locator('#answerCount').innerText(), /296.*288.*8/);
            await page.locator('[data-mode="exam"]').click();
            await page.locator('#examCount').selectOption('10');
            await page.locator('#examTopic').selectOption('all');
            await page.locator('#examKeyOnly').check();
            await page.locator('#examAction').click();
            assert.equal((await state(page)).examIds.length, 10);
            assert.equal(await page.locator('#examSetup').isVisible(), false);
            const examCurrent = (await state(page)).current;
            const first = all.find(q => q.id === examCurrent);
            for (const label of Array.isArray(first.key) ? first.key : [first.key]) await choose(page, label);
            await page.reload();
            assert.equal(await page.locator('#examAnswered').innerText(), '1');
            await page.locator('#examAction').click();
            assert.match(await page.locator('.result-score').innerText(), /1\/10/);
            assert.equal((await state(page)).examHistory.length, 1);

            await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
            const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
            assert.equal(scope, url);
            online = false;
            await page.reload();
            assert.equal(await page.locator('#examResult').isVisible(), true);
            assert.deepEqual(errors, []);
          } finally {
            online = true;
            await context.close();
          }
        });
      }
      await t.test('lưu cũ, sao lưu và khôi phục', async () => {
        const context = await browser.newContext({ acceptDownloads: true });
        try {
          const page = await context.newPage();
          page.on('dialog', dialog => dialog.accept());
          await page.addInitScript(() => {
            if (localStorage.getItem('fixture')) return;
            localStorage.setItem('fixture', '1');
            localStorage.setItem('mcqhs2_v41', JSON.stringify({
              mode: 'practice', current: 8, answers: { 1: 'B' }, wrong: [1], marked: [8]
            }));
            localStorage.setItem('mcqhs2_v41_prefs', JSON.stringify({ theme: 'dark' }));
          });
          await page.goto(url);
          assert.equal((await state(page)).learning.current, 8);
          assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
          assert.deepEqual((await state(page)).wrongHistory['1'], { wrong: 1, corrected: 0 });
          await back(page);
          await page.locator('[data-mode="settings"]').click();
          await page.locator('#settingsArea summary').click();
          const downloadEvent = page.waitForEvent('download');
          await page.locator('#exportProgress').click();
          const download = await downloadEvent;
          const exported = await download.path();
          const saved = JSON.parse(await readFile(exported));
          assert.equal(saved.schema, 2);
          assert.equal(saved.learning.current, 8);
          await page.locator('#resetBtn').click();
          assert.deepEqual((await state(page)).answers, {});
          await page.locator('#backupFile').setInputFiles(exported);
          await page.waitForFunction(() => JSON.parse(localStorage.getItem('mcqhs2_v5')).answers['1'] === 'B');
          assert.equal((await state(page)).learning.current, 8);
          await page.locator('#backupFile').setInputFiles({
            name: 'rc7.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
              schema: 1, bank: 'hoa-sinh-2-296', answers: { 1: 'A' }, preferences: { theme: 'light' }
            }))
          });
          await page.waitForFunction(() => JSON.parse(localStorage.getItem('mcqhs2_v5')).answers['1'] === 'A');
          assert.equal(await page.locator('html').getAttribute('data-theme'), '');
        } finally {
          await context.close();
        }
      });
    } finally {
      await browser.close();
    }
  });
}
