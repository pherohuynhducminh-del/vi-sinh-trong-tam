import { writeFile } from 'node:fs/promises';
import { development, readOriginal } from './quiz-source.mjs';

await writeFile(development, await readOriginal());
