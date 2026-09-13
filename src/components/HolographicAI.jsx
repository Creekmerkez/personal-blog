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

// Speech-recognition failures used to be console.warn-only, invisible to
// anyone without devtools open. Surfaced as a chat message instead, keyed by
// the SpeechRecognitionErrorEvent.error string (+ our own "timeout" case).
const VOICE_ERRORS = {
  en: {
    'not-allowed': "Microphone access was blocked. Check your browser's site settings and allow the microphone, then try again.",
    'audio-capture': 'No microphone was found on this device.',
    'network': 'A network error interrupted voice recognition. Please try again.',
    'language-not-supported': "This browser doesn't support voice recognition for the selected language. Try switching to EN or UA.",
    'no-speech': "No speech was picked up — check that the correct microphone is selected and isn't muted, then try again.",
    timeout: "The mic never started listening. Check that microphone access is allowed for this site, then try again.",
  },
  ua: {
    'not-allowed': 'Доступ до мікрофона заблоковано. Перевірте налаштування сайту в браузері, дозвольте доступ до мікрофона й спробуйте ще раз.',
    'audio-capture': 'На цьому пристрої не знайдено мікрофон.',
    'network': 'Помилка мережі перервала розпізнавання мовлення. Спробуйте ще раз.',
    'language-not-supported': 'Цей браузер не підтримує розпізнавання обраної мови. Спробуйте переключитися на EN або UA.',
    'no-speech': 'Мовлення не розпізнано — перевірте, чи обрано правильний мікрофон і чи він не вимкнений, і спробуйте ще раз.',
    timeout: 'Мікрофон так і не почав слухати. Перевірте, чи дозволено доступ до мікрофона для цього сайту, і спробуйте ще раз.',
  },
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

// Caps how tall the auto-growing input can get before it scrolls instead —
// keeps a very long pasted/dictated message from pushing the send button
// (or the message list) off screen.
const INPUT_MAX_HEIGHT = 120;

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
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  // Bumped on every explicit start/stop so a pending network-error retry or
  // pause-triggered restart (see startRecognition) can tell it's stale and
  // skip itself instead of resurrecting a session the user already stopped.
  const voiceSessionRef = useRef(0);
  // Single-utterance mode (continuous:true is unreliable on Android Chrome —
  // see the comment in startRecognition) auto-ends after a short pause in
  // speech. True while the mic should keep going despite that — only a
  // manual click flips it back off — so onend/onerror below know to chain
  // straight into a fresh session instead of stopping.
  const shouldKeepListeningRef = useRef(false);
  // Tracks the full spoken-so-far text across chained sessions; React state
  // (`input`) can't be read live from inside these closures without going
  // stale, since a new recognition object's handlers close over whatever
  // `input` was at the render that started it.
  const liveTextRef = useRef('');

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

  // Grows the input with its content instead of staying a fixed
  // single-line height. Runs on every `input` change regardless of source
  // (typing, voice transcription, or clearing on send) — resetting height
  // to 'auto' first is what lets scrollHeight shrink back down again when
  // text is deleted, not just grow.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, INPUT_MAX_HEIGHT)}px`;
  }, [input]);

  // Stop any in-progress recognition the moment the panel starts closing —
  // and reset the UI state directly rather than waiting on the recognition
  // object's own onend, which isn't guaranteed to fire promptly (or at all)
  // once the panel is gone. Without this the mic showed "listening" again
  // the next time the panel opened even though nothing was recording.
  useEffect(() => {
    if (!render) {
      voiceSessionRef.current += 1;
      shouldKeepListeningRef.current = false;
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

  // Chrome's "network" error from SpeechRecognition is notoriously
  // over-broad — it fires for several unrelated hiccups talking to the
  // recognition backend, not just an actual connectivity loss, and in
  // practice often clears up on an immediate retry. Give it one silent
  // retry before showing the user anything.
  const startRecognition = (baseText, retriesLeft, sessionId) => {
    liveTextRef.current = baseText;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang === 'ua' ? 'uk-UA' : 'en-US';
    // interimResults streams words in as they're recognized, same as any
    // live-dictation UI — the previous `false` here silently withheld all
    // text until the entire session ended, which read as "nothing happens."
    recognition.interimResults = true;
    // NOT continuous: on Android Chrome, continuous mode is unreliable and
    // was producing zero results at all. Single-utterance mode — speak, it
    // auto-finalizes on a pause — is the well-supported behavior across
    // both Android and iOS; onend below chains straight into the next
    // session so the *user* still only ever controls start/stop by clicking,
    // even though under the hood it's several short sessions back to back.
    recognition.maxAlternatives = 1;

    // If the mic never actually starts capturing audio, the ripple/"on"
    // state was still showing with nothing happening and no error at all —
    // the most likely cause is a native permission prompt the user never
    // saw or responded to. onaudiostart is the browser's own signal that
    // capture genuinely began; if it hasn't fired shortly after start(),
    // something upstream of recognition itself is stuck.
    let audioStarted = false;
    const audioStartTimer = setTimeout(() => {
      if (audioStarted) return;
      recognition.abort();
      shouldKeepListeningRef.current = false;
      setMessages((prev) => [...prev, { role: 'ai', text: VOICE_ERRORS[lang].timeout }]);
    }, 4000);
    recognition.onaudiostart = () => { audioStarted = true; clearTimeout(audioStartTimer); };

    recognition.onresult = (e) => {
      // .stop() asks the engine to wind down gracefully — per spec it can
      // still deliver one more already-in-progress result afterward. Without
      // this check, that straggler would silently repopulate the input
      // field after the user had already stopped listening or sent the
      // message (voiceSessionRef is bumped in both places).
      if (voiceSessionRef.current !== sessionId) return;
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        const { transcript } = e.results[i][0];
        if (e.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      const spoken = (finalTranscript + interimTranscript).trim();
      const combined = spoken ? (baseText ? `${baseText} ${spoken}` : spoken) : baseText;
      liveTextRef.current = combined;
      setInput(combined);
    };
    recognition.onerror = (e) => {
      clearTimeout(audioStartTimer);
      console.warn('Speech recognition error:', e.error, 'retriesLeft:', retriesLeft);
      if (e.error === 'network' && retriesLeft > 0) {
        setTimeout(() => {
          // The user may have tapped the mic to cancel during this window —
          // don't resurrect a session they already stopped.
          if (voiceSessionRef.current !== sessionId) return;
          startRecognition(liveTextRef.current, retriesLeft - 1, sessionId);
        }, 400);
        return;
      }
      if (e.error === 'no-speech' && shouldKeepListeningRef.current) {
        // Just a pause, not a real failure — the mic is meant to stay on
        // until clicked off. onend fires right after this and restarts.
        return;
      }
      const message = VOICE_ERRORS[lang][e.error];
      if (message) setMessages((prev) => [...prev, { role: 'ai', text: message }]);
      shouldKeepListeningRef.current = false;
      setListening(false);
    };
    recognition.onend = () => {
      clearTimeout(audioStartTimer);
      if (shouldKeepListeningRef.current && voiceSessionRef.current === sessionId) {
        // Ended on its own (a pause in speech) — the user hasn't clicked
        // stop, so seamlessly start the next session. Insert a sentence
        // boundary first: Chrome's recognizer doesn't turn a spoken "period"
        // into an actual "." — without this, two unrelated phrases spoken
        // across a pause (e.g. "mic check" ... "what do you know about
        // Julia?") get glued into one run-on blob with no punctuation,
        // which reads as gibberish to whatever answers it.
        const priorText = liveTextRef.current.trim();
        const nextBase = priorText && !/[.!?]$/.test(priorText) ? `${priorText}.` : priorText;
        startRecognition(nextBase, 1, sessionId);
      } else {
        setListening(false);
      }
    };
    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch (err) {
      // start() can throw synchronously (e.g. already-started state) — if it
      // does, no onerror/onend will ever fire for this attempt, so reset
      // here or the mic would show "listening" forever.
      clearTimeout(audioStartTimer);
      console.warn('Speech recognition failed to start:', err);
      shouldKeepListeningRef.current = false;
      setListening(false);
    }
  };

  const toggleListening = () => {
    if (!SpeechRecognitionClass) return;

    if (listening) {
      shouldKeepListeningRef.current = false;
      voiceSessionRef.current += 1; // invalidate any pending retry/restart
      recognitionRef.current?.stop();
      return;
    }

    // Whatever's already typed stays put; speech gets appended after it.
    shouldKeepListeningRef.current = true;
    startRecognition(input, 1, ++voiceSessionRef.current);
  };

  const send = async () => {
    const query = input.trim();
    if (!query || loading) return;

    // Sending didn't stop an active mic session — if it was still
    // listening, its next result (or the auto-chained restart after a
    // pause) would fire setInput(baseText + ...) shortly after this
    // clears the field, silently repopulating it with stale text right
    // after the message was sent. Same stop sequence as clicking the mic
    // button: bump the session id first so any in-flight retry/restart
    // recognizes itself as stale and skips.
    if (listening) {
      shouldKeepListeningRef.current = false;
      voiceSessionRef.current += 1;
      recognitionRef.current?.stop();
    }

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
            <textarea
              ref={textareaRef}
              rows={1}
              className="holo-ai-input"
              placeholder={PLACEHOLDER[lang]}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              maxLength={500}
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
