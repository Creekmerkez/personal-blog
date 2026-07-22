import React, { useEffect, useRef, useState } from 'react';
import { searchQA, detectLang, isGreeting, isGeneralQuery, isAboutAI } from './QAChat/qaSearch';

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '';
import '../styles/HolographicGallery.css';


const WELCOME = "Hi! I'm Julia's AI. Ask me anything — in English or Ukrainian.";
const PLACEHOLDER = 'Ask me anything... / Запитайте мене...';

const NO_INFO = {
  en: "Julia hasn't shared anything about that with me — try asking something else!",
  ua: 'Юлія не розповідала мені про це — спробуйте запитати щось інше!',
};

const AI_SELF_MSG = {
  en: "I'm Julia's AI assistant — I can only answer questions about her, not about myself. Try asking something about Julia!",
  ua: 'Я — AI-асистент Юлії. Можу відповідати лише на запитання про неї, а не про себе. Спробуйте запитати щось про Юлію!',
};

const ERROR_MSG = {
  en: 'Something went wrong. Please try again.',
  ua: 'Щось пішло не так. Спробуйте ще раз.',
};

const JULIA_OVERVIEW = {
  en: "Julia is a Test Automation Engineer from Ukraine, based in Prague for about 11 years. She's also a DJ, children's book author, and AI enthusiast. Feel free to ask anything specific about her!",
  ua: "Юлія — Test Automation Engineer з України, живе в Празі вже близько 11 років. Ще вона DJ, авторка дитячих книг і захоплена ШІ. Питайте що завгодно конкретніше про неї!",
};

function renderWithLinks(text) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (!/^https?:\/\//.test(part)) return part;
    const url = part.replace(/[.,!?;:)]+$/, '');
    const tail = part.slice(url.length);
    return [
      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>{url}</a>,
      tail,
    ];
  });
}

const HolographicAI = ({ open, onClose, originRect }) => {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      setRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    if (render) {
      setVisible(false);
      const timer = setTimeout(() => setRender(false), window.innerWidth < 600 ? 0 : 520);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [open, render]);

  useEffect(() => {
    if (!render) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [render]);

  useEffect(() => {
    if (!render) return undefined;
    const onKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [render, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const lang = detectLang(query);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setLoading(true);

    // Greetings are handled locally — no API call needed.
    if (isGreeting(query)) {
      setLoading(false);
      const reply = lang === 'ua'
        ? 'Привіт! Я AI-асистент Юлії. Запитайте мене що завгодно про неї!'
        : "Hi there! Ask me anything about Julia — I'm happy to help!";
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      return;
    }

    if (WORKER_URL) {
      // Claude path — intelligent, handles any phrasing in any language.
      // Fuse matches are passed as extra context; Claude can answer even without them.
      const matches = searchQA(query, lang, 5);
      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, lang, matches }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
      } catch {
        setMessages((prev) => [...prev, { role: 'ai', text: NO_INFO[lang] }]);
      }
      setLoading(false);
      return;
    }

    // Fallback: client-side regex + Fuse (no worker configured).
    if (isGeneralQuery(query)) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: JULIA_OVERVIEW[lang] }]);
      return;
    }

    const matches = searchQA(query, lang);

    if (matches.length === 0) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: isAboutAI(query) ? AI_SELF_MSG[lang] : NO_INFO[lang] }]);
      return;
    }

    if (matches[0].final) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: matches[0].answer }]);
      return;
    }

    if (matches[0].score !== undefined && matches[0].score > 0.20) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: isAboutAI(query) ? AI_SELF_MSG[lang] : NO_INFO[lang] }]);
      return;
    }
    setLoading(false);
    setMessages((prev) => [...prev, { role: 'ai', text: matches[0].answer }]);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!render) return null;

  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  const ox = originRect ? originRect.left + originRect.width / 2 : cx;
  const oy = originRect ? originRect.top + originRect.height / 2 : cy;
  const originStyle = { '--dx': `${ox - cx}px`, '--dy': `${oy - cy}px` };

  return (
    <div
      className={`holo-gallery-stage ${visible ? 'visible' : ''}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="holo-gallery-panel holo-ai-panel"
        style={originStyle}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="MY AI Chat"
      >
        <span className="holo-corner tl" aria-hidden="true" />
        <span className="holo-corner tr" aria-hidden="true" />
        <span className="holo-corner bl" aria-hidden="true" />
        <span className="holo-corner br" aria-hidden="true" />

        <div className="holo-rail left" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>
        <div className="holo-rail right" aria-hidden="true">
          <span className="holo-rail-mark" />
        </div>

        <header className="holo-gallery-header holo-ai-header">
          <div className="holo-gallery-titles">
            <h2 className="holo-gallery-title">MY AI</h2>
            <span className="holo-gallery-subtitle">ASK ME ANYTHING</span>
          </div>
        </header>

        <div className="holo-ai-chat">
          <div className="holo-ai-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`holo-ai-msg holo-ai-msg--${msg.role}`}>
                {renderWithLinks(msg.text)}
              </div>
            ))}
            {loading && (
              <div className="holo-ai-msg holo-ai-msg--ai holo-ai-typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="holo-ai-input-row">
            <input
              type="text"
              className="holo-ai-input"
              placeholder={PLACEHOLDER}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={500}
              autoFocus
            />
            <button
              type="button"
              className="holo-ai-send"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolographicAI;
