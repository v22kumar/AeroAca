# Architecture decisions — Release 0.1

Short records of the decisions that shape the codebase, in the style of ADRs.

## ADR-1: Next.js 16 App Router, static output, no backend

**Decision.** Next.js 16 with the App Router, TypeScript and Tailwind CSS v4. Every route is prerendered to static HTML; there are no server actions, API routes, environment variables or secrets.

**Why.** The brief asks for a low-cost, Vercel-friendly stack with no premature backend. Static pages load fast on a phone, cache well in a service worker, and cannot leak data they do not have. Next's `generateStaticParams` gives one route per lesson and mission at build time.

**Consequences.** Anything that depends on the learner's state renders client-side after hydration. A `Hydrated` guard and skeletons avoid hydration mismatches. If cross-device sync is ever added, it becomes a separate, explicit layer.

## ADR-2: Content as typed data with zod, not MDX

**Decision.** Lessons, missions, the curriculum and the interview bank are TypeScript modules exporting plain objects. Prose fields are Markdown strings rendered with `react-markdown`. Everything is validated against zod schemas (`lib/content/schema.ts`) in the unit tests.

**Why.** The learning value lives in structured interaction: exercises with per-option feedback, ordering with per-item rationale, a register editor with protected bits, a mission graph with prerequisites, evidence tags and graded fixes. MDX is excellent for prose but turns this structure into ad-hoc JSX props with no validation. Typed data makes answer keys, cross-references and reachability checkable in CI, keeps content serialisable for server-to-client rendering, and lets a new lesson be added by adding one file and one registry line.

**Consequences.** Authors write TypeScript object literals rather than Markdown documents. The schema is the contract; the tests refuse inconsistent content (duplicate ids, single-choice with two correct options, unreachable mission paths, published curriculum entries without a lesson).

## ADR-3: Device-local progress with a versioned, validated store

**Decision.** `lib/progress/store.ts` is a framework-agnostic store mirrored to `localStorage` under a versioned key. Loads are validated with zod; corrupt or foreign data is ignored. React subscribes through `useSyncExternalStore`. The store exposes export/import/reset.

**Why.** The brief rules out auth and a database for 0.1. A single in-memory source of truth with validation gives reliable persistence without hiding the limitation: the UI states that progress is per browser.

**Consequences.** Progress does not sync. Migrations are handled by the version in the key and the schema literal; a future version adds a migration step in `load()`.

## ADR-4: Completion rules are explicit and conservative

**Decision.** A lesson is complete only when every exercise has been answered correctly at least once and the recap has been reached. A mission is complete only when a run ends with the correct diagnosis backed by the required evidence. "Weak areas" are derived from real wrong attempts and the learner's own interview ratings.

**Why.** The brief forbids fake progress. Reading steps is not learning; solving is.

## ADR-5: Pure logic, thin UI

**Decision.** Grading (`lib/learning/grading.ts`) and the mission engine (`lib/learning/mission.ts`) are pure functions with no React or DOM dependency. Components dispatch events and render results.

**Why.** Correctness of feedback is the product. Pure functions are unit-tested exhaustively and are reusable by any future UI (for example a native wrapper).

## ADR-6: Missions as a gated action graph

**Decision.** A mission is a scenario, a set of actions with simulated results, assessments and evidence tags, prerequisites (`requiresAnyOf`), a diagnosis list where the correct one requires evidence, graded fixes, a budget of bench-minutes and an optimal path.

**Why.** This produces genuinely different experiences from different choices: actions unlock others, red herrings are judged, unjustified correct guesses are called out, and the debrief compares paths and time. It is small enough to author by hand and rich enough to teach method, not trivia.

## ADR-7: Visual system

**Decision.** A restrained "engineer's bench notebook" palette: warm paper, ink text, one instrument-teal accent, amber for attention, light and dark modes via `prefers-color-scheme`, system fonts (no web-font download), 16 px gutters, bottom navigation on phones and a side rail from 768 px.

**Why.** The audience is an adult engineer. The design has to be calm, legible on a phone in one hand, and fast. No badges, streaks or confetti.

## ADR-9: Definitions on demand through a remark plugin

**Decision.** A glossary (`content/glossary.ts`) is matched into rendered Markdown by a small remark plugin (`lib/content/glossary-matcher.ts`) that links the first occurrence of each term per block to `term:<id>`; `react-markdown` renders those links as buttons that open one shared definition sheet.

**Why.** The learner should never have to leave a lesson to find out what a word means, and authors should not have to hand-annotate every term. Matching at render time keeps content plain Markdown; one sheet keeps the DOM small and the behaviour consistent. Capitalised aliases match case-sensitively so prose words such as "can" and "start" stay plain.

