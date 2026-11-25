import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { development, readOriginal } from '../scripts/quiz-source.mjs';

test('bản gốc và toàn bộ ngân hàng, ảnh và phân tầng được bảo toàn', async () => {
  const original = await readOriginal();
  const candidate = await readFile(development, 'utf8');
  const session = await readFile(new URL('../clinical-quiz/session.js', import.meta.url), 'utf8');
  const storage = await readFile(new URL('../clinical-quiz/storage.js', import.meta.url), 'utf8');
  const banks = await readFile(new URL('../clinical-quiz/banks.js', import.meta.url), 'utf8');
  const pattern = /(?:const hs=|,vs=)("(?:\\.|[^"\\])*")/g;
  const originalBanks = [...original.matchAll(pattern)];
  const candidateBanks = [...candidate.matchAll(pattern)];
  assert.equal(originalBanks.length, 2);
  assert.equal(candidateBanks.length, 2);
  for (const [i, match] of originalBanks.entries()) {
    const bank = JSON.parse(candidateBanks[i][1]);
    const originalBank = bank.replace('<script>\n' + storage + '</script>\n', '')
      .replace('\n<script>\n' + session + '</script>\n', '');
    assert.equal(originalBank, JSON.parse(match[1]));
    assert.ok(bank.indexOf(storage) < bank.indexOf('const IS_VS'));
    assert.ok(bank.endsWith('\n<script>\n' + session + '</script>\n'));
  }
  const normalize = html => html.replace(pattern, (match, literal) => match.slice(0, -literal.length));
  const oldShell = normalize(original);
  const end = oldShell.lastIndexOf('</script>');
  assert.equal(normalize(candidate), oldShell.slice(0, oldShell.indexOf('let current=null;function choose')) + banks + oldShell.slice(end));
});
