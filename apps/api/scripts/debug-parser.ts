import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';

const here = path.dirname(fileURLToPath(import.meta.url));
const docxPath = path.resolve(here, '../../../docs/Generic 2024 final 62.docx');

const { value: raw } = await mammoth.extractRawText({ path: docxPath });
const lines = raw.split('\n').map((l) => l.replace(/ /g, ' '));

const targets = [1436, 1996, 2940, 3176];
for (const t of targets) {
  console.log(`\n=== Context around L${t} ===`);
  for (let i = t - 14; i <= t + 4; i++) {
    if (i < 0 || i >= lines.length) continue;
    const mark = i === t ? '>>>' : '   ';
    const blank = lines[i]!.trim() === '' ? '[blank]' : '';
    console.log(`${mark} L${i}${blank}: ${lines[i]!.slice(0, 130)}`);
  }
}
