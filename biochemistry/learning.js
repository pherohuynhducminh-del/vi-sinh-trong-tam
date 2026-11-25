const LEARNING_MODES = ['study', 'review'];
const LEARNING_ACTIONS = {
  all: 'Học',
  random: 'Học ngẫu nhiên',
  unanswered: 'Chưa làm',
  redo: 'Học lại toàn bộ',
  done: 'Làm lại câu đã làm',
  wrong: 'Ôn câu sai',
  marked: 'Câu đánh dấu',
  nokey: 'Câu chưa có đáp án',
  custom: 'Theo bộ lọc'
};
const chapterFor = q => topicFor(q).split(' › ')[0];
const learningActive = () => LEARNING_MODES.includes(S.mode) && S.learningOpen && !!S.learning;
const learningDraft = q => S.learning.drafts[q.id];
const attempted = q => hasAnswer(S.answers[q.id]) || S.wrong.includes(q.id) || S.read.includes(q.id);

function scopeQuestions(scope = 'all') {
  return QUESTIONS.filter(q => scope === 'all' || topicFor(q) === scope || chapterFor(q) === scope);
}

function matchesLearningAction(q, action) {
  switch (action) {
    case 'unanswered': return !attempted(q);
    case 'done': return attempted(q);
    case 'wrong': return S.wrong.includes(q.id);
    case 'marked': return S.marked.includes(q.id);
    case 'nokey': return getKey(q) === null;
    default: return true;
  }
}

function learningProgress(questions) {
  const total = questions.length;
  const done = questions.filter(attempted).length;
  const wrong = questions.filter(q => S.wrong.includes(q.id)).length;
  const right = questions.filter(q => !S.wrong.includes(q.id) && scoreSaved(q) === true).length;
  const noKey = questions.filter(q => getKey(q) === null).length;
  return { total, done, right, wrong, unanswered: total - done, noKey };
}

function newLearningSession(ids, scope, action, mode = 'study') {
  return { ids, scope, action, mode, current: ids[0], drafts: {}, checked: [], revealed: [] };
}

function recordLearningResult(q, answer) {
  const result = scoreAnswer(q, answer);
  if (hasAnswer(answer)) S.answers[q.id] = answer;
  else if (!S.read.includes(q.id)) S.read.push(q.id);
  if (result === false) {
    const history = S.wrongHistory[q.id] ||= { wrong: 0, corrected: 0 };
    history.wrong++;
    (history.attempts ||= []).push({
      at: new Date().toISOString(),
      answer,
      source: S.mode === 'exam' ? 'exam' : 'learning'
    });
    if (!S.wrong.includes(q.id)) S.wrong.push(q.id);
    S.reviewAnswers[q.id] = answer;
  } else if (result === true && S.wrong.includes(q.id)) {
    const history = S.wrongHistory[q.id] ||= { wrong: 1, corrected: 0 };
    history.corrected++;
    S.wrong = S.wrong.filter(id => id !== q.id);
    delete S.reviewAnswers[q.id];
  }
}

function migrateLearning(saved) {
  S.read ||= [];
  S.reviewAnswers ||= {};
  S.wrongHistory ||= {};
  for (const id of S.wrong) {
    const history = S.wrongHistory[id] ||= { wrong: 1, corrected: 0 };
    if (history.attempts == null && hasAnswer(S.reviewAnswers[id])) {
      history.attempts = [{ at: null, answer: S.reviewAnswers[id], source: 'legacy' }];
    }
  }
  if (saved?.learningVersion === 1) return;
  const oldMode = saved?.mode ?? (saved ? 'practice' : null);
  if (['practice', 'study', 'review'].includes(oldMode)) {
    const scope = S.studyTopic || 'all';
    const action = oldMode === 'review' ? 'wrong' : 'all';
    const mode = oldMode === 'review' ? 'review' : 'study';
    const validIds = S.session.filter(id => qBy(id));
    const ids = oldMode === 'review' ? S.wrong.slice() :
      validIds.length ? validIds : scopeQuestions(scope).map(q => q.id);
    if (ids.length && (oldMode !== 'study' || validIds.length || S.studyTopic)) {
      S.learning = newLearningSession(ids, scope, action, mode);
      if (ids.includes(S.current)) S.learning.current = S.current;
      const answer = S.reviewAnswers[S.learning.current] ?? S.answers[S.learning.current];
      if (hasAnswer(answer)) S.learning.drafts[S.learning.current] = answer;
      if (hasAnswer(answer) && (saved.submitted || (P.instant && !qBy(S.learning.current).multi))) {
        S.learning.checked.push(S.learning.current);
      }
    }
    S.mode = mode;
    S.learningOpen = !!S.learning;
  }
  S.learningVersion = 1;
}
