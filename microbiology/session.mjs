import { available } from './domain.mjs';

export const MODES = ['study', 'practice', 'exam', 'flash', 'wrong', 'due'];

function shuffle(ids, random) {
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function startSession(records, progress, {
  mode, bank, length, minutes = 30, remaining = false, randomized = false, now = Date.now(), random = Math.random
}) {
  let selected = mode === 'flash' ? records.filter(q => q.answer !== null) : records;
  if (remaining) {
    const pending = available(selected, progress);
    selected = pending.length === 1
      ? [...pending, ...selected.filter(q => q.id !== pending[0].id)] : pending;
  }
  let ids = selected.map(q => q.id);
  if (randomized || mode === 'exam') shuffle(ids, random);
  if (mode === 'exam') ids = ids.slice(0, length);
  if (!ids.length) return null;
  return {
    mode, bank, ids, position: 0, responses: {}, checked: [], phase: 'active',
    minutes, deadline: mode === 'exam' ? now + minutes * 60_000 : null
  };
}

export const currentId = session => session.ids[session.position];

export function navigate(session, position) {
  if (!Number.isInteger(position) || position < 0 || position >= session.ids.length) return session;
  return { ...session, position };
}

export function restart(session, now = Date.now()) {
  return { ...session, position: 0, responses: {}, checked: [], phase: 'active',
    deadline: session.mode === 'exam' ? now + session.minutes * 60_000 : null };
}
