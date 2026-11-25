import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { canonical } from '../build.mjs';
import { createBank, score, statistics, DAY } from '../domain.mjs';
import { currentId, navigate, startSession } from '../session.mjs';
import { emptyState, importBackup, storageAdapter, STORAGE } from '../persistence.mjs';
import { transition } from '../state.mjs';

const { records, images, captions } = await canonical();
const bank = createBank(records);
const focus = bank.select({ bank: 'focus' });
const start = (mode, records = bank.questions, options = {}) => transition(bank, emptyState(), {
  type: 'start', records, options: { bank: 'all', mode, ...options }
}, 0);
const focusAnswers = Object.fromEntries(focus.filter(q => q.id !== 497).map(q => [q.id, q.options[0].label]));

test('canonical data, exact order, keys, image bytes and captions', () => {
  assert.equal(records.length, 500);
  assert.equal(focus.length, 388);
  assert.deepEqual([1, 2, 3, 4].map(t => bank.select({ tier: String(t) }).length), [273, 42, 73, 112]);
  assert.equal(records.every((q, i) => q.number === i + 1 && bank.byId.get(q.id) === q), true);
  assert.deepEqual(records.filter(q => q.answer === null).map(q => q.id), [340, 394]);
  assert.equal(images.length, 12);
  assert.equal(captions.length, 12);
  assert.equal(new Set(images.map(i => createHash('sha256').update(i).digest('hex'))).size, 12);
  assert.ok(images.every(i => i.readUInt16BE(0) === 0xffd8));
  assert.equal(score(bank.byId.get(340), ['A']), null);
  assert.equal(bank.byId.get(424).answer, 'D');
  assert.equal(bank.byId.get(428).answer, 'A');
});

test('domain filters and search preserve ID, source order and valid intersections', () => {
  const q = bank.byId.get(497);
  assert.deepEqual(bank.select({ query: 'Câu 497' }), [q]);
  assert.deepEqual(bank.select({ query: 'gen ma hoa p24' }), [q]);
  assert.deepEqual(bank.select({ chapter: 'Virus học', topic: 'Vi khuẩn học › Cúm' }), []);
  assert.equal(bank.select({ bank: 'focus', topic: 'Virus học › Sởi' }).length, 1);
  assert.deepEqual(bank.select({ tier: '4', bank: 'focus' }), []);
});

test('session sizes, boundaries, filters and one-question remaining regression', () => {
  const progress = importBackup(bank, { schema: 1, bank: 'vi-sinh-495', answers: focusAnswers, marked: [] }).progress;
  const s = startSession(focus, progress, { mode: 'practice', bank: 'focus', remaining: true });
  assert.equal(s.ids.length, 388);
  assert.equal(currentId(s), 497);
  assert.notEqual(currentId(navigate(s, 1)), 497);
  assert.equal(navigate(s, -1), s);
  assert.equal(start('practice').session.ids.length, 500);
  assert.equal(start('practice', bank.select({ query: 'id 497' })).session.ids.length, 1);
  assert.equal(start('study', []).session, null);
});

test('practice feedback, spaced schedule, marking, pause-compatible round trip and flashcard rating', () => {
  const q = bank.byId.get(497);
  let state = start('practice', [q]);
  state = transition(bank, state, { type: 'answer', labels: ['A'] }, 10);
  assert.equal(state.progress.attempts[q.id].due, 10 + DAY);
  assert.equal(state.progress.attempts[q.id].result, false);
  state = transition(bank, state, { type: 'mark', id: q.id }, 11);
  assert.deepEqual(state.progress.marked, [q.id]);
  state = transition(bank, state, { type: 'restart' }, 12);
  state = transition(bank, state, { type: 'answer', labels: ['C'] }, 13);
  assert.equal(statistics([q], state.progress).correct, 1);
  state = transition(bank, state, { type: 'start', records: [q], options: { mode: 'flash', bank: 'all' } });
  state = transition(bank, state, { type: 'recall', remembered: false }, 14);
  assert.equal(state.progress.attempts[q.id].result, true);
  assert.equal(state.progress.attempts[q.id].due, 14 + DAY);
  assert.deepEqual(importBackup(bank, JSON.parse(JSON.stringify(state))), state);
});

test('exam response isolation, timeout, submission and cancel', () => {
  const q = bank.byId.get(497);
  let state = start('exam', [q], { length: 1, minutes: 1 });
  state = transition(bank, state, { type: 'answer', labels: ['C'] }, 40);
  assert.deepEqual(state.progress.attempts, {});
  state = transition(bank, state, { type: 'submit' }, 60_000);
  assert.equal(state.session.phase, 'submitted');
  assert.deepEqual(state.progress.exams, [{ at: 60_000, total: 1, known: 1, correct: 1, answered: 1 }]);
  assert.equal(transition(bank, state, { type: 'submit' }, 60_000), state);
  assert.equal(transition(bank, state, { type: 'cancel' }, 60_000).session, null);
});

