// Holographic gallery photos — auto-loaded from:
//   public/images/instagram photos/
//
// HOW IT WORKS
//   • Every image in that folder is discovered automatically at build time.
//     Drop new photos in (or remove some) and they're picked up on the next
//     build / deploy — no need to edit this file.
//   • On EACH page reload, a random 12 of those photos are chosen and shuffled,
//     so the gallery looks different every visit.
//
// Supported file types: .jpg .jpeg .png .webp .gif (any capitalization).

const MAX_PHOTOS = 12;

// Vite globs the folder at build time and returns each image's final URL.
const modules = import.meta.glob(
  '../../public/images/instagram photos/*.{jpg,jpeg,png,webp,gif,JPG,JPEG,PNG,WEBP,GIF}',
  { eager: true, query: '?url', import: 'default' }
);

const allUrls = Object.values(modules);

// Fisher–Yates shuffle (runs once per page load → fresh order each reload).
function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const photos = shuffle(allUrls)
  .slice(0, MAX_PHOTOS)
  .map((src, i) => ({
    id: i + 1,
    src,
    alt: `Photo ${i + 1}`,
  }));

export default photos;
