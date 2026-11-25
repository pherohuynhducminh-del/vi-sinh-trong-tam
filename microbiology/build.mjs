import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourceHash = 'ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123';
const hash = data => createHash('sha256').update(data).digest('hex');

export async function canonical() {
  const source = await readFile(new URL('../nkhkjjhkkjjh.html', import.meta.url));
  assert.equal(hash(source), sourceHash);
  const html = source.toString();
  const bank = JSON.parse(html.match(/,vs=("(?:\\.|[^"\\])*")/)[1]);
  function literal(name, source, prefix = '') {
    const anchor = name + '=' + prefix;
    const start = source.indexOf(anchor);
    assert.ok(start >= 0, name);
    const structural = /"(?:\\.|[^"\\])*"|[{}\[\]]/g;
    const value = source.slice(start + anchor.length);
    let depth = 0;
    for (const token of value.matchAll(structural)) {
      if ('{['.includes(token[0])) depth++;
      if ('}]'.includes(token[0]) && --depth === 0) {
        return JSON.parse(value.slice(0, token.index + 1));
      }
    }
    throw new Error('Thiếu dữ liệu: ' + name);
  }
  const questions = literal('const QUESTIONS', bank, '(IS_VS?');
  const keys = literal('KEYS', bank, '(IS_VS?');
  const topics = literal('const FIXED_TOPICS', bank, '(IS_VS?');
  const explanations = literal('const EXPLANATIONS', bank, '(IS_VS?');
  const meta = literal('const META', bank);
  const aliases = literal('const VS_SOURCE_ALIASES', bank);
  const inline = literal('const VS_INLINE_SOURCE', bank);
  const images = literal('const sharedImages', html).map(uri => {
    assert.match(uri, /^data:image\/jpeg;base64,/);
    return Buffer.from(uri.split(',')[1], 'base64');
  });
  assert.equal(images.length, 12);
  const ids = new Set(questions.map(q => q.id));
  assert.equal(ids.size, 500);
  assert.equal(questions.length, 500);
  for (const table of [keys, topics, explanations, meta, aliases, inline]) {
    assert.ok(Object.keys(table).every(id => ids.has(Number(id))));
  }
  const records = questions.map((q, index) => {
    const key = keys[q.id] ?? null;
    assert.deepEqual(key, q.answer);
    const labels = new Set(q.options.map(option => option.label));
    assert.equal(labels.size, q.options.length);
    assert.ok([key].flat().every(label => label === null || labels.has(label)));
    const { topic, ...tier } = meta[q.id];
    assert.equal(topic, topics[q.id]);
    return {
      ...q, number: index + 1, classification: topic.split(' › '), ...tier,
      explanation: explanations[q.id] ?? null, sourceAlias: aliases[q.id] ?? null,
      sourceNote: inline[q.id] ?? null
    };
  });
  assert.deepEqual([1, 2, 3, 4].map(t => records.filter(q => q.tier === t).length), [273, 42, 73, 112]);
  assert.deepEqual(records.filter(q => q.answer === null).map(q => q.id), [340, 394]);
  const captions = [...bank.matchAll(/data-src="__CQ_IMAGE_(\d+)__" alt="([^"]+)"[\s\S]*?<figcaption><small>([^<]+)<\/small>[\s\S]*?<p>([^<]+)<\/p><\/details>/g)]
    .map(([, index, alt, reference, title], position) => {
      assert.equal(Number(index), position);
      return { alt, reference, title };
    });
  assert.equal(captions.length, images.length);
  return { records, images, captions };
}

const assets = ['index.html', 'style.css', 'app.mjs', 'domain.mjs', 'session.mjs', 'state.mjs', 'scopes.mjs',
  'persistence.mjs', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

export async function build(output) {
  const { records, images, captions } = await canonical();
  const directory = resolve(output, 'microbiology');
  await mkdir(resolve(directory, 'images'), { recursive: true });
  const files = new Map();
  for (const asset of assets) {
    files.set(asset, await readFile(new URL(asset, import.meta.url)));
  }
  files.set('questions.json', JSON.stringify({ records, captions }));
  images.forEach((image, index) => files.set('images/' + (index + 1) + '.jpg', image));
  const digest = createHash('sha256');
  for (const [name, bytes] of files) {
    digest.update(name).update(bytes);
    await writeFile(resolve(directory, name), bytes);
  }
  const worker = await readFile(new URL('sw.js', import.meta.url), 'utf8');
  const version = hash(digest.digest('hex') + worker).slice(0, 20);
  await writeFile(resolve(directory, 'sw.js'), worker
    .replace('__VERSION__', version).replace('__ASSETS__', JSON.stringify([...files.keys()])));
  console.log('500 câu, 388 trọng tâm, tầng 273/42/73/112, 12 JPEG · ' + version);
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  assert.ok(process.argv[2], 'node microbiology/build.mjs <thư mục đầu ra>');
  await build(process.argv[2]);
}
