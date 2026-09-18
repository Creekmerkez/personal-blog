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
  // Served from our own domain rather than i.ytimg.com. One of these is used
  // as a homepage carousel background, so hotlinking meant Google was
  // contacted on the landing page before the visitor touched anything.
  thumbnail: `/images/youtube/${video.id}.jpg`,
  // youtube-nocookie.com, not youtube.com: the standard embed drops tracking
  // cookies on the visitor before they press play. This variant doesn't.
  embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}?controls=1&rel=0&modestbranding=1`,
  autoplayEmbedUrl: `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&controls=1&rel=0&modestbranding=1`,
}));

export default videos;