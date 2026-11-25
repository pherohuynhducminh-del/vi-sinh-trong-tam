const $=id=>document.getElementById(id);
function esc(t){return String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function markText(t){const raw=String(t??'');if(!P.highlight)return esc(raw);const re=/(?:ngoại trừ|không đúng|không phải|không|chưa|sai|tất cả|duy nhất|luôn luôn|bắt buộc|chỉ|\d+(?:[.,]\d+)?\s*(?:°\s*C|℃|%|mg\s*\/\s*d[lL]|mmol\s*\/\s*[lL]|[µμu]mol\s*\/\s*[lL]|[uU]\s*\/\s*[lL]|nm|m[lL]|giờ|phút|ngày)|NADH|NADPH|ATP|ADP|HDL|LDL|VLDL|GLDH|GOD|POD|urease|uricase|creatinin)/giu;let out='',pos=0;for(const m of raw.matchAll(re)){out+=esc(raw.slice(pos,m.index))+'<mark>'+esc(m[0])+'</mark>';pos=m.index+m[0].length}return out+esc(raw.slice(pos))}
const filteredIds = activeIds;
const focusActive = () => learningActive() || (S.mode === 'exam' && S.examActive && P.focus);

function showResult(q) {
  if (!learningActive()) return null;
  const session = S.learning;
  if (!session.checked.includes(q.id) && !session.revealed.includes(q.id) && !P.reveal) return null;
  return { reveal: true, key: getKey(q), result: session.checked.includes(q.id) ? scoreQ(q) : null };
}
function renderExplanation(q){const e=EXPLANATIONS[q.id],panel=$('explanationPanel');if(!e||!panel){panel?.classList.add('hidden');return}const rows=e.options?Object.entries(e.options).map(([k,v])=>`<p><b>${k}.</b> ${esc(v)}</p>`).join(''):'';panel.innerHTML=`<div class="explain-title">📘 Giải thích kiến thức · Câu ${q.id}: ${esc(e.title)}</div><div class="muted">${esc(e.sourceStatus)} · Giải thích tham khảo, chưa thẩm định độc lập từng câu.</div><div class="explain-section"><b>Khóa PDF gốc</b><div>${esc(getKey(q)==null?"Chưa có key":Array.isArray(getKey(q))?getKey(q).join(", "):getKey(q))}</div></div><div class="explain-section"><b>Nguyên lý</b><div>${esc(e.principle)}</div></div><div class="explain-section"><b>Vì sao chọn đáp án? (Tham khảo, không thay khóa PDF)</b><div>${esc(e.why)}</div></div>${rows?`<div class="explain-section"><b>Vì sao các lựa chọn khác không phù hợp?</b>${rows}</div>`:''}${e.caution?`<div class="explain-caution"><b>Lưu ý thẩm định</b><div>${esc(e.caution)}</div></div>`:''}<div class="explain-section"><b>Ghi nhớ nhanh</b><div>${esc(e.takeaway)}</div></div>`;panel.classList.remove('hidden')}
function render() {
  const learning = learningActive();
  const catalog = LEARNING_MODES.includes(S.mode) && !learning;
  const exam = S.mode === 'exam';
  document.documentElement.dataset.theme = P.theme === 'dark' ? 'dark' : '';
  document.body.classList.toggle('focus', focusActive());
  document.body.classList.toggle('learning-session', learning);
  $('themeBtn').textContent = P.theme === 'dark' ? '☀️ Sáng' : '🌙 Tối';
  $('focusBtn').hidden = !(exam && S.examActive);
  $('focusBtn').textContent = P.focus ? 'Thoát tập trung' : '⛶ Tập trung';
  $('examAction').textContent = S.examActive ? 'Nộp bài' : S.examDone ? 'Thi lại' : 'Bắt đầu thi';
  $('revealToggle').checked = P.reveal;
  $('instantToggle').checked = P.instant;
  $('highlightToggle').checked = P.highlight;
  $('examLive').classList.toggle('show', exam && S.examActive);
  $('examResult').classList.toggle('hidden', !exam || !S.examDone);
  $('examSetup').classList.toggle('hidden', S.examActive);
  $('timer').classList.toggle('hidden', !S.examActive);
  $('prefs').classList.toggle('hidden', !exam);
  for (const [mode, id] of Object.entries({ flashcards: 'flashArea', answers: 'answerArea', stats: 'statsArea', settings: 'settingsArea' })) {
    $(id).classList.toggle('hidden', S.mode !== mode);
  }
  $('studyCatalog').classList.toggle('hidden', !catalog);
  $('learningBar').classList.toggle('hidden', !learning);
  $('quizArea').classList.toggle('hidden', !(learning || (exam && S.examActive)));
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === S.mode));

  if (exam && S.examDone) renderExamResult();
  if (exam && S.examActive) renderExamLive();
  if (S.mode === 'answers') renderAnswers();
  if (S.mode === 'flashcards') renderFlashcard();
  if (S.mode === 'stats') renderStats();
  if (catalog) renderStudyCatalog();
  if (!learning && !(exam && S.examActive)) {
    save();
    return;
  }
  if (learning) {
    S.current = S.learning.current;
    renderLearningBar();
  }

