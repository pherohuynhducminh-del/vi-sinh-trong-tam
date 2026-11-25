for(const q of QUESTIONS){q.options=q.options||[];q.multi=q.multi||Array.isArray(KEYS[q.id])||/chọn nhiều/i.test(q.question)}
function computeTopic(q){if(TOPIC_OVERRIDES[q.id]!=null){let t=TOPICS[TOPIC_OVERRIDES[q.id]];return t.chapter+' › '+t.name}let txt=q.question+' '+q.options.map(o=>o.text).join(' ');for(let t of TOPICS.slice(0,-1))if(t.re.test(txt))return t.chapter+' › '+t.name;return TOPICS.at(-1).chapter+' › '+TOPICS.at(-1).name}
const topicCache=new Map();
function topicFor(q){if(!topicCache.has(q.id))topicCache.set(q.id,computeTopic(q));return topicCache.get(q.id)}
function foldSearch(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').trim()}
const searchCache=new Map();
function searchText(q){if(!searchCache.has(q.id))searchCache.set(q.id,foldSearch(`Câu ${q.id} ${q.question} ${q.options.map(o=>o.text).join(' ')}`));return searchCache.get(q.id)}
function matchesSearch(q,t){return !t||(/^(?:cau\s*)?\d+$/.test(t)?q.id===Number(t.replace(/^cau\s*/,'')):searchText(q).includes(t))}
function topicList(){return [...new Set(QUESTIONS.map(topicFor))]}

const questionIndex=new Map(QUESTIONS.map(q=>[q.id,q]));
function activeIds(){if(S.mode==='flashcards')return S.session||[];if(S.mode==='exam')return S.examIds;if(S.mode==='review')return [...new Set([...S.wrong,...(S.submitted&&S.reviewResolved===S.current?[S.current]:[])])];if(S.session?.length)return S.session;return QUESTIONS.map(q=>q.id)}
function currentQ(){return qBy(S.current)||QUESTIONS[0]}
function currentAnswer(q){return S.mode==='exam'?S.examAnswers[q.id]:S.mode==='review'?(Object.prototype.hasOwnProperty.call(S.reviewAnswers||{},q.id)?S.reviewAnswers[q.id]:S.answers[q.id]):S.answers[q.id]}
function hasAnswer(a){return a!=null&&(!Array.isArray(a)||a.length>0)}
function isAnswered(q){return hasAnswer(currentAnswer(q))}
function normalizedKey(q){let k=getKey(q);return k==null?null:(Array.isArray(k)?k:[k]).slice().sort()}
function scoreQ(q){let k=normalizedKey(q),a=currentAnswer(q);if(!k||!hasAnswer(a))return null;if(q.multi)return Array.isArray(a)&&JSON.stringify([...a].sort())===JSON.stringify(k);return k.includes(a)}
function recordResult(q){let result=scoreQ(q);S.reviewAnswers=S.reviewAnswers||{};if(result===true){if(S.mode==='review'){S.answers[q.id]=currentAnswer(q);S.reviewResolved=q.id;}S.wrong=S.wrong.filter(id=>id!==q.id);delete S.reviewAnswers[q.id]}else if(result===false){if(!S.wrong.includes(q.id))S.wrong.push(q.id);S.reviewAnswers[q.id]=currentAnswer(q)}}
function scoreSaved(q){let k=normalizedKey(q),a=S.answers[q.id];if(!k||!hasAnswer(a))return null;if(q.multi)return Array.isArray(a)&&JSON.stringify([...a].sort())===JSON.stringify(k);return k.includes(a)}
function scoreQExam(q){let k=normalizedKey(q),a=S.examAnswers[q.id];if(!k||!hasAnswer(a))return null;if(q.multi)return Array.isArray(a)&&JSON.stringify([...a].sort())===JSON.stringify(k);return k.includes(a)}
let timer=null,examRemaining=0;
const qBy=id=>questionIndex.get(Number(id)),getKey=q=>KEYS[q.id]??null;
