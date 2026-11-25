export const DAY = 86_400_000;
export const fold = value => String(value).toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
export const topicOf = q => q.classification.join(' › ');
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
        (!filters.section || q.sub === filters.section) &&
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

export const available = (records, progress) => records.filter(q => !own(progress.attempts, q.id));

export function statistics(records, progress) {
  const attempts = records.map(q => progress.attempts[q.id]).filter(Boolean);
  return {
    done: attempts.length,
    correct: attempts.filter(a => a.result === true).length,
    wrong: attempts.filter(a => a.result === false).length,
    known: records.filter(q => q.answer !== null).length
  };
}
