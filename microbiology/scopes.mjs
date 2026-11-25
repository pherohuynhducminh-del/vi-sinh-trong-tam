import { sectionOf, statistics, topicOf } from './domain.mjs';

const chapters = ['Vi sinh đại cương', 'Vi khuẩn học', 'Virus học', 'Miễn dịch', 'Kháng sinh'];
const sections = ['Kiểm soát nhiễm khuẩn', 'Vi khuẩn học đại cương', 'Các nhóm vi khuẩn',
  'Virus học đại cương', 'Các nhóm virus', 'Miễn dịch và dự phòng', 'Xét nghiệm miễn dịch',
  'Cơ chế và nhóm thuốc'];

function group(records, classify, order = []) {
  const groups = new Map();
  for (const record of records) {
    const name = classify(record);
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(record);
  }
  return [...new Set([...order, ...groups.keys()])].filter(name => groups.has(name))
    .map(name => ({ name, records: groups.get(name) }));
}

export function learningTree(records) {
  return group(records, q => q.classification[0], chapters).map(chapter => ({
    ...chapter, sections: group(chapter.records, sectionOf, sections).map(section => ({
      ...section, topics: group(section.records, topicOf)
    }))
  }));
}

export function scopeStatistics(records, progress) {
  const scores = statistics(records, progress);
  return { ...scores, unseen: records.length - scores.done, unkeyed: records.length - scores.known };
}

export function scopeRecords(records, strategy, progress, now = Date.now()) {
  if (strategy === 'wrong') return records.filter(q => progress.attempts[q.id]?.result === false);
  if (strategy === 'due') return records.filter(q => {
    const due = progress.attempts[q.id]?.due;
    return due != null && due <= now;
  });
  return records;
}

export const coverage = [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4]];
export const inTiers = (records, tiers) => records.filter(q => tiers.includes(q.tier));

export function tierBreakdown(records, progress) {
  return coverage.at(-1).map(tier => {
    const subset = inTiers(records, [tier]);
    return { tier, total: subset.length, ...scopeStatistics(subset, progress) };
  });
}

export function rankedTopics(nodes, criterion, progress) {
  const ranked = nodes.map(node => {
    const tier1 = inTiers(node.records, [1]).length;
    const stats = scopeStatistics(node.records, progress);
    const values = { tier1, focus: node.records.filter(q => q.tier < 4).length,
      ratio: tier1 / node.records.length, unseen: stats.unseen, wrong: stats.wrong };
    return { ...node, value: values[criterion] };
  });
  return ranked.sort((a, b) => b.value - a.value);
}
