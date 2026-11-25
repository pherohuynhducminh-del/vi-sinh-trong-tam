import { readFile, writeFile } from 'node:fs/promises';
import { development, readOriginal } from './quiz-source.mjs';

function replaceOnce(source, target, replacement) {
  const index = source.indexOf(target);
  if (index < 0 || source.indexOf(target, index + target.length) !== -1) {
    throw new Error('Expected one occurrence of ' + target);
  }
  return source.slice(0, index) + replacement + source.slice(index + target.length);
}

const readScript = name => readFile(new URL('../clinical-quiz/' + name, import.meta.url), 'utf8');
const session = (await Promise.all(['session.js', 'navigation.js', 'diagnostics.js'].map(readScript))).join('\n');
const storage = await readScript('storage.js');
const banks = await readScript('banks.js');
let html = await readOriginal();
const bankPattern = /(?:const hs=|,vs=)("(?:\\.|[^"\\])*")/g;
const matches = [...html.matchAll(bankPattern)];
if (matches.length !== 2) throw new Error('Expected two embedded banks.');
for (const [full, originalLiteral] of matches) {
  const originalBank = JSON.parse(originalLiteral);
  const firstScript = originalBank.indexOf('<script>');
  if (firstScript < 0) throw new Error('Missing embedded script.');
  const isolatedBank = originalBank.slice(0, firstScript) + '<script>\n' + storage + '</script>\n' + originalBank.slice(firstScript);
  const patchedBank = isolatedBank + '\n<script>\n' + session + '</script>\n';
  const literal = JSON.stringify(patchedBank).replaceAll('<', '\\u003c');
  html = replaceOnce(html, full, full.slice(0, -originalLiteral.length) + literal);
}

const start = html.indexOf('let current=null;function choose(k,approved=false)');
const end = html.lastIndexOf('</script>');
if (start === -1 || end <= start) throw new Error('Missing bank selector.');
await writeFile(development, html.slice(0, start) + banks + html.slice(end));
