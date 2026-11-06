# AeroAca

**Written learning blueprint:** [career-switch guide](docs/SUSHMITA_CAREER_SWITCH_GUIDE.md) · [full curriculum map](docs/FULL_CURRICULUM_MAP.md) · [topic breakdown](docs/MODULE_TOPIC_BREAKDOWN.md) · [learner guide](docs/LEARNER_GUIDE.md) · [30/60/90 plan](docs/STUDY_PLAN_30_60_90.md) · [diagrams](docs/DIAGRAM_INDEX.md).

Long-term engineering planning: [source audit](docs/ENGINEERING_GAP_AUDIT.md), [coverage matrix and CSV](docs/LEARNING_COVERAGE_MATRIX.md), [four career pathways](docs/CAREER_PATHWAYS.md), [revised syllabus](docs/CURRICULUM.md), [implementation plan](docs/ENGINEERING_IMPLEMENTATION_PLAN.md). New lesson rollout awaits the three-lesson pilot evaluation; planned subjects are not published capabilities.

A mobile-first engineering academy for Sushmita: short, problem-led electronics and embedded lessons, branching fault-isolation missions, interview practice with rubrics, and spaced review. Built for an **Associate Avionics Engineer** moving into electronics R&D and embedded roles across aerospace, automotive, medical, industrial and consumer electronics.

**Release 0.1** (in production) shipped the vertical slice: three lessons, two missions, a ten-question interview bank, device-local progress and an installable PWA. **Release 0.2** adds the 30-day guided journey, five more lessons, two more missions, targeted revision from real mistakes, cross-industry interview notes and a larger glossary. **Release 0.3** fills journey days 11–15 with integration, verification and root-cause content, including a requirements-to-tests traceability interactive. **Release 0.4** fills days 16–20 with startup code, RTOS scheduling and handoff, bootloaders and embedded Linux. **Release 0.5** fills days 21–25 with Python test automation (a simulated SCPI console), hardware-in-the-loop and FMEA. **Release 0.6** completes the 30 days with standards as scope, cross-industry transfer, portfolio presentation, a debugging-story lesson and a timed mock-interview mode. **Release 0.7** adds the portfolio track: an STM32 sensor monitor built in seven stages, with simulation and hardware evidence recorded separately and an in-browser fault-injection lab. **Release 0.8** fills the curriculum: power trees, op-amps, ADC noise, schematic review, datasheets, NVIC, CAN, pointers to hardware, embedded C++, driver models and logic analysers, with four more interactives and two missions. **Release 0.9** adds recommendations and a readiness view derived only from recorded evidence, a backup-migration test and on-demand loading of the interactives.

## Quick start

```bash
npm ci            # Node 20.9+ (CI uses Node 22)
npm run dev       # http://localhost:3000
npm run check     # lint + typecheck + unit tests + production build
npm run test:e2e  # Playwright, mobile (Pixel 7) and desktop; builds and starts the app itself
```

Other scripts: `npm run build`, `npm start`, `npm test` (Vitest), `npm run icons` (regenerate PWA icons from `public/icons/icon.svg`).

## What a learner gets

| Screen | Route | What it does |
|---|---|---|
| Today | `/` | The current journey day: one obvious next step, the day's checklist (lessons, missions, interview rehearsal, spaced review, career actions she ticks herself), realistic minutes, this week's numbers |
| Journey | `/journey` | All 30 days in six blocks, with real statuses; days whose content is not yet published are marked and never counted as done |
| Learn | `/curriculum` | All 16 modules from [docs/CURRICULUM.md](docs/CURRICULUM.md); published items are playable, planned ones are marked *Coming soon* and are not links |
| Lesson | `/lessons/[slug]` | Scenario → concept → interactive visual → example → exercises → interview question → recap, with per-answer feedback. Completion requires every exercise solved |
| Mission | `/missions/[slug]` | Fault isolation with a simulated bench: actions cost minutes, unlock other actions, and are judged; a diagnosis must be backed by evidence; a fix is graded; a debrief compares your path with an efficient one |
| Interview | `/interview` | Questions that probe reasoning, a strong/weak rubric, follow-up probes, a sample answer, honest self-rating |
| Progress | `/progress` | Only real completions, attempts, weak skills, interview ratings; export/import/reset of device-local data |
| Review | `/review` | Spaced recall of recap cards from completed lessons (Leitner-style boxes), plus targeted review: every exercise answered wrongly or left unsolved, grouped by skill, with a link straight back to that step |
| Portfolio | `/portfolio` | The STM32 sensor-monitor project in seven stages; deliverables ticked per path (written, simulation, hardware) and an evidence table derived only from those ticks |
| Terms | `/glossary` | Searchable glossary of every technical term; inside lessons, missions and interview text the first occurrence of each term is tappable and opens the same definition |

### Published content

The authoritative list is the Curriculum page in the app (every module, every lesson and mission, with status) and `docs/LEARNING_COVERAGE_MATRIX.md` (every curriculum topic with what covers it). In summary, across the 16 modules:

