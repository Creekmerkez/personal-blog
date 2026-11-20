import { useCallback, useEffect, useRef, useState } from 'react';

// Hold a row to lift it, then drag it up or down; the other rows make room, and on
// release onMove(from, to) gives the new place. Touch and mouse both work. While a row
// is lifted the page doesn't scroll by itself, but it does when the row is near the top
// or bottom of the screen, so a long list can be crossed.

const HOLD_MS = 350;
const SLOP = 8; // px the finger may wander before it counts as a scroll, not a hold
const EDGE = 90; // px from the screen's top or bottom where the page starts scrolling
const BOTTOM_BAR = 84; // the tab bar covers the bottom of the screen

export function useReorder(onMove) {
  const listRef = useRef(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const drag = useRef(null);
  const swallowClick = useRef(false);
  const [lifted, setLifted] = useState(null); // { from, to, dy, height }

  const place = (d) => {
    const dy = d.y - d.startY + window.scrollY - d.startScroll;
    const self = d.rects[d.from];
    const middle = self.top + self.height / 2 + dy;
    d.to = d.rects.filter((r, i) => i !== d.from && r.top + r.height / 2 < middle).length;
    setLifted({ from: d.from, to: d.to, dy, height: self.height });
  };

  const scrollNearEdges = () => {
    const d = drag.current;
    if (!d?.active) return;
    const bottom = window.innerHeight - BOTTOM_BAR;
    const speed = d.y < EDGE ? -(EDGE - d.y) / 6 : d.y > bottom - EDGE ? (d.y - bottom + EDGE) / 6 : 0;
    if (speed) {
      window.scrollBy(0, speed);
      place(d);
    }
    d.frame = requestAnimationFrame(scrollNearEdges);
  };

  const lift = (d) => {
    const rows = [...(listRef.current?.children ?? [])];
    if (!rows[d.from]) return;
    d.rects = rows.map((row) => {
      const box = row.getBoundingClientRect();
      return { top: box.top + window.scrollY, height: box.height };
    });
    d.active = true;
    d.to = d.from;
    navigator.vibrate?.(10);
    setLifted({ from: d.from, to: d.from, dy: 0, height: d.rects[d.from].height });
    d.frame = requestAnimationFrame(scrollNearEdges);
  };

  const finish = useCallback(() => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    clearTimeout(d.timer);
    cancelAnimationFrame(d.frame);
    if (!d.active) return;
    // The release also counts as a tap on whatever is under the finger: ignore that one.
    swallowClick.current = true;
    setTimeout(() => (swallowClick.current = false), 400);
    setLifted(null);
    if (d.to !== d.from) onMoveRef.current(d.from, d.to);
  }, []);

  const moveTo = (y) => {
    const d = drag.current;
    if (!d) return;
    d.y = y;
    if (d.active) place(d);
    else if (Math.abs(y - d.startY) > SLOP) finish(); // a scroll, not a hold
  };

  const start = (from, y) => {
    finish();
    swallowClick.current = false; // a new touch: whatever comes next is a real tap
    const d = { from, startY: y, y, startScroll: window.scrollY, active: false };
    d.timer = setTimeout(() => lift(d), HOLD_MS);
    drag.current = d;
  };

  // Touch: the page must not scroll while a row is lifted, which needs a non-passive listener.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const onTouchMove = (event) => {
      if (drag.current?.active) event.preventDefault();
      moveTo(event.touches[0].clientY);
    };
    list.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => list.removeEventListener('touchmove', onTouchMove);
  });

  // Mouse: follow the pointer anywhere on the page until the button is let go.
  useEffect(() => {
    const onMouseMove = (event) => drag.current && moveTo(event.clientY);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', finish);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', finish);
    };
  });

  useEffect(() => () => finish(), [finish]);

  const listProps = {
    ref: listRef,
    onClickCapture: (event) => {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    onContextMenu: (event) => drag.current && event.preventDefault(),
  };

  /** Props for row `index`: where it is drawn while a row is lifted, and how a hold starts. */
  const itemProps = (index) => {
    let shift = 0;
    if (lifted) {
      const { from, to, dy, height } = lifted;
      if (index === from) shift = dy;
      else if (from < to && index > from && index <= to) shift = -height;
      else if (to < from && index >= to && index < from) shift = height;
    }
    return {
      className: lifted ? (index === lifted.from ? 'org-drag-lifted' : 'org-drag-moving') : '',
      style: shift ? { transform: `translateY(${shift}px)` } : undefined,
      onTouchStart: (event) => event.touches.length === 1 && start(index, event.touches[0].clientY),
      onTouchEnd: finish,
      onTouchCancel: finish,
      onMouseDown: (event) => event.button === 0 && start(index, event.clientY),
    };
  };

  /** The place row `index` will have when the lifted row is let go, for live numbering. */
  const placeOf = (index) => {
    if (!lifted) return index;
    const { from, to } = lifted;
    if (index === from) return to;
    if (from < to && index > from && index <= to) return index - 1;
    if (to < from && index >= to && index < from) return index + 1;
    return index;
  };

  return { listProps, itemProps, placeOf };
}
