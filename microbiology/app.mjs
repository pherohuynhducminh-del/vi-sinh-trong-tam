import { createBank, fold, keyOf, score, statistics, topicOf } from './domain.mjs';
import { currentId } from './session.mjs';
import { transition } from './state.mjs';
import { importBackup, storageAdapter } from './persistence.mjs';

const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sorted = values => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'vi'));
const modes = {
  study: 'Học theo chủ đề', practice: 'Luyện tập', exam: 'Thi thử',
  flash: 'Flashcard', wrong: 'Làm lại câu sai', due: 'Ôn ngắt quãng'
};
const filterIds = ['query', 'chapter', 'topic', 'tier', 'section', 'status'];
const pageSize = 25;

async function main() {
  const response = await fetch('./questions.json');
  if (!response.ok) throw Error('Không tải được ngân hàng câu hỏi.');
  const { records, captions } = await response.json();
  const bank = createBank(records);
  const store = storageAdapter({
    getItem: key => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value)
  }, bank);
  const saved = store.load();
  let state = saved.state;
  let view = state.session && !state.paused ? 'session' : 'bank';
  let notice = saved.notice;
  let page = 0;
  let allAnswers = false;
  let flashBack = false;
  let matches = [];
  let pointer = null;

  const filters = () => Object.fromEntries([
    ['bank', state.selection], ...filterIds.map(id => [id, $(id).value])
  ]);

  function save(next, { atomic = false } = {}) {
    try {
      store.save(next);
      state = next;
      notice = '';
      return true;
    } catch {
      if (!atomic) state = next;
      notice = atomic ? 'Không thể lưu bản nhập. Tiến độ hiện tại được giữ nguyên.'
        : 'Không thể lưu vào trình duyệt. Hãy xuất bản sao lưu trước khi đóng trang.';
      return false;
    }
  }

  function send(event) {
    const next = transition(bank, state, event);
    if (next !== state) save(next);
  }

  function focusTitle() {
    document.querySelector('#' + view + '-view h1')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function moveTo(next) {
    if (next !== 'session' && state.session && !state.paused) save({ ...state, paused: true });
    view = next;
    render();
    focusTitle();
  }

  function openSession(mode, selected, options = {}) {
    if (!selected.length) {
      notice = 'Không có câu phù hợp cho chế độ này.';
      render();
      return;
    }
    if (state.session && state.session.phase === 'active' &&
      !confirm('Thay thế phiên đã lưu bằng phiên mới? Tiến độ đã ghi nhận được giữ lại.')) return;
    const next = transition(bank, state, {
      type: 'start', records: selected, options: { mode, bank: state.selection, ...options }
    });
    if (!next.session) {
      notice = 'Không có câu phù hợp cho chế độ này.';
      render();
      return;
    }
    save({ ...next, paused: false });
    flashBack = false;
    moveTo('session');
  }

  function choices(id, values, label = value => value) {
    const node = $(id);
    const previous = node.value;
    node.replaceChildren(new Option('Tất cả', ''), ...values.map(value => new Option(label(value), value)));
    node.value = values.includes(previous) ? previous : '';
  }

  function renderFilters() {
    const available = bank.select({ bank: state.selection });
    choices('chapter', sorted(available.map(q => q.classification[0])));
    const chapter = $('chapter').value;
    const topicRecords = available.filter(q => !chapter || q.classification[0] === chapter);
    choices('topic', sorted(topicRecords.map(topicOf)), value => chapter ? value.split(' › ')[1] : value);
    choices('tier', sorted(available.map(q => String(q.tier))), value => 'Tầng ' + value);
    choices('section', sorted(available.map(q => q.sub)), value => 'Nhóm ' + value);
  }

  function answerLine(q) {
    const labels = keyOf(q);
    if (!labels.length) return '<p class="muted">Chưa có đáp án xác minh</p>';
    return '<p class="answer">Đáp án ' + labels.map(label => {
      const option = q.options.find(item => item.label === label);
      return esc(label) + ' · ' + esc(option.text);
    }).join(' / ') + '</p>';
  }

  function highlight(text, q) {
    if (!state.preferences.highlight) return esc(text);
    const tokenize = value => [...value.matchAll(/[\p{L}\p{M}\p{N}]+/gu)];
    const common = new Set(['tinh', 'chat', 'sau', 'day', 'trong', 'duoc', 'nhung', 'nhieu',
      'khong', 'nhat', 'nao', 'hoac', 'theo', 'thuoc', 'cung', 'loai', 'nhom', 'dung']);
    const stems = new Set(tokenize(q.question).map(token => fold(token[0]))
      .filter(word => word.length >= 3 && !common.has(word)));
    let end = 0;
    let output = '';
    for (const token of tokenize(text)) {
      output += esc(text.slice(end, token.index));
      const word = esc(token[0]);
      output += stems.has(fold(token[0])) ? '<mark>' + word + '</mark>' : word;
      end = token.index + token[0].length;
    }
    return output + esc(text.slice(end));
  }

  function renderBank() {
    renderFilters();
    matches = bank.select(filters(), state.progress);
    $('match-count').textContent = matches.length + ' câu phù hợp';
    $('remaining').disabled = !matches.some(q => !state.progress.attempts[q.id]?.labels.length);
    for (const button of document.querySelectorAll('[data-mode]')) {
      const mode = button.dataset.mode;
      button.disabled = !matches.some(q => (mode !== 'flash' || q.answer !== null) &&
        (mode !== 'wrong' || state.progress.attempts[q.id]?.result === false) &&
        (mode !== 'due' || due(q)));
    }
    $('exam-start').disabled = !matches.length;
    $('exam-count').max = Math.max(1, matches.length);
    if (+$('exam-count').value > matches.length && matches.length) $('exam-count').value = matches.length;
    const totalPages = Math.ceil(matches.length / pageSize);
    page = Math.min(page, Math.max(0, totalPages - 1));
    const shown = allAnswers ? matches : matches.slice(page * pageSize, (page + 1) * pageSize);
    $('results').innerHTML = shown.length ? shown.map(q => `
      <article class="result">
        <button class="open-question" data-open="${q.id}">Câu ${q.number} · ${esc(q.question)}</button>
        <p class="muted">${esc(topicOf(q))} · Tầng ${q.tier}${state.progress.marked.includes(q.id) ? ' · Đã đánh dấu' : ''}</p>
        ${allAnswers ? answerLine(q) : ''}
      </article>`).join('') : '<p>Không tìm thấy câu hỏi. Hãy thay đổi bộ lọc.</p>';
    $('result-pages').innerHTML = allAnswers || totalPages <= 1 ? '' :
      `<button data-page="${page - 1}" ${page === 0 ? 'disabled' : ''}>Trang trước</button>
       <span>Trang ${page + 1} / ${totalPages}</span>
       <button data-page="${page + 1}" ${page + 1 === totalPages ? 'disabled' : ''}>Trang sau</button>`;
    $('show-answers').textContent = allAnswers ? 'Ẩn toàn bộ đáp án' : 'Hiện toàn bộ đáp án';
    $('show-answers').setAttribute('aria-pressed', String(allAnswers));
    const s = state.session;
    $('resume-area').innerHTML = s ? `<div class="panel row split">
      <span>${esc(modes[s.mode])} · ${s.bank === 'focus' ? 'Trọng tâm' : 'Toàn bộ'} · ${s.position + 1}/${s.ids.length}</span>
      <button class="primary" data-command="resume">${s.phase === 'submitted' ? 'Xem lại bài thi' : 'Tiếp tục phiên đã lưu'}</button>
    </div>` : '';
  }

  function due(q) {
    const date = state.progress.attempts[q.id]?.due;
    return date != null && date <= Date.now();
  }

  function renderSession() {
    const s = state.session;
    const q = bank.byId.get(currentId(s));
    const labels = s.responses[q.id] ?? [];
    const exam = s.mode === 'exam';
    const flash = s.mode === 'flash';
    const marked = state.progress.marked.includes(q.id);
    const judged = s.checked.includes(q.id) || s.phase === 'submitted';
    const reveal = judged || (flash && flashBack);
    const result = score(q, labels);
    const summary = exam && s.phase === 'submitted' ? examSummary(s) : '';
    const explanation = reveal && q.explanation ? `<details><summary>${esc(q.explanation.title)}</summary>
      <p>${esc(q.explanation.why)}</p><p>${esc(q.explanation.caution)}</p></details>` : '';
    $('session-view').innerHTML = `
      <div class="row split"><h1 tabindex="-1">${modes[s.mode]}</h1><button data-command="pause">Lưu và thoát</button></div>
      ${summary}
      <article class="panel question-panel">
        <div class="row split">
          <div id="position">Câu ${s.position + 1} / ${s.ids.length} · ID ${q.id}</div>
          ${exam && !judged ? '<strong id="timer" aria-label="Thời gian còn lại"></strong>' : ''}
        </div>
        <progress aria-label="Vị trí trong phiên" value="${s.position + 1}" max="${s.ids.length}"></progress>
        <p class="muted">${esc(topicOf(q))} · Tầng ${q.tier}</p>
        <h2 class="question">${esc(q.question)}</h2>
        ${flash ? '' : `<p class="muted">${q.multi ? 'Chọn các đáp án phù hợp' : 'Chọn một đáp án'}</p>
          <div class="options">${q.options.map(option => {
            const active = labels.includes(option.label);
            const answer = reveal && keyOf(q).includes(option.label);
            const text = !exam || judged ? highlight(option.text, q) : esc(option.text);
            return `<button class="option${answer ? ' is-answer' : ''}" data-answer="${esc(option.label)}" aria-pressed="${active}" ${judged ? 'disabled' : ''}>${esc(option.label)}. ${text}</button>`;
          }).join('')}</div>`}
        ${flash && !reveal ? '<button class="primary" data-command="flip">Lật thẻ</button>' : ''}
        ${flash && reveal && !judged ? '<div class="actions"><button data-command="forgot">Chưa nhớ</button><button class="primary" data-command="remembered">Đã nhớ</button></div>' : ''}
        ${flash && judged ? '<p class="feedback">Đã lên lịch ôn thẻ này.</p>' : ''}
        ${q.multi && !exam && !flash && !judged ? `<button class="primary" data-command="check" ${labels.length ? '' : 'disabled'}>Kiểm tra đáp án</button>` : ''}
        ${judged && !flash && labels.length ? `<p class="feedback ${result === false ? 'incorrect' : ''}">${result === null ? 'Chưa chấm vì thiếu khóa' : result ? 'Chính xác' : 'Chưa đúng'}</p>` : ''}
        ${reveal ? answerLine(q) + explanation : ''}
        <div class="actions">
          <button data-command="mark" aria-pressed="${marked}">${marked ? 'Bỏ đánh dấu' : 'Đánh dấu câu'}</button>
          ${exam && !judged && labels.length ? '<button data-command="clear">Bỏ lựa chọn</button>' : ''}
        </div>
      </article>
      <div class="panel actions">
        <button data-command="previous" ${s.position ? '' : 'disabled'}>Trước</button>
        <button class="primary" data-command="next" ${s.position + 1 < s.ids.length ? '' : 'disabled'}>Tiếp</button>
        <form id="jump-form" class="actions"><input aria-label="Vị trí cần đến" id="jump-position" type="number" min="1" max="${s.ids.length}" value="${s.position + 1}" required><button>Đến câu</button></form>
        ${exam && s.phase === 'active' ? '<button data-command="submit">Nộp bài</button>' : ''}
        <button data-command="restart">Khởi động lại</button>
        <button data-command="cancel">Hủy phiên</button>
      </div>`;
    tick();
  }

  function examSummary(s) {
    const known = s.ids.filter(id => bank.byId.get(id).answer !== null).length;
    const correct = s.ids.filter(id => score(bank.byId.get(id), s.responses[id]) === true).length;
    return `<div class="panel" role="status"><strong>Kết quả thi thử</strong><p>${correct}/${known} câu đúng có khóa · ${Object.keys(s.responses).length}/${s.ids.length} câu đã trả lời</p></div>`;
  }

  function tick() {
    const s = state.session;
    if (s?.mode !== 'exam' || s.phase !== 'active') return;
    const seconds = Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000));
    if (!seconds) {
      send({ type: 'submit' });
      render();
      return;
    }
    if ($('timer')) $('timer').textContent =
      Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }

  function renderProgress() {
    const rows = [
      ['Toàn bộ', bank.questions],
      ['Trọng tâm', bank.select({ bank: 'focus' })],
      ...[1, 2, 3, 4].map(tier => ['Tầng ' + tier, bank.select({ tier: String(tier) })])
    ];
    $('statistics').innerHTML = '<div class="panel metrics">' + rows.map(([name, questions]) => {
      const s = statistics(questions, state.progress);
      return `<div class="metric"><strong>${s.done}/${questions.length}</strong>${name}<br>
        <span>${s.correct} đúng · ${s.wrong} sai</span></div>`;
    }).join('') + '</div>';
    const plan = state.progress.plan;
    if (plan) {
      $('plan-date').value = plan.date;
      $('plan-count').value = plan.count;
      $('plan-minutes').value = plan.minutes;
    }
    $('plan-summary').textContent = plan
      ? `Ngày thi ${plan.date} · ${plan.count} câu, ${plan.minutes} phút/ngày · ${bank.questions.filter(due).length} câu đến hạn ôn.`
      : 'Chưa có kế hoạch học.';
    $('run-plan').disabled = !plan;
    $('exam-history').innerHTML = state.progress.exams.length
      ? '<ul>' + state.progress.exams.slice().reverse().map(exam =>
        `<li>${esc(new Date(exam.at).toLocaleString('vi-VN'))} · ${exam.correct}/${exam.known} đúng · ${exam.answered}/${exam.total} đã làm</li>`).join('') + '</ul>'
      : '<p>Chưa có bài thi.</p>';
  }

  function render() {
    if (view === 'session' && !state.session) view = 'bank';
    document.documentElement.dataset.theme = state.preferences.theme;
    $('theme').textContent = state.preferences.theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
    $('theme').setAttribute('aria-pressed', String(state.preferences.theme === 'dark'));
    $('highlight').setAttribute('aria-pressed', String(state.preferences.highlight));
    $('notice').textContent = notice;
    for (const section of ['bank', 'session', 'progress', 'album']) {
      $(section + '-view').hidden = section !== view;
      $(section + '-view').querySelector('h1')?.setAttribute('tabindex', '-1');
    }
    for (const tab of document.querySelectorAll('[data-view]')) {
      tab.setAttribute('aria-current', tab.dataset.view === view ? 'page' : 'false');
    }
    for (const button of document.querySelectorAll('[data-bank]')) {
      button.setAttribute('aria-pressed', String(button.dataset.bank === state.selection));
    }
    if (view === 'bank') renderBank();
    if (view === 'session') renderSession();
    if (view === 'progress') renderProgress();
  }

  function navigate(position, direction) {
    if (position < 0 || position >= state.session.ids.length || position === state.session.position) return;
    flashBack = false;
    send({ type: 'move', position });
    render();
    const nextControl = document.querySelector('[data-command="' + direction + '"]:not(:disabled)');
    (nextControl ?? document.querySelector('#session-view h1'))?.focus({ preventScroll: true });
  }

  const commands = {
    resume() {
      save({ ...state, paused: false });
      moveTo('session');
    },
    pause() { moveTo('bank'); },
    previous() { navigate(state.session.position - 1, 'previous'); },
    next() { navigate(state.session.position + 1, 'next'); },
    flip() { flashBack = true; render(); document.querySelector('[data-command="forgot"]')?.focus(); },
    forgot() { send({ type: 'recall', remembered: false }); render(); },
    remembered() { send({ type: 'recall', remembered: true }); render(); },
    mark() { send({ type: 'mark', id: currentId(state.session) }); render(); },
    clear() { send({ type: 'clear' }); render(); },
    check() { send({ type: 'check' }); render(); },
    submit() {
      if (confirm('Nộp bài thi?')) {
        send({ type: 'submit' });
        render();
        focusTitle();
      }
    },
    restart() {
      if (confirm('Khởi động lại phiên từ đầu?')) {
        send({ type: 'restart' });
        flashBack = false;
        render();
        focusTitle();
      }
    },
    cancel() {
      if (confirm('Hủy phiên? Tiến độ đã ghi nhận được giữ lại.')) {
        send({ type: 'cancel' });
        moveTo('bank');
      }
    }
  };

  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const data = button.dataset;
    if (data.view) moveTo(data.view);
    if (data.bank && data.bank !== state.selection) {
      save({ ...state, selection: data.bank });
      page = 0;
      render();
    }
    if (data.mode) {
      const selected = data.mode === 'wrong'
        ? matches.filter(q => state.progress.attempts[q.id]?.result === false)
        : data.mode === 'due' ? matches.filter(due) : matches;
      openSession(data.mode, selected);
    }
    if (data.open) openSession('study', [bank.byId.get(Number(data.open))]);
    if (data.page !== undefined) {
      page = +data.page;
      renderBank();
      $('match-count').scrollIntoView({ block: 'start' });
    }
    if (data.command) commands[data.command]();
    if (data.answer) {
      const s = state.session;
      const q = bank.byId.get(currentId(s));
      const active = s.responses[q.id] ?? [];
      const labels = !q.multi ? [data.answer] : active.includes(data.answer)
        ? active.filter(label => label !== data.answer) : [...active, data.answer];
      send(labels.length ? { type: 'answer', labels } : { type: 'clear' });
      render();
      const option = [...document.querySelectorAll('[data-answer]')]
        .find(candidate => candidate.dataset.answer === data.answer && !candidate.disabled);
      (option ?? document.querySelector('[data-command="next"]:not(:disabled)') ??
        document.querySelector('[data-command="mark"]'))?.focus({ preventScroll: true });
    }
    if (data.image) {
      const zoom = $('zoom');
      const image = zoom.querySelector('img');
      image.src = './images/' + data.image + '.jpg';
      image.alt = captions[Number(data.image) - 1].alt;
      zoom.showModal();
    }
  });

  for (const id of filterIds) {
    $(id).addEventListener(id === 'query' ? 'input' : 'change', () => {
      if (id === 'chapter') $('topic').value = '';
      page = 0;
      renderBank();
    });
  }
  $('reset').onclick = () => {
    for (const id of filterIds) $(id).value = '';
    page = 0;
    renderBank();
  };
  $('show-answers').onclick = () => { allAnswers = !allAnswers; renderBank(); };
  $('remaining').onclick = () => openSession('practice', matches, { remaining: true });
  $('theme').onclick = () => {
    save({ ...state, preferences: { ...state.preferences, theme: state.preferences.theme === 'dark' ? 'light' : 'dark' } });
    render();
  };
  $('highlight').onclick = () => {
    save({ ...state, preferences: { ...state.preferences, highlight: !state.preferences.highlight } });
    render();
  };
  $('exam-form').onsubmit = event => {
    event.preventDefault();
    openSession('exam', matches, { length: $('exam-count').valueAsNumber, minutes: $('exam-minutes').valueAsNumber });
  };
  $('session-view').addEventListener('submit', event => {
    event.preventDefault();
    navigate($('jump-position').valueAsNumber - 1, 'next');
  });
  $('session-view').addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch' && event.target.closest('.question-panel') &&
      !event.target.closest('button, input, summary')) {
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  });
  $('session-view').addEventListener('pointerup', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    const x = event.clientX - pointer.x;
    const y = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(x) > 55 && Math.abs(x) > 1.6 * Math.abs(y)) {
      navigate(state.session.position + (x < 0 ? 1 : -1), x < 0 ? 'next' : 'previous');
    }
  });
  $('session-view').addEventListener('pointercancel', () => { pointer = null; });
  $('plan-form').onsubmit = event => {
    event.preventDefault();
    const plan = { date: $('plan-date').value, count: $('plan-count').valueAsNumber,
      minutes: $('plan-minutes').valueAsNumber };
    save({ ...state, progress: { ...state.progress, plan } });
    render();
  };
  $('run-plan').onclick = () => {
    const plan = state.progress.plan;
    if (!plan) return;
    const records = bank.select({ bank: state.selection });
    const ordered = [...records.filter(due), ...records.filter(q => !due(q) && state.progress.attempts[q.id]?.labels.length === undefined),
      ...records.filter(q => !due(q) && state.progress.attempts[q.id]?.labels.length !== undefined)];
    openSession('study', ordered.slice(0, plan.count));
  };
  $('export').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vi-sinh-tien-do.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };
  $('import').onclick = () => $('backup-file').click();
  $('backup-file').onchange = async event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw Error('Tệp quá lớn');
      const imported = importBackup(bank, JSON.parse(await file.text()));
      if (!confirm('Thay thế tiến độ Vi sinh hiện tại bằng bản sao lưu?')) return;
      if (save({ ...imported, paused: !!imported.session }, { atomic: true })) notice = 'Đã nhập tiến độ Vi sinh.';
    } catch {
      notice = 'Tệp sao lưu Vi sinh không hợp lệ. Tiến độ hiện tại được giữ nguyên.';
    }
    render();
  };
  $('album').innerHTML = captions.map((caption, i) => `<figure class="panel">
    <button data-image="${i + 1}" aria-label="Phóng to hình ${i + 1}"><img loading="lazy" src="./images/${i + 1}.jpg" alt="${esc(caption.alt)}"></button>
    <figcaption><p>${esc(caption.reference)}</p><details><summary>Hiện tên hình</summary><p>${esc(caption.title)}</p></details></figcaption>
  </figure>`).join('');
  render();
  tick();
  setInterval(tick, 500);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(() => {
      $('offline').hidden = false;
      $('offline').textContent = 'Đã tải đủ tài nguyên để học ngoại tuyến.';
    }).catch(() => {
      $('offline').hidden = false;
      $('offline').textContent = 'Chưa chuẩn bị được tài nguyên ngoại tuyến.';
    });
  }
}

main().catch(error => {
  console.error(error);
  $('notice').textContent = 'Không mở được ngân hàng Vi sinh. Hãy kiểm tra kết nối và tải lại trang.';
});
