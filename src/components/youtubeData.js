const youtubeVideos = [
  { id: 'BTqXM0srww8', title: 'Desperate Fall' },
  { id: 'IU_USVhpDOE', title: 'The Dream of Night City' },
  { id: 'Ums3mwdrFJM', title: 'Poor Folk' },
  { id: 'IAd9StDN85Q', title: 'Peace and Wind' },
  { id: 'tLjAKEfK-xg', title: 'Heavy Sand' },
  { id: '4v1R271lJ4o', title: 'Mix VI' },
];

function shuffle(input) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const videos = shuffle(youtubeVideos).map((video, index) => ({
  ...video,
  order: index + 1,
  thumbnail: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
  embedUrl: `https://www.youtube.com/embed/${video.id}?controls=1&rel=0&modestbranding=1`,
  autoplayEmbedUrl: `https://www.youtube.com/embed/${video.id}?autoplay=1&controls=1&rel=0&modestbranding=1`,
}));

export default videos;