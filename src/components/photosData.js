// Holographic gallery photos — auto-loaded from:
//   src/assets/instagram-photos/
//
// They live under src/ rather than public/ on purpose: Vite copies public/
// verbatim into the build AND emits a hashed copy for anything imported, so
// photos kept there would ship twice — 16MB of dead weight at current counts.
//
// HOW IT WORKS
//   • Every image in that folder is discovered automatically at build time.
//     Drop new photos in (or remove some) and they're picked up on the next
//     build / deploy — no need to edit this file.
//   • A random 12 of those photos are shown, and that selection changes ONCE
//     A WEEK rather than on every reload — so the gallery stays steady while
//     someone is browsing, but looks fresh if they come back later. No deploy
//     is needed for it to rotate; it follows the visitor's clock.
//
// Supported file types: .jpg .jpeg .png .webp .gif (any capitalization).

const MAX_PHOTOS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Vite globs the folder at build time and returns each image's final URL.
const modules = import.meta.glob(
  '../assets/instagram-photos/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}',
  { eager: true, query: '?url', import: 'default' }
);

const allUrls = Object.values(modules);

// Mulberry32: a tiny seeded generator. Math.random() would reshuffle on every
// reload — seeding by week number instead means the same week always produces
// the same selection, and it rolls over on its own.
function seededRandom(seed) {
  let state = seed;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(input, random) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const weekNumber = Math.floor(Date.now() / WEEK_MS);

const photos = shuffle(allUrls, seededRandom(weekNumber))
  .slice(0, MAX_PHOTOS)
  .map((src, i) => ({
    id: i + 1,
    src,
    alt: `Photo ${i + 1}`,
  }));

export default photos;
