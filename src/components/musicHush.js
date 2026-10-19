export const HUSH_EVENT = 'site-music-hush';

/** Pauses the site's background music while `on` is true (a YouTube video is playing, say). */
export const hushMusic = (on) => window.dispatchEvent(new CustomEvent(HUSH_EVENT, { detail: on }));