let visibleIds=filteredIds();if(!visibleIds.length){$('qTitle').textContent='Không có câu phù hợp';$('question').textContent='Hãy đổi bộ lọc hoặc chế độ học.';$('options').innerHTML='';$('feedback').className='feedback hidden';$('explanationPanel').classList.add('hidden');$('questionGrid').innerHTML='';$('gridCaption').textContent='0 câu';for(const id of ['prevBtn','nextBtn','checkBtn','markBtn'])$(id).disabled=true;save();return}if(!visibleIds.includes(S.current)){S.current=visibleIds[0];S.submitted=false}$('markBtn').disabled=false;let q=currentQ(),res=showResult(q),answer=currentAnswer(q),key=getKey(q);$('qTitle').textContent=`Câu ${q.id}${q.multi?' · Chọn nhiều đáp án':''}`;$('question').innerHTML=markText(q.question)+(q.id>=8&&q.id<=11?' <div class="formula">C = <span class=\"frac\"><span>OD</span><span>OD₀</span></span> × C₀</div>':'');$('markBtn').textContent=S.marked.includes(q.id)?'★ Đã đánh dấu':'☆ Đánh dấu';$('options').innerHTML='';if(!q.options.length){$('options').innerHTML='<div class=\"empty\">📝 Câu ghi nhớ / tự luận — tài liệu gốc không có lựa chọn A/B/C/D. Nội dung câu được giữ nguyên như PDF.</div>'}else q.options.forEach(o=>{let selected=q.multi?Array.isArray(answer)&&answer.includes(o.label):answer===o.label;let correct=res&&res.key&&(Array.isArray(res.key)?res.key:[res.key]).includes(o.label);let wrong=res&&selected&&res.result===false&&!correct;let btn=document.createElement('button');btn.className='opt'+(selected?' selected':'')+(correct?' correct':'')+(wrong?' incorrect':'');btn.innerHTML=`<span class=\"letter\">${esc(o.label)}.</span><span>${markText(o.text)}</span>`;btn.disabled=learning && S.learning.checked.includes(q.id) && (!P.instant || q.multi);btn.onclick=()=>choose(q,o.label);$('options').appendChild(btn)});
$('feedback').className='feedback hidden';$('explanationPanel').classList.add('hidden');if(res){$('feedback').classList.remove('hidden');if(key==null){$('feedback').textContent='⚠️ Câu này chưa có đáp án trong bộ key. Hãy đối chiếu tài liệu gốc; không tự suy đoán đáp án.'}else if(res.result===true){$('feedback').classList.add('correct');$('feedback').textContent='✓ Chính xác theo PDF gốc · Đáp án: '+(Array.isArray(key)?key.join(', '):key)}else if(res.result===false){$('feedback').classList.add('incorrect');$('feedback').textContent='✕ Chưa đúng theo PDF gốc · Đáp án: '+(Array.isArray(key)?key.join(', '):key)}else{$('feedback').textContent='Đáp án theo PDF gốc: '+(Array.isArray(key)?key.join(', '):key)}}
if (learning && key == null && !res) {
  $('feedback').classList.remove('hidden');
  $('feedback').textContent = 'Câu này chưa có đáp án trong bộ khóa gốc.';
}
if(res&&key!=null&&S.mode!=='exam')renderExplanation(q);
const index = visibleIds.indexOf(q.id);
$('prevBtn').disabled = index <= 0;
$('nextBtn').disabled = index >= visibleIds.length - 1;
$('checkBtn').hidden = !learning;
if (learning) {
  const checked = S.learning.checked.includes(q.id);
  const revealed = S.learning.revealed.includes(q.id);
  $('checkBtn').textContent = !q.options.length ? (checked ? 'Đã đọc' : 'Đánh dấu đã đọc') :
    checked ? 'Làm lại câu' : hasAnswer(answer) ? 'Kiểm tra' : revealed ? 'Ẩn đáp án' : 'Xem đáp án';
  $('checkBtn').disabled = !q.options.length && checked;
}

let ids=visibleIds;$('gridCaption').textContent=`${ids.length} câu trong bộ hiện tại`;$('questionGrid').innerHTML='';const gridFragment=document.createDocumentFragment();ids.forEach(id=>{let b=document.createElement('button');b.className='number'+((S.mode==='exam'?hasAnswer(S.examAnswers[id]):S.learning.checked.includes(id))?' answered':'')+(S.wrong.includes(id)?' wrong':'')+(S.marked.includes(id)?' flag':'')+(id===q.id?' current':'');b.textContent=id;b.onclick=()=>go(id);gridFragment.appendChild(b)});$('questionGrid').appendChild(gridFragment);save()}
function choose(q, label) {
  if ((!learningActive() && !(S.mode === 'exam' && S.examActive)) ||
      q.id !== S.current || !q.options.some(option => option.label === label)) return;
  const learning = learningActive();
  if (learning && S.learning.checked.includes(q.id) && (!P.instant || q.multi)) return;
  const target = learning ? S.learning.drafts : S.examAnswers;
  if (q.multi) {
    const selected = target[q.id] || [];
    const next = selected.includes(label) ? selected.filter(item => item !== label) : [...selected, label];
    if (next.length) target[q.id] = next;
    else delete target[q.id];
  } else {
    if (learning && P.instant && target[q.id] === label && S.learning.checked.includes(q.id)) return;
    target[q.id] = label;
    if (learning && P.instant) finishLearningQuestion(q);
  }
  render();
  if (learning && P.instant && !q.multi) keepFeedbackVisible();
}

