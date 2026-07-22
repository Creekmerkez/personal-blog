---
name: Site Architecture Constraints — Critical Facts for Reviews
description: Key architectural facts that affect every proposal: no router, no CMS, hardcoded content, ESLint zero-warnings, GitHub Pages
type: project
---

**No routing library installed.** `package.json` has no `react-router-dom` or equivalent. App.jsx is a flat component tree: Header → MainContent → Footer. Any proposal requiring multiple URL routes needs react-router-dom added as a dependency.

**Why:** The site was built as a single-page no-scroll presentation, not a multi-page app.

**How to apply:** Any proposal adding a `/music` or other sub-page is a significant architectural change, not a small feature. Flag routing addition as a dependency blocker and evaluate whether hash-based routing within the SPA is a viable alternative.

**GitHub Pages hosting.** Deployed via `gh-pages` to a custom domain (CNAME). GitHub Pages serves static files — deep links (e.g., `/music`) return 404 unless a 404.html redirect hack or hash routing is used.

**ESLint strict: `--max-warnings 0`.** Any lint warning breaks the build. New components must be lint-clean.

**Content is fully hardcoded.** No CMS, no database. Video IDs in YouTubeVideos.jsx (5 videos), YouTubeMixesGallery.jsx exists but uses placeholder IDs — it appears to be an unused draft component. The active gallery component is YouTubeVideos.jsx.

**One CSS file per component.** No CSS modules, no utility framework. New pages need a new CSS file each.

**Global background: #C9B7A0.** Warm beige. Text colors: #7a5c2e (body), #a3834b (highlights/links). Font: EB Garamond serif throughout.

**Header is not a traditional navbar.** It occupies 100vh (desktop) as a two-column layout: left=bio panel (white bg), right=video panel. Adding a nav link changes this visual contract fundamentally.

**YouTubeMixesGallery.jsx** exists as a component with placeholder YouTube IDs (clearly not real) and a corresponding CSS file. It is NOT imported anywhere — it is dead/draft code. Do not treat it as part of the current live site.
