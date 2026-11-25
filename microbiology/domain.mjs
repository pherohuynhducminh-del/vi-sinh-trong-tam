export const DAY = 86_400_000;
export const fold = value => String(value).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[₀-₉]/g, digit => String(digit.charCodeAt(0) - 0x2080)).trim();
export const topicOf = q => q.classification.join(' › ');
const sections = {
  'Virus học': [
    ['Virus học đại cương', ['Cấu trúc và thành phần', 'Nuôi cấy tế bào', 'Nhân lên và hậu quả',
      'Miễn dịch và interferon', 'Phòng và điều trị', 'Chẩn đoán', 'Thực khuẩn thể', 'Đặc tính chung',
      'Biểu hiện bệnh và hướng mô', 'Biến đổi kháng nguyên']],
    ['Các nhóm virus', null]
  ],
  'Vi khuẩn học': [
    ['Vi khuẩn học đại cương', ['Cấu trúc, sinh lý, sinh trưởng', 'Bám dính và độc lực',
      'Di truyền và đột biến', 'Độc tố và yếu tố độc lực']],
    ['Các nhóm vi khuẩn', null]
  ],
  'Miễn dịch': [
    ['Xét nghiệm miễn dịch', ['Phản ứng huyết thanh', 'ELISA']],
    ['Miễn dịch và dự phòng', null]
  ],
  'Kháng sinh': [['Cơ chế và nhóm thuốc', null]],
  'Vi sinh đại cương': [['Kiểm soát nhiễm khuẩn', null]]
};

export function sectionOf(q) {
  const [chapter, topic] = q.classification;
  return sections[chapter]?.find(([, topics]) => !topics || topics.includes(topic))?.[0] ?? chapter;
}

export const labelsOf = q => q.options.map(option => option.label);
export const keyOf = q => [q.answer].flat().filter(label => label !== null);
export const own = (object, key) => Object.hasOwn(object, key);

export function validAnswer(q, labels) {
  return !!q && Array.isArray(labels) && labels.length > 0 &&
    (q.multi || labels.length === 1) && new Set(labels).size === labels.length &&
    labels.every(label => labelsOf(q).includes(label));
}

export function score(q, labels) {
  const key = keyOf(q);
  if (!key.length || !labels?.length) return null;
  return q.multi ? labels.length === key.length && key.every(label => labels.includes(label))
    : key.includes(labels[0]);
}

export function createBank(questions) {
  const byId = new Map(questions.map(q => [q.id, q]));
  const searchable = new Map(questions.map(q => [q.id,
    fold([q.question, ...q.options.map(option => option.text)].join(' '))]));
  function select(filters = {}, progress = { attempts: {}, marked: [] }, now = Date.now()) {
    const text = fold(filters.query ?? '');
    const exact = text.match(/^(?:(?:cau|id|#)\s*)?(\d+)$/);
    return questions.filter(q => {
      const attempt = progress.attempts[q.id];
      return (filters.bank !== 'focus' || q.tier < 4) &&
        (!filters.chapter || q.classification[0] === filters.chapter) &&
        (!filters.topic || topicOf(q) === filters.topic) &&
        (!filters.tier || String(q.tier) === filters.tier) &&
        (!filters.section || sectionOf(q) === filters.section) &&
        (!filters.subgroup || q.sub === filters.subgroup) &&
        (exact ? q.id === Number(exact[1]) : searchable.get(q.id).includes(text)) &&
        (filters.status !== 'marked' || progress.marked.includes(q.id)) &&
        (filters.status !== 'wrong' || attempt?.result === false) &&
        (filters.status !== 'due' || (attempt?.due != null && attempt.due <= now));
    });
  }
  return { questions, byId, select };
}

export function attemptFor(q, labels, previous, now) {
  const result = score(q, labels);
  const streak = result ? (previous?.streak ?? 0) + 1 : 0;
  const days = result ? Math.min(30, 2 ** Math.min(streak - 1, 5)) : 1;
  return { labels, result, streak, at: now, due: result === null ? null : now + days * DAY };
}

export const available = (records, progress) => records.filter(q => !progress.attempts[q.id]?.labels.length);

export function statistics(records, progress) {
  const attempts = records.map(q => progress.attempts[q.id]).filter(attempt => attempt?.labels.length);
  return {
    done: attempts.length,
    correct: attempts.filter(a => a.result === true).length,
    wrong: attempts.filter(a => a.result === false).length,
    known: records.filter(q => q.answer !== null).length
  };
}
