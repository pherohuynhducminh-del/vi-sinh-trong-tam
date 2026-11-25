import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, resolve, sep } from 'node:path';
import { after, before, test } from 'node:test';
import { chromium, webkit, devices } from 'playwright';
import { build, canonical } from '../build.mjs';
import { STORAGE } from '../persistence.mjs';

const engine = process.env.MICRO_ENGINE ?? 'chromium';
const layout = engine === 'webkit' ? devices['iPhone 13'] : { viewport: { width: 1366, height: 900 } };
const types = {
  '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg'
};
let root;
let server;
let origin;
let browser;
let networkAvailable = true;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'microbiology-'));
  await build(root);
  server = createServer(async (req, res) => {
    if (!networkAvailable) {
      req.socket.destroy();
      return;
    }
    const path = new URL(req.url, 'http://localhost').pathname;
    try {
      const file = resolve(root, '.' + path + (path.endsWith('/') ? 'index.html' : ''));
      if (!file.startsWith(root + sep)) throw Error();
      const bytes = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] });
      res.end(bytes);
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  const executablePath = process.env.MICRO_CHROMIUM_PATH;
  browser = await ({ chromium, webkit })[engine].launch(engine === 'chromium' && executablePath ? { executablePath } : {});
  console.log(engine + ' ' + browser.version());
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (root) await rm(root, { recursive: true, force: true });
});

