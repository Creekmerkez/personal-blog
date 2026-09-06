import React, { useEffect, useRef, useState } from 'react';
import { searchQA, detectLang, isGreeting, isGeneralQuery, isAboutAI } from './QAChat/qaSearch';

const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? '';
import '../styles/HolographicGallery.css';


const WELCOME = {
  en: "Hi! I'm Julia's AI. Ask me anything — in English or Ukrainian.",
  ua: 'Привіт! Я AI-асистент Юлії. Запитайте мене що завгодно — англійською або українською.',
};

const PLACEHOLDER = {
  en: 'Ask me anything...',
  ua: 'Запитайте мене...',
};

const SUBTITLE = {
  en: 'Ask me anything',
  ua: 'Запитайте мене про що завгодно',
};

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

const UI_LANG_KEY = 'aiUiLang';
const SpeechRecognitionClass = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const HolographicAI = ({ open, onClose, originRect }) => {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem(UI_LANG_KEY) === 'ua' ? 'ua' : 'en'; } catch { return 'en'; }
  });
  const [messages, setMessages] = useState(() => [{ role: 'ai', text: WELCOME[lang], isWelcome: true }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

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

  // Stop any in-progress recognition the moment the panel starts closing —
  // and reset the UI state directly rather than waiting on the recognition
  // object's own onend, which isn't guaranteed to fire promptly (or at all)
  // once the panel is gone. Without this the mic showed "listening" again
  // the next time the panel opened even though nothing was recording.
  useEffect(() => {
    if (!render) {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      setListening(false);
    }
  }, [render]);

  // ...and on unmount, in case the panel closes mid-recognition.
  useEffect(() => () => recognitionRef.current?.stop(), []);

  // Persist the choice, and — as long as the conversation hasn't actually
  // started yet — keep the welcome message in sync with it. Once a real
  // reply exists, switching language stops rewriting history.
  useEffect(() => {
    try { localStorage.setItem(UI_LANG_KEY, lang); } catch { /* ignore */ }
    setMessages((prev) => (
      prev.length === 1 && prev[0].isWelcome
        ? [{ role: 'ai', text: WELCOME[lang], isWelcome: true }]
        : prev
    ));
  }, [lang]);

  const toggleListening = () => {
    if (!SpeechRecognitionClass) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    // Whatever's already typed stays put; speech gets appended after it.
    // Captured once here (not read live) so it doesn't shift while talking.
    const baseText = input;

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang === 'ua' ? 'uk-UA' : 'en-US';
    // interimResults streams words in as they're recognized, same as any
    // live-dictation UI — the previous `false` here silently withheld all
    // text until the entire session ended, which read as "nothing happens."
    recognition.interimResults = true;
    // NOT continuous: on Android Chrome, continuous mode is unreliable and
    // was producing zero results at all (regression from a prior attempt at
    // this). Single-utterance mode — speak, it auto-finalizes on a pause —
    // is the well-supported behavior across both Android and iOS.
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        const { transcript } = e.results[i][0];
        if (e.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      const spoken = (finalTranscript + interimTranscript).trim();
      setInput(spoken ? (baseText ? `${baseText} ${spoken}` : spoken) : baseText);
    };
    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch (err) {
      // start() can throw synchronously (e.g. already-started state) — if it
      // does, no onerror/onend will ever fire for this attempt, so reset
      // here or the mic would show "listening" forever.
      console.warn('Speech recognition failed to start:', err);
      setListening(false);
    }
  };

  const send = async () => {
    const query = input.trim();
    if (!query || loading) return;

    // Detected from the query text itself — independent of the UI language
    // toggle above, so a reply always matches whatever the user actually typed/said.
    const queryLang = detectLang(query);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    setLoading(true);

    // Greetings are handled locally — no API call needed.
    if (isGreeting(query)) {
      setLoading(false);
      const reply = queryLang === 'ua'
        ? 'Привіт! Я AI-асистент Юлії. Запитайте мене що завгодно про неї!'
        : "Hi there! Ask me anything about Julia — I'm happy to help!";
      setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
      return;
    }

    if (WORKER_URL) {
      // Claude path — intelligent, handles any phrasing in any language.
      // Fuse matches are passed as extra context; Claude can answer even without them.
      const matches = searchQA(query, queryLang, 5);
      try {
        const res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, lang: queryLang, matches }),
        });
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
      } catch {
        setMessages((prev) => [...prev, { role: 'ai', text: NO_INFO[queryLang] }]);
      }
      setLoading(false);
      return;
    }

    // Fallback: client-side regex + Fuse (no worker configured).
    if (isGeneralQuery(query)) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: JULIA_OVERVIEW[queryLang] }]);
      return;
    }

    const matches = searchQA(query, queryLang);

    if (matches.length === 0) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: isAboutAI(query) ? AI_SELF_MSG[queryLang] : NO_INFO[queryLang] }]);
      return;
    }

    if (matches[0].final) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: matches[0].answer }]);
      return;
    }

    if (matches[0].score !== undefined && matches[0].score > 0.20) {
      setLoading(false);
      setMessages((prev) => [...prev, { role: 'ai', text: isAboutAI(query) ? AI_SELF_MSG[queryLang] : NO_INFO[queryLang] }]);
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
            <span className="holo-gallery-subtitle">{SUBTITLE[lang]}</span>
          </div>
          <div className="holo-ai-lang-switch" role="group" aria-label="Chat language">
            <button
              type="button"
              className={`holo-ai-lang-btn${lang === 'en' ? ' active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <button
              type="button"
              className={`holo-ai-lang-btn${lang === 'ua' ? ' active' : ''}`}
              onClick={() => setLang('ua')}
              aria-pressed={lang === 'ua'}
            >
              UA
            </button>
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
              placeholder={PLACEHOLDER[lang]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={500}
              autoFocus
            />
            {SpeechRecognitionClass && (
              <button
                type="button"
                className={`holo-ai-mic${listening ? ' listening' : ''}`}
                onClick={toggleListening}
                disabled={loading}
                aria-pressed={listening}
                aria-label={
                  listening
                    ? (lang === 'ua' ? 'Зупинити голосове введення' : 'Stop voice input')
                    : (lang === 'ua' ? 'Почати голосове введення' : 'Start voice input')
                }
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M19 11a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M12 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className="holo-ai-send"
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label={lang === 'ua' ? 'Надіслати' : 'Send'}
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
