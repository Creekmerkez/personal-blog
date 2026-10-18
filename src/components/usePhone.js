import { useEffect, useState } from 'react';

// True on a phone-sized screen, where popups switch to phone layouts
// (the photo grid, the YouTube list) instead of the desktop collages.
const PHONE = '(max-width: 600px)';

export default function usePhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE);
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
}
