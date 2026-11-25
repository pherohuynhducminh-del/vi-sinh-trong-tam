import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

export const original = new URL('../nkhkjjhkkjjh.html', import.meta.url);
export const development = new URL('../clinical-quiz/index.html', import.meta.url);
export const originalHash = 'ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123';

export async function readOriginal() {
  const bytes = await readFile(original);
  if (createHash('sha256').update(bytes).digest('hex') !== originalHash) {
    throw new Error('SHA-256 của bản chuẩn không khớp.');
  }
  return bytes.toString('utf8');
}
