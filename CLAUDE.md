# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint (strict: max-warnings 0)
npm run deploy     # Build + deploy to GitHub Pages via gh-pages
npm test           # Vitest unit/component tests
npm run test:e2e   # Playwright end-to-end tests
```

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

## Skill routing

Many skills are installed in `.agents/skills/`. Apply them automatically when a request matches — the user should never have to name one. Use this table; do not wait to be asked.

| When the request is about | Use |
|---|---|
| Adding/changing animation, motion, transitions, "make it feel alive" | `animate` |
| Critiquing motion that already exists | `review-animations` |
| Auditing motion across the whole codebase | `improve-animations` |
| UI polish, spacing, component feel, visual detail | `emil-design-eng` |
| Gestures, springs, sheets, drag/swipe, translucency | `apple-design` |
| A bug, test failure, or unexplained behavior | `systematic-debugging` |
| A small, contained bug fix | `surgical-patch` |
| Restructuring code without changing behavior | `safe-refactor` |
| Building a new feature or a whole new section | `lean-build` |
| Before claiming anything is done, fixed, or ready to deploy | `verification-before-completion` |
| Reviewing a diff for bloat / over-engineering | `ponytail-review` |
| Choosing a library or adding a dependency | `pick-ui-library` |
| General judgment on any coding task: keep it small, no speculative abstraction | `karpathy-guidelines` |

Only on explicit request (these interview the user, so never fire them unprompted): `grill-me`, `discovery-interview`, `brainstorming`, `ponytail`, `kaizen`.

Never auto-apply:
- `caveman*` — `caveman-setup` and `caveman-discover` route this project's LLM traffic (and in BYOK mode, a real provider API key) through the third-party `gateway.caveman.so`. Do not run them against the Worker or the AI chat. `caveman` itself compresses replies into terse shorthand, which is wrong for this user.
- `using-superpowers` — demands a skill invocation before every reply, including simple status questions.
- `write-swift`, `animate-expo`, `ask-sonner`, `migration`, `using-git-worktrees` — wrong stack or no such workflow in this repo.

When two skills overlap, pick the most specific one and use it alone. Do not stack four philosophy skills onto one small change.
