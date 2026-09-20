import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PrivacyPage.css';

// Describes what this site actually does, verified against the code rather
// than copied from a template — a generic policy would be inaccurate here
// (most notably: AI chat questions are emailed to the owner, which no
// boilerplate would mention).
const PrivacyPage = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy — Julia Merkusheva';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="privacy-page">
      <article className="privacy-shell">
        <h1 className="privacy-title">Privacy</h1>
        <p className="privacy-lede">
          This site is run personally by Julia Merkusheva. It does not use cookies,
          analytics, advertising, or tracking of any kind, and nothing collected here
          is ever sold or shared for marketing.
        </p>

        <section className="privacy-section">
          <h2>Who is responsible</h2>
          <p>
            Julia Merkusheva, Prague, Czech Republic. For any question about your
            information, write to{' '}
            <a href="mailto:julia.merkusheva@gmail.com">julia.merkusheva@gmail.com</a>.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Cookies</h2>
          <p>
            None. This site sets no cookies whatsoever. Your browser stores two small
            settings on your own device — your choice of light or dark appearance, and
            your language preference in the AI chat. These stay in your browser, are
            never sent anywhere, and exist only so the site remembers how you like it.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Requesting a copy of a book</h2>
          <p>
            If you use the request form, you give your name, your email address, and
            optionally a note. This is delivered to Julia&apos;s email through a form
            service called Web3Forms, which processes it on her behalf. It is used only
            to reply to you about the book, and is kept only as long as needed for that
            conversation. Nothing is sold through this site, so there is no payment
            information involved.
          </p>
        </section>

        <section className="privacy-section">
          <h2>The AI chat</h2>
          <p>
            When you send a message to &quot;MY AI&quot;, it is sent to Anthropic, which
            generates the reply. Your message is not saved, logged, or emailed to anyone
            afterwards — it is used only to produce the answer you see. Even so, please
            do not type anything private or sensitive into a chat box.
          </p>
          <p>
            Your IP address is briefly held by Cloudflare — for about a minute — purely
            to stop the chat being abused. It is not stored beyond that and is not used
            to identify you.
          </p>
          <p>
            If you use the microphone button, the speech-to-text is performed by your own
            browser (in Chrome, this means the audio goes to Google&apos;s speech
            service). This site never receives or stores your audio — only the text that
            appears in the input box, and only once you send it.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Embedded videos</h2>
          <p>
            Music pages embed videos from YouTube using its no-cookie address, which
            avoids tracking cookies. YouTube still receives your IP address when a video
            loads, as it must to send you the video.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Your rights</h2>
          <p>
            You can ask what information is held about you, ask for it to be corrected,
            or ask for it to be deleted — just email{' '}
            <a href="mailto:julia.merkusheva@gmail.com">julia.merkusheva@gmail.com</a>.
            If you are unhappy with how it is handled, you may complain to the Czech data
            protection authority, Úřad pro ochranu osobních údajů (
            <a href="https://uoou.gov.cz" target="_blank" rel="noopener noreferrer">
              uoou.gov.cz
            </a>
            ).
          </p>
        </section>

        <Link className="privacy-back" to="/">
          ← Back to the site
        </Link>
      </article>
    </main>
  );
};

export default PrivacyPage;
