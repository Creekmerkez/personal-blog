import sharp from 'sharp';
import { stat, unlink } from 'node:fs/promises';

const files = ['2','3','4','5','6','7'];

for (const n of files) {
  const src = `public/images/${n}.png`;
  const dst = `public/images/${n}.jpg`;
  const before = (await stat(src)).size;
  await sharp(src)
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dst);
  const after = (await stat(dst)).size;
  console.log(`${n}.png ${Math.round(before/1024)}KB → ${n}.jpg ${Math.round(after/1024)}KB  (-${Math.round((before-after)/1024)}KB)`);
  await unlink(src);
}
