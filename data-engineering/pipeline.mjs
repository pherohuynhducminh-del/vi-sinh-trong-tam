import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { hash, readSource, sourceHash, sourceSha } from './source.mjs';
import { selectIds, validateBank } from './model.mjs';

const version = '1.0.0';
const specifications = [
  { source: 'hs', bankId: 'hoa-sinh-2', backupBank: 'hoa-sinh-2-296', count: 296,
    missingKeys: [73, 213, 217, 230, 232, 236, 246, 296], missingOptions: [213, 230, 236] },
  { source: 'vs', bankId: 'vi-sinh', backupBank: 'vi-sinh-495', count: 500,
    missingKeys: [340, 394], missingOptions: [], focus: 388 },
];
const json = value => JSON.stringify(value) + '\n';
const taxonomyId = (kind, label) => kind + '-' + hash(label).slice(0, 24);
const groups = Object.fromEntries(['1', '2', '3', '4A', '4B', '4C', '4D']
  .map(group => [group, { tier: Number(group[0]) }]));

function normalize(input, spec, album, media) {
  const { bankId, backupBank, count, focus } = spec;
  const ids = new Set(input.questions.map(q => q.id));
  assert.equal(ids.size, input.questions.length, 'Duplicate source ID');
  for (const field of ['keys', 'topics', 'explanations', 'tiers', 'aliases', 'excerpts']) {
    for (const key of Object.keys(input[field] ?? {})) {
      assert(ids.has(Number(key)) && String(Number(key)) === key, 'Orphan ' + field + ' ' + key);
    }
  }
  const chapters = {};
  const topics = {};
  const questions = input.questions.map(raw => {
    const id = raw.id;
    const key = input.keys[id] ?? null;
    const legacyLabel = input.topics[id];
    assert.equal(typeof legacyLabel, 'string', 'Missing source classification ' + id);
    const [chapter, label, ...remaining] = legacyLabel.split(' › ');
    assert(chapter && label && !remaining.length, 'Invalid taxonomy path ' + id);
    const chapterId = taxonomyId('chapter', chapter);
    const topicId = taxonomyId('topic', legacyLabel);
    chapters[chapterId] = { label: chapter };
    topics[topicId] = { chapterId, label, legacyLabel };
    const metadata = input.tiers?.[id];
    if (focus) assert(metadata && metadata.topic === legacyLabel, 'Priority topic conflict ' + id);
    assert.deepEqual(raw.answer, focus ? key : null, 'Unexpected inline answer ' + id);
    assert(Array.isArray(raw.options) && typeof raw.multi === 'boolean');
    return {
      id: bankId + ':' + id,
      localId: id,
      sourceNumber: input.aliases?.[id] ?? null,
      prompt: raw.question,
      options: raw.options,
      answerKey: key === null ? null : Array.isArray(key) ? key : [key],
      multi: focus ? false : raw.multi || Array.isArray(key) || /chọn nhiều/i.test(raw.question),
      kind: raw.kind ?? null,
      topicId,
      priority: metadata ? { tier: metadata.tier, group: metadata.sub, flag: metadata.flag, reason: metadata.reason } : null,
      tags: [],
      explanation: input.explanations[id] ?? null,
      sourceExcerpt: input.excerpts?.[id] ?? null,
    };
  });
  const bank = {
    schemaVersion: 1,
    datasetVersion: version,
    bankId,
    backupBank,
    source: { path: 'nkhkjjhkkjjh.html', commit: sourceSha, sha256: sourceHash, frame: spec.source },
    views: focus ? { all: null, focus: [1, 2, 3], supplement: [4] } : { all: null },
    taxonomy: { chapters, topics, groups: focus ? groups : {},
      tiers: focus ? { 1: {}, 2: {}, 3: {}, 4: {} } : {}, tags: {} },
    album,
    questions,
  };
  validateBank(bank, media, {
    ids: Array.from({ length: count }, (_, i) => i + 1),
    missingKeys: spec.missingKeys, missingOptions: spec.missingOptions,
    counts: focus ? { all: count, focus, supplement: count - focus } : { all: count },
  });
  return bank;
}

function duplicateGroups(bank) {
  const groups = new Map();
  for (const q of bank.questions) {
    const content = json([q.prompt, q.options]);
    if (!groups.has(content)) groups.set(content, []);
    groups.get(content).push(q.localId);
  }
  return [...groups.values()].filter(ids => ids.length > 1);
}

