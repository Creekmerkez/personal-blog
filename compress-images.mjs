import sharp from 'sharp';
import { readdir, stat, writeFile, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';

const DIR = 'public/images/instagram photos';
const MAX_PX = 1200;
const QUALITY = 78;

const files = (await readdir(DIR)).filter(f => /\.(jpe?g|png|webp)$/i.test(f));

let savedTotal = 0;
for (const file of files) {
  const src = join(DIR, file);
  const before = (await stat(src)).size;
  const tmp = join(tmpdir(), randomBytes(8).toString('hex') + '.jpg');

  const buf = await sharp(src)
    .resize(MAX_PX, MAX_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toBuffer();

  if (buf.length < before) {
    await writeFile(tmp, buf);
    await unlink(src);
    await rename(tmp, src);
    const saved = before - buf.length;
    savedTotal += saved;
    console.log(`${file}: ${Math.round(before/1024)}KB → ${Math.round(buf.length/1024)}KB  (-${Math.round(saved/1024)}KB)`);
  } else {
    console.log(`${file}: already optimal, skipped`);
  }
}
console.log(`\nTotal saved: ${Math.round(savedTotal/1024)}KB`);