test('legacy namespaces and V2 migration distinguish exact search from remaining shortcut', () => {
  const sample = { current: 497, session: [497], submitted: false, filters: { search: 'all', scope20: 'focus' } };
  const progress = { schema: 2, bank: 'vi-sinh-495', answers: focusAnswers, marked: [497],
    preferences: { focus: true }, practice: { focus: sample } };
  const old = importBackup(bank, progress);
  assert.equal(old.session.ids.length, 388);
  assert.equal(currentId(old.session), 497);
  const exact = importBackup(bank, { ...progress, practice: { focus: {
    ...sample, filters: { ...sample.filters, search: '497' }
  } } });
  assert.deepEqual(exact.session.ids, [497]);
  const data = new Map([
    ['clinical-quiz:mcq_vs_multi1', JSON.stringify(progress)],
    ['clinical-quiz:mcq_vs_multi1_practice23_focus', JSON.stringify(sample)],
    ['clinical-quiz:mcq_vs_multi1_prefs', '{"focus":true}']
  ]);
  const store = storageAdapter({ getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) }, bank);
  assert.deepEqual(store.load().state, old);
  store.save(old);
  assert.deepEqual(store.load().state, old);
  data.set(STORAGE, '{');
  assert.match(store.load().notice, /Không đọc/);
  assert.throws(() => importBackup(bank, { ...progress, bank: 'hoa-sinh-2-296' }));
  assert.throws(() => importBackup(bank, { ...old, session: { ...old.session, ids: [999] } }));
});

test('priority matrix partitions every ID and all layer combinations preserve order', async () => {
  const { canonical } = await import('../build.mjs');
  const { learningTree, inTiers, coverage, tierBreakdown } = await import('../scopes.mjs');
  const { records } = await canonical();
  const matrix = learningTree(records).flatMap(c => c.sections.flatMap(s => s.topics));
  const ids = matrix.flatMap(node => node.records.map(q => q.id));
  assert.equal(ids.length, 500);
  assert.equal(new Set(ids).size, 500);
  assert.deepEqual(coverage.map(tiers => inTiers(records, tiers).length), [273, 315, 388, 500]);
  for (const { records: questions } of matrix) {
    const tiers = tierBreakdown(questions, { attempts: {} });
    assert.equal(tiers.reduce((sum, tier) => sum + tier.total, 0), questions.length);
    for (let mask = 0; mask < 16; mask++) {
      const selected = [1, 2, 3, 4].filter(tier => mask & (1 << (tier - 1)));
      const result = inTiers(questions, selected);
      assert.equal(result.length, tiers.filter(t => selected.includes(t.tier)).reduce((sum, t) => sum + t.total, 0));
      assert.deepEqual(result.map(q => q.id), questions.filter(q => selected.includes(q.tier)).map(q => q.id));
    }
  }
});

test('guards UTF-8 text and preserves the reviewed Vietnamese and scientific notation', async () => {
  const { unexpectedText } = await import('../text-quality.mjs');
  const { fold } = await import('../domain.mjs');
  for (const example of ['Nhieãm', 'vaø', 'dÞch', 'Tiáº¿ng Viá»‡t', '\uFFFD', '\uF062', 'Tiê\u0301ng']) {
    assert.ok(unexpectedText(example), example);
  }
  for (const example of ['Tiếng Việt', '37°C', 'β - lactamase', 'H₂O₂', 'N₀', '12 µm']) {
    assert.equal(unexpectedText(example), null, example);
  }
  assert.equal(bank.byId.get(257).question, 'Nhiễm trùng cơ hội là gì ?');
  assert.equal(bank.byId.get(258).question, 'Tiên lượng AIDS chủ yếu dựa vào yếu tố nào ?');
  assert.equal(bank.byId.get(259).question, 'HIV thuộc nhóm :');
  assert.equal(bank.byId.get(266).options[1].text, 'Cơ');
  assert.match(bank.byId.get(217).question, /CO₂.*37°C/);
  assert.deepEqual(bank.byId.get(288).question.match(/\d+°C/g), ['30°C', '36°C', '40°C', '46°C']);
  assert.equal(fold('H₂O₂'), fold('H2O2'));
  assert.ok(bank.select({ query: 'h2o2' }).some(q => q.id === 200));
  assert.ok(bank.select({ query: 'nhiem trung co hoi' }).some(q => q.id === 257));
});