function keepFeedbackVisible() {
  const feedback = $('feedback');
  const controls = $('checkBtn').parentElement;
  if (!feedback.classList.contains('hidden') &&
      feedback.getBoundingClientRect().bottom > controls.getBoundingClientRect().top) {
    feedback.scrollIntoView({ block: 'nearest' });
  }
}

function finishLearningQuestion(q) {
  recordLearningResult(q, learningDraft(q));
  if (!S.learning.checked.includes(q.id)) S.learning.checked.push(q.id);
}

function go(id) {
  if (!activeIds().includes(id)) return;
  S.current = id;
  if (learningActive()) S.learning.current = id;
  S.submitted = false;
  render();
  if (learningActive()) window.scrollTo(0, 0);
}

function move(delta) {
  const ids = activeIds();
  const index = ids.indexOf(S.current);
  if (ids[index + delta] != null) go(ids[index + delta]);
}
function renderFlashcard(){let ids=activeIds().filter(id=>getKey(qBy(id))!=null),q=qBy(S.current);if(!ids.length){$('flashCount').textContent='0 thẻ';$('flashFront').textContent='Không có câu phù hợp với bộ lọc này.';$('flashBack').classList.add('hidden');$('flashFlip').disabled=true;$('flashPrev').disabled=true;$('flashNext').disabled=true;return}if(!ids.includes(S.current)){S.current=ids[0];q=qBy(S.current)}let idx=ids.indexOf(S.current),k=getKey(q),keys=Array.isArray(k)?k:[k];$('flashCount').textContent=`Thẻ ${idx+1}/${ids.length} · Câu ${q.id}`;$('flashEyebrow').textContent=S.flashFace==='back'?'MẶT SAU':'MẶT TRƯỚC';$('flashFront').innerHTML=`<b>Câu ${q.id}.</b><br>${markText(q.question)}`;$('flashBack').innerHTML=`<div class="keyline" style="font-size:1.1rem;margin-bottom:8px">Đáp án: ${keys.join(', ')}</div>${q.options.map(o=>`<div class="answerrow ${keys.includes(o.label)?'correctline':''}"><b>${o.label}.</b> ${markText(o.text)} ${keys.includes(o.label)?'✓':''}</div>`).join('')}`;$('flashBack').classList.toggle('hidden',S.flashFace!=='back');$('flashFlip').textContent=S.flashFace==='back'?'Xem mặt trước':'Lật thẻ · xem đáp án';$('flashFlip').disabled=false;$('flashPrev').disabled=idx===0;$('flashNext').disabled=idx===ids.length-1}
function renderAnswers(){let term=foldSearch($('answerSearch').value),arr=QUESTIONS.filter(q=>matchesSearch(q,term)||(!/^(?:cau\s*)?\d+$/.test(term)&&foldSearch((getKey(q)||[]).toString()).includes(term)));$('answerCount').textContent=`${arr.length} câu · ${Object.keys(KEYS).length} câu có key · ${QUESTIONS.length-Object.keys(KEYS).length} chưa có key`;$('answerList').innerHTML='';const fragment=document.createDocumentFragment();arr.forEach(q=>{let d=document.createElement('article');d.className='reviewitem';let k=getKey(q),keys=Array.isArray(k)?k:[k];d.innerHTML=`<strong>Câu ${q.id}.</strong><p>${markText(q.question)}</p>${q.options.map(o=>`<div class="answerrow ${k!=null&&keys.includes(o.label)?'correctline':''}">${o.label}. ${markText(o.text)} ${k!=null&&keys.includes(o.label)?'✓':''}</div>`).join('')}<div class="keyline">Đáp án theo PDF gốc: ${k==null?'Chưa có key':Array.isArray(k)?k.join(', '):k}</div>`;fragment.appendChild(d)});$('answerList').appendChild(fragment)}
const learningButton = (text, data, disabled = false) =>
  `<button type="button" ${data}${disabled ? ' disabled' : ''}>${esc(text)}</button>`;

function scopeMetrics(questions) {
  const stats = learningProgress(questions);
  const { total, done, right, wrong, unanswered, noKey } = stats;
  return `<span class="scope-metrics">
    <span>${total} câu</span><span>${done} đã làm</span><span>${right} đúng</span>
    <span>${wrong} sai</span><span>${unanswered} chưa làm</span><span>${noKey} chưa có đáp án</span>
  </span><progress value="${done}" max="${total || 1}" aria-label="Tiến độ ${done}/${total}"></progress>`;
}

