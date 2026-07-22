import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/HomeCarousel.css';
import HolographicPlayer from './HolographicPlayer';
import HolographicGallery from './HolographicGallery';
import HolographicBooks from './HolographicBooks';
import HolographicYouTube from './HolographicYouTube';
import HolographicAI from './HolographicAI';
import HolographicCeskeSamples from './HolographicCeskeSamples';
import galleryPhotos from './photosData';
import youtubeVideos from './youtubeData';

const heroVideoSrc = '/videos/banner.mp4';

// Random photo from the gallery as the Photos card cover (picked once per page load,
// in sync with the gallery's own random shuffle). Falls back to a book image.
const photosCover = galleryPhotos[0]?.src ?? '/images/book3.jpg';
const youtubeCover = youtubeVideos[0]?.thumbnail ?? '/images/book1.jpg';
// External Pinterest URL was blocked by Pinterest's hotlink protection, causing
// the card to render as a grey/white rectangle on Android (gradient only, no image).
// Replaced with a local dark gradient — no external dependency.
const ceskeRealieCover = '/images/ceske-realie-cover.png';
const myAICardCover = '/images/my-ai-card.jpg';

const cards = [
  {
    id: 'youtube',
    title: 'My Music',
    subtitle: 'Music I Created',
    background: youtubeCover,
    actionType: 'youtube',
  },
  {
    id: 'books',
    title: 'My Books',
    subtitle: 'Written Words',
    background: '/images/book2.jpg',
    actionType: 'books',
  },
  {
    id: 'ceske-realie',
    title: 'České Reálie',
    subtitle: 'Czech Realities',
    background: ceskeRealieCover,
    actionType: 'ceske-samples',
  },
  {
    id: 'photos',
    title: 'Photos',
    subtitle: 'Visual Stories',
    background: photosCover,
    actionType: 'gallery',
  },
  {
    id: 'about',
    title: 'About',
    subtitle: 'The story behind the work',
    background: '/images/book1.jpg',
    actionType: 'modal',
    action: heroVideoSrc,
    videoSrc: heroVideoSrc,
  },
  {
    id: 'contact',
    title: 'MY AI',
    subtitle: 'Ask Me Anything',
    background: myAICardCover,
    actionType: 'ai',
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const HomeCarousel = () => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isHologramOpen, setIsHologramOpen] = useState(false);
  const [hologramVideoEl, setHologramVideoEl] = useState(null);
  const [aboutOrigin, setAboutOrigin] = useState(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryOrigin, setGalleryOrigin] = useState(null);
  const [isBooksOpen, setIsBooksOpen] = useState(false);
  const [booksOrigin, setBooksOrigin] = useState(null);
  const [isYouTubeOpen, setIsYouTubeOpen] = useState(false);
  const [youtubeOrigin, setYouTubeOrigin] = useState(null);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiOrigin, setAiOrigin] = useState(null);
  const [isCeskeSamplesOpen, setIsCeskeSamplesOpen] = useState(false);
  const [ceskeSamplesOrigin, setCeskeSamplesOrigin] = useState(null);
  const rotationRef = useRef(144);
  const velocityRef = useRef(0);
  const snapTargetRef = useRef(null);
  const pointerRef = useRef({ active: false, startX: 0, lastX: 0 });
  const dragStartedRef = useRef(false);
  const lastWheelRef = useRef(0);
  const frameRef = useRef(null);
  const stageRef = useRef(null);
  // Refs for direct DOM animation — no React re-render during rotation.
  const cardRefs = useRef([]);
  const hoveredRef = useRef(null);
  const selectedCardRef = useRef(null);
  const isHologramOpenRef = useRef(false);
  const frontCardIdRef = useRef(null);

  useEffect(() => {
    const previousBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#ffffff';
    return () => {
      document.body.style.backgroundColor = previousBg;
    };
  }, []);

  // Preload dynamic card covers (static ones are preloaded via <link rel="preload"> in index.html)
  useEffect(() => {
    [photosCover, youtubeCover].forEach(src => {
      if (src) { const img = new Image(); img.src = src; }
    });
  }, []);

  // Preload gallery/ceske images on card hover so they're cached before the popup opens
  const preloadGallery = useCallback(() => {
    galleryPhotos.forEach(p => { const img = new Image(); img.src = p.src; });
  }, []);

  const preloadCeske = useCallback(() => {
    ['2','3','4','5','6','7'].forEach(n => { const img = new Image(); img.src = `/images/${n}.jpg`; });
  }, []);

  // Inject mobile overrides at runtime to cover cached-CSS scenarios.
  // ::before and ::after are now scoped to min-width:601px in the stylesheet
  // so they simply don't exist on mobile — no hiding rules needed for them.
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 600px) {
        .card-overlay { display: none !important; }
        .card-reflection { display: none !important; }
        .carousel-card.photos-card .card-face::after { display: none !important; }
        .holo-gallery-stage,
        .holo-gallery-panel { transition: none !important; will-change: auto !important; }
        .holo-gallery-stage:not(.visible) { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Write card transforms/styles directly to the DOM — bypasses React's render
  // cycle so Android GPU never has to clear+re-rasterize card textures at 60 fps.
  const applyCardStyles = useCallback((rot) => {
    const mob = window.innerWidth < 600;
    let newFrontId = null;
    cards.forEach((card, index) => {
      const el = cardRefs.current[index];
      if (!el) return;
      const baseAngle = (360 / cards.length) * index;
      const angle = (baseAngle + rot) % 360;
      const radians = (angle * Math.PI) / 180;
      const x = Math.sin(radians) * (mob ? 46 : 22.4);
      const z = Math.cos(radians);
      const depth = (z + 1) / 2;
      const y = 2 + (1 - depth) * (mob ? 2.5 : 4.75);
      const scale = 0.66 + depth * 0.44;
      const opacity = 0.32 + depth * 0.72;
      const brightness = 0.22 + depth * 0.68;
      const saturate = 0.20 + depth * 0.75;
      const contrast = 0.78 + depth * 0.32;
      const blur = mob ? 0 : clamp((1 - depth) * 2.4, 0, 2.4);
      const rotateY = Math.sin(radians) * 34;
      const zIndex = Math.round(depth * 100);
      const isFront = depth > 0.88;
      const isHov = hoveredRef.current === card.id;
      const sel = card.id === selectedCardRef.current && isHologramOpenRef.current;
      const finalScale = scale * (isHov ? 1.12 : 1) * (sel ? 1.14 : 1) * 0.75;
      const finalBrightness = brightness + (isFront && !isHov ? 0.26 : 0) + (isHov ? 0.28 : 0) + (sel ? 0.10 : 0);
      const finalSaturate = saturate + (isFront && !isHov ? 0.52 : 0) + (isHov ? 0.55 : 0) + (sel ? 0.15 : 0);
      const finalContrast = contrast + (isFront ? 0.10 : 0) + (isHov ? 0.05 : 0) + (sel ? 0.05 : 0);
      const filter = `brightness(${finalBrightness}) saturate(${finalSaturate}) contrast(${finalContrast}) blur(${blur}px)`;

      el.style.zIndex = zIndex;
      el.style.transform = `translateX(${x}vw) translateY(${y}vh) translateZ(${z * (mob ? 90 : 176)}px) rotateY(${rotateY}deg) scale(${finalScale})`;
      if (mob) { el.style.opacity = opacity; el.style.filter = filter; }
      else { el.style.opacity = ''; el.style.filter = ''; }
      el.classList.toggle('carousel-card-front', isFront);
      if (isFront) newFrontId = card.id;

      const face = el.querySelector('.card-face');
      if (face && !mob) { face.style.opacity = opacity; face.style.filter = filter; }
      el.querySelectorAll('.card-edge').forEach(e => { e.style.opacity = opacity; });

      if (!mob) {
        const ref = el.querySelector('.card-reflection');
        if (ref) {
          const ro = clamp(0.12 + depth * 0.34 + (sel ? 0.06 : 0), 0.12, 0.56);
          const rb = clamp(1.35 - depth * 0.95, 0.42, 1.35);
          ref.style.opacity = ro;
          ref.style.filter = `blur(${rb}px) brightness(${0.74 + depth * 0.3}) saturate(${0.9 + depth * 0.24})`;
        }
      }
    });
    frontCardIdRef.current = newFrontId;
  }, []);

  // Apply styles once after mount, then whenever hover/selection/hologram changes.
  useLayoutEffect(() => { applyCardStyles(rotationRef.current); }, [applyCardStyles]);
  useLayoutEffect(() => {
    hoveredRef.current = hovered;
    applyCardStyles(rotationRef.current);
  }, [hovered, applyCardStyles]);
  useLayoutEffect(() => {
    selectedCardRef.current = selectedCard;
    isHologramOpenRef.current = isHologramOpen;
    applyCardStyles(rotationRef.current);
  }, [selectedCard, isHologramOpen, applyCardStyles]);

  useEffect(() => {
    const animate = () => {
      if (!pointerRef.current.active) {
        if (snapTargetRef.current !== null) {
          // Spring toward the nearest card position
          const diff = snapTargetRef.current - rotationRef.current;
          if (Math.abs(diff) < 0.08) {
            rotationRef.current = snapTargetRef.current;
            snapTargetRef.current = null;
          } else {
            rotationRef.current += diff * 0.12;
          }
        } else {
          // Gentle auto-rotation when idle
          rotationRef.current += 0.025;
        }
        applyCardStyles(rotationRef.current);
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [applyCardStyles]);

  // Native touch events — bypasses the Pointer Events API entirely to avoid
  // the iOS Safari setPointerCapture bug (bogus clientX=0 events).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    let startX = 0;
    let lastX = 0;
    let dragging = false;
    let touchStartTime = 0;
    const STEP = 360 / cards.length;
    const DRAG_THRESHOLD = 8;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      lastX = startX;
      dragging = false;
      touchStartTime = Date.now();
      snapTargetRef.current = null; // Cancel any active snap on new touch
    };

    const onTouchMove = (e) => {
      if (e.touches.length < 1) return;
      const x = e.touches[0].clientX;
      if (!dragging) {
        if (Math.abs(x - startX) < DRAG_THRESHOLD) return;
        dragging = true;
        pointerRef.current.active = true;
        lastX = x;
      }
      e.preventDefault();
      const delta = x - lastX;
      lastX = x;
      // EMA velocity so fast swipes carry momentum even when finger decelerates
      velocityRef.current = velocityRef.current * 0.6 + delta * 0.38 * 0.4;
      rotationRef.current = (rotationRef.current + delta * 0.8) % 360;
      applyCardStyles(rotationRef.current);
    };

    const onTouchEnd = (e) => {
      const wasDragging = dragging;
      pointerRef.current.active = false;
      dragging = false;

      if (wasDragging) {
        const v = velocityRef.current;
        // Cap coasting to one card-step so a quick flick moves exactly one
        // position and never overshoots multiple cards.
        const coasting = Math.max(-STEP, Math.min(STEP, v / 0.06));
        const projected = rotationRef.current + coasting;
        // Direction-aware snap: a rightward swipe always advances forward,
        // never snaps backward — Math.round was the root cause of the oscillation
        // (it could round in the opposite direction of the swipe).
        let target;
        if (v > 0.2) {
          target = Math.ceil(projected / STEP) * STEP;
        } else if (v < -0.2) {
          target = Math.floor(projected / STEP) * STEP;
        } else {
          target = Math.round(projected / STEP) * STEP;
        }
        snapTargetRef.current = target;
        velocityRef.current = 0;
      } else if (e.changedTouches.length > 0) {
        // Always preventDefault — stops browser's native ~300 ms click synthesis.
        e.preventDefault();
        const touchDuration = Date.now() - touchStartTime;
        const touch = e.changedTouches[0];
        const totalMovement = Math.abs(touch.clientX - startX);
        // Only open a popup for a quick deliberate tap (< 250 ms, < 5 px drift).
        // Even then, only fire if the tapped card is CURRENTLY the front card —
        // computed directly from rotationRef (always current, never a frame
        // behind React state) so an in-flight swipe can never open a popup.
        if (touchDuration < 250 && totalMovement < 5) {
          const el = document.elementFromPoint(touch.clientX, touch.clientY);
          const cardEl = el && el.closest('[data-card-id]');
          if (cardEl) {
            const cardId = cardEl.dataset.cardId;
            const cardIndex = cards.findIndex(c => c.id === cardId);
            if (cardIndex !== -1) {
              const baseAngle = (360 / cards.length) * cardIndex;
              const angle = (baseAngle + rotationRef.current) % 360;
              const radians = (angle * Math.PI) / 180;
              const depth = (Math.cos(radians) + 1) / 2;
              if (depth > 0.88) {
                el.click();
              }
            }
          }
        }
      }
    };

    stage.addEventListener('touchstart', onTouchStart);
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd, { passive: false });
    stage.addEventListener('touchcancel', () => { pointerRef.current.active = false; dragging = false; });

    return () => {
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('touchcancel', () => {});
    };
  }, [applyCardStyles]);


  const closeHologram = () => {
    const v = hologramVideoEl;
    if (v) {
      try { v.pause(); } catch { /* ignore */ }
      try { v.src = ''; } catch { /* ignore */ }
    }
    setIsHologramOpen(false);
    setSelectedCard(null);
    setHologramVideoEl(null);
  };

  const handleNavigation = (event, card) => {
    if (dragStartedRef.current) return; // dragged, not clicked — suppress navigation
    if (window.innerWidth < 600 && card.id !== frontCardIdRef.current) return;
    if (window.innerWidth < 600 && snapTargetRef.current !== null) return;

    if (card.actionType === 'route') {
      navigate(card.action);
      return;
    }

    if (card.actionType === 'ceske-samples') {
      const rect = event.currentTarget.getBoundingClientRect();
      setCeskeSamplesOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setIsCeskeSamplesOpen(true);
      return;
    }

    if (card.actionType === 'youtube') {
      const rect = event.currentTarget.getBoundingClientRect();
      setYouTubeOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setIsYouTubeOpen(true);
      return;
    }

    if (card.actionType === 'gallery') {
      const rect = event.currentTarget.getBoundingClientRect();
      setGalleryOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setIsGalleryOpen(true);
      return;
    }

    if (card.actionType === 'books') {
      const rect = event.currentTarget.getBoundingClientRect();
      setBooksOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setIsBooksOpen(true);
      return;
    }

    if (card.actionType === 'ai') {
      const rect = event.currentTarget.getBoundingClientRect();
      setAiOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      setIsAIOpen(true);
      return;
    }

    if (card.actionType === 'external') {
      window.open(card.action, '_blank', 'noopener');
      return;
    }

    if (card.actionType === 'modal') {
      event.preventDefault();
      event.stopPropagation();
      const rect = event.currentTarget.getBoundingClientRect();
      setAboutOrigin({ left: rect.left, top: rect.top, width: rect.width, height: rect.height });

      // Create a video element under the user's click gesture so playback with audio is allowed.
      const video = document.createElement('video');
      video.src = card.action;
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      try { video.muted = false; } catch { /* ignore */ }
      try { video.defaultMuted = false; } catch { /* ignore */ }
      try { video.volume = 1; } catch { /* ignore */ }
      video.className = 'hologram-video';
      video.style.width = '100%';
      video.style.display = 'none';

      document.body.appendChild(video);

      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {}).catch((err) => {
          console.warn('Hologram video.play() rejected:', err);
          try { video.muted = false; } catch { /* ignore */ }
          try { video.volume = 1; } catch { /* ignore */ }
        });
      }

      flushSync(() => {
        setSelectedCard(card.id);
        setHologramVideoEl(video);
        setIsHologramOpen(true);
      });
    }
  };

  const updateRotation = (delta) => {
    rotationRef.current = (rotationRef.current + delta) % 360;
    applyCardStyles(rotationRef.current);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const STEP = 360 / cards.length;
    const now = Date.now();
    // One wheel tick = one card; 400 ms cooldown lets the snap animation finish
    if (now - lastWheelRef.current < 400) return;
    lastWheelRef.current = now;
    const dir = event.deltaY > 0 ? 1 : -1;
    const base = snapTargetRef.current !== null
      ? snapTargetRef.current
      : Math.round(rotationRef.current / STEP) * STEP;
    snapTargetRef.current = base + dir * STEP;
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'touch') return;
    if (event.button !== 0) return;
    snapTargetRef.current = null;
    pointerRef.current.active = true;
    pointerRef.current.startX = event.clientX;
    pointerRef.current.lastX = event.clientX;
    dragStartedRef.current = false;
    // Don't call setPointerCapture yet — doing so on pointerdown redirects the
    // click event away from the card button. Capture is set once the 5 px drag
    // threshold is crossed in handlePointerMove.
  };

  const handlePointerMove = (event) => {
    if (event.pointerType === 'touch') return;
    if (!pointerRef.current.active) return;
    const delta = event.clientX - pointerRef.current.lastX;
    pointerRef.current.lastX = event.clientX;
    if (!dragStartedRef.current) {
      if (Math.abs(event.clientX - pointerRef.current.startX) < 5) return;
      dragStartedRef.current = true;
      stageRef.current?.setPointerCapture(event.pointerId);
      return; // skip first frame to avoid a position jump at drag start
    }
    velocityRef.current = delta * 0.38;
    updateRotation(delta * 0.8);
  };

  const handlePointerUp = (event) => {
    if (event.pointerType === 'touch') return;
    if (!pointerRef.current.active) return;
    pointerRef.current.active = false;
    if (!dragStartedRef.current) return; // pure click — let button onClick fire naturally
    const step = 360 / cards.length;
    const v = velocityRef.current;
    const coasting = Math.max(-step, Math.min(step, v / 0.06));
    const projected = rotationRef.current + coasting;
    let target;
    if (v > 0.2) {
      target = Math.ceil(projected / step) * step;
    } else if (v < -0.2) {
      target = Math.floor(projected / step) * step;
    } else {
      target = Math.round(projected / step) * step;
    }
    snapTargetRef.current = target;
    velocityRef.current = 0;
    stageRef.current?.releasePointerCapture?.(event.pointerId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      velocityRef.current -= 5;
      updateRotation(-8);
    }
    if (event.key === 'ArrowRight') {
      velocityRef.current += 5;
      updateRotation(8);
    }
  };

  return (
    <main className="home-carousel-page" tabIndex={0} onKeyDown={handleKeyDown}>
      <section className="carousel-hero">
        <div
          className="carousel-stage"
          ref={stageRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          role="group"
          aria-roledescription="carousel"
          aria-label="Homepage navigation carousel"
        >
          <div className="carousel-grid">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                data-card-id={card.id}
                ref={(el) => { cardRefs.current[index] = el; }}
                className={`carousel-card ${card.id === 'about' ? 'about-card' : ''} ${card.id === 'photos' ? 'photos-card' : ''} ${card.id === 'contact' ? 'ai-card' : ''} ${selectedCard === card.id && isHologramOpen ? 'carousel-card-active' : ''}`}
                aria-label={`Open ${card.title}`}
                aria-expanded={card.id === 'about' ? isHologramOpen : undefined}
                onMouseEnter={() => { setHovered(card.id); if (card.id === 'photos') preloadGallery(); if (card.id === 'ceske-realie') preloadCeske(); }}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(card.id)}
                onBlur={() => setHovered(null)}
                onClick={(event) => handleNavigation(event, card)}
              >
                <span className="card-edge left" aria-hidden="true" />
                <span className="card-edge right" aria-hidden="true" />

                <div
                  className="card-face"
                  style={{
                    backgroundColor: card.id === 'about' ? '#090909' : undefined,
                    backgroundImage:
                      card.id === 'about'
                        ? undefined
                        : card.id === 'photos'
                        ? `linear-gradient(165deg, rgba(34, 52, 86, 0.5) 0%, rgba(10, 16, 28, 0.7) 38%, rgba(3, 5, 10, 0.9) 80%), url('${card.background}')`
                        : `linear-gradient(180deg, rgba(6, 7, 12, 0.5) 0%, rgba(4, 5, 9, 0.7) 42%, rgba(2, 3, 6, 0.9) 84%), url('${card.background}')`,
                    backgroundSize: card.id === 'about' ? undefined : 'cover',
                    backgroundPosition: card.id === 'about' ? undefined : 'center',
                  }}
                >
                  {card.id === 'about' && (
                    <>
                      <video
                        className="card-video-preview"
                        src={card.videoSrc}
                        loop
                        muted
                        autoPlay
                        playsInline
                        preload="metadata"
                        aria-hidden="true"
                        tabIndex={-1}
                      />
                      <div
                        className="card-click-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigation(e, card);
                        }}
                        aria-hidden="true"
                      />
                    </>
                  )}
                  <div className="card-overlay" />
                  <div className="card-content">
                    <h2 className="card-title">{card.title}</h2>
                    <span className="card-action">{card.id === 'about' ? 'Watch intro' : card.id === 'ceske-realie' ? 'Download' : card.id === 'books' ? 'Buy' : card.id === 'contact' ? 'Ask Me Anything' : 'Explore'}</span>
                  </div>
                </div>

                <div className="card-reflection" style={{
                  backgroundColor: card.id === 'about' ? 'rgba(12, 12, 18, 0.42)' : undefined,
                  backgroundImage:
                    card.id === 'about'
                      ? undefined
                      : card.id === 'photos'
                      ? `linear-gradient(165deg, rgba(34, 52, 86, 0.4) 0%, rgba(8, 12, 22, 0.78) 40%, rgba(2, 4, 8, 0.94) 80%), url('${card.background}')`
                      : `linear-gradient(180deg, rgba(6, 7, 12, 0.45) 0%, rgba(3, 4, 8, 0.84) 50%, rgba(2, 3, 6, 0.95) 84%), url('${card.background}')`,
                  backgroundSize: card.id === 'about' ? undefined : 'cover',
                  backgroundPosition: card.id === 'about' ? undefined : 'center',
                }} />
              </button>
            ))}
          </div>
        </div>
        <div className="carousel-nav-guide" aria-hidden="true">
          <div className="scroll-indicator">
            <span className="scroll-icon" />
            <p>SCROLL TO EXPLORE</p>
          </div>
        </div>
      </section>

      <HolographicPlayer open={isHologramOpen} videoEl={hologramVideoEl} originRect={aboutOrigin} onClose={closeHologram} />

      <HolographicGallery
        open={isGalleryOpen}
        originRect={galleryOrigin}
        onClose={() => setIsGalleryOpen(false)}
      />

      <HolographicBooks
        open={isBooksOpen}
        originRect={booksOrigin}
        onClose={() => setIsBooksOpen(false)}
      />

      <HolographicYouTube
        open={isYouTubeOpen}
        originRect={youtubeOrigin}
        onClose={() => setIsYouTubeOpen(false)}
      />

      <HolographicAI
        open={isAIOpen}
        originRect={aiOrigin}
        onClose={() => setIsAIOpen(false)}
      />

      <HolographicCeskeSamples
        open={isCeskeSamplesOpen}
        originRect={ceskeSamplesOrigin}
        onClose={() => setIsCeskeSamplesOpen(false)}
      />

      <section className="home-details" aria-label="Page sections" hidden>
        <article id="books" className="home-detail-block">
          <h2>Books</h2>
          <p>Explore thoughtfully crafted children’s books that blend warmth, imagination, and storytelling.</p>
        </article>
        <article id="photos" className="home-detail-block">
          <h2>Photos</h2>
          <p>View a gallery of visual stories captured with a cinematic eye for light and emotion.</p>
        </article>
        <article id="videos" className="home-detail-block">
          <h2>Videos</h2>
          <p>Experience moving images and edits that bring modern storytelling to life.</p>
        </article>
      </section>
    </main>
  );
};

export default HomeCarousel;
