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

## ADR-8: PWA without a framework

**Decision.** Next's `app/manifest.ts` generates the manifest; `public/sw.js` is a small hand-written service worker (precache of the app shell, network-first navigations with cache fallback, cache-first hashed assets). Icons are rendered from one SVG with Playwright (`npm run icons`).

**Why.** Dependencies like next-pwa lag behind Next releases and add build complexity. Forty lines of plain JavaScript cover the need and can be read in full.

**Consequences.** Offline support is best-effort: pages visited once stay available. Installability is verified in e2e by manifest, icon and registration checks; physical-device install behaviour is documented as a manual check in `docs/DEPLOYMENT.md`.
