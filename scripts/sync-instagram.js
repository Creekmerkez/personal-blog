#!/usr/bin/env node
// Downloads photos from the connected Instagram Professional account into
// src/assets/instagram-photos/, which the holographic gallery globs at build
// time (see src/components/photosData.js).
//
// Additive only: it never deletes or overwrites. Photos you added by hand
// stay, and a post already downloaded is skipped on later runs.
//
//   IG_ACCESS_TOKEN=... npm run sync:instagram
//
// Token comes from the Meta app dashboard: Instagram > API setup >
// "Generate token". It lasts 60 days; `npm run sync:instagram -- --refresh`
// extends it another 60 and prints the new one.

import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const API = 'https://graph.instagram.com/v25.0';
const REFRESH_URL = 'https://graph.instagram.com/refresh_access_token';
const DEST = join(process.cwd(), 'src', 'assets', 'instagram-photos');
const MAX_POSTS = 50;

// Instagram serves 1440px originals up to ~2.4MB each. The gallery renders
// them in a card a few hundred pixels wide, so full resolution only costs
// mobile visitors load time — and every synced photo lives in git forever.
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 82;

const token = process.env.IG_ACCESS_TOKEN;
if (!token) {
  console.error(
    'IG_ACCESS_TOKEN is not set.\n' +
      'Add it to .env.local (already gitignored) or pass it inline:\n' +
      '  IG_ACCESS_TOKEN=xxx npm run sync:instagram'
  );
  process.exit(1);
}

async function callApi(url) {
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    throw new Error(
      `Instagram API ${res.status}: ${e.message ?? 'unknown error'}` +
        (e.code ? ` (code ${e.code})` : '') +
        (e.code === 190 ? '\nThe token is expired or invalid — generate a new one.' : '')
    );
  }
  return body;
}

// Walks pagination until MAX_POSTS, so a large account doesn't pull everything.
async function fetchRecentPosts() {
  const fields = 'id,media_type,media_url,permalink,timestamp,children{id,media_type,media_url}';
  let url = `${API}/me/media?fields=${fields}&limit=25&access_token=${token}`;
  const posts = [];

  while (url && posts.length < MAX_POSTS) {
    const page = await callApi(url);
    posts.push(...(page.data ?? []));
    url = page.paging?.next;
  }
  return posts.slice(0, MAX_POSTS);
}

// A carousel holds several images under `children`; a plain post is one image.
// Videos have no still worth showing in a photo gallery, so they're dropped.
function toImages(posts) {
  return posts.flatMap((post) => {
    if (post.media_type === 'IMAGE') {
      return [{ id: post.id, url: post.media_url }];
    }
    if (post.media_type === 'CAROUSEL_ALBUM') {
      return (post.children?.data ?? [])
        .filter((child) => child.media_type === 'IMAGE')
        .map((child) => ({ id: child.id, url: child.media_url }));
    }
    return [];
  });
}

async function refreshToken() {
  const body = await callApi(
    `${REFRESH_URL}?grant_type=ig_refresh_token&access_token=${token}`
  );

  // --quiet prints the bare token and nothing else, so CI can capture it into
  // a masked variable. Anything extra on stdout would end up in the workflow
  // log, which is public on this repo.
  if (process.argv.includes('--quiet')) {
    process.stdout.write(body.access_token);
    return;
  }

  const days = Math.round((body.expires_in ?? 0) / 86400);
  console.log(`New token (valid ~${days} days):\n\n${body.access_token}\n`);
  console.log('Update IG_ACCESS_TOKEN in .env.local with the value above.');
}

async function sync() {
  await mkdir(DEST, { recursive: true });
  const existing = new Set(await readdir(DEST));

  const images = toImages(await fetchRecentPosts());
  if (images.length === 0) {
    console.log('No photos found on the account.');
    return;
  }

  let added = 0;
  for (const image of images) {
    const filename = `ig_${image.id}.jpg`;
    if (existing.has(filename)) continue;

    const res = await fetch(image.url);
    if (!res.ok) {
      console.warn(`  skipped ${filename} — download failed (${res.status})`);
      continue;
    }
    const original = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(original)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    await writeFile(join(DEST, filename), resized);
    const saved = Math.round((1 - resized.length / original.length) * 100);
    console.log(`  + ${filename} (${Math.round(resized.length / 1024)}KB, -${saved}%)`);
    added += 1;
  }

  console.log(
    added === 0
      ? `Already up to date (${images.length} photos on Instagram, all present).`
      : `Added ${added} new photo${added === 1 ? '' : 's'}. Run \`npm run deploy\` to publish.`
  );
}

const run = process.argv.includes('--refresh') ? refreshToken : sync;
run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
