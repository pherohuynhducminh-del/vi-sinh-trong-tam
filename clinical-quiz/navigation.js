(() => {
  if (!IS_VS || !STRATEGIC) return;
  const control = $('scope20');
  const practiceKey = STORAGE + '_practice23_focus';
  const studyKey = 'vs_focus_resume_v1';
  const currentScope = value => sorted(QUESTIONS.map(q => q.id).filter(id => {
    const group = META[id];
    if (value === 'all') return true;
    if (value === 'focus') return group.tier < 4;
    return value.startsWith('4') && value.length > 1 ? group.sub === value : String(group.tier) === value;
  }));
  const prioritized = (scopeIds, first) => [first, ...scopeIds.filter(id => id !== first)];
  const write = localStorage.setItem.bind(localStorage);
  let repaired = 0;
  let source = 'initial';

  // Give shortcuts their own intent before the legacy launch listener starts a session.
  const next = $('next20');
  next.onclick = () => {
    if (S.examActive) return;
    const scopeIds = currentScope(control.value);
    const unanswered = scopeIds.filter(id => !hasAnswer(S.answers[id]));
    if (!unanswered.length) return alert('Đã hoàn thành phạm vi này');
    source = 'unanswered-shortcut';
    for (const id of ['filter', 'topicFilter', 'formatFilter']) $(id).value = 'all';
    $('search').value = '';
    S.mode = 'practice';
    S.studyTopic = null;
    S.current = unanswered[0];
    S.session = unanswered.length === 1 ? prioritized(scopeIds, S.current) : unanswered;
    S.submitted = false;
    save();
    render();
  };

  function parse(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function migrate(key) {
    const snapshot = parse(key);
    if (!snapshot || snapshot.navigationVersion === 1 || snapshot.session?.length !== 1) return;
    if (key === studyKey && snapshot.mode !== 'practice') return;
    const filters = snapshot.filters;
    if (!filters || !['', 'all', undefined].includes(filters.search)) return;
    if (['filter', 'topicFilter', 'formatFilter'].some(id => filters[id] && filters[id] !== 'all')) return;
    // The old shared resume record did not store strategic scope. Leave ambiguous records alone.
    const value = filters.scope20;
    if (![...control.options].some(option => option.value === value)) return;
    const scopeIds = currentScope(value);
    const id = snapshot.session[0];
    if (id !== snapshot.current || scopeIds.length < 2 || !scopeIds.includes(id)) return;
    if (scopeIds.some(other => other !== id && !hasAnswer(S.answers[other]))) return;
    try {
      write(key, JSON.stringify({ ...snapshot, session: prioritized(scopeIds, id), navigationVersion: 1 }));
      repaired++;
    } catch {}
  }

  $('sessionStart').addEventListener('click', () => {
    if (S.mode === 'practice') source = 'practice-setup';
  }, { capture: true });
  for (const [id, name] of [['adaptive21', 'adaptive'], ['start22', 'planner'], ['catalog20', 'catalog']]) {
    $(id).addEventListener('click', () => { source = name; }, { capture: true });
  }

  migrate(practiceKey);
  migrate(studyKey);
  localStorage.setItem = (key, value) => {
    if (key === practiceKey || key === studyKey) {
      const snapshot = JSON.parse(value);
      value = JSON.stringify({ ...snapshot, navigationVersion: 1 });
    }
    write(key, value);
  };
  // The legacy practice resume button checks storage on render.
  render();
  window.quizNavigationDiagnostics = () => ({
    source, migratedSnapshots: repaired, strategicScope: control.value, scopeSize: currentScope(control.value).length,
    savedPracticeSize: parse(practiceKey)?.session?.length ?? null,
    savedStudyMode: parse(studyKey)?.mode ?? null
  });
})();
