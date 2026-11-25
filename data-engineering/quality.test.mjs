import assert from 'node:assert/strict';
import { test } from 'node:test';
import { build } from './pipeline.mjs';
import { indexBank, resolveLegacyId, selectIds, validateBank } from './model.mjs';
import { hash, readSource } from './source.mjs';

const { banks: [hs, vs], files, assets, report } = build();
const source = readSource();
const media = JSON.parse(files['media.json']);
const identity = JSON.parse(files['identity.json']);

test('every active record preserves prompt, ordered options, key and taxonomy', () => {
  for (const [bank, raw] of [[hs, source.hs], [vs, source.vs]]) {
    assert.equal(bank.questions.length, raw.questions.length);
    for (const [index, q] of bank.questions.entries()) {
      const original = raw.questions[index];
      assert.equal(q.localId, original.id);
      assert.equal(q.prompt, original.question);
      assert.deepEqual(q.options, original.options);
      const key = raw.keys[original.id];
      assert.deepEqual(q.answerKey, key == null ? null : [key].flat());
      assert.deepEqual(q.explanation, raw.explanations[original.id] ?? null);
      assert.equal(bank.taxonomy.topics[q.topicId].legacyLabel, raw.topics[original.id]);
    }
  }
  assert.deepEqual(report.copyDifferencesVsThenHs.keys, [[407, 431, 443, 448, 450], []]);
});

test('views are complete and disjoint and topic intersections preserve session order', () => {
  const focus = selectIds(vs, { view: 'focus' });
  const supplement = selectIds(vs, { view: 'supplement' });
  assert.equal(selectIds(hs).length, 296);
  assert.equal(focus.length, 388);
  assert.equal(supplement.length, 112);
  assert.deepEqual([...focus, ...supplement].sort((a, b) => a - b), selectIds(vs));
  const { topicId } = indexBank(vs).get(497);
  assert.deepEqual(selectIds(vs, { view: 'focus', topicId, tier: 1, hasKey: true }), [497]);
  assert.equal(selectIds(vs, { view: 'focus', topicId }).length, 2);
  assert.deepEqual(selectIds(vs, { view: 'supplement', id: 497 }), []);
  assert.deepEqual(selectIds(vs, { id: 501 }), []);
  assert.deepEqual(selectIds(vs, { view: 'focus', sessionIds: [499, 501, 497] }), [499, 497]);
  assert.deepEqual(selectIds(vs, { view: 'focus', sessionIds: [497] }), [497]);
  assert.deepEqual(selectIds(vs, { view: 'focus', sessionIds: [] }), []);
  const singleton = indexBank(hs).get(32);
  assert.deepEqual(selectIds(hs, { topicId: singleton.topicId }), [32]);
  assert.deepEqual(selectIds(hs, { topicId: singleton.topicId, chapterId: 'unknown' }), []);
  assert.deepEqual(selectIds(hs, { topicId: 'unknown' }), []);
});

test('schema and relationship gate rejects malformed canonical rows', () => {
  for (const [mutate, error] of [
    [bank => { bank.questions[1] = bank.questions[0]; }, /Duplicate local ID/],
    [bank => { delete bank.questions[0].topicId; }, /Missing topic/],
    [bank => { bank.questions[0].answerKey = ['INVALID']; }, /Invalid answer label/],
    [bank => { bank.questions[0].priority.tier = 1; }, /4/],
    [bank => { bank.album[0].assetId = 'unknown'; }, /known/],
  ]) {
    const candidate = structuredClone(vs);
    mutate(candidate);
    assert.throws(() => validateBank(candidate, media), error);
  }
});

test('all legacy IDs round trip without mutating v1 and v2 state', () => {
  for (const bank of [hs, vs]) {
    for (const q of bank.questions) {
      assert.equal(resolveLegacyId(identity, bank.backupBank, q.localId), q.id);
      assert.equal(indexBank(bank).get(q.localId).id, q.id);
    }
  }
  for (const schema of [1, 2]) {
    const backup = {
      schema, bank: 'vi-sinh-495', answers: { 497: 'A' }, current: 497,
      examHistory: [{ score: 1, wrong: [498] }], marked: [497], wrong: [498],
      ...(schema === 2 && { learning: { 497: { due: 123, attempts: 1 } },
        planner: { date: '2026-11-30', minutes: 20 }, practice: { focus: { session: [497], current: 497 } } }),
    };
    const original = structuredClone(backup);
    assert.equal(resolveLegacyId(identity, backup.bank, backup.current), 'vi-sinh:497');
    assert.deepEqual(backup, original);
  }
  assert.equal(resolveLegacyId(identity, 'hoa-sinh-2-296', 497), null);
  assert.equal(resolveLegacyId(identity, 'vi-sinh-495', '497'), null);
  assert.equal(resolveLegacyId(identity, 'unknown', 1), null);
});

test('source key conflicts block integration without changing preserved keys', () => {
  assert.equal(report.structuralGate, 'pass');
  assert.equal(report.integrationGate, 'blocked');
  assert.deepEqual(report.conflictingKeys, { 'hoa-sinh-2': [[82, 83]], 'vi-sinh': [[424, 428]] });
});

test('manifest and media are deterministic and verify byte identity', () => {
  assert.deepEqual(build().files, files);
  const manifest = JSON.parse(files['manifest.json']);
  for (const [name, sha256] of Object.entries(manifest.sha256)) assert.equal(hash(files[name]), sha256);
  assert.equal(Object.keys(media).length, 12);
  for (const asset of Object.values(media)) {
    assert.equal(hash(assets[asset.path]), asset.sha256);
    assert.equal(assets[asset.path].length, asset.bytes);
    assert.deepEqual(assets[asset.path], Buffer.from(source.images[asset.sourceIndex].split(',')[1], 'base64'));
  }
});