async function fixture(run, device = layout) {
  const context = await browser.newContext(device);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  page.on('dialog', dialog => dialog.accept());
  try {
    await run(page, context);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

async function bank(page) {
  await page.goto(origin + '/microbiology/');
  await page.locator('#match-count').getByText(/câu phù hợp/).waitFor();
}
const position = page => page.locator('#position').innerText();
const command = (page, command) => page.locator('[data-command="' + command + '"]');
const mode = (page, mode) => page.locator('[data-mode="' + mode + '"]');
const chosen = (page, choice) => page.locator('[data-bank="' + choice + '"]');
const dataState = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);

test('500 and 388 sessions, bank switch, exact ID, previous/next and page reload', async () => {
  await fixture(async page => {
    const started = Date.now();
    await bank(page);
    const ready = Date.now() - started;
    assert.ok(ready < 8000, 'local cold navigation took ' + ready + ' ms');
    assert.match(await page.locator('#match-count').innerText(), /^500/);
    assert.equal(await page.locator('#results article').count(), 25);
    await mode(page, 'practice').click();
    assert.match(await position(page), /1 \/ 500/);
    assert.equal(await command(page, 'previous').isDisabled(), true);
    await command(page, 'next').click();
    assert.match(await position(page), /2 \/ 500/);
    await command(page, 'previous').click();
    await command(page, 'next').click();
    await page.reload();
    assert.match(await position(page), /2 \/ 500/);
    await command(page, 'pause').click();
    await chosen(page, 'focus').click();
    assert.match(await page.locator('#match-count').innerText(), /^388/);
    await command(page, 'resume').click();
    assert.match(await position(page), /2 \/ 500/);
    await command(page, 'pause').click();
    await mode(page, 'practice').click();
    assert.match(await position(page), /1 \/ 388/);
    await command(page, 'restart').click();
    assert.match(await position(page), /1 \/ 388/);
    await command(page, 'cancel').click();
    await page.locator('#query').fill('Câu 497');
    assert.match(await page.locator('#match-count').innerText(), /^1 /);
    await mode(page, 'study').click();
    assert.match(await position(page), /1 \/ 1 · ID 497/);
    assert.equal(await command(page, 'next').isDisabled(), true);
    await page.locator('[data-answer="C"]').click();
    await page.getByText('Chính xác', { exact: true }).waitFor();
    assert.equal((await dataState(page)).progress.attempts[497].result, true);
    console.log(engine + ' cold local navigation: ' + ready + ' ms');
  });
});

test('topic with one question, empty intersection, filters and full answer sheet', async () => {
  await fixture(async page => {
    await bank(page);
    await chosen(page, 'focus').click();
    await page.locator('#chapter').selectOption('Virus học');
    await page.locator('#section').selectOption('Các nhóm virus');
    await page.locator('#topic').selectOption('Virus học › Sởi');
    assert.equal(await page.locator('#results article').count(), 1);
    await mode(page, 'study').click();
    assert.match(await position(page), /1 \/ 1/);
    await command(page, 'study-reveal').click();
    await page.locator('.answer').waitFor();
    assert.deepEqual((await dataState(page)).progress.attempts, {});
    await command(page, 'study-reveal').click();
    assert.equal(await page.locator('.answer').count(), 0);
    await command(page, 'pause').click();
    await page.locator('#query').fill('497');
    assert.match(await page.locator('#match-count').innerText(), /^0 /);
    assert.equal(await mode(page, 'practice').isDisabled(), true);
    await page.locator('#reset').click();
    await page.locator('#show-answers').click();
    assert.equal(await page.locator('#results article').count(), 388);
    await chosen(page, 'all').click();
    assert.equal(await page.locator('#results article').count(), 500);
    assert.equal(await page.getByText('Chưa có đáp án xác minh', { exact: true }).count(), 2);
    await page.locator('#show-answers').click();
    await page.locator('#tier').selectOption('4');
    assert.match(await page.locator('#match-count').innerText(), /^112/);
  });
});

test('legacy 387/388 recovery and new remaining shortcut preserve navigation', async () => {
  const { records } = await canonical();
  const answers = Object.fromEntries(records.filter(q => q.tier < 4 && q.id !== 497)
    .map(q => [q.id, q.options[0].label]));
  await fixture(async page => {
    await page.addInitScript(answers => {
      localStorage.setItem('clinical-quiz:mcq_vs_multi1', JSON.stringify({ answers, marked: [497] }));
      localStorage.setItem('clinical-quiz:mcq_vs_multi1_prefs', '{"focus":true}');
      localStorage.setItem('clinical-quiz:mcq_vs_multi1_practice23_focus', JSON.stringify({
        current: 497, session: [497], submitted: false, filters: { search: 'all', scope20: 'focus' }
      }));
    }, answers);
    await bank(page);
    await command(page, 'resume').click();
    assert.match(await position(page), /1 \/ 388 · ID 497/);
    await command(page, 'next').click();
    assert.match(await position(page), /2 \/ 388/);
    await command(page, 'cancel').click();
    await page.locator('#remaining').click();
    assert.match(await position(page), /1 \/ 388 · ID 497/);
    assert.equal((await dataState(page)).progress.marked[0], 497);
    await page.reload();
    assert.match(await position(page), /1 \/ 388 · ID 497/);
    await command(page, 'next').click();
    assert.match(await position(page), /2 \/ 388/);
  });
});

test('exam, wrong review, flashcards, study plan, backup roundtrip, appearance and album', async () => {
  await fixture(async page => {
    await bank(page);
    await page.locator('#query').fill('497');
    await page.locator('#exam-start').click();
    await page.locator('#timer').waitFor();
    await page.locator('[data-answer="A"]').click();
    assert.equal(await page.locator('.answer').count(), 0);
    assert.equal((await dataState(page)).progress.attempts[497], undefined);
    await command(page, 'submit').click();
    await page.getByText(/0\/1 câu đúng/).waitFor();
    await command(page, 'mark').click();
    await command(page, 'pause').click();
    await mode(page, 'wrong').click();
    await page.locator('[data-answer="C"]').click();
    await command(page, 'pause').click();
    assert.equal(await mode(page, 'wrong').isDisabled(), true);
    await mode(page, 'flash').click();
    await command(page, 'flip').click();
    await page.getByText('Đáp án C · GAG').waitFor();
    await command(page, 'forgot').click();
    assert.ok((await dataState(page)).progress.attempts[497].due > Date.now());
    await page.locator('#theme').click();
    await page.locator('#highlight').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.locator('[data-view="progress"]').click();
    await page.locator('#plan-date').fill('2030-01-01');
    await page.locator('#plan-count').fill('3');
    await page.getByRole('button', { name: 'Lưu kế hoạch' }).click();
    await page.getByText(/3 câu, 30 phút\/ngày/).waitFor();
    const backup = await dataState(page);
    backup.progress.attempts[497].due = 1;
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), 'vi-sinh-tien-do.json');
    const exported = await readFile(await download.path(), 'utf8');
    assert.deepEqual(JSON.parse(exported), await dataState(page));
    await page.locator('#backup-file').setInputFiles({
      name: 'progress.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup))
    });
    await page.getByText('Đã nhập tiến độ Vi sinh.').waitFor();
    await page.locator('[data-view="bank"]').click();
    await mode(page, 'due').click();
    assert.match(await position(page), /1 \/ 1 · ID 497/);
    await page.locator('[data-view="progress"]').click();
    await page.locator('#run-plan').click();
    assert.match(await position(page), /1 \/ 3/);
    await page.locator('[data-view="album"]').click();
    assert.equal(await page.locator('#album img').count(), 12);
    await page.locator('[data-image="1"]').click();
    await page.locator('dialog[open]').waitFor();
    assert.match(await page.locator('dialog img').getAttribute('alt'), /Hình thực hành 1/);
  });
});

