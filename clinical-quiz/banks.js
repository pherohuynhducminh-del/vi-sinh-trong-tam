let current = null;
const bankNames = ['hs', 'vs', 'focus'];
const bankKey = 'clinical_quiz_bank';

function choose(bank, approved = false) {
  if (current === bank) return;
  if (current && !approved) {
    const quiz = document.querySelector('#stage iframe')?.contentWindow;
    if (!quiz?.prepareBankExit) return;
    if (!quiz.prepareBankExit(() => choose(bank, true))) return;
  }
  const frame = document.createElement('iframe');
  frame.title = bank;
  frame.srcdoc = expandImages(bank === 'hs' ? hs : vs.replace('__STRATEGIC__', String(bank === 'focus')));
  document.getElementById('stage').replaceChildren(frame);
  current = bank;
  try { sessionStorage.setItem(bankKey, bank); } catch {}
  for (const name of bankNames) document.getElementById(name).setAttribute('aria-pressed', String(name === bank));
}

for (const bank of bankNames) document.getElementById(bank).onclick = () => choose(bank);
let initial = 'focus';
try {
  const previous = sessionStorage.getItem(bankKey);
  if (bankNames.includes(previous)) initial = previous;
} catch {}
choose(initial);