function scopeButtons(scope, questions) {
  const actions = ['unanswered', 'wrong', 'marked', 'redo', 'done', 'nokey'];
  return actions.map(action => {
    const count = questions.filter(q => matchesLearningAction(q, action)).length;
    return learningButton(`${LEARNING_ACTIONS[action]} · ${count}`,
      `data-learning-action="${action}" data-scope="${esc(scope)}"`, count === 0);
  }).join('');
}

function renderStudyCatalog() {
  const review = S.mode === 'review';
  const action = review ? 'wrong' : 'all';
  const intro = review ? 'Ôn câu sai' : 'Học theo chương & chủ đề';
  $('learningTitle').textContent = intro;
  $('studyTotal').textContent = review ? `${S.wrong.length} câu cần ôn` : `${learningProgress(QUESTIONS).done}/296 đã làm`;
  $('advancedLearning').hidden = review;
  const main = [learningButton(review ? 'Ôn sai toàn môn' : 'Học toàn bộ 296 câu',
    `data-learning-action="${action}" data-scope="all"`, review && !S.wrong.length)];
  if (!review) {
    main.push(learningButton('Học ngẫu nhiên', 'data-learning-action="random" data-scope="all"'));
    main.push(scopeButtons('all', QUESTIONS));
  }
  if (S.learning) main.unshift(learningButton('Tiếp tục phiên đã lưu', 'data-learning-resume'));
  $('learningMain').innerHTML = main.join('');
  const topics = TOPICS.map(t => t.chapter + ' › ' + t.name).filter(topic => scopeQuestions(topic).length);
  const groups = [...new Set(topics.map(topic => topic.split(' › ')[0]))];
  $('studyChapters').innerHTML = groups.map(chapter => {
    const questions = scopeQuestions(chapter);
    const launch = scope => `data-learning-action="${action}" data-scope="${esc(scope)}"`;
    const blocked = list => review && !list.some(q => S.wrong.includes(q.id));
    const topicsMarkup = topics.filter(topic => topic.startsWith(chapter + ' › ')).map(topic => {
      const list = scopeQuestions(topic);
      const name = topic.split(' › ')[1];
      return `<div class="study-topic topic-card">
        <button type="button" class="topic-open" ${launch(topic)} data-study-topic="${esc(topic)}" ${blocked(list) ? 'disabled' : ''}><strong>${esc(name)}</strong></button>
        ${scopeMetrics(list)}
        ${review ? '' : `<details><summary>Chọn nhóm câu</summary><div class="learning-actions">${scopeButtons(topic, list)}</div></details>`}
      </div>`;
    }).join('');
    return `<article class="study-chapter" data-chapter="${esc(chapter)}">
      <h3>${esc(chapter)}</h3>${scopeMetrics(questions)}
      <div class="learning-actions">${learningButton(review ? 'Ôn sai chương này' : 'Học chương này',
        launch(chapter), blocked(questions))}</div>
      ${review ? '' : `<details><summary>Chọn nhóm câu trong chương</summary><div class="learning-actions">${scopeButtons(chapter, questions)}</div></details>`}
      <div class="study-topics">${topicsMarkup}</div>
    </article>`;
  }).join('');
}

function renderLearningBar() {
  const { scope, action, ids, checked, current } = S.learning;
  $('learningLabel').textContent = scope === 'all' ? LEARNING_ACTIONS[action] + ' · Toàn môn' : scope;
  $('learningPosition').textContent = `${ids.indexOf(current) + 1}/${ids.length} · ${checked.length} đã làm`;
  $('learningProgress').max = ids.length;
  $('learningProgress').value = checked.length;
}

function startLearning(scope, action, ids) {
  $('learningNotice').textContent = '';
  if (!ids) ids = scopeQuestions(scope).filter(q => matchesLearningAction(q, action)).map(q => q.id);
  if (!ids.length) {
    $('learningNotice').textContent = 'Không có câu phù hợp với phạm vi này.';
    return;
  }
  if (action === 'random') {
    for (let index = ids.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [ids[index], ids[other]] = [ids[other], ids[index]];
    }
  }
  S.learning = newLearningSession(ids, scope, action, S.mode);
  resumeLearning();
}