- **Lessons** in every module: electronics fundamentals (circuit laws, RC and filters, diodes and transistors, logic levels, power trees, op-amps, ADC, grounding and protection), schematics and datasheets, MCU boot, interrupts and watchdogs, I2C/UART/SPI/CAN, Embedded C and C++, startup code, bootloaders and driver models, RTOS, embedded Linux, instruments (multimeter and bench supply, oscilloscope, logic analyser, root-cause analysis), bring-up and ICDs, test design, SIL/HIL and FMEA, Python automation, standards as scope, cross-industry transfer, portfolio and interview communication. Each lesson: scenario, concepts with references, worked example, graded exercises with misconception feedback, an interview question with rubric, review cards; many carry an interactive and a runnable lab.
- **Missions**: ten branching fault-isolation scenarios with simulated bench readings, evidence-backed diagnosis and graded fixes.
- **Interactives** on boot chains, I2C, registers, UART, SPI, watchdog timing, aliasing, traceability, startup, priority inversion, a SCPI console, FMEA, standards, the sensor-monitor lab, ADC quantisation, CAN arbitration, PWM timers, NVIC priorities, dividers and RC response.
- **Runnable labs** under `labs/` with CI-verified expected output (see "Running the labs").
- **Portfolio track**: the STM32 sensor monitor in seven stages with Build-it steps.
- **Interview bank** with rubrics and cross-industry notes; **glossary** of tappable terms; **30-day journey** as the fast track; a **starting-level diagnostic** at `/start`.

Exact counts live in `docs/DEVELOPMENT_STATUS.md` and change with every content PR; the lesson counts shown on the Today page are computed from the content at build time.

All mission readings are simulated and labelled as such in the UI.

## Architecture

```
app/            Next.js 16 App Router pages (all prerendered static HTML)
components/     UI: shell, ui primitives, visuals (SVG), lesson player + exercises, mission player, interview, progress, review, pwa
content/        Learning content as typed data: lessons/, missions/, curriculum.ts, interview.ts, glossary.ts, index.ts (registry)
lib/content/    zod schemas + loaders (lesson/mission/curriculum/interview, learning path), glossary matcher (remark plugin)
lib/learning/   Pure grading functions and the mission state machine
lib/progress/   Device-local store (localStorage, versioned, zod-validated), React provider, selectors
public/         manifest icons, service worker (sw.js)
tests/          Vitest unit tests (content validity, grading, mission engine, store)
e2e/            Playwright tests (mobile + desktop)
docs/           Product brief, curriculum, MVP, architecture decisions, deployment, authoring, release report
```

Key decisions, with reasoning, are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). In short:

- **Next.js 16 + TypeScript + Tailwind v4**, fully static output, no server code, no API keys, no database.
- **Content is typed data, not MDX.** Lessons are step sequences with structured exercises, validated by zod at test time. Prose fields are Markdown. See [docs/CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md).
- **Progress is device-local** (localStorage, schema-versioned). The UI says so wherever it matters and offers export/import.
- **Grading, mission and journey logic are pure functions** with unit tests; the UI only renders their results. Journey days complete only when every available item is genuinely done; planned items never count.
- **Definitions on demand.** A remark plugin links the first occurrence of each glossary term per block of Markdown; a shared bottom sheet shows a plain-language definition, the precise detail, why it matters for her work, related terms and the lesson it comes from.
- **Personal, warm, adult.** Greeting by name (editable on Progress), "why this matters for your next role" on every lesson and mission, encouraging feedback copy. No badges, streaks or confetti.

## Adding a lesson or mission

1. Create `content/lessons/<slug>.ts` (or `content/missions/<slug>.ts`) exporting a `Lesson` / `Mission` object. Copy an existing one as a template.
2. Register it in `content/index.ts`.
3. Mark it `published` with its slug in `content/curriculum.ts`, and replace the matching `planned` item in `content/journey.ts` with a `lesson` or `mission` item.
4. `npm test` validates the schema, cross-references, exercise answer keys and mission reachability. `npm run build` prerenders the new route.

No page or component changes are needed. Full guide: [docs/CONTENT_AUTHORING.md](docs/CONTENT_AUTHORING.md).

## Testing

- `npm test`: unit tests across content validation, grading, mission engine, progress store, learner profile and the glossary matcher.
- `npm run test:e2e`: Playwright flows on a Pixel 7 profile and desktop Chrome: navigation, planned-content gating, completion of all three lessons with wrong-then-right answers and reload resume, both missions (wrong path, evidence-backed path, reload mid-run), interview rating and filters, spaced review, progress reset, not-found, PWA manifest/icons/service worker, keyboard access, glossary sheet and search, and axe accessibility scans (WCAG 2.0 A/AA, no serious or critical violations) of every primary screen.
- CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, build and e2e on every push and pull request.

## Deployment

Vercel, from the GitHub repository. Steps, environment and verification checklist: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The app has no environment variables and no secrets.

## Limitations in 0.1

- Progress lives in one browser profile; there is no account or sync. Clearing site data deletes it (export a backup from Progress).
- Eight lessons and four missions are published; days 1–10 of the journey are complete, days 11–30 reference content that is still planned and is shown as *Coming soon*.
- PWA installability is verified by automated checks (manifest, icons, service worker registration); install behaviour on physical iOS and Android devices has not yet been confirmed by hand.
- No AI tutor, no payments, no accounts, by design.

## Privacy

The repository is public. It contains no personal data, employer material, credentials or real measurements. The deployed app stores progress only in the learner's browser and sends nothing to a server. If private deployment is wanted, add authentication or Vercel deployment protection before collecting anything beyond device-local state.

## Repository documents

- [Product brief](docs/PRODUCT_BRIEF.md), [handoff](docs/FABBY_HANDOFF.md), [curriculum](docs/CURRICULUM.md), [MVP](docs/MVP.md)
- [Architecture decisions](docs/ARCHITECTURE.md) · [Content authoring](docs/CONTENT_AUTHORING.md) · [Deployment](docs/DEPLOYMENT.md) · [Release 0.1 report](docs/RELEASE_0.1_REPORT.md)

## Running the labs

Lessons marked **Run it yourself** and the portfolio's **Build it** steps are small C and Python programs under `labs/`. Each shows the exact command and an expected output that CI reproduces on every change (`tests/labs.test.ts`). Set-up is in `docs/LOCAL_LAB.md`.
