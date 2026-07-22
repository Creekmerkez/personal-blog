Custom commant: /new-task
Description: Orchesrates the ui wokflow: design - implement - verify

You are executing a structured 3-phase workflow to implement a new feature in this personal blog project. The task to implement is:

**$ARGUMENTS**
new-task (required): the ui featue to desin and implement
Follow these phases strictly and in order. Do not start the next phase until the current one is complete.

---

## Phase 1: UX Design Review

Invoke the `ux-quality-auditor` agent with the full task description above. Pass it all relevant context: what the feature is, where it will appear on the page (Header, MainContent, QAChat, or Footer), and any interaction patterns or layout changes involved.

Wait for the agent to return its assessment. If the agent raises blockers or recommends significant changes to the proposal, surface those findings to the user and ask whether to proceed with the original plan or incorporate the recommendations before coding.

---

## Phase 2: Implementation

Once Phase 1 is approved, implement the feature in code following the project conventions in CLAUDE.md:
- React 18 + Vite SPA — edit components in `src/components/`
- One CSS file per component in `src/styles/` — plain CSS, no utility frameworks
- Mobile breakpoints at `600px` and `768px`
- Content is hardcoded in components — no CMS
- Run `npm run lint` after making changes and fix any warnings (max-warnings 0)
- Run `npm run build` to confirm the production build succeeds

---

## Phase 3: UI Testing

After implementation, launch the dev server (`npm run dev`) and use the `mcp__playwright__browser_*` tools to verify the feature works correctly:

1. Navigate to `http://localhost:5173`
2. Take a screenshot of the relevant section to confirm visual correctness
3. Test the golden path: the primary interaction the feature is meant to support
4. Test at mobile viewport (375×667) — resize and take another screenshot
5. Check the browser console for any errors (`mcp__playwright__browser_console_messages`)
6. Report what passed, what failed, and any regressions observed in other sections

Close the browser when testing is complete.

---

After all three phases finish, provide a brief summary: what was built, what the UX audit flagged, and the test results.