**Consequences.** Adding a term is one object literal; it lights up everywhere at once. Option labels in exercises are excluded so taps select answers.

## ADR-10: The journey is derived, not stored

**Decision.** The 30-day journey is content (`content/journey.ts`). The learner's position in it is *derived* at render time from the same progress facts the rest of the app uses (completed lessons, solved missions, rated questions, due cards, ticked actions). Only the career-action ticks are new stored state.

**Why.** A stored "current day" drifts from reality the moment a lesson is completed out of order or a backup is restored. Deriving it keeps a single source of truth, makes the journey testable as a pure function, and means publishing a lesson later automatically unlocks the day it belongs to.

**Consequences.** Days with unpublished items show them as coming soon and complete on their available items only, so the learner is never blocked by missing content and nothing unbuilt is ever marked done.

## ADR-11: Targeted revision comes only from recorded attempts

**Decision.** The targeted-review list is computed from exercise attempts (wrong answers and unsolved reached exercises), grouped by skill tag, each linking to the exact lesson step via `?step=N`. No mastery percentages are shown anywhere.

**Why.** The brief forbids fake mastery. Counts of real mistakes with a direct retry path are both honest and actionable.

## ADR-8: PWA without a framework

**Decision.** Next's `app/manifest.ts` generates the manifest; `public/sw.js` is a small hand-written service worker (precache of the app shell, network-first navigations with cache fallback, cache-first hashed assets). Icons are rendered from one SVG with Playwright (`npm run icons`).

**Why.** Dependencies like next-pwa lag behind Next releases and add build complexity. Forty lines of plain JavaScript cover the need and can be read in full.

**Consequences.** Offline support is best-effort: pages visited once stay available. Installability is verified in e2e by manifest, icon and registration checks; physical-device install behaviour is documented as a manual check in `docs/DEPLOYMENT.md`.

## ADR-12: Portfolio evidence is the learner's own record, with simulation and hardware kept apart

**Context.** The 1.0 definition of done requires a usable STM32 portfolio track with a simulation-only path and optional hardware exercises, and "verified vs simulated results clearly separated". The app cannot verify what happened on a learner's bench, and must not pretend to.

**Decision.** A project is typed content (`projectSchema`): stages with deliverables, each deliverable tagged `doc`, `sim`, `hw` or `both`. A `both` deliverable has two independent records. The learner ticks what she has done; ticks are stored under the existing `applyDone` map with `project:` keys, so no progress-schema migration is needed and export/import carry them. `projectState` and `evidenceTable` derive the stage status and the simulated-versus-hardware table from those ticks only. The in-browser sensor-monitor lab is labelled a simulation in the UI and counts as simulation evidence by the learner's tick, never automatically.

**Consequences.** Nothing on the portfolio page is "verified by the app"; the page says so. The evidence table can be copied into the stage-7 report as it stands, including empty hardware columns, which is the honest result for a learner without a board. Adding a second project is a content file and a registry entry.

## ADR-13: Recommendations and readiness are explained lists derived from recorded evidence

**Context.** The mandate forbids fabricated mastery or readiness percentages and asks for adaptive revision and interview preparation driven by actual learner evidence.

**Decision.** `lib/progress/recommend.ts` produces an ordered list of next steps, each carrying the facts it rests on: retries from wrong or unsolved exercises (highest priority), lessons that exercise a weak skill or ground a shaky interview rating, missions whose module lessons are all complete, and first lessons of untouched modules (lowest). `lib/progress/readiness.ts` reports per module the counts of lessons completed, missions solved with evidence, questions rated confident and open wrong answers, a status in words, and the gaps that would change it. Neither computes a score; neither predicts. Both render on Today (top three) and Progress (full list and the readiness table).

**Consequences.** Every recommendation can be checked by the learner against her own history. Changing the rules is a change to two pure functions covered by unit tests. The readiness view is honest by construction: an empty profile reads "no evidence yet", and "evidence complete" requires every piece of evidence the module can hold.

## ADR-14: Interactive visuals load on demand

**Context.** With nineteen interactives, the static dispatcher bundled every visual into every lesson page.

**Decision.** `components/visuals/Visual.tsx` resolves each visual with `next/dynamic`, so a lesson page downloads only the interactive it uses, with a skeleton while it loads. Measured on the CAN lesson: none of the other visuals' code appears in the page's initial scripts.

**Consequences.** The content bundle (all lessons and the glossary as typed data, needed client-side for progress derivation under ADR-2 and ADR-10) remains the largest chunk; it is text and compresses well, and the service worker caches it after first load. A server-side split of content per route is possible later without changing the content model.

