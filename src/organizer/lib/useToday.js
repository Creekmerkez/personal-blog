import { useEffect, useState } from 'react';
import { dayKeyFromDate, msUntilMidnight } from './dates';

/** Today's day key. Moves on at midnight and whenever the app comes back to the screen. */
export function useToday(fixedDay) {
  const [today, setToday] = useState(() => fixedDay ?? dayKeyFromDate());

  useEffect(() => {
    if (fixedDay) return undefined;
    let timer;
    const refresh = () => setToday(dayKeyFromDate());
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refresh();
        schedule();
      }, msUntilMidnight());
    };
    const onReturn = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        schedule();
      }
    };
    schedule();
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [fixedDay]);

  return today;
}
