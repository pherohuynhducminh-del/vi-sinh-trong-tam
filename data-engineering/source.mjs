import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const sourceSha = 'c4668de7f189c8fff29f1fa65be1a3e6c86f32dd';
export const sourceHash = 'ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function literal(text, start) {
  let depth = 0;
  const tokens = /"(?:\\.|[^"\\])*"|[{}\[\]]/gs;
  tokens.lastIndex = start;
  for (let token; (token = tokens.exec(text));) {
    if (token[0] === '{' || token[0] === '[') depth++;
    if (token[0] === '}' || token[0] === ']') depth--;
    if (depth === 0) return [JSON.parse(text.slice(start, tokens.lastIndex)), tokens.lastIndex];
  }
  throw new Error('Unclosed data literal');
}

function readLiteral(text, marker, conditional = false) {
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, marker);
  const [value, end] = literal(text, start + marker.length);
  if (!conditional) return value;
  assert.equal(text[end], ':');
  return [value, literal(text, end + 1)[0]];
}

export function readSource(path = new URL('../nkhkjjhkkjjh.html', import.meta.url)) {
  const bytes = readFileSync(path);
  assert.equal(hash(bytes), sourceHash, 'Unexpected source bytes');
  const html = bytes.toString('utf8');
  const frames = [...html.matchAll(/(?:const hs=|,vs=)("(?:\\.|[^"\\])*")/g)]
    .map(match => JSON.parse(match[1]));
  assert.equal(frames.length, 2);
  const fields = { questions: 'QUESTIONS', keys: 'KEYS', explanations: 'EXPLANATIONS', topics: 'FIXED_TOPICS' };
  const copies = {};
  const banks = [{}, {}];
  for (const [field, symbol] of Object.entries(fields)) {
    const [hsFrame, vsFrame] = frames.map(frame => readLiteral(frame, symbol + '=(IS_VS?', true));
    copies[field] = hsFrame.map((sourceRows, bank) => {
      const byId = rows => Object.fromEntries(rows.map(row => [row.id, row]));
      const rows = field === 'questions' ? byId(sourceRows) : sourceRows;
      const other = field === 'questions' ? byId(vsFrame[bank]) : vsFrame[bank];
      return [...new Set([...Object.keys(rows), ...Object.keys(other)])]
        .filter(key => JSON.stringify(rows[key]) !== JSON.stringify(other[key]))
        .map(key => Number(key));
    });
    banks[0][field] = hsFrame[1];
    banks[1][field] = vsFrame[0];
  }
  const [hs, vs] = banks;
  vs.tiers = readLiteral(frames[1], 'const META=');
  vs.aliases = readLiteral(frames[1], 'const VS_SOURCE_ALIASES=');
  vs.excerpts = readLiteral(frames[1], 'const VS_INLINE_SOURCE=');
  const images = readLiteral(html, 'const sharedImages=');
  const albums = frames.map(frame => [...frame.matchAll(
    /data-src="__CQ_IMAGE_(\d+)__" alt="([^"]+)"><\/button><figcaption><small>([^<]+)<\/small><details open><summary>[^<]+<\/summary><p>([^<]+)<\/p>/g
  )].map(([, index, alt, caption, title]) => ({ index: Number(index), alt, caption, title })));
  return { hs, vs, images, albums, copies };
}
