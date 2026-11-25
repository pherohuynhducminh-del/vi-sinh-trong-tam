const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const hashes = require('./rc7-hashes.json');

const read = name => readFileSync(path.join(__dirname, '..', name));
const sha256 = data => createHash('sha256').update(data).digest('hex');

test('RC7 extraction matches recorded checksums and keeps the complete bank', () => {
  for (const [name, expected] of Object.entries(hashes.assets)) {
    assert.equal(sha256(read(name)), expected, name);
  }
  const context = vm.createContext({});
  const bank = read('bank.js').toString();
  const domain = read('domain.js').toString();
  vm.runInContext(bank + '\n' + domain, context);
  const snapshot = vm.runInContext(
    'JSON.stringify(QUESTIONS.map(q => [q, getKey(q), topicFor(q)]))', context
  );
  const rows = JSON.parse(snapshot);
  assert.equal(rows.length, 296);
  assert.equal(new Set(rows.map(([q]) => q.id)).size, 296);
  assert.equal(rows.filter(([, key]) => key !== null).length, 288);
  assert.ok(rows.every(([, , topic]) => topic.includes(' › ')));
  if (process.env.RC7_ORIGINAL) {
    const original = readFileSync(process.env.RC7_ORIGINAL);
    assert.equal(sha256(original), hashes.source);
    const script = original.toString().match(/<script>([\s\S]*?)<\/script>/)[1];
    const originalContext = vm.createContext({});
    vm.runInContext(script.split("const STORAGE=")[0], originalContext);
    const originalSnapshot = vm.runInContext(
      'JSON.stringify(QUESTIONS.map(q => [q, KEYS[q.id] ?? null, topicFor(q)]))',
      originalContext
    );
    assert.equal(snapshot, originalSnapshot);
  }
  assert.doesNotMatch(read('index.html').toString(), /<iframe\b|\bsrcdoc=/i);
});