function resumeLearning() {
  S.mode = S.learning.mode;
  S.learningOpen = true;
  S.current = S.learning.current;
  closeJump();
  render();
  window.scrollTo(0, 0);
}
function renderStats() {
  const summary = learningProgress(QUESTIONS);
  const graded = summary.right + summary.wrong;
  const accuracy = graded ? Math.round(100 * summary.right / graded) : 0;
  const corrected = Object.values(S.wrongHistory).filter(item => item.corrected > 0).length;
  const mistakes = Object.values(S.wrongHistory).reduce((total, item) => total + item.wrong, 0);
  const history = S.examHistory.slice().reverse().map(h =>
    `<div class="history-row"><span>${new Date(h.at).toLocaleString('vi-VN')} · ${h.total} câu · ${h.answered} đã trả lời</span><b>${h.score}/${h.known} (${h.pct}%)</b></div>`
  ).join('');
  $('statsContent').innerHTML = `${scopeMetrics(QUESTIONS)}
    <p>${mistakes} lượt sai đã ghi nhận · ${corrected} câu từng được khắc phục · ${summary.wrong} câu cần ôn</p>
    <p>Độ chính xác hiện tại: ${graded ? accuracy + '%' : '—'}</p>
    ${mistakes ? `<details><summary>Lịch sử câu sai</summary>${Object.entries(S.wrongHistory)
      .map(([id, item]) => `<div class="history-row"><span>Câu ${esc(id)} · ${item.wrong} lượt sai
        ${item.attempts?.length ? ' · Đã chọn ' + item.attempts.map(attempt => esc(attempt.answer)).join(' / ') : ''}
      </span><b>${S.wrong.includes(Number(id)) ? 'Cần ôn' : 'Đã khắc phục'}</b></div>`).join('')}</details>` : ''}
    <h3>Tiến độ theo chương / mục</h3>
    ${topicList().map(topic => `<section class="topic-summary"><strong>${esc(topic)}</strong>${scopeMetrics(scopeQuestions(topic))}</section>`).join('')}
    <h3>Lịch sử thi thử</h3>${history || '<p class="muted">Chưa có lượt thi nào được lưu trên thiết bị này.</p>'}`;
}
function renderExamLive(){const n=S.examIds.length,answered=S.examIds.filter(id=>hasAnswer(S.examAnswers[id])).length,flagged=S.examIds.filter(id=>S.marked.includes(id)).length;$('examAnswered').textContent=answered;$('examUnanswered').textContent=n-answered;$('examFlagged').textContent=flagged;$('examTotal').textContent=n;const jump=(kind)=>{const ids=S.examIds.filter(id=>kind==='unanswered'?!hasAnswer(S.examAnswers[id]):S.marked.includes(id));if(!ids.length){alert(kind==='unanswered'?'Không còn câu chưa trả lời.':'Chưa có câu nào được đánh dấu.');return}const start=ids.findIndex(id=>id>S.current),target=ids[start<0?0:start];go(target)};$('examNextUnanswered').onclick=()=>jump('unanswered');$('examNextFlagged').onclick=()=>jump('flagged')}
function renderExamResult(){const ids=S.examIds||[],known=ids.map(qBy).filter(q=>q&&getKey(q)!=null),right=known.filter(q=>scoreQExam(q)===true),wrong=known.filter(q=>hasAnswer(S.examAnswers[q.id])&&scoreQExam(q)===false),unanswered=ids.map(qBy).filter(q=>q&&!hasAnswer(S.examAnswers[q.id])),noKey=ids.map(qBy).filter(q=>q&&getKey(q)==null),pct=known.length?Math.round(right.length/known.length*100):0;let html=`<div class="eyebrow">KẾT QUẢ THI THỬ</div><h2>Hoàn thành bài thi</h2><div class="result-score">${right.length}/${known.length} · ${pct}%</div><div class="muted">Điểm tính trên các câu có key trong tài liệu. ${noKey.length?`${noKey.length} câu chưa có key được loại khỏi mẫu số.`:''}</div><div class="exam-result-grid"><div>Đúng<b>${right.length}</b></div><div>Sai<b>${wrong.length}</b></div><div>Chưa trả lời<b>${unanswered.length}</b></div><div>Chưa có key<b>${noKey.length}</b></div></div><h3>Kết quả theo chủ đề</h3>`;const topics=[...new Set(known.map(q=>topicFor(q)))];for(const t of topics){const qs=known.filter(q=>topicFor(q)===t),r=qs.filter(q=>scoreQExam(q)===true).length;html+=`<div class="topic-result"><span>${esc(t)}</span><b>${r}/${qs.length} · ${Math.round(r/qs.length*100)}%</b></div>`}html+='<details open><summary>Xem lại câu sai ('+wrong.length+')</summary>';if(!wrong.length)html+='<p class="muted">Không có câu sai có key trong lượt thi này.</p>';for(const q of wrong){const ans=S.examAnswers[q.id],key=getKey(q),e=EXPLANATIONS[q.id];html+=`<div class="result-q"><b>Câu ${q.id}</b><div>${esc(q.question)}</div><small>Bạn chọn: ${Array.isArray(ans)?ans.join(', '):(ans||'Chưa trả lời')} · Đáp án theo PDF: ${Array.isArray(key)?key.join(', '):key}</small>${e?`<small><b>Giải thích:</b> ${esc(e.why||e.principle||'')}</small>`:''}</div>`}html+='</details><details><summary>Câu chưa trả lời ('+unanswered.length+')</summary>';for(const q of unanswered){const key=getKey(q);html+=`<div class="result-q"><b>Câu ${q.id}</b><div>${esc(q.question)}</div><small>${key==null?'PDF chưa có key':'Đáp án theo PDF: '+(Array.isArray(key)?key.join(', '):key)}</small></div>`}html+='</details><details><summary>Câu chưa có key ('+noKey.length+')</summary>';for(const q of noKey)html+=`<div class="result-q"><b>Câu ${q.id}</b><div>${esc(q.question)}</div><small>Không chấm điểm vì tài liệu chưa cung cấp key.</small></div>`;html+='</details><div class="controls"><button id="examRetry">Thi lại cấu hình này</button><button id="examBack">Quay lại luyện tập</button></div>';$('examResult').innerHTML=html;$('examRetry').onclick=()=>{S.examDone=false;startExam()};$('examBack').onclick=()=>{S.examDone=false;S.mode='practice';S.session=[];render()}}
function startExam(){if(S.examActive){alert('Bài thi hiện tại vẫn đang diễn ra. Hãy nộp bài trước khi bắt đầu lượt thi mới.');return}let num=$('examCount').value,topic=$('examTopic')?.value||'all',keyOnly=$('examKeyOnly')?.checked,ids=QUESTIONS.filter(q=>(topic==='all'||topicFor(q)===topic)&&(!keyOnly||getKey(q)!=null)).map(q=>q.id);if(!ids.length){alert('Không có câu hỏi theo chủ đề đã chọn.');return}for(let i=ids.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}if(num!=='all')ids.splice(+num);S.examIds=ids;S.examAnswers={};S.examActive=true;S.examDone=false;S.mode='exam';S.learningOpen=false;S.current=ids[0];S.submitted=false;S.examDeadline=Date.now()+Number($('duration').value)*60000;resumeClock();save();render()}
function updateClock(){let mins=String(Math.floor(Math.max(0,examRemaining)/60)).padStart(2,'0'),secs=String(Math.max(0,examRemaining)%60).padStart(2,'0');$('timer').textContent=mins+':'+secs}
function submitExam(timeout=false){if(!S.examActive)return;clearInterval(timer);S.examActive=false;S.examDeadline=null;S.examDone=true;let count = 0, known = 0;
for (const id of S.examIds) {
  const q = qBy(id);
  if (getKey(q) != null) known++;
  if (scoreQExam(q) === true) count++;
  if (hasAnswer(S.examAnswers[id])) recordLearningResult(q, S.examAnswers[id]);
}
S.examHistory=S.examHistory||[];S.examHistory.push({at:new Date().toISOString(),total:S.examIds.length,known,answered:S.examIds.filter(id=>hasAnswer(S.examAnswers[id])).length,score:count,pct:known?Math.round(count/known*100):0});S.submitted=true;save();render();$('examResult').scrollIntoView({behavior:'smooth',block:'start'})}
function resumeClock(){clearInterval(timer);if(!S.examActive)return;if(!Number.isFinite(S.examDeadline))S.examDeadline=Date.now()+Number($('duration').value)*60000;const tick=()=>{examRemaining=Math.max(0,Math.ceil((S.examDeadline-Date.now())/1000));updateClock();if(!examRemaining)submitExam(true)};timer=setInterval(tick,1000);tick();}
document.addEventListener('visibilitychange',()=>{if(S.examActive)resumeClock()});
document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => {
  if (S.examActive) {
    if (!confirm('Bạn đang làm bài thi. Chuyển mục sẽ nộp bài hiện tại. Tiếp tục?')) return;
    submitExam();
  }
  clearInterval(timer);
  S.mode = button.dataset.mode;
  S.learningOpen = false;
  $('learningNotice').textContent = '';
  closeJump();
  if (S.mode === 'flashcards') {
    S.session = QUESTIONS.filter(q => getKey(q) != null).map(q => q.id);
    S.current = S.session[0];
    S.flashFace = 'front';
    $('flashFilter').value = 'all';
  }
  render();
  window.scrollTo(0, 0);
});

