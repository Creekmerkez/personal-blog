import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/CeskeRealiePage.css';

const WEB3FORMS_KEY = '59ef3f7d-05e1-49b6-9b78-bdb24517095a';

// No prices, and nothing here is sold. Both editions are shared personally on
// request — keep it that way: showing a price would make this a distance sale,
// which carries consumer-law obligations (seller identity, delivery terms,
// 14-day withdrawal right) that this page does not and should not have to meet.
const purchaseOptions = [
  {
    id: 'pdf',
    title: 'PDF or EPUB',
    subtitle: 'Digital edition',
    detail: 'Choose either format for tablet, e-reader, desktop, or print-at-home use.',
    audioNote: '+ audio MP3 for each topic included',
  },
  {
    id: 'physical',
    title: 'Printed Book',
    subtitle: 'Physical edition',
    detail: 'A tangible, gift-ready copy.',
    audioNote: '+ audio MP3 for each topic included',
  },
];

const CeskeRealiePage = () => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState(null);
  const [authorImageMissing, setAuthorImageMissing] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', note: '' });
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [toastClosing, setToastClosing] = useState(false);

  const selectedData = useMemo(
    () => purchaseOptions.find((o) => o.id === selectedOption) ?? null,
    [selectedOption]
  );

  const handleSelectOption = (optionId) => {
    setSelectedOption(optionId);
    setShowContactForm(false);
    setFormSent(false);
    setSubmitError(false);
    setContactForm({ name: '', email: '', note: '' });
  };

  const handleOpenForm = () => setShowContactForm(true);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(false);
    try {
      const isDigital = selectedData.id === 'pdf';
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Book Request: ${selectedData.title} — from ${contactForm.name}`,
          from_name: contactForm.name,
          email: contactForm.email,
          message: [
            `Requested: ${isDigital ? 'digital' : 'printed'} edition (personal request, not a sale)`,
            `Name: ${contactForm.name}`,
            `Email: ${contactForm.email}`,
            contactForm.note ? `Note: ${contactForm.note}` : null,
          ].filter(Boolean).join('\n'),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error('Submit failed');
      setFormSent(true);
      setShowSuccessPopup(true);
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showSuccessPopup) return undefined;
    // Start the exit animation before the unmount, so the toast leaves the
    // way it arrived instead of teleporting away — matches the .closing
    // exit duration (260ms) declared in CeskeRealiePage.css.
    const closeTimer = setTimeout(() => setToastClosing(true), 5740);
    const unmountTimer = setTimeout(() => {
      setShowSuccessPopup(false);
      setToastClosing(false);
    }, 6000);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(unmountTimer);
    };
  }, [showSuccessPopup]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setExpandedPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isDigitalSelected = selectedData?.id === 'pdf';

  const renderSelectionContent = () => (
    <>
      <div className="ceske-selection-top">
        <div className="digital-notice-wrap">
          <span className="selected-label">
            {isDigitalSelected ? 'Digital edition' : 'Printed edition'}
          </span>
          <p className="digital-notice-text">
            {isDigitalSelected
              ? "The digital edition isn't sold — to keep it from being copied and resold, it's shared only with close friends and family, by personal request. If that's you, just reach out below and Julia will send it to you directly."
              : "The printed book isn't sold through this site — Julia shares copies personally with friends, family, and readers who ask. Reach out below and she'll get back to you."}
          </p>
          <span className="selected-addon">{selectedData.audioNote}</span>
        </div>
        {!showContactForm && !formSent && (
          <button type="button" className="purchase-cta" onClick={handleOpenForm}>
            Request a Copy
          </button>
        )}
      </div>

      {showContactForm && !formSent && (
        <form className="ceske-contact-form" onSubmit={handleFormSubmit}>
          <p className="ceske-form-notice">
            Let Julia know a little about yourself, and she&apos;ll be in touch
            about your copy personally.
          </p>
          <label className="ceske-form-field">
            <span className="ceske-form-label">Your name</span>
            <input
              className="ceske-form-input"
              type="text"
              required
              value={contactForm.name}
              onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Full name"
            />
          </label>
          <label className="ceske-form-field">
            <span className="ceske-form-label">Email address</span>
            <input
              className="ceske-form-input"
              type="email"
              required
              value={contactForm.email}
              onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
            />
          </label>
          <label className="ceske-form-field">
            <span className="ceske-form-label">Note (optional)</span>
            <textarea
              className="ceske-form-input ceske-form-textarea"
              value={contactForm.note}
              onChange={(e) => setContactForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="Any questions or special requests…"
              rows={3}
            />
          </label>
          {submitError && (
            <p className="ceske-form-error">
              Something went wrong. Please try again or email{' '}
              <a href="mailto:julia.merkusheva@gmail.com">julia.merkusheva@gmail.com</a> directly.
            </p>
          )}
          <button type="submit" className="purchase-cta" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send Request'}
          </button>
        </form>
      )}

      {formSent && (
        <p className="ceske-form-success">
          Request sent! Julia will be in touch with you soon.
        </p>
      )}
    </>
  );

  const previewData = {
    cover: {
      src: '/images/ceske-realie-cover.png',
      alt: 'České Reálie cover',
      caption: 'Book Cover Preview',
    },
    back: {
      src: '/images/author%20page.png',
      alt: 'České Reálie back page preview',
      caption: 'Back Page Preview',
    },
    context: {
      src: '/images/context.png',
      alt: 'České Reálie context page preview',
      caption: 'Context Page Preview',
    },
  };

  return (
    <main
      className="ceske-page"
      aria-label="České Reálie copy request"
      onClick={(e) => {
        // The content card reads like a modal even though it's a full page —
        // clicking the margin around it goes back to the homepage, matching
        // that expectation. e.target === e.currentTarget means the click
        // landed on this backdrop itself, not bubbled up from the card.
        if (e.target === e.currentTarget) navigate('/');
      }}
    >

      {showSuccessPopup && (
        <div
          className={`ceske-success-toast${toastClosing ? ' closing' : ''}`}
          role="alert"
          aria-live="assertive"
        >
          <span className="ceske-toast-corner tl" aria-hidden="true" />
          <span className="ceske-toast-corner tr" aria-hidden="true" />
          <span className="ceske-toast-corner bl" aria-hidden="true" />
          <span className="ceske-toast-corner br" aria-hidden="true" />
          <span className="ceske-toast-eyebrow">Request confirmed</span>
          <p className="ceske-toast-title">Thank you, {contactForm.name}!</p>
          <p className="ceske-toast-body">Your request was sent successfully. Julia will be in touch soon.</p>
          <button
            type="button"
            className="ceske-toast-close"
            onClick={() => {
              setToastClosing(true);
              setTimeout(() => {
                setShowSuccessPopup(false);
                setToastClosing(false);
              }, 260);
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="ceske-shell">
        <a
          href="https://www.instagram.com/realie_cr_zkouska/"
          target="_blank"
          rel="noopener noreferrer"
          className="ceske-instagram-badge"
        >
          <svg className="ceske-instagram-badge-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="17" cy="7" r="0.9" fill="currentColor" />
          </svg>
          <span>Follow České Reálie on Instagram</span>
        </a>
        <h1 className="ceske-title">Request a Copy</h1>
        <p className="ceske-description">
          Choose which format you would like.
        </p>

        {/* The price/form panel used to render TWICE (once per breakpoint,
            toggled via CSS display:none) so it could sit inline right after
            the selected card on mobile but always below both cards on
            desktop. Two copies of the same form fields in the DOM at once
            confuses screen readers, autofill, and password managers. Now
            there's exactly one: its visual position is controlled by CSS
            `order` instead of duplicating it. Cards get even order values
            (0, 2, 4...) leaving odd slots between them; the panel's --panel-order
            custom property places it right after the selected card on
            mobile (single column, so "between" is meaningful), while on
            desktop it's pinned to always-last via a fixed order in
            CeskeRealiePage.css, since a 2-column grid can't have a
            full-width item sit "between" two side-by-side cards without
            breaking the row. */}
        <div className="ceske-options" role="radiogroup" aria-label="Format selection">
          {purchaseOptions.map((option, index) => {
            const isActive = selectedOption === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                className={`ceske-option-card ${isActive ? 'is-active' : ''}`}
                style={{ order: index * 2 }}
                onClick={() => handleSelectOption(option.id)}
              >
                <span className="option-kicker">{option.subtitle}</span>
                <span className="option-title">{option.title}</span>
                <span className="option-detail">{option.detail}</span>
              </button>
            );
          })}
          {selectedData && (
            <section
              className="ceske-selection"
              aria-live="polite"
              style={{ '--panel-order': purchaseOptions.findIndex((o) => o.id === selectedOption) * 2 + 1 }}
            >
              {renderSelectionContent()}
            </section>
          )}
        </div>

        <section className="ceske-content-preview" aria-label="Book cover, back page, and context page preview">
          <figure className="ceske-preview-frame">
            <button
              type="button"
              className="ceske-preview-trigger"
              onClick={() => setExpandedPreview(previewData.cover)}
              aria-label="Open full-size book cover preview"
            >
              <img src={previewData.cover.src} alt={previewData.cover.alt} className="ceske-preview-image" />
            </button>
            <figcaption>Book Cover Preview</figcaption>
          </figure>

          <figure className="ceske-preview-frame">
            {!authorImageMissing ? (
              <button
                type="button"
                className="ceske-preview-trigger"
                onClick={() => setExpandedPreview(previewData.back)}
                aria-label="Open full-size back page preview"
              >
                <img
                  src={previewData.back.src}
                  alt={previewData.back.alt}
                  className="ceske-preview-image"
                  onError={() => setAuthorImageMissing(true)}
                />
              </button>
            ) : (
              <div className="ceske-author-photo-fallback" aria-hidden="true">Back Page</div>
            )}
            <figcaption>Back Page Preview</figcaption>
          </figure>

          <figure className="ceske-preview-frame">
            <button
              type="button"
              className="ceske-preview-trigger"
              onClick={() => setExpandedPreview(previewData.context)}
              aria-label="Open full-size context page preview"
            >
              <img src={previewData.context.src} alt={previewData.context.alt} className="ceske-preview-image" />
            </button>
            <figcaption>Context Page Preview</figcaption>
          </figure>
        </section>

        {expandedPreview && ReactDOM.createPortal(
          <div
            className="ceske-preview-modal"
            role="dialog"
            aria-modal="true"
            aria-label={expandedPreview.caption}
            onClick={() => setExpandedPreview(null)}
          >
            <div className="ceske-preview-modal-content" onClick={(e) => e.stopPropagation()}>
              <img src={expandedPreview.src} alt={expandedPreview.alt} className="ceske-preview-modal-image" />
            </div>
          </div>,
          document.body
        )}
      </section>
    </main>
  );
};

export default CeskeRealiePage;
