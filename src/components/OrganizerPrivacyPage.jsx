import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PrivacyPage.css';

// Privacy policy for Julia's "Organizer" iPhone app. The App Store requires a
// public URL for it; this route (/privacy/organizer) is that URL. Every claim
// here matches the app's code: it has no networking, no analytics, no account,
// and stores everything with SwiftData on the device.
const OrganizerPrivacyPage = () => {
  useEffect(() => {
    const previous = document.title;
    document.title = 'Organizer app privacy — Julia Merkusheva';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="privacy-page">
      <article className="privacy-shell">
        <h1 className="privacy-title">Organizer app privacy</h1>
        <p className="privacy-lede">
          Organizer is a personal iPhone app for daily tasks, notes about a child, and
          learning words. It does not collect, send, or share any of your information.
          Everything you enter stays on your iPhone.
        </p>

        <section className="privacy-section">
          <h2>What the app stores</h2>
          <p>
            The tasks, counters, records about your child, game and place ideas, and
            vocabulary words you enter are saved only in the app&apos;s storage on your
            device. There is no account, no sign-in, and no server. The app does not
            connect to the internet.
          </p>
        </section>

        <section className="privacy-section">
          <h2>What the app does not do</h2>
          <p>
            It has no analytics, no advertising, no tracking, and no third-party code
            that collects data. Nothing you enter is ever seen by the developer or
            anyone else.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Export files</h2>
          <p>
            If you choose Export Data in Settings, the app creates one file with your
            data and saves it where you pick, for example in Files or Google Drive. From
            then on that copy is handled by the place you saved it to, under its own
            terms. The app only reads a file when you choose Import Data.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Information about children</h2>
          <p>
            Parents can record things such as vaccinations and doctor visits for their
            child. This information is treated like everything else in the app: it stays
            on the device and is never sent anywhere. The app is not intended for use by
            children.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Deleting your data</h2>
          <p>
            Deleting the app from your iPhone deletes all of its data. Export files you
            saved elsewhere are not affected.
          </p>
        </section>

        <section className="privacy-section">
          <h2>Contact</h2>
          <p>
            Julia Merkusheva, Prague, Czech Republic.{' '}
            <a href="mailto:julia.merkusheva@gmail.com">julia.merkusheva@gmail.com</a>
          </p>
          <p>Last updated: October 2026.</p>
        </section>

        <Link className="privacy-back" to="/privacy">
          ← Website privacy
        </Link>
      </article>
    </main>
  );
};

export default OrganizerPrivacyPage;
