import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/BlogPage.css';

// Posts are journal entries the owner publishes from the organizer, which
// commits them to public/blog/posts.json (see src/organizer/lib/publish.js).
// Each post has Ukrainian and, usually, English and Czech translations.

const LANGUAGES = [
  { id: 'uk', label: 'UA', locale: 'uk-UA', more: 'Читати далі', less: 'Згорнути' },
  { id: 'en', label: 'EN', locale: 'en-GB', more: 'Read more', less: 'Show less' },
  { id: 'cs', label: 'CZ', locale: 'cs-CZ', more: 'Číst dál', less: 'Sbalit' },
];
const byId = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));

// Longer posts start folded; a short one shows whole.
const FOLD_AT = 700;

/** The visitor's language when a post has it: Czech, Ukrainian (or Russian), else English. */
function preferredLanguage() {
  const wanted = (navigator.languages ?? [navigator.language]).map((l) => (l ?? '').slice(0, 2));
  for (const code of wanted) {
    if (code === 'cs') return 'cs';
    if (code === 'uk' || code === 'ru') return 'uk';
    if (code === 'en') return 'en';
  }
  return 'en';
}

const formatDate = (date, locale) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

const Post = ({ post, defaultLanguage }) => {
  const available = LANGUAGES.filter((l) => post[l.id]?.text);
  const [lang, setLang] = useState(post[defaultLanguage]?.text ? defaultLanguage : 'uk');
  const [open, setOpen] = useState(false);
  const { title, text } = post[lang];
  const language = byId[lang];
  const long = text.length > FOLD_AT;
  const cut = text.lastIndexOf(' ', FOLD_AT);
  const shown = long && !open ? `${text.slice(0, cut > 0 ? cut : FOLD_AT)}…` : text;
  const photos = open || !long ? post.photos ?? [] : (post.photos ?? []).slice(0, 1);

  return (
    <article className="blog-post" lang={lang}>
      <header className="blog-post-head">
        <time className="blog-post-date" dateTime={post.date}>{formatDate(post.date, language.locale)}</time>
        {available.length > 1 && (
          <div className="blog-langs" role="group" aria-label="Language">
            {available.map((l) => (
              <button key={l.id} type="button" aria-pressed={lang === l.id} onClick={() => setLang(l.id)}>{l.label}</button>
            ))}
          </div>
        )}
      </header>
      {title && <h2 className="blog-post-title">{title}</h2>}
      <div className="blog-post-text">
        {shown.split(/\n{2,}/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </div>
      {photos.map((url) => (
        <img key={url} className="blog-post-photo" src={url} alt="" loading="lazy" onError={(e) => { e.currentTarget.hidden = true; }} />
      ))}
      {long && (
        <button type="button" className="blog-more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? language.less : language.more}
        </button>
      )}
    </article>
  );
};

const BlogPage = () => {
  const [posts, setPosts] = useState(null);
  const [defaultLanguage] = useState(preferredLanguage);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Blog — Julia Merkusheva';
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    let live = true;
    fetch('/blog/posts.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : { posts: [] }))
      .catch(() => ({ posts: [] }))
      .then((data) => live && setPosts(Array.isArray(data.posts) ? data.posts.filter((p) => p.uk?.text && p.date) : []));
    return () => {
      live = false;
    };
  }, []);

  return (
    <main className="blog-page">
      <div className="blog-shell">
        <h1 className="blog-title">Blog</h1>
        {posts?.length === 0 && <p className="blog-empty">Nothing here yet.</p>}
        {posts?.map((post) => <Post key={post.id} post={post} defaultLanguage={defaultLanguage} />)}
        <Link className="blog-back" to="/">← Home</Link>
      </div>
    </main>
  );
};

export default BlogPage;
