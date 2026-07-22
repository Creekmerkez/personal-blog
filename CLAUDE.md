# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (strict: max-warnings 0)
npm run deploy     # Build + deploy to GitHub Pages via gh-pages
```

No test suite is configured.

## Architecture

React 18 SPA built with Vite. Deployed to GitHub Pages (CNAME file sets the domain).

**Component layout (top to bottom on the page):**
1. `Header.jsx` — Full-width video banner with custom YouTube-style controls (play/pause/mute/seek). Handles loading and error states.
2. `MainContent.jsx` — Bio text, books section, Instagram feed, YouTube gallery. Also mounts the floating Q&A button.
3. `QAChat/` — Draggable floating button + modal with 54 bilingual (Ukrainian/English) Q&A pairs. Data lives in `qaData.js` as a static array.
4. `Footer.jsx` — LinkedIn CTA.

**Content is hardcoded in components** — no CMS or database. To update bio text, books, or Q&A answers, edit the relevant component directly. Book data is in `BooksSection.jsx`, Q&A data in `src/components/QAChat/qaData.js`.

**Styling:** One CSS file per component in `src/styles/`. No CSS modules or utility frameworks — plain vanilla CSS. Mobile breakpoints at `600px` and `768px`. Global styles in `global.css`, fonts in `fonts.css`.

**Path alias:** `@` resolves to `./src` (configured in `vite.config.js`).

## ESLint

Uses ESLint 9 flat config (`eslint.config.js`). The `--max-warnings 0` flag means any warning is a build failure. Run `npm run lint` before committing.
