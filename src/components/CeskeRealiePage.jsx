import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/CeskeRealiePage.css';

const WEB3FORMS_KEY = '59ef3f7d-05e1-49b6-9b78-bdb24517095a';

const purchaseOptions = [
  {
    id: 'pdf',
    title: 'PDF or EPUB',
    subtitle: 'Instant digital delivery',
    priceCzk: 350,
    detail: 'Choose either format for tablet, e-reader, desktop, or print-at-home use.',
    audioNote: '+ audio MP3 for each topic included',
  },
  {
    id: 'physical',
    title: 'Printed Book',
    subtitle: 'Premium physical edition',
    priceCzk: 500,
    detail: 'Tangible, gift-ready copy prepared for premium packaging flow.',
    audioNote: '+ audio MP3 for each topic included',
  },
];

const CeskeRealiePage = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [authorImageMissing, setAuthorImageMissing] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', note: '' });
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `Book Order: ${selectedData.title} — from ${contactForm.name}`,
          from_name: contactForm.name,
          email: contactForm.email,
          message: [
            `Edition: ${selectedData.title} (${selectedData.priceCzk} CZK)`,
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
    const t = setTimeout(() => setShowSuccessPopup(false), 6000);
    return () => clearTimeout(t);
  }, [showSuccessPopup]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setExpandedPreview(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderSelectionContent = () => (
    <>
      <div className="ceske-selection-top">
        <div className="selected-price-wrap">
          <span className="selected-label">Selected price</span>
          <div className="selected-price-line">
            <strong className="selected-price">{selectedData.priceCzk} CZK</strong>
            <span className="selected-addon">{selectedData.audioNote}</span>
          </div>
        </div>
        {!showContactForm && !formSent && (
          <button type="button" className="purchase-cta" onClick={handleOpenForm}>
            Continue to Purchase
          </button>
        )}
      </div>

      {showContactForm && !formSent && (
        <form className="ceske-contact-form" onSubmit={handleFormSubmit}>
          <p className="ceske-form-notice">
            Online payment is still being set up. Fill in your details and Julia will contact you to confirm your order.
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
    <main className="ceske-page" aria-label="České Reálie purchase selection">

      {showSuccessPopup && (
        <div className="ceske-success-toast" role="alert" aria-live="assertive">
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
            onClick={() => setShowSuccessPopup(false)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <section className="ceske-shell">
        <div className="ceske-title-row">
          <h1 className="ceske-title">Choose Your Edition</h1>
          <a
            href="https://www.instagram.com/realie_cr_zkouska/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="České Reálie Instagram"
            className="ceske-title-instagram"
          >
            <svg className="ceske-instagram-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="17" cy="7" r="0.9" fill="currentColor" />
            </svg>
          </a>
        </div>
        <p className="ceske-description">
          Select how you would like to purchase.
        </p>

        <div className="ceske-options" role="radiogroup" aria-label="Purchase format selection">
          {purchaseOptions.map((option) => {
            const isActive = selectedOption === option.id;
            return (
              <React.Fragment key={option.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={`ceske-option-card ${isActive ? 'is-active' : ''}`}
                  onClick={() => handleSelectOption(option.id)}
                >
                  <span className="option-kicker">{option.subtitle}</span>
                  <span className="option-title">{option.title}</span>
                  <span className="option-detail">{option.detail}</span>
                </button>
                {isActive && selectedData && (
                  <section className="ceske-selection ceske-selection--inline" aria-live="polite">
                    {renderSelectionContent()}
                  </section>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {selectedData && (
          <section className="ceske-selection ceske-selection--below" aria-live="polite">
            {renderSelectionContent()}
          </section>
        )}

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
