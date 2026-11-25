import assert from 'node:assert/strict';

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const unique = values => new Set(values).size === values.length;
const known = (dictionary, key) => typeof key === 'string' && Object.hasOwn(dictionary, key);

export function indexBank(bank) {
  return new Map(bank.questions.map(question => [question.localId, question]));
}

export function selectIds(bank, { view = 'all', chapterId, topicId, tier, group, kind, hasKey, id, sessionIds } = {}) {
  assert(Object.hasOwn(bank.views, view), 'Unknown view');
  const byId = indexBank(bank);
  const tierSet = bank.views[view];
  return (sessionIds ?? [...byId.keys()]).filter(localId => {
    const question = byId.get(localId);
    if (!question) return false;
    const topic = bank.taxonomy.topics[question.topicId];
    return (tierSet === null || tierSet.includes(question.priority?.tier))
      && (chapterId === undefined || topic.chapterId === chapterId)
      && (topicId === undefined || question.topicId === topicId)
      && (tier === undefined || question.priority?.tier === tier)
      && (group === undefined || question.priority?.group === group)
      && (kind === undefined || question.kind === kind)
      && (hasKey === undefined || (question.answerKey !== null) === hasKey)
      && (id === undefined || localId === id);
  });
}

// Executable schema for the canonical bank. Cross-field checks are part of validation.
export function validateBank(bank, media, expected) {
  assert.equal(bank.schemaVersion, 1);
  assert(isText(bank.bankId) && isText(bank.datasetVersion));
  assert(isRecord(bank.source) && /^[a-f0-9]{64}$/.test(bank.source.sha256));
  assert(isRecord(bank.taxonomy.chapters) && isRecord(bank.taxonomy.topics));
  assert(isRecord(bank.taxonomy.tiers) && isRecord(bank.taxonomy.groups) && isRecord(bank.taxonomy.tags));
  for (const chapter of Object.values(bank.taxonomy.chapters)) assert(isText(chapter.label));
  const topicLabels = Object.values(bank.taxonomy.topics).map(topic => {
    assert(isText(topic.label) && known(bank.taxonomy.chapters, topic.chapterId));
    assert.equal(topic.legacyLabel, bank.taxonomy.chapters[topic.chapterId].label + ' › ' + topic.label);
    return topic.legacyLabel;
  });
  assert(unique(topicLabels), 'Ambiguous legacy topic labels');
  for (const group of Object.values(bank.taxonomy.groups)) {
    assert(known(bank.taxonomy.tiers, String(group.tier)));
  }
  assert(Array.isArray(bank.questions));
  assert(unique(bank.questions.map(question => question.localId)), 'Duplicate local ID');
  for (const q of bank.questions) {
    assert(Number.isSafeInteger(q.localId) && q.localId > 0);
    assert.equal(q.id, bank.bankId + ':' + q.localId);
    assert(isText(q.prompt) && typeof q.multi === 'boolean');
    assert(q.kind === null || isText(q.kind));
    assert(known(bank.taxonomy.topics, q.topicId), 'Missing topic for ' + q.id);
    assert(Array.isArray(q.options) && unique(q.options.map(option => option.label)));
    for (const option of q.options) assert(isText(option.label) && typeof option.text === 'string');
    if (q.answerKey !== null) {
      assert(Array.isArray(q.answerKey) && q.answerKey.length > 0 && unique(q.answerKey));
      assert(q.multi || q.answerKey.length === 1, 'Single question has multiple keys');
      assert(q.answerKey.every(label => q.options.some(option => option.label === label)), 'Invalid answer label');
    }
    if (q.priority !== null) {
      assert(known(bank.taxonomy.groups, q.priority.group));
      assert.equal(q.priority.tier, bank.taxonomy.groups[q.priority.group].tier);
      assert(isText(q.priority.reason) && typeof q.priority.flag === 'boolean');
    }
    assert(Array.isArray(q.tags) && unique(q.tags) && q.tags.every(tag => known(bank.taxonomy.tags, tag)));
    assert(q.explanation === null || isRecord(q.explanation));
    assert(q.sourceNumber === null || (Number.isSafeInteger(q.sourceNumber) && q.sourceNumber > 0));
    assert(q.sourceExcerpt === null || typeof q.sourceExcerpt === 'string');
  }
  assert.equal(bank.views.all, null);
  for (const [view, tiers] of Object.entries(bank.views)) {
    if (view === 'all') continue;
    assert(Array.isArray(tiers) && tiers.length && unique(tiers));
    assert(tiers.every(tier => known(bank.taxonomy.tiers, String(tier))));
    assert(bank.questions.every(q => q.priority !== null), 'Incomplete priority taxonomy');
  }
  assert(Array.isArray(bank.album) && unique(bank.album.map(entry => entry.assetId)));
  for (const entry of bank.album) {
    assert(known(media, entry.assetId));
    assert(isText(entry.caption) && isText(entry.title) && isText(entry.alt));
  }
  if (expected) {
    assert.deepEqual(bank.questions.map(q => q.localId), expected.ids);
    assert.deepEqual(bank.questions.filter(q => q.answerKey === null).map(q => q.localId), expected.missingKeys);
    assert.deepEqual(bank.questions.filter(q => !q.options.length).map(q => q.localId), expected.missingOptions);
    for (const [view, count] of Object.entries(expected.counts)) {
      assert.equal(selectIds(bank, { view }).length, count);
    }
  }
}

export function resolveLegacyId(identity, backupBank, localId) {
  if (!Number.isSafeInteger(localId)) return null;
  if (!Object.hasOwn(identity, backupBank)) return null;
  return identity[backupBank][String(localId)] ?? null;
}
