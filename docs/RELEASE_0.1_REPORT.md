# Release 0.1 report

Date: 2026-11-05. Branch `feat/release-0.1`.

## What works

**On a phone (verified with Playwright on a Pixel 7 profile, and by screenshot review at 412 px wide in light and dark mode):**

- Today shows one next action that changes with real progress: start → resume → next item → review cards → interview practice.
- The learning path lists the 3 lessons and 2 missions with honest statuses (not started / in progress / completed).
- Curriculum shows all 16 modules; 5 published items are links, 25 planned items are labelled *Coming soon* and are not clickable.
- Lesson player: step-by-step with a tappable progress strip, sticky Back/Next, interactive visuals (boot chain, I2C waveform with address/direction/ACK controls, tap-the-bits register, read-modify-write timeline), five exercise types with answer-specific feedback, interview step with rubric and self-rating, recap with review cards and references. Next is locked until the current exercise is solved; completion requires every exercise solved.
- Mission player: simulated bench with 11–12 actions, costs in bench-minutes, prerequisites that unlock actions, per-action assessment, diagnosis with evidence requirement, graded fix, debrief with score breakdown and path comparison. Wrong paths and right paths produce different outcomes, text and scores.
- Interview page: 10 questions, filters by rating and topic, rubric, probes, sample answer, self-rating saved.
- Progress page: lessons with solved counts, missions with best scores, weak skills from real wrong attempts, interview questions rated not-yet/shaky, review queue size, export/import/reset.
- Review page: spaced recall with Again / Got it and growing intervals.
- Progress survives reload (step position, solved exercises, completions, mission runs, ratings, review schedule).
- PWA: manifest with 192/512/maskable icons, apple-touch-icon, service worker registered in production, offline fallback for visited pages, install hint when the browser signals installability (and written instructions on iOS).
- Accessibility: skip link, visible focus rings, labelled controls, `aria-live` feedback, keyboard operation of every exercise (no drag-and-drop), reduced-motion respected, no horizontal overflow at phone width.

## Test and build evidence

| Check | Result |
|---|---|
| `npm run lint` (ESLint 9, eslint-config-next incl. React Compiler rules) | 0 errors, 0 warnings |
| `npm run typecheck` (strict TS, `noUncheckedIndexedAccess`) | clean |
| `npm test` (Vitest) | 4 files, 29 tests passed |
| `npm run build` (Next 16) | 13 routes, all prerendered static |
| `npm run test:e2e` (Playwright 1.63, Pixel 7 + Desktop Chrome) | 14 passed |

Unit tests cover: schema validity of all content, curriculum cross-references, interview links, unique ids, mission reachability/evidence/budget, grading of every exercise kind including misconceptions and protected bits, mission engine gating/scoring/reset, store persistence/corruption handling/no-storage mode/completion rules/review scheduling/next-action/export-import.

E2E tests cover: navigation, planned-content gating, full I2C lesson completion with wrong-then-right answers, mid-lesson reload resume, register exercise grading, mission wrong path vs. evidence-backed path with persistence, manifest/icons/service worker, keyboard access.

## Deployment status

See the pull request description and `docs/DEPLOYMENT.md`. The Vercel project `aeroaca` exists under the `aero-aca` team. A live URL is only reported once a deployment has been verified.

## Known limitations

- Progress is per browser profile; no sync. Export/import is manual.
- A mission run that is interrupted by a reload restarts; finished runs are saved.
- 3 lessons, 2 missions, 10 interview questions, 14 review cards. The remaining curriculum is planned.
- Install behaviour on physical iOS/Android devices has not been confirmed by hand yet; automated checks cover manifest, icons and service worker registration.
- Offline support is best-effort (visited pages).
- The review scheduler is a simple Leitner ladder (10 min, 1, 3, 7, 14, 30 days), not an SM-2 style algorithm.

## Decisions for the Product Owner

1. **Deployment privacy.** The site is public by URL once deployed. Enable Vercel Deployment Protection if the academy should be private.
2. **Next content block.** Suggested order: UART framing lesson + mission, SPI first-byte lesson, watchdog/reset-loop lesson, then a Python/PyVISA lesson for days 21–25.
3. **Sync.** Only if Sushmita uses more than one device regularly; it would require an account and a store, which 0.1 deliberately avoids.
4. **Content review.** Lessons are marked *Technically reviewed* on the basis of cited vendor documentation; a second human review by an embedded engineer is recommended before wider use.