export function build() {
  const source = readSource();
  const media = {};
  const assets = {};
  assert.equal(source.images.length, 12);
  const [album, redundantAlbum] = source.albums;
  assert.deepEqual(album, redundantAlbum);
  assert.deepEqual(album.map(entry => entry.index), source.images.map((_, index) => index));
  const albumRefs = album.map(({ index, ...labels }) => {
    const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(source.images[index]);
    assert(match, 'Invalid image data URL');
    const bytes = Buffer.from(match[1], 'base64');
    assert.equal(bytes.toString('base64'), match[1]);
    assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8');
    assert.equal(bytes.subarray(-2).toString('hex'), 'ffd9');
    const sha256 = hash(bytes);
    const assetId = 'jpeg-' + sha256;
    const path = 'assets/' + sha256 + '.jpg';
    media[assetId] = { path, mime: 'image/jpeg', sha256, bytes: bytes.length, sourceIndex: index };
    assets[path] = bytes;
    return { assetId, ...labels };
  });
  const banks = specifications.map(spec => normalize(source[spec.source], spec, albumRefs, media));
  const identity = Object.fromEntries(banks.map(bank => [bank.backupBank,
    Object.fromEntries(bank.questions.map(q => [q.localId, q.id]))]));
  const indexes = Object.fromEntries(banks.map(bank => [bank.bankId, {
    views: Object.fromEntries(Object.keys(bank.views).map(view => [view, selectIds(bank, { view })])),
    topics: Object.fromEntries(Object.keys(bank.taxonomy.topics).map(topicId =>
      [topicId, selectIds(bank, { topicId })])),
    chapters: Object.fromEntries(Object.keys(bank.taxonomy.chapters).map(chapterId =>
      [chapterId, selectIds(bank, { chapterId })])),
  }]));
  const vs = banks[1];
  const q497 = vs.questions.find(q => q.localId === 497);
  const conflictingKeys = Object.fromEntries(banks.map(bank => {
    const byId = new Map(bank.questions.map(q => [q.localId, q]));
    return [bank.bankId, duplicateGroups(bank).filter(ids =>
      new Set(ids.map(id => json(byId.get(id).answerKey))).size > 1)];
  }));
  const blockers = Object.values(conflictingKeys).some(groups => groups.length)
    ? ['Identical prompts and ordered options have conflicting keys. Source adjudication required.'] : [];
  const report = {
    structuralGate: 'pass',
    integrationGate: blockers.length ? 'blocked' : 'pass',
    blockers,
    conflictingKeys, datasetVersion: version, sourceCommit: sourceSha, sourceSha256: sourceHash,
    copyDifferencesVsThenHs: source.copies,
    priorityCounts: Object.fromEntries([1, 2, 3, 4].map(tier => [tier, selectIds(vs, { tier }).length])),
    banks: Object.fromEntries(banks.map(bank => [bank.bankId, {
      views: Object.fromEntries(Object.entries(indexes[bank.bankId].views).map(([key, ids]) => [key, ids.length])),
      missingKeys: selectIds(bank, { hasKey: false }),
      missingOptions: bank.questions.filter(q => !q.options.length).map(q => q.localId),
      explanationCount: bank.questions.filter(q => q.explanation !== null).length,
      duplicatePromptAndOptions: duplicateGroups(bank),
      topics: Object.fromEntries(Object.entries(indexes[bank.bankId].topics).map(([topicId, ids]) =>
        [bank.taxonomy.topics[topicId].legacyLabel, ids.length])),
      singletonTopics: Object.fromEntries(Object.entries(indexes[bank.bankId].topics)
        .filter(([, ids]) => ids.length === 1)
        .map(([topicId, ids]) => [bank.taxonomy.topics[topicId].legacyLabel, ids[0]])),
    }])),
    mediaCount: Object.keys(media).length,
    id497: {
      bankId: vs.bankId, priority: q497.priority, topic: vs.taxonomy.topics[q497.topicId].legacyLabel,
      topicIds: selectIds(vs, { topicId: q497.topicId }),
      focusTopicIds: selectIds(vs, { view: 'focus', topicId: q497.topicId }),
      focusIdLookup: selectIds(vs, { view: 'focus', id: 497 }),
      focusSavedSingleton: selectIds(vs, { view: 'focus', sessionIds: [497] }),
    },
  };
  const files = {
    ...Object.fromEntries(banks.map(bank => [bank.bankId + '.json', json(bank)])),
    'media.json': json(media), 'identity.json': json(identity), 'indexes.json': json(indexes),
    'quality.json': JSON.stringify(report, null, 2) + '\n',
  };
  files['manifest.json'] = json({ schemaVersion: 1, datasetVersion: version, sourceCommit: sourceSha,
    sha256: Object.fromEntries(Object.entries(files).map(([path, content]) => [path, hash(content)])) });
  return { files, assets, banks, report };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const [mode, path] = process.argv.slice(2);
  assert((mode === '--verify' || mode === '--export' || mode === '--gate') && path, 'Use --verify DIR, --gate DIR or --export NEW_DIR');
  const { files, assets, report } = build();
  if (mode !== '--export') {
    for (const [name, content] of Object.entries(files)) {
      assert.equal(readFileSync(join(path, name), 'utf8'), content, 'Stale dataset file ' + name);
    }
    for (const [name, content] of Object.entries(assets)) {
      assert.deepEqual(readFileSync(join(path, name)), content, 'Stale asset ' + name);
    }
    if (mode === '--gate' && report.integrationGate === 'blocked') {
      for (const blocker of report.blockers) process.stderr.write(blocker + '\n');
      process.exitCode = 1;
    }
  } else {
    mkdirSync(path);
    mkdirSync(join(path, 'assets'));
    for (const [name, bytes] of Object.entries(assets)) writeFileSync(join(path, name), bytes, { flag: 'wx' });
    for (const [name, content] of Object.entries(files)) writeFileSync(join(path, name), content, { flag: 'wx' });
  }
}
