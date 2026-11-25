import assert from 'node:assert/strict';

// The bank uses Latin Vietnamese text, scientific notation and a small set of punctuation.
const vietnamese = 'àáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ';
const allowed = new Set(vietnamese + vietnamese.toUpperCase() + 'αβγμµ°·–—…›₀₁₂₃₄₅₆₇₈₉');
const legacyWords = /\b(?:vaø|laø|teá|nhieãm|thuoäc|toång|neáu|coù|cuûa)\b/iu;

export function unexpectedText(text) {
  if (text !== text.normalize('NFC')) return 'Văn bản chưa ở dạng NFC';
  for (const char of text) {
    if (char === '\n' || char === '\r' || char === '\t' || /^[ -~]$/.test(char) || allowed.has(char)) continue;
    return 'Ký tự ngoài bảng kiểm kê U+' + char.codePointAt(0).toString(16).toUpperCase();
  }
  if (legacyWords.test(text)) return 'Mẫu từ VNI chưa chuyển';
  return null;
}

export function assertCleanText(value, path) {
  if (typeof value === 'string') {
    const problem = unexpectedText(value);
    assert.equal(problem, null, path + ': ' + problem);
  } else if (value !== null && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) assertCleanText(entry, path + '.' + key);
  }
}

export function applyReviewedCorrections(records, corrections) {
  const byId = new Map(records.map(record => [record.id, record]));
  const seen = new Set();
  for (const { id, field, before, after } of corrections) {
    const key = id + ':' + field;
    assert.ok(!seen.has(key), key);
    seen.add(key);
    const record = byId.get(id);
    assert.ok(record, key);
    const target = field === 'question' ? record : record.options.find(option => option.label === field);
    const property = field === 'question' ? 'question' : 'text';
    assert.equal(target?.[property], before, 'Nguồn thay đổi tại ' + key);
    assert.equal(typeof after, 'string', key);
    assert.notEqual(after, before, key);
    target[property] = after;
  }
}