$('studyCatalog').onclick = event => {
  const button = event.target.closest('button');
  if (button?.hasAttribute('data-learning-resume')) resumeLearning();
  else if (button?.dataset.learningAction) startLearning(button.dataset.scope, button.dataset.learningAction);
};
$('studyBackBtn').onclick = () => {
  S.learningOpen = false;
  closeJump();
  render();
  window.scrollTo(0, 0);
};
const scopeOptions = [...new Set(TOPICS.flatMap(t => [t.chapter, t.chapter + ' › ' + t.name]))]
  .filter(scope => scopeQuestions(scope).length);
$('learningScope').innerHTML = '<option value="all">Toàn môn</option>' +
  scopeOptions.map(scope => `<option value="${esc(scope)}">${esc(scope)}</option>`).join('');
$('learningGroup').innerHTML = '<option value="all">Tất cả</option>' +
  ['unanswered', 'wrong', 'marked', 'done', 'nokey'].map(action =>
    `<option value="${action}">${LEARNING_ACTIONS[action]}</option>`).join('');
$('learningFilter').onsubmit = event => {
  event.preventDefault();
  const scope = $('learningScope').value;
  const action = $('learningGroup').value;
  const term = foldSearch($('learningSearch').value);
  const ids = scopeQuestions(scope).filter(q => matchesLearningAction(q, action) && matchesSearch(q, term))
    .map(q => q.id);
  startLearning(scope, action === 'all' && term ? 'custom' : action, ids);
};
$('prevBtn').onclick = () => move(-1);
$('nextBtn').onclick = () => move(1);
$('checkBtn').onclick = () => {
  if (!learningActive()) return;
  const q = currentQ();
  const session = S.learning;
  if (session.checked.includes(q.id)) {
    session.checked = session.checked.filter(id => id !== q.id);
    session.revealed = session.revealed.filter(id => id !== q.id);
    delete session.drafts[q.id];
  } else if (hasAnswer(learningDraft(q)) || !q.options.length) finishLearningQuestion(q);
  else if (session.revealed.includes(q.id)) session.revealed = session.revealed.filter(id => id !== q.id);
  else session.revealed.push(q.id);
  render();
  keepFeedbackVisible();
};
$('markBtn').onclick = () => {
  S.marked = S.marked.includes(S.current) ? S.marked.filter(id => id !== S.current) : [...S.marked, S.current];
  render();
};
$('themeBtn').onclick = () => { P.theme = P.theme === 'dark' ? 'light' : 'dark'; render(); };
$('focusBtn').onclick = () => { P.focus = !P.focus; render(); };
for (const [id, pref] of Object.entries({ revealToggle: 'reveal', instantToggle: 'instant', highlightToggle: 'highlight' })) {
  $(id).onchange = () => { P[pref] = $(id).checked; render(); };
}
$('answerSearch').oninput = renderAnswers;
$('resetBtn').onclick = () => {
  if (!confirm('Xóa tiến độ học, lịch sử câu sai, đánh dấu và phiên đã lưu?')) return;
  Object.assign(S, { answers: {}, reviewAnswers: {}, wrongHistory: {}, marked: [], wrong: [], read: [],
    learning: null, learningOpen: false, current: 1, submitted: false });
  render();
};
$('examAction').onclick = () => {
  if (!S.examActive) startExam();
  else if (confirm(`Nộp bài thi? Đã trả lời ${S.examIds.filter(id => hasAnswer(S.examAnswers[id])).length}/${S.examIds.length} câu.`)) submitExam();
};
$('flashFilter').onchange=()=>{let v=$('flashFilter').value,ids=QUESTIONS.filter(q=>getKey(q)!=null&& (v==='all'||(v==='wrong'&&S.wrong.includes(q.id))||(v==='marked'&&S.marked.includes(q.id))||(v==='unseen'&&S.answers[q.id]==null))).map(q=>q.id);S.session=ids;S.current=ids[0]||1;S.flashFace='front';save();render()};$('flashFlip').onclick=()=>{S.flashFace=S.flashFace==='back'?'front':'back';renderFlashcard();save()};$('flashPrev').onclick=()=>{let ids=activeIds().filter(id=>getKey(qBy(id))!=null),i=ids.indexOf(S.current);if(i>0){S.current=ids[i-1];S.flashFace='front';renderFlashcard();save()}};$('flashNext').onclick=()=>{let ids=activeIds().filter(id=>getKey(qBy(id))!=null),i=ids.indexOf(S.current);if(i>=0&&i<ids.length-1){S.current=ids[i+1];S.flashFace='front';renderFlashcard();save()}};
document.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)||!(learningActive() || (S.mode === 'exam' && S.examActive)))return;if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);let q=currentQ(),letter=e.key.toUpperCase();if(q.options.some(o=>o.label===letter))choose(q,letter)});

