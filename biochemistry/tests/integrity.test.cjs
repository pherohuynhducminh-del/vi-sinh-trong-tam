const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const read = file => fs.readFileSync(path.join(__dirname, '..', file));
test('RC7 bank is byte-identical and chapter assignments match the original', () => {
  const bank = read('bank.js');
  assert.equal(createHash('sha256').update(bank).digest('hex'),
    '4b639eb045ab5b6c8941debd7c1568b4541ac265580ec172e8e5f3227cb1d6e8');
  const context = vm.createContext({});
  vm.runInContext(bank.toString() + '\n' + read('domain.js'), context);
  const snapshot = vm.runInContext('JSON.stringify(QUESTIONS.map(q => [q, getKey(q), topicFor(q)]))', context);
  const questions = JSON.parse(snapshot);
  assert.equal(questions.length, 296);
  assert.equal(questions.filter(([, key]) => key !== null).length, 288);
  if (process.env.RC7_ORIGINAL) {
    const original = fs.readFileSync(process.env.RC7_ORIGINAL, 'utf8');
    const script = original.match(/<script>([\s\S]*?)<\/script>/)[1];
    const baseline = vm.createContext({});
    vm.runInContext(script.split('const STORAGE=')[0], baseline);
    assert.equal(snapshot, vm.runInContext(
      'JSON.stringify(QUESTIONS.map(q => [q, KEYS[q.id] ?? null, topicFor(q)]))', baseline
    ));
  }
});
