// Tells when an embedded YouTube video on the page plays, so the background music
// can step aside. YouTube embeds that have enablejsapi=1 report their state to the
// page once the page says it is listening; no YouTube script needs to be loaded.

const YOUTUBE = /^https:\/\/www\.youtube(-nocookie)?\.com$/;
const isYouTubeFrame = (node) => node instanceof HTMLIFrameElement && /youtube(-nocookie)?\.com\/embed\/.*enablejsapi=1/.test(node.src);

/** The parameter every YouTube embed on the site needs for this. */
export const YOUTUBE_API_PARAM = 'enablejsapi=1';

/** Calls onChange(true) while any embedded YouTube video plays, onChange(false) when none does. Returns a stop function. */
export function watchYouTube(onChange) {
  const playing = new Set(); // the frames' windows that play right now
  let last = false;
  const report = () => {
    const now = playing.size > 0;
    if (now !== last) onChange((last = now));
  };

  const listen = (frame) => {
    const hello = () => {
      try {
        const send = (message) => frame.contentWindow?.postMessage(JSON.stringify({ ...message, id: 'site-music', channel: 'widget' }), '*');
        send({ event: 'listening' });
        send({ event: 'command', func: 'addEventListener', args: ['onStateChange'] });
      } catch {
        /* the frame is gone */
      }
    };
    frame.addEventListener('load', hello);
    hello();
  };

  const onMessage = (event) => {
    if (!YOUTUBE.test(event.origin)) return;
    let data;
    try {
      data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }
    const state = data?.event === 'onStateChange' ? data.info : data?.event === 'infoDelivery' ? data.info?.playerState : undefined;
    if (typeof state !== 'number') return;
    // 1 playing, 3 buffering; anything else (paused, ended, cued) is quiet.
    if (state === 1 || state === 3) playing.add(event.source);
    else playing.delete(event.source);
    report();
  };

  // Frames added later (another page, a video opened) are greeted too; a removed one stops counting.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (isYouTubeFrame(node)) listen(node);
        else if (node instanceof Element) node.querySelectorAll('iframe').forEach((f) => isYouTubeFrame(f) && listen(f));
      }
    }
    const alive = new Set([...document.querySelectorAll('iframe')].map((f) => f.contentWindow));
    playing.forEach((source) => !alive.has(source) && playing.delete(source));
    report();
  });

  document.querySelectorAll('iframe').forEach((f) => isYouTubeFrame(f) && listen(f));
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('message', onMessage);
  return () => {
    observer.disconnect();
    window.removeEventListener('message', onMessage);
  };
}
