import { useCallback, useEffect, useRef } from 'react';

// A popup opens over the page at the same address, so the browser's Back button
// (or the iPhone's swipe back) used to leave the site. While it is open it gets a
// history step of its own: Back closes it, and closing it any other way takes
// that step back off. Returns the close function to use for its close buttons.
export default function useBackToClose(open, close) {
  const step = useRef(null);
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) {
      step.current = null;
      return undefined;
    }
    // Pushed once per opening (React's development double run finds it already there).
    if (step.current === null || window.history.state?.popup !== step.current) {
      step.current = `${Date.now()}-${Math.random()}`;
      window.history.pushState({ ...window.history.state, popup: step.current }, '');
    }
    const onBack = () => {
      if (window.history.state?.popup !== step.current) closeRef.current();
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [open]);

  return useCallback(() => {
    if (step.current !== null && window.history.state?.popup === step.current) window.history.back();
    else closeRef.current();
  }, []);
}
