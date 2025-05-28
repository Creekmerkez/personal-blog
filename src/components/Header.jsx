import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

const Header = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const videoRef = useRef(null);

  // Controls visibility logic
  const [controlsVisible, setControlsVisible] = useState(true);
  let hideTimeout = useRef();

  const showControls = () => {
    clearTimeout(hideTimeout.current);
    setControlsVisible(true);
  };
  const hideControls = () => {
    hideTimeout.current = setTimeout(() => setControlsVisible(false), 1200);
  };

  // Clean up timeout on unmount
  useEffect(() => () => clearTimeout(hideTimeout.current), []);

  const handleVideoError = (e) => {
    console.error('Video error:', e);
    setError(true);
    setIsLoading(false);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);

    // Initialize captions as hidden
    const video = videoRef.current;
    if (video && video.textTracks.length > 0) {
      video.textTracks[0].mode = 'hidden';
    }
  };

  const togglePlay = () => {
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

  const toggleCaptions = () => {
    const video = videoRef.current;
    if (!video || !video.textTracks.length) return;

    const track = video.textTracks[0];
    const newCaptionsState = !captionsEnabled;
    track.mode = newCaptionsState ? 'showing' : 'hidden';
    setCaptionsEnabled(newCaptionsState);
  };

  const handleMouseEnter = () => setControlsVisible(true);
  const handleMouseLeave = () => setControlsVisible(false);
  const handleTouchStart = () => setControlsVisible(true);

  // Hide controls after 3 seconds of inactivity on touch devices
  useEffect(() => {
    if (controlsVisible) {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [controlsVisible]);

  // Format time in MM:SS format
  const formatTime = (timeInSeconds) => {
    if (!isFinite(timeInSeconds)) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update time and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      setCurrentTime(formatTime(video.currentTime));
      setDuration(formatTime(video.duration));
    };
    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', update);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('loadedmetadata', update);
    };
  }, []);

  // Captions toggle logic
  const handleCaptions = () => {
    const video = videoRef.current;
    if (!video || !video.textTracks.length) return;
    const track = video.textTracks[0];
    const newState = !captionsEnabled;
    track.mode = newState ? 'showing' : 'hidden';
    setCaptionsEnabled(newState);
  };

  // SVG icons for YouTube-like controls (no black circle, YouTube style)
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
  const CCIcon = (enabled) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="14" fill={enabled ? '#fff' : 'rgba(0,0,0,0.7)'} /><text x="7" y="19" fontSize="11" fontWeight="bold" fill={enabled ? '#222' : '#fff'}>CC</text></svg>
  );

  // Progress bar logic
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

  // Common button style for YouTube look (no background)
  const ytButtonStyle = {
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.18s',
  };
  const ytButtonHoverStyle = {
    background: 'rgba(60,60,60,0.18)'
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  const navWidth = isMobile ? '100%' : '60%';

  return (
    <header className="header">
      <div className="header-video-container"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseEnter}
        onMouseLeave={hideControls}
        onTouchStart={handleTouchStart}
      >
        <video
          className="header-video"
          ref={videoRef}
          src="/videos/banner.mp4"
          autoPlay
          muted={isMuted}
          loop
        >
          <track kind="captions" src="/videos/banner.vtt" srcLang="en" label="English" default />
        </video>
        <div
          className="video-controls"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: isMobile ? 0 : '2.5rem',
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
          <div className="progress-bar-container" style={{ width: navWidth, height: '6px', background: 'rgba(255,255,255,0.25)', borderRadius: '3px', marginBottom: '0.7rem', cursor: 'pointer', position: 'relative' }} onClick={handleSeekBar}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#f00', borderRadius: '3px', transition: 'width 0.2s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: navWidth, padding: isMobile ? '0 12px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <button
                className="header-control-btn"
                onClick={togglePlay}
                style={ytButtonStyle}
                onMouseOver={e => e.currentTarget.style.background = ytButtonHoverStyle.background}
                onMouseOut={e => e.currentTarget.style.background = ytButtonStyle.background}
              >{isPlaying ? PauseIcon : PlayIcon}</button>
              <button
                className="header-control-btn"
                onClick={toggleMute}
                style={ytButtonStyle}
                onMouseOver={e => e.currentTarget.style.background = ytButtonHoverStyle.background}
                onMouseOut={e => e.currentTarget.style.background = ytButtonStyle.background}
              >{isMuted ? MuteIcon : UnmuteIcon}</button>
            </div>
            <span style={{ color: '#fff', fontSize: '1.1rem', fontFamily: 'monospace', minWidth: '80px', textAlign: 'center', marginLeft: 'auto' }}>{currentTime} / {duration}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 