test('responsive touch targets, swipe routing and offline reopen with all assets', async () => {
  for (const device of [devices['iPhone 13'], devices['iPad (gen 7)'], { viewport: { width: 1366, height: 900 } }]) {
    await fixture(async (page, context) => {
      await bank(page);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      if (device.hasTouch) await mode(page, 'practice').tap();
      else await mode(page, 'practice').click();
      assert.ok((await command(page, 'next').boundingBox()).height >= 44);
      if (process.env.MICRO_SCREENSHOTS) {
        const width = page.viewportSize().width;
        await page.screenshot({ path: join(process.env.MICRO_SCREENSHOTS, engine + '-' + width + '.png'), fullPage: true });
      }
      if (device.hasTouch && engine === 'chromium') {
        const devtools = await context.newCDPSession(page);
        const question = page.locator('.question');
        await question.scrollIntoViewIfNeeded();
        const { x, y, width, height } = await question.boundingBox();
        const start = { x: x + width * .8, y: y + height / 2 };
        const end = { ...start, x: start.x - 120 };
        await devtools.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        await devtools.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] });
        await devtools.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.getByText(/Câu 2 \/ 500/).waitFor({ timeout: 3000 });
      } else if (device.hasTouch) {
        await page.locator('.question').evaluate(element => {
          for (const [type, clientX] of [['pointerdown', 250], ['pointerup', 130]]) {
            element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerId: 9,
              pointerType: 'touch', clientX, clientY: 100 }));
          }
        });
        assert.match(await position(page), /2 \/ 500/);
      }
      await page.getByText('Đã tải đủ tài nguyên để học ngoại tuyến.').waitFor({ timeout: 12000 });
      await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
      const cached = await page.evaluate(async () => {
        const name = (await caches.keys()).find(name => name.startsWith('microbiology-rebuild:'));
        return (await (await caches.open(name)).keys()).map(request => request.url);
      });
      assert.equal(cached.filter(url => /\/images\/\d+\.jpg$/.test(url)).length, 12);
      networkAvailable = false;
      try {
        if (engine === 'chromium') await context.setOffline(true);
        const offline = await context.newPage();
        await offline.goto(origin + '/microbiology/');
        await offline.locator('#position').waitFor();
        assert.match(await position(offline), device.hasTouch ? /2 \/ 500/ : /1 \/ 500/);
        const photoStatus = await offline.evaluate(async () => (await fetch('./images/12.jpg')).status);
        assert.equal(photoStatus, 200);
      } finally {
        networkAvailable = true;
      }
    }, device);
  }
});
