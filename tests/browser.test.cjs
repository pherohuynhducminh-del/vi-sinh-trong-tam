const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile, mkdir, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const { once } = require('node:events');
const { after, before, test } = require('node:test');
const { chromium, webkit, devices } = require('playwright');

const root = join(__dirname, '..');
let server;
let base;
before(async () => {
  const original = await readFile(join(root, 'nkhkjjhkkjjh.html'));
  const candidate = await readFile(join(root, 'clinical-quiz/index.html'));
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(req.url === '/original' ? original : candidate);
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = 'http://127.0.0.1:' + server.address().port;
});
after(() => server?.close());

async function frame(page, bank = 'focus') {
  const locator = page.frameLocator('iframe[title="' + bank + '"]');
  await locator.locator('#sessionModes button').first().waitFor({ state: 'attached' });
  return page.frames()[1];
}
const byId = (quiz, id) => quiz.locator('#' + id);
const mode = (quiz, label) => byId(quiz, 'sessionModes').getByRole('button', { name: new RegExp(label) }).click();
const visibleIds = quiz => quiz.evaluate(() => filteredIds());
const state = quiz => quiz.evaluate(() => JSON.parse(JSON.stringify(S)));
const draft = quiz => quiz.evaluate(() => ({
  count: QUESTIONS.length, unique: new Set(QUESTIONS.map(q => q.id)).size,
  noKey: QUESTIONS.filter(q => getKey(q) == null).map(q => q.id),
  noOptions: QUESTIONS.filter(q => !q.options.length).map(q => q.id),
  badKeys: QUESTIONS.filter(q => normalizedKey(q)?.some(key => !q.options.some(option => option.label === key))).map(q => q.id),
  tiers: typeof META === 'undefined' ? null : [1, 2, 3, 4].map(t => QUESTIONS.filter(q => META[q.id].tier === t).length)
}));

async function switchTo(page, bank) {
  await page.locator('#' + bank).click();
  return frame(page, bank);
}

async function openSingletonStudy(quiz) {
  await mode(quiz, 'Học theo chủ đề');
  const topic = await quiz.evaluate(() => topicList().find(name => QUESTIONS.filter(q => topicFor(q) === name).length === 1));
  assert.ok(topic);
  await quiz.locator('[data-study-topic]').evaluateAll((buttons, name) => {
    buttons.find(button => button.dataset.studyTopic === name).click();
  }, topic);
  assert.equal((await visibleIds(quiz)).length, 1);
  return topic;
}

async function examine(page) {
  let quiz = await frame(page);
  await mode(quiz, 'Thi thử');
  await byId(quiz, 'sessionStart').click();
  assert.equal((await state(quiz)).examActive, true);
  return quiz;
}

async function screenshot(page, name) {
  const buffer = await page.screenshot({ animations: 'disabled' });
  const dir = process.env.QUIZ_SCREENSHOTS;
  if (dir) {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name + '.png'), buffer);
  }
  return buffer;
}

