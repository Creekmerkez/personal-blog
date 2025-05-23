import React from 'react';
import '../styles/YouTubeVideo.css';

const videoLinks = [
  'https://youtu.be/BTqXM0srww8',
  'https://youtu.be/IU_USVhpDOE',
  'https://youtu.be/Ums3mwdrFJM',
  'https://youtu.be/IAd9StDN85Q?si=Jjh8rBZGHQR-miUf',
  'https://youtu.be/tLjAKEfK-xg?si=ezBuT7Q4olGC2U9J',
  // 'https://youtu.be/edajWZRKG6M?si=HKns-AShlMhpeSnC', // 6th video, not shown
];

function getEmbedUrl(link) {
  // Extract the video ID from youtu.be or youtube.com URLs
  const match = link.match(/youtu(?:\.be\/|be\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)?)([\w-]{11})/);
  const id = match ? match[1] : '';
  return id
    ? `https://www.youtube.com/embed/${id}?controls=1&rel=0&modestbranding=1`
    : '';
}

const YouTubeVideo = () => {
  return (
    <section className="youtube-videos">
      <div className="youtube-container">
        <div className="youtube-videos-grid">
          {videoLinks.map((link, idx) => (
            <div className="youtube-video-wrapper" key={idx}>
              <iframe
                width="360"
                height="203"
                src={getEmbedUrl(link)}
                title="YouTube video player"
                frameBorder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default YouTubeVideo; 