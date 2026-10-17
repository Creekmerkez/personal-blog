import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Root from './Root';
import { requestPersistence } from './lib/storage';
import './organizer.css';

const params = new URLSearchParams(window.location.search);
const demo = params.has('demo');
const fixedDay = Number(params.get('today')) || undefined;

if (!demo) {
  requestPersistence();
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register('/organizer/sw.js', { scope: '/organizer/' }).catch(() => {});
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root demo={demo} fixedDay={fixedDay} />
  </StrictMode>,
);
