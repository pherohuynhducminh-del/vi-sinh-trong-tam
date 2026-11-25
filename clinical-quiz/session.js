(() => {
  const storedBank = IS_VS ? 'vi-sinh-495' : 'hoa-sinh-2-296';
  const practiceKeys = IS_VS ? ['normal', 'focus'] : ['normal'];
  const studyKey = IS_VS ? 'vs_focus_resume_v1' : 'hs2_focus_resume_v1';
  const practiceKey = variant => STORAGE + '_practice23_' + variant;
  window.addEventListener('pagehide', () => {
    if (S.mode !== 'practice' || !document.body.classList.contains('session-running')) return;
    const filters = Object.fromEntries(['filter', 'topicFilter', 'formatFilter', 'search', 'scope20']
      .filter(id => $(id)).map(id => [id, $(id).value]));
    const snapshot = { current: S.current, session: S.session, submitted: S.submitted, filters };
    try { localStorage.setItem(practiceKey(STRATEGIC ? 'focus' : 'normal'), JSON.stringify(snapshot)); } catch {}
  });

  const validId = id => Number.isInteger(id) && Boolean(qBy(id));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const requireValid = condition => { if (!condition) throw new Error('invalid backup'); };

  let pendingExamSave = false;
  window.prepareBankExit = next => {
    if (S.examActive) {
      if (!confirm('Nộp bài thi hiện tại và chuyển ngân hàng?')) return false;
      submitExam();
      pendingExamSave = true;
    }
    if (pendingExamSave) {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(S));
        pendingExamSave = false;
      } catch {
        alert('Không thể lưu bài thi. Thử chuyển ngân hàng lại để lưu kết quả.');
        return false;
      }
      return true;
    }
    return !window.requestPracticeExit23(next);
  };

  document.querySelector('[data-mode="study"]').addEventListener('click', () => {
    if (S.examActive) return;
    for (const id of ['filter', 'formatFilter', 'topicFilter']) $(id).value = 'all';
    $('search').value = '';
  }, { capture: true });

  const expand = $('expand26');
  const expandPractice = expand.onclick;
  expand.onclick = () => {
    if (S.mode === 'study') {
      S.studyTopic = null;
      S.session = [];
      S.submitted = false;
      $('topicFilter').value = 'all';
      render();
      return;
    }
    if (S.mode === 'practice') expandPractice();
  };
  const renderSession = render;
  render = function () {
    renderSession();
    expand.textContent = S.mode === 'study' ? 'Về danh mục chủ đề' : 'Tiếp tục các câu trong phạm vi';
    if (S.mode === 'review' || (S.mode === 'study' && !S.studyTopic)) expand.hidden = true;
  };

  // Keep the original controls reachable within the existing statistics screen.
  const controls = document.createElement('div');
  controls.className = 'actions';
  controls.append($('exportProgress'), $('importProgress'));
  $('statsArea').append(controls);
  for (const id of ['adaptive21', 'start22']) {
    const details = $(id)?.closest('details');
    if (details) $('statsArea').append(details);
  }

  function readSnapshot(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  function validateSession(value, study = false) {
    if (value == null) return null;
    requireValid(object(value) && validId(value.current) && Array.isArray(value.session)
      && value.session.length <= QUESTIONS.length && value.session.every(validId)
      && typeof value.submitted === 'boolean' && object(value.filters));
    const filters = {};
    for (const key of ['filter', 'topicFilter', 'formatFilter', 'search', 'scope20']) {
      if (typeof value.filters[key] === 'string' && value.filters[key].length <= 1000) {
        filters[key] = value.filters[key];
      }
    }
    const result = { current: value.current, session: [...new Set(value.session)], submitted: value.submitted, filters };
    if (study) {
      requireValid(['practice', 'study', 'review'].includes(value.mode));
      requireValid(value.studyTopic == null || topicList().includes(value.studyTopic));
      Object.assign(result, { mode: value.mode, studyTopic: value.studyTopic ?? null });
    }
    return result;
  }

  function validateLearning(value) {
    requireValid(object(value));
    for (const [id, item] of Object.entries(value)) {
      requireValid(String(Number(id)) === id && validId(Number(id)) && object(item)
        && ['streak', 'attempts', 'last', 'due'].every(key => Number.isSafeInteger(item[key]) && item[key] >= 0)
        && item.streak <= item.attempts);
    }
    return value;
  }

  function validatePlanner(value) {
    if (value == null) return undefined;
    requireValid(object(value) && typeof value.date === 'string'
      && (!value.date || /^\d{4}-\d{2}-\d{2}$/.test(value.date))
      && ['number', 'string'].includes(typeof value.minutes)
      && String(value.minutes).length <= 16 && Number.isFinite(Number(value.minutes)));
    return { date: value.date, minutes: value.minutes };
  }

  function backup() {
    return {
      schema: 2, bank: storedBank, exportedAt: new Date().toISOString(),
      answers: S.answers, marked: S.marked, wrong: S.wrong, reviewAnswers: S.reviewAnswers || {},
      examHistory: S.examHistory || [], current: S.current, preferences: P,
      learning: S.learning21 || {}, planner: S.planner22 ?? null,
      study: readSnapshot(studyKey),
      practice: Object.fromEntries(practiceKeys.map(key => [key, readSnapshot(practiceKey(key))]))
    };
  }

  $('exportProgress').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup(), null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = IS_VS ? 'Vi_sinh_backup.json' : 'MCQ_Hoa_Sinh_2_backup.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  function prepareImport(data) {
    requireValid(object(data));
    const version2 = data.schema === 2;
    if (version2) requireValid(data.bank === storedBank && object(data.practice));
    const { preferences, ...progress } = validateBackup(version2 ? { ...data, schema: 1 } : data);
    const next = {
      ...S, ...progress, mode: 'practice', session: [], studyTopic: null, submitted: false,
      examActive: false, examDone: false, examDeadline: null, examIds: [], examAnswers: {}
    };
    const changes = new Map();
    if (version2) {
      next.learning21 = validateLearning(data.learning);
      next.planner22 = validatePlanner(data.planner);
      changes.set(studyKey, validateSession(data.study, true));
      for (const key of practiceKeys) changes.set(practiceKey(key), validateSession(data.practice[key]));
    }
    changes.set(STORAGE, next);
    changes.set(PREF, preferences);
    return changes;
  }

  function storeImport(changes) {
    const written = [];
    try {
      for (const [key, value] of changes) {
        const old = localStorage.getItem(key);
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, JSON.stringify(value));
        written.push([key, old]);
      }
    } catch {
      for (const [key, old] of written.reverse()) {
        try {
          if (old === null) localStorage.removeItem(key);
          else localStorage.setItem(key, old);
        } catch {}
      }
      return false;
    }
    return true;
  }

  $('backupFile').onchange = async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file || S.examActive) return;
    if (file.size > 5000000) return alert('File sao lưu quá lớn.');
    let changes;
    try { changes = prepareImport(JSON.parse(await file.text())); }
    catch { return alert('File backup không hợp lệ. Tiến độ hiện tại được giữ nguyên.'); }
    if (!window.frameElement?.isConnected || S.examActive || !confirm('Khôi phục sẽ thay thế tiến độ hiện tại. Bạn có muốn tiếp tục?')) return;
    if (!storeImport(changes)) return alert('Không thể ghi tiến độ vào bộ nhớ trình duyệt.');
    alert('Đã khôi phục tiến độ.');
    parent.location.reload();
  };
  render();
})();
