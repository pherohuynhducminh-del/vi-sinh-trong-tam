import { score, validAnswer, own } from './domain.mjs';
import { MODES } from './session.mjs';

export const STORAGE = 'microbiology-rebuild:v1';
const LEGACY = 'mcq_vs_multi1';
const legacyPrefixes = ['', 'clinical-quiz:'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const dateNumber = value => Number.isSafeInteger(value) && value >= 0;
const bankName = value => ['all', 'focus'].includes(value);
const requireValid = condition => {
  if (!condition) throw new Error('Dữ liệu tiến độ Vi sinh không hợp lệ.');
};

export function emptyState() {
  return { schema: 3, bank: 'microbiology', selection: 'all',
    preferences: { theme: 'light', highlight: false },
    progress: { attempts: {}, marked: [], exams: [], plan: null }, session: null, paused: false };
}

function planOf(value) {
  if (!object(value)) return null;
  const date = value.date;
  const count = Number(value.count ?? 20);
  const minutes = Number(value.minutes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(count) || count < 1 || count > 500 ||
    !Number.isInteger(minutes) || minutes < 1 || minutes > 720) return null;
  return { date, count, minutes };
}

function validateSession(bank, s) {
  if (s === null) return;
  requireValid(object(s) && MODES.includes(s.mode) && bankName(s.bank) &&
    Array.isArray(s.ids) && s.ids.length > 0 && new Set(s.ids).size === s.ids.length &&
    s.ids.every(id => bank.byId.has(id) && (s.bank !== 'focus' || bank.byId.get(id).tier < 4)) &&
    Number.isInteger(s.position) && s.position >= 0 && s.position < s.ids.length &&
    object(s.responses) && Array.isArray(s.checked) && s.checked.every(id => s.ids.includes(id)) &&
    ['active', 'submitted'].includes(s.phase) && Number.isInteger(s.minutes) &&
    s.minutes >= 1 && s.minutes <= 180 &&
    (s.mode === 'exam' ? dateNumber(s.deadline) : s.deadline === null && s.phase === 'active'));
  for (const [id, labels] of Object.entries(s.responses)) {
    requireValid(String(Number(id)) === id && s.ids.includes(Number(id)) &&
      validAnswer(bank.byId.get(Number(id)), labels));
  }
}

function current(bank, state) {
  const { progress, preferences } = state;
  requireValid(state.bank === 'microbiology' && bankName(state.selection) &&
    typeof state.paused === 'boolean' && object(preferences) &&
    ['light', 'dark'].includes(preferences.theme) && typeof preferences.highlight === 'boolean' &&
    object(progress) && object(progress.attempts) && Array.isArray(progress.marked) &&
    progress.marked.every(id => bank.byId.has(id)) && Array.isArray(progress.exams) &&
    (progress.plan === null || planOf(progress.plan)));
  for (const [id, attempt] of Object.entries(progress.attempts)) {
    const q = bank.byId.get(Number(id));
    requireValid(q && String(Number(id)) === id && object(attempt) &&
      Array.isArray(attempt.labels) && (!attempt.labels.length || validAnswer(q, attempt.labels)) &&
      attempt.result === score(q, attempt.labels) && dateNumber(attempt.streak) &&
      dateNumber(attempt.at) && (attempt.due === null || dateNumber(attempt.due)));
  }
  requireValid(progress.exams.every(exam => object(exam) && dateNumber(exam.at) &&
    ['total', 'answered', 'known', 'correct'].every(key => dateNumber(exam[key])) &&
    exam.answered <= exam.total && exam.correct <= exam.known && exam.known <= exam.total));
  validateSession(bank, state.session);
  return state;
}

function compatibleLegacySession(bank, snapshot, variant, progress) {
  if (!object(snapshot) || !bankName(variant) || !Array.isArray(snapshot.session)) return null;
  const filters = snapshot.filters ?? {};
  const scope = filters.scope20;
  // Specialized legacy scopes used different orderings. Preserve progress and start afresh.
  if (scope && !['all', 'focus', 'target', 'core388', 'all500'].includes(scope)) return null;
  if (filters.formatFilter && filters.formatFilter !== 'all') return null;
  const query = filters.search === 'all' ? '' : filters.search;
  const rawTopic = snapshot.studyTopic || filters.topicFilter;
  const topic = rawTopic && rawTopic !== 'all' ? rawTopic : '';
  const status = filters.filter === 'marked' || filters.filter === 'wrong' ? filters.filter : '';
  if (filters.filter && !['all', 'marked', 'wrong'].includes(filters.filter)) return null;
  const records = bank.select({ bank: variant, topic, query, status }, progress);
  const allowed = new Set(records.map(q => q.id));
  let ids = snapshot.session.length
    ? [...new Set(snapshot.session)].filter(id => allowed.has(id)) : [...allowed];
  if (snapshot.session.length === 1 && !snapshot.navigationVersion && !query && !topic && !status &&
    ids.length === 1 && !own(progress.attempts, ids[0]) &&
    records.every(q => q.id === ids[0] || own(progress.attempts, q.id))) {
    const [remaining] = ids;
    ids = [remaining, ...records.map(q => q.id).filter(id => id !== remaining)];
  }
  if (!ids.length || !ids.includes(snapshot.current)) return null;
  const mode = snapshot.mode === 'review' ? 'wrong' : snapshot.mode === 'study' ? 'study' : 'practice';
  return { mode, bank: variant, ids, position: ids.indexOf(snapshot.current),
    responses: {}, checked: [], phase: 'active', deadline: null, minutes: 30 };
}

function legacy(bank, value) {
  requireValid(object(value.answers) && Array.isArray(value.marked));
  const state = emptyState();
  const { progress } = state;
  for (const [id, raw] of Object.entries(value.answers)) {
    const q = bank.byId.get(Number(id));
    const labels = Array.isArray(raw) ? raw : [raw];
    if (validAnswer(q, labels)) progress.attempts[id] = {
      labels, result: score(q, labels), at: 0, due: null, streak: 0
    };
  }
  for (const id of value.wrong ?? []) {
    const q = bank.byId.get(id);
    const raw = value.reviewAnswers?.[id];
    const labels = Array.isArray(raw) ? raw : [raw];
    if (validAnswer(q, labels) && score(q, labels) === false) {
      progress.attempts[id] = { labels, result: false, at: 0, due: null, streak: 0 };
    }
  }
  for (const [id, item] of Object.entries(value.learning ?? value.learning21 ?? {})) {
    if (!bank.byId.has(Number(id)) || !dateNumber(item?.due) || !dateNumber(item?.last) ||
      !dateNumber(item?.streak)) continue;
    const prior = progress.attempts[id] ?? { labels: [], result: null };
    progress.attempts[id] = { ...prior, due: item.due, at: item.last, streak: item.streak };
  }
  progress.marked = [...new Set(value.marked)].filter(id => bank.byId.has(id));
  progress.exams = (Array.isArray(value.examHistory) ? value.examHistory : [])
    .filter(entry => dateNumber(Date.parse(entry?.at)) && ['total', 'answered', 'known', 'score']
      .every(key => dateNumber(entry[key])) && entry.answered <= entry.total &&
      entry.score <= entry.known && entry.known <= entry.total)
    .map(entry => ({ at: Date.parse(entry.at), total: entry.total, answered: entry.answered,
      known: entry.known, correct: entry.score }));
  progress.plan = planOf(value.planner ?? value.planner22);
  state.preferences = { theme: value.preferences?.theme === 'dark' ? 'dark' : 'light',
    highlight: value.preferences?.highlight === true };
  const preferred = value.preferences?.focus ? 'focus' : 'all';
  const studyBank = value.study?.filters?.scope20
    ? (['focus', 'target', 'core388'].includes(value.study.filters.scope20) ? 'focus' : 'all') : null;
  const snapshots = [
    [preferred, value.practice?.[preferred === 'focus' ? 'focus' : 'normal']],
    [studyBank, value.study],
    [preferred === 'focus' ? 'all' : 'focus', value.practice?.[preferred === 'focus' ? 'normal' : 'focus']]
  ];
  for (const [variant, snapshot] of snapshots) {
    state.session = compatibleLegacySession(bank, snapshot, variant, progress);
    if (state.session) break;
  }
  state.selection = state.session?.bank ?? preferred;
  state.paused = !!state.session;
  return current(bank, state);
}

export function importBackup(bank, value) {
  requireValid(object(value));
  if (value.schema === 3) return current(bank, value);
  requireValid([1, 2].includes(value.schema) && value.bank === 'vi-sinh-495');
  return legacy(bank, value);
}

export function storageAdapter(storage, bank) {
  function read(key) {
    const raw = storage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  }
  return {
    load() {
      try {
        const state = read(STORAGE);
        if (state !== null) return { state: importBackup(bank, state), notice: '' };
      } catch {
        return { state: emptyState(), notice: 'Không đọc được bản lưu hiện tại. Có thể nhập bản sao lưu.' };
      }
      for (const prefix of legacyPrefixes) {
        try {
          const progress = read(prefix + LEGACY);
          if (!progress) continue;
          const optional = key => {
            try { return read(prefix + key); } catch { return null; }
          };
          const state = legacy(bank, {
            ...progress,
            preferences: optional(LEGACY + '_prefs'),
            study: optional('vs_focus_resume_v1'),
            practice: {
              normal: optional(LEGACY + '_practice23_normal'),
              focus: optional(LEGACY + '_practice23_focus')
            }
          });
          return { state, notice: 'Đã đọc tiến độ từ bản Vi sinh trước.' };
        } catch {
          // Try the other supported same-origin namespace.
        }
      }
      return { state: emptyState(), notice: '' };
    },
    save(state) {
      storage.setItem(STORAGE, JSON.stringify(state));
    }
  };
}
