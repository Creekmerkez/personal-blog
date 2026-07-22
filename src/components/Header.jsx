import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const videoRef = useRef(null);

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeout = useRef();

  useEffect(() => () => clearTimeout(hideTimeout.current), []);

  const handleVideoLoad = () => {
    const video = videoRef.current;
    if (video && video.textTracks.length > 0) {
      video.textTracks[0].mode = 'hidden';
    }
  };

  const togglePlay = (e) => {
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleMouseEnter = () => setControlsVisible(true);
  const handleMouseLeave = () => {
    if (!isMobile) setControlsVisible(false);
  };
  const handleTouchStart = () => setControlsVisible(true);

  useEffect(() => {
    if (controlsVisible) {
      const timer = setTimeout(() => setControlsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [controlsVisible]);

  const formatTime = (timeInSeconds) => {
    if (!isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      setCurrentTime(formatTime(video.currentTime));
      setDuration(formatTime(video.duration));
      setProgress((video.currentTime / video.duration) * 100 || 0);
    };
    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', update);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('loadedmetadata', update);
    };
  }, []);

  const handleSeekBar = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const percent = (x - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
    setProgress(percent * 100);
  };

  const ytButtonStyle = {
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.18s',
  };

  const PlayIcon = (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <polygon points="12,8 28,18 12,28" fill="#fff"/>
    </svg>
  );
  const PauseIcon = (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="11" y="8" width="5" height="20" rx="2.5" fill="#fff"/>
      <rect x="20" y="8" width="5" height="20" rx="2.5" fill="#fff"/>
    </svg>
  );
  const MuteIcon = (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M10 14v8h6l7 7V7l-7 7h-6z" fill="#fff"/>
      <line x1="10" y1="7" x2="30" y2="29" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
  const UnmuteIcon = (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M10 14v8h6l7 7V7l-7 7h-6z" fill="#fff"/>
      <path d="M25 18c0-2.5-1.5-4.5-3.5-5.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M25 18c0 2.5-1.5 4.5-3.5 5.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
    </svg>
  );

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <header className="header">
      {/* LEFT: Bio panel */}
      <div className="header-bio-panel">
        <div className="header-bio-content">
          <p className="bio-narrow">
            Hi there! I'm a <span className="highlight">Test Automation Engineer</span> with over a decade of experience in IT, but my journey extends beyond technology into the realms of music, writing, and conscious living.
          </p>
          <p>
            Music has always been a vital part of my life. Through <span className="highlight">DJing</span>, I've created <span className="highlight">17 mixes</span>, each one a unique expression of creativity and emotion. While currently on pause, this passion remains an essential part of who I am.
          </p>
          <p>
            <span className="highlight">Prague</span> is my home, where I live with my <span className="highlight">wonderful husband and our son</span> who constantly inspires me. Together, we embrace a lifestyle centered on freedom, flexibility, and mindful choices.
          </p>
          <p>
            Writing <span className="highlight">children's books</span> brings me immense joy. Each story I write aims to spark curiosity and imagination in young minds. My books reflect my belief in the power of storytelling to shape young perspectives.
          </p>
          <p>
            Living consciously guides my choices - from maintaining a <span className="highlight">meat-free diet</span> to ensuring everything I use aligns with <span className="highlight">cruelty-free</span> values. This commitment reflects my deep respect for all forms of life.
          </p>
          <p className="bio-narrow">
            I also help others create meaningful digital experiences through AI-powered solutions. If you're interested in crafting something unique and beautiful, I'd love to collaborate.
          </p>
          <div className="signature">
            Yulia M.<span className="signature-flourish">~</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Video panel */}
      <div
        className="header-video-panel"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
      >
        <video
          className="header-video"
          ref={videoRef}
          src="/videos/banner.mp4"
          autoPlay
          muted={isMuted}
          loop
          onClick={togglePlay}
          onLoadedData={handleVideoLoad}
          style={{ cursor: 'pointer' }}
        >
          <track kind="captions" src="/videos/banner.vtt" srcLang="en" label="English" default />
        </video>
        <div
          className="video-controls"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: isMobile ? 0 : '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            width: '100%',
            opacity: controlsVisible ? 1 : 0,
            pointerEvents: controlsVisible ? 'auto' : 'none',
            transition: 'opacity 0.35s',
          }}
        >
          <div
            className="progress-bar-container"
            style={{ width: '88%', height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '3px', marginBottom: '0.6rem', cursor: 'pointer' }}
            onClick={handleSeekBar}
          >
            <div style={{ width: `${progress}%`, height: '100%', background: '#f00', borderRadius: '3px', transition: 'width 0.2s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '88%', padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                className="header-control-btn"
                onClick={togglePlay}
                style={ytButtonStyle}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >{isPlaying ? PauseIcon : PlayIcon}</button>
              <button
                className="header-control-btn"
                onClick={toggleMute}
                style={ytButtonStyle}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(60,60,60,0.18)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >{isMuted ? MuteIcon : UnmuteIcon}</button>
            </div>
            <span style={{ color: '#fff', fontSize: '1rem', fontFamily: 'monospace', minWidth: '80px', textAlign: 'right' }}>
              {currentTime} / {duration}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