$('exportProgress').onclick=()=>{let payload={schema:2,bank:'hoa-sinh-2-296',exportedAt:new Date().toISOString(),answers:S.answers,marked:S.marked,wrong:S.wrong,reviewAnswers:S.reviewAnswers||{},examHistory:S.examHistory||[],current:S.current,wrongHistory:S.wrongHistory,read:S.read,learning:S.learning,preferences:P};let blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MCQ_Hoa_Sinh_2_backup.json';a.click();URL.revokeObjectURL(url)};
function validateBackup(data){
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
if(!obj(data)||!obj(data.answers)||!obj(data.preferences)||(data.bank&&data.bank!=='hoa-sinh-2-296')||(data.schema!=null&&![1,2].includes(data.schema)))throw Error('format');
const answers=x=>{if(!obj(x))throw Error('answers');let out={};for(const [id,a] of Object.entries(x)){let q=qBy(id);if(!q||String(q.id)!==id)throw Error('id');let labels=q.options.map(o=>o.label);if(q.multi){if(!Array.isArray(a)||!a.every(v=>labels.includes(v))||new Set(a).size!==a.length)throw Error('multi');out[id]=a.slice()}else{if(!labels.includes(a))throw Error('label');out[id]=a}}return out};
const ids=x=>{if(!Array.isArray(x)||!x.every(v=>Number.isInteger(v)&&qBy(v)))throw Error('ids');return [...new Set(x)]};
let history=data.examHistory??[];if(!Array.isArray(history)||!history.every(h=>obj(h)&&typeof h.at==='string'&&Number.isFinite(Date.parse(h.at))&&['total','known','answered','score','pct'].every(k=>Number.isInteger(h[k])&&h[k]>=0)&&h.total<=QUESTIONS.length&&h.known<=h.total&&h.answered<=h.total&&h.score<=h.known&&h.pct<=100))throw Error('history');
let prefs={...P};for(const k of ['reveal','instant','highlight','focus'])if(typeof data.preferences[k]==='boolean')prefs[k]=data.preferences[k];if(['light','dark'].includes(data.preferences.theme))prefs.theme=data.preferences.theme;
const wrongHistory = {};
for (const [id, item] of Object.entries(data.wrongHistory ?? {})) {
  if (String(qBy(id)?.id) !== id || !obj(item) || !Number.isSafeInteger(item.wrong) || !Number.isSafeInteger(item.corrected) ||
      item.wrong < 1 || item.corrected < 0 || item.corrected > item.wrong) throw Error('wrong history');
  const attempts = item.attempts ?? [];
  if (!Array.isArray(attempts) || attempts.length > item.wrong || !attempts.every(attempt =>
    obj(attempt) && (attempt.at === null || typeof attempt.at === 'string' && Number.isFinite(Date.parse(attempt.at))) &&
    ['legacy', 'learning', 'exam'].includes(attempt.source) && hasAnswer(answers({ [id]: attempt.answer })[id])
  )) throw Error('attempts');
  wrongHistory[id] = { wrong: item.wrong, corrected: item.corrected, attempts };
}
const wrong = ids(data.wrong ?? []);
for (const id of wrong) wrongHistory[id] ||= { wrong: 1, corrected: 0 };
let learning = null;
if (data.learning != null) {
  const session = data.learning;
  const pool = ids(session.ids);
  const checked = ids(session.checked), revealed = ids(session.revealed);
  const drafts = answers(session.drafts);
  if (!pool.includes(session.current) || !LEARNING_MODES.includes(session.mode) ||
      !Object.hasOwn(LEARNING_ACTIONS, session.action) || typeof session.scope !== 'string' ||
      !pool.every(id => scopeQuestions(session.scope).some(q => q.id === id)) ||
      ![...checked, ...revealed, ...Object.keys(drafts).map(Number)].every(id => pool.includes(id))) throw Error('learning');
  learning = { ...newLearningSession(pool, session.scope, session.action, session.mode),
    current: session.current, checked, revealed, drafts };
}
return { answers: answers(data.answers), marked: ids(data.marked ?? []), wrong,
  reviewAnswers: answers(data.reviewAnswers ?? {}), examHistory: history,
  current: qBy(data.current)?.id || 1, wrongHistory, read: ids(data.read ?? []),
  learning, learningOpen: false, preferences: prefs };
}
$('importProgress').onclick=()=>{if(!S.examActive)$('backupFile').click()};$('backupFile').onchange=e=>{let file=e.target.files[0];e.target.value='';if(!file||S.examActive)return;if(file.size>5000000){alert('File sao lưu quá lớn.');return}let reader=new FileReader();reader.onload=()=>{try{if(S.examActive)return;let data=validateBackup(JSON.parse(reader.result));if(!confirm('Khôi phục sẽ thay thế tiến độ hiện tại. Bạn có muốn tiếp tục?'))return;let {preferences,...progress}=data;S={...S,...progress,submitted:false};P=preferences;save();render();alert('Đã khôi phục tiến độ.')}catch(err){alert('File backup không hợp lệ. Tiến độ hiện tại được giữ nguyên.')}};reader.onerror=()=>alert('Không đọc được file sao lưu.');reader.readAsText(file)};

const jumpButton=$('mobileJump'),jumpSide=$('questionGrid').closest('.side');
function syncMobileUI(){document.body.classList.toggle('exam-running',S.examActive);$('themeBtn').setAttribute('aria-pressed',String(P.theme==='dark'));$('focusBtn').setAttribute('aria-pressed',String(P.focus));document.querySelector('meta[name="theme-color"]').content=P.theme==='dark'?'#101725':'#f4f7fb';document.querySelectorAll('.nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===S.mode)));}
function closeJump(){jumpSide.classList.remove('jump-open');jumpButton.setAttribute('aria-expanded','false');}
jumpButton.onclick=()=>{let open=jumpSide.classList.toggle('jump-open');jumpButton.setAttribute('aria-expanded',String(open));if(open)jumpSide.scrollIntoView({block:'start'});};
$('questionGrid').addEventListener('click',e=>{if(e.target.closest('button')){closeJump();$('qTitle').scrollIntoView({block:'start'});}});
const focusExplainBtn = $('focusExplainBtn');
const explanationPanel = $('explanationPanel');
let openExplanationId = null;

function syncFocusExplanation() {
  const available = learningActive() && !$('quizArea').classList.contains('hidden') &&
    !explanationPanel.classList.contains('hidden');
  if (!available || openExplanationId !== S.current) openExplanationId = null;
  const open = available && openExplanationId === S.current;
  focusExplainBtn.hidden = !available;
  focusExplainBtn.textContent = open ? 'Ẩn giải thích' : 'Xem giải thích';
  focusExplainBtn.setAttribute('aria-expanded', String(open));
  explanationPanel.classList.toggle('focus-explanation-collapsed', available && !open);
}

focusExplainBtn.onclick = () => {
  openExplanationId = openExplanationId === S.current ? null : S.current;
  syncFocusExplanation();
};

const originalRenderMobile = render;
render = function () {
  originalRenderMobile();
  syncMobileUI();
  syncFocusExplanation();
};
migrateLearning(loadedState);
render();
if (S.examActive) resumeClock();
