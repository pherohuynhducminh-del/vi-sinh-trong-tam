import { attemptFor, keyOf, score, validAnswer } from './domain.mjs';
import { currentId, navigate, restart, startSession } from './session.mjs';

function record(progress, q, labels, now) {
  return { ...progress, attempts: { ...progress.attempts,
    [q.id]: attemptFor(q, labels, progress.attempts[q.id], now) } };
}

export function submitExam(bank, state, now) {
  const session = state.session;
  if (session?.mode !== 'exam' || session.phase !== 'active') return state;
  let progress = state.progress;
  let known = 0;
  let correct = 0;
  for (const id of session.ids) {
    const q = bank.byId.get(id);
    const labels = session.responses[id];
    if (q.answer !== null) known++;
    if (score(q, labels) === true) correct++;
    if (labels?.length) progress = record(progress, q, labels, now);
  }
  const entry = { at: now, total: session.ids.length, answered: Object.keys(session.responses).length,
    known, correct };
  return { ...state, session: { ...session, phase: 'submitted' },
    progress: { ...progress, exams: [...progress.exams, entry] } };
}

export function transition(bank, state, event, now = Date.now()) {
  const { session, progress } = state;
  if (event.type === 'mark') {
    if (!bank.byId.has(event.id)) return state;
    const marked = progress.marked.includes(event.id)
      ? progress.marked.filter(id => id !== event.id) : [...progress.marked, event.id];
    return { ...state, progress: { ...progress, marked } };
  }
  if (event.type === 'start') {
    return { ...state, session: startSession(event.records, progress, { ...event.options, now }) };
  }
  if (!session) return state;
  if (session.mode === 'exam' && session.phase === 'active' && now >= session.deadline) {
    return submitExam(bank, state, now);
  }
  if (event.type === 'submit') return submitExam(bank, state, now);
  if (event.type === 'move') return { ...state, session: navigate(session, event.position) };
  if (event.type === 'cancel') return { ...state, session: null };
  if (event.type === 'restart') return { ...state, session: restart(session, now) };
  const id = currentId(session);
  const q = bank.byId.get(id);
  if (session.phase !== 'active' || session.checked.includes(id)) return state;
  if (event.type === 'answer') {
    if (!validAnswer(q, event.labels)) return state;
    const updated = { ...state, session: { ...session,
      responses: { ...session.responses, [id]: event.labels } } };
    return session.mode !== 'exam' && !q.multi
      ? transition(bank, updated, { type: 'check' }, now) : updated;
  }
  if (event.type === 'clear') {
    const responses = { ...session.responses };
    delete responses[id];
    return { ...state, session: { ...session, responses } };
  }
  if (event.type === 'recall' && session.mode === 'flash') {
    const labels = keyOf(q);
    const result = event.remembered;
    const previous = progress.attempts[id];
    const attempt = attemptFor(q, labels, result ? previous : null, now);
    if (!result) {
      // A self-rating schedules review independently of multiple-choice accuracy.
      attempt.result = previous?.result ?? null;
      attempt.labels = previous?.labels ?? [];
      attempt.streak = 0;
    }
    return { ...state, progress: { ...progress, attempts: { ...progress.attempts, [id]: attempt } },
      session: { ...session, checked: [...session.checked, id] } };
  }
  if (event.type === 'check' && session.mode !== 'exam' && session.responses[id]?.length) {
    return { ...state, progress: record(progress, q, session.responses[id], now),
      session: { ...session, checked: [...session.checked, id] } };
  }
  return state;
}