for (const [engine, browser] of Object.entries({ chromium, webkit })) {
  if (process.env.QUIZ_ENGINE && engine !== process.env.QUIZ_ENGINE) continue;
  test(engine + ' desktop, iPhone, iPad · so giao diện và thao tác', async t => {
    const options = engine === 'chromium' && process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {};
    const instance = await browser.launch(options);
    t.after(() => instance.close());
    const profiles = {
      desktop: { viewport: { width: 1280, height: 800 } },
      iphone: { ...devices['iPhone 13'] },
      ipad: { ...devices['iPad (gen 7)'] }
    };
    for (const [profile, config] of Object.entries(profiles)) {
      await t.test(profile, async t => {
        let page;
        const errors = [];
        const prefix = engine + '-' + profile;
        const baseline = new Map();
        for (const route of ['original', 'candidate']) {
          const context = await instance.newContext(config);
          t.after(() => context.close());
          page = await context.newPage();
          page.on('pageerror', error => errors.push(error.message));
          page.setDefaultTimeout(12000);
          await page.goto(base + '/' + route);
          const quiz = await frame(page);
          await quiz.evaluate(() => document.fonts.ready.then(() => true));
          assert.equal(await quiz.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          const compare = async screen => {
            const image = await screenshot(page, prefix + '-' + screen + '-' + route);
            if (route === 'original') baseline.set(screen, image);
            else assert.ok(image.equals(baseline.get(screen)), 'Ảnh phải khớp baseline: ' + screen);
          };
          await compare('home');
          const clickForScreenshot = locator => locator.evaluate(button => button.click());
          await clickForScreenshot(byId(quiz, 'homeTheme'));
          await compare('dark');
          await clickForScreenshot(byId(quiz, 'homeTheme'));
          await clickForScreenshot(byId(quiz, 'sessionModes').getByRole('button', { name: /Luyện tập/ }));
          await clickForScreenshot(byId(quiz, 'sessionStart'));
          await quiz.evaluate(() => window.scrollTo(0, 0));
          await compare('practice');
          if (route === 'candidate') {
            const answer = quiz.locator('#options button').first();
            await (config.hasTouch ? answer.tap() : answer.click());
            assert.ok((await state(quiz)).answers[(await state(quiz)).current]);
            await byId(quiz, 'exit26').click();
            await byId(quiz, 'discard23').click();
          }
        }
        const activate = locator => config.hasTouch ? locator.tap() : locator.click();
        await activate(page.locator('#hs'));
        const quiz = await frame(page, 'hs');
        await activate(byId(quiz, 'sessionModes').getByRole('button', { name: /Hình thực hành/ }));
        const images = await quiz.evaluate(async () => {
          const sources = [...document.querySelectorAll('img[data-src], img[src]')].map(img => img.dataset.src || img.src).filter(Boolean);
          return Promise.all(sources.map(async src => {
            const image = new Image();
            image.src = src;
            await image.decode();
            return image.naturalWidth;
          }));
        });
        assert.equal(images.length, 12);
        assert.ok(images.every(width => width > 0));
        await quiz.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        assert.ok(await quiz.evaluate(() => scrollY > 0));
        await page.reload();
        await frame(page, 'hs');
        assert.deepEqual(errors, []);
      });
    }

    await t.test('dữ liệu, lọc, phiên một câu và lịch ôn', async t => {
      const page = await instance.newPage();
      page.setDefaultTimeout(12000);
      t.after(() => page.close());
      await page.goto(base + '/original');
      page.once('dialog', dialog => dialog.accept());
      let quiz = await switchTo(page, 'hs');
      const originalTopic = await openSingletonStudy(quiz);
      await byId(quiz, 'expand26').click();
      assert.equal((await state(quiz)).studyTopic, originalTopic);
      assert.notEqual(await quiz.evaluate(() => topicFor(currentQ())), originalTopic);
      await page.goto(base + '/candidate');
      quiz = await frame(page);
      assert.deepEqual(await draft(quiz), {
        count: 500, unique: 500, noKey: [340, 394], noOptions: [], badKeys: [], tiers: [273, 42, 73, 112]
      });
      await byId(quiz, 'scope20').selectOption('focus');
      assert.equal((await visibleIds(quiz)).length, 388);
      await mode(quiz, 'Thống kê');
      await byId(quiz, 'adaptive21').click();
      assert.equal((await state(quiz)).session.length, 30);
      await byId(quiz, 'exit26').click();
      await byId(quiz, 'discard23').click();
      await mode(quiz, 'Thống kê');
      await byId(quiz, 'start22').locator('xpath=ancestor::details').locator('summary').click();
      await byId(quiz, 'start22').click();
      assert.ok((await state(quiz)).session.length > 0);
      await byId(quiz, 'exit26').click();
      await byId(quiz, 'discard23').click();
      quiz = await switchTo(page, 'hs');
      assert.deepEqual(await draft(quiz), {
        count: 296, unique: 296, noKey: [73, 213, 217, 230, 232, 236, 246, 296],
        noOptions: [213, 230, 236], badKeys: [], tiers: null
      });
      await mode(quiz, 'Luyện tập');
      await byId(quiz, 'search').fill('1');
      assert.deepEqual(await visibleIds(quiz), [1]);
      await byId(quiz, 'sessionStart').click();
      assert.equal(await byId(quiz, 'nextBtn').isDisabled(), true);
      await page.reload();
      quiz = await frame(page, 'hs');
      await quiz.getByRole('button', { name: 'Tiếp tục luyện tập đã lưu' }).click();
      assert.deepEqual(await visibleIds(quiz), [1]);
      await byId(quiz, 'expand26').click();
      assert.equal((await visibleIds(quiz)).length, 296);
      await byId(quiz, 'markBtn').click();
      const marked = (await state(quiz)).current;
      await byId(quiz, 'exit26').click();
      await byId(quiz, 'keep23').click();
      await page.reload();
      quiz = await frame(page, 'hs');
      await quiz.getByRole('button', { name: 'Tiếp tục luyện tập đã lưu' }).click();
      assert.ok((await state(quiz)).marked.includes(marked));
      await byId(quiz, 'exit26').click();
      await byId(quiz, 'discard23').click();
      const studyTopic = await openSingletonStudy(quiz);
      await page.reload();
      quiz = await frame(page, 'hs');
      await byId(quiz, 'resumeFocus').click();
      assert.equal((await state(quiz)).studyTopic, studyTopic);
      assert.equal((await visibleIds(quiz)).length, 1);
      await byId(quiz, 'expand26').click();
      assert.equal((await state(quiz)).studyTopic, null);
      assert.equal(await byId(quiz, 'studyCatalog').isVisible(), true);
      await byId(quiz, 'sessionBack').click();
      await quiz.evaluate(() => { S.wrong = [1, 2]; save(); });
      await mode(quiz, 'Ôn câu sai');
      await byId(quiz, 'nextBtn').click();
      assert.equal((await state(quiz)).current, 2);
      await byId(quiz, 'expand26').click();
      assert.equal((await state(quiz)).current, 1);
    });

    await t.test('Vi sinh trọng tâm · ID 497 tự động, phiên chủ động và dữ liệu đã lưu', async t => {
      const page = await instance.newPage({ ...devices['iPhone 13'] });
      t.after(() => page.close());
      await page.goto(base + '/candidate?diagnostics=1');
      let quiz = await frame(page);
      await byId(quiz, 'scope20').selectOption('focus');
      await byId(quiz, 'next20').tap();
      assert.equal((await visibleIds(quiz)).length, 388);
      await byId(quiz, 'exit26').tap();
      await byId(quiz, 'discard23').tap();

      await quiz.evaluate(() => {
        for (const q of QUESTIONS) {
          if (META[q.id].tier < 4 && q.id !== 497) S.answers[q.id] = q.options[0].label;
        }
        save();
      });
      const previous = (await state(quiz)).answers;
      await byId(quiz, 'next20').tap();
      assert.equal((await state(quiz)).current, 497);
      assert.match(await byId(quiz, 'qTitle').textContent(), /1 \/ 388 · ID 497/);
      assert.equal(await byId(quiz, 'nextBtn').isEnabled(), true);
      await byId(quiz, 'nextBtn').tap();
      await byId(quiz, 'prevBtn').tap();
      assert.equal((await state(quiz)).current, 497);
      await byId(quiz, 'exit26').tap();
      await byId(quiz, 'discard23').tap();

      await quiz.evaluate(() => window.localStorage.setItem('clinical-quiz:' + STORAGE + '_practice23_focus', JSON.stringify({
        current: 497, session: [497], submitted: false,
        filters: { scope20: 'focus', search: '', filter: 'all', topicFilter: 'all', formatFilter: 'all' }
      })));
      await page.reload();
      quiz = await frame(page);
      await quiz.getByRole('button', { name: 'Tiếp tục luyện tập đã lưu' }).tap();
      assert.equal((await state(quiz)).current, 497);
      assert.equal((await visibleIds(quiz)).length, 388);
      assert.deepEqual((await state(quiz)).answers, previous);
      assert.equal(await quiz.evaluate(() => quizNavigationDiagnostics().migratedSnapshots), 1);
      await byId(quiz, 'exit26').tap();
      await byId(quiz, 'discard23').tap();

      await mode(quiz, 'Luyện tập');
      await byId(quiz, 'search').fill('497');
      await byId(quiz, 'sessionStart').tap();
      assert.deepEqual(await visibleIds(quiz), [497]);
      assert.equal(await byId(quiz, 'nextBtn').isDisabled(), true);
      await byId(quiz, 'exit26').tap();
      await byId(quiz, 'keep23').tap();
      await page.reload();
      quiz = await frame(page);
      await quiz.getByRole('button', { name: 'Tiếp tục luyện tập đã lưu' }).tap();
      assert.deepEqual(await visibleIds(quiz), [497]);
      assert.equal(await quiz.evaluate(() => quizNavigationDiagnostics().migratedSnapshots), 0);
      await byId(quiz, 'exit26').tap();
      await byId(quiz, 'discard23').tap();
      quiz = await switchTo(page, 'vs');
      assert.deepEqual((await state(quiz)).answers, previous);
      quiz = await switchTo(page, 'hs');
      assert.deepEqual((await state(quiz)).answers, {});
      await switchTo(page, 'focus');
      quiz = await frame(page);
      await quiz.getByText('Chẩn đoán Clinical Quiz', { exact: true }).tap();
      const report = JSON.parse(await quiz.getByRole('textbox', { name: 'Báo cáo trạng thái có thể sao chép' }).inputValue());
      assert.equal(report.bank, 'focus');
      assert.equal(report.bankSize, 500);
      assert.equal('answers' in report || 'search' in report, false);
    });

    await t.test('thi thử · hủy đổi, nộp khi đổi, hồi phục và hết giờ', async t => {
      const page = await instance.newPage();
      page.setDefaultTimeout(12000);
      t.after(() => page.close());
      await page.clock.install({ time: new Date('2026-01-15T10:00:00Z') });
      await page.goto(base + '/candidate');
      let quiz = await examine(page);
      const deadline = (await state(quiz)).examDeadline;
      page.once('dialog', dialog => dialog.dismiss());
      await page.locator('#hs').click();
      assert.equal((await state(quiz)).examActive, true);
      await page.reload();
      quiz = await frame(page);
      assert.equal((await state(quiz)).examDeadline, deadline);
      page.once('dialog', dialog => dialog.accept());
      await switchTo(page, 'hs');
      quiz = await switchTo(page, 'focus');
      assert.equal((await state(quiz)).examHistory.length, 1);
      assert.equal((await state(quiz)).examActive, false);
      quiz = await examine(page);
      const question = await quiz.evaluate(() => {
        const q = S.examIds.map(qBy).find(q => normalizedKey(q));
        return { id: q.id, key: normalizedKey(q)[0] };
      });
      await quiz.evaluate(id => go(id), question.id);
      await quiz.locator('#options button').filter({ hasText: new RegExp('^' + question.key + '\\.') }).click();
      await page.clock.fastForward(90 * 60 * 1000);
      assert.equal((await state(quiz)).examActive, false);
      assert.equal((await state(quiz)).examHistory.length, 2);
      assert.equal((await state(quiz)).examHistory.at(-1).score, 1);
      assert.equal((await state(quiz)).examHistory.at(-1).answered, 1);
      assert.equal(await byId(quiz, 'examResult').isVisible(), true);
    });

    await t.test('sao lưu v2, phiên cũ, từ chối file sai và lỗi ghi', async t => {
      const page = await instance.newPage({ acceptDownloads: true });
      t.after(() => page.close());
      await page.goto(base + '/candidate');
      let quiz = await frame(page);
      await quiz.evaluate(() => {
        const q = QUESTIONS.find(q => getKey(q) != null);
        S.answers[q.id] = getKey(q);
        S.learning21[q.id] = { streak: 1, attempts: 1, last: 1, due: 2 };
        S.planner22 = { date: '2027-01-01', minutes: '45' };
        localStorage.setItem(STORAGE + '_practice23_focus', JSON.stringify({
          current: q.id, session: [q.id], submitted: false, filters: {}
        }));
        save();
      });
      const isolated = await quiz.evaluate(() => {
        const key = STORAGE;
        const production = window.localStorage;
        production.setItem(key, 'existing root progress');
        save();
        return {
          root: production.getItem(key),
          development: JSON.parse(production.getItem('clinical-quiz:' + key)).answers
        };
      });
      assert.equal(isolated.root, 'existing root progress');
      assert.deepEqual(isolated.development, (await state(quiz)).answers);
      await mode(quiz, 'Thống kê');
      const downloaded = page.waitForEvent('download');
      await byId(quiz, 'exportProgress').click();
      const backup = JSON.parse(await readFile(await (await downloaded).path(), 'utf8'));
      assert.equal(backup.schema, 2);
      assert.equal(backup.practice.focus.session.length, 1);
      assert.deepEqual(backup.planner, { date: '2027-01-01', minutes: '45' });
      const imported = await instance.newPage();
      t.after(() => imported.close());
      imported.on('dialog', dialog => dialog.accept());
      await imported.goto(base + '/candidate');
      quiz = await frame(imported);
      const upload = value => byId(quiz, 'backupFile').setInputFiles({
        name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(value))
      });
      const reload = imported.waitForEvent('load');
      await upload(backup);
      await reload;
      quiz = await frame(imported);
      assert.deepEqual((await state(quiz)).answers, backup.answers);
      assert.deepEqual((await state(quiz)).learning21, backup.learning);
      assert.deepEqual((await state(quiz)).planner22, backup.planner);
      await quiz.getByRole('button', { name: 'Tiếp tục luyện tập đã lưu' }).click();
      assert.deepEqual(await visibleIds(quiz), backup.practice.focus.session);
      await byId(quiz, 'exit26').click();
      await byId(quiz, 'discard23').click();
      let message = imported.waitForEvent('dialog');
      await upload({ ...backup, bank: 'hoa-sinh-2-296' });
      assert.match((await message).message(), /không hợp lệ/);
      assert.deepEqual((await state(quiz)).answers, backup.answers);
      await quiz.evaluate(() => {
        const originalSet = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === 'clinical-quiz:' + PREF) throw new DOMException('test', 'QuotaExceededError');
          return originalSet.call(this, key, value);
        };
      });
      message = imported.waitForEvent('dialog', { predicate: dialog => dialog.type() === 'alert' });
      await upload({ ...backup, answers: {} });
      assert.match((await message).message(), /Không thể ghi/);
      assert.deepEqual(await quiz.evaluate(() => JSON.parse(localStorage.getItem(STORAGE)).answers), backup.answers);
      await imported.reload();
      quiz = await frame(imported);
      const oldReload = imported.waitForEvent('load');
      await upload({ schema: 1, bank: backup.bank, preferences: backup.preferences, answers: {} });
      await oldReload;
      quiz = await frame(imported);
      assert.deepEqual((await state(quiz)).answers, {});
      assert.deepEqual((await state(quiz)).learning21, backup.learning);
    });
  });
}
