# AeroAca

A mobile-first engineering academy for Sushmita: short, problem-led electronics and embedded lessons, branching fault-isolation missions, interview practice with rubrics, and spaced review. Built for an **Associate Avionics Engineer** moving into electronics R&D and embedded roles across aerospace, automotive, medical, industrial and consumer electronics.

**Release 0.1** (in production) shipped the vertical slice: three lessons, two missions, a ten-question interview bank, device-local progress and an installable PWA. **Release 0.2** adds the 30-day guided journey, five more lessons, two more missions, targeted revision from real mistakes, cross-industry interview notes and a larger glossary. **Release 0.3** fills journey days 11–15 with integration, verification and root-cause content, including a requirements-to-tests traceability interactive. **Release 0.4** fills days 16–20 with startup code, RTOS scheduling and handoff, bootloaders and embedded Linux. **Release 0.5** fills days 21–25 with Python test automation (a simulated SCPI console), hardware-in-the-loop and FMEA. **Release 0.6** completes the 30 days with standards as scope, cross-industry transfer, portfolio presentation, a debugging-story lesson and a timed mock-interview mode. **Release 0.7** adds the portfolio track: an STM32 sensor monitor built in seven stages, with simulation and hardware evidence recorded separately and an in-browser fault-injection lab.

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

Lessons (module in brackets):

1. **MCU board does not boot** (3 · Microcontrollers): power, reset, clock, boot pins, debugging order. Interactive boot-chain explorer.
2. **Watchdogs and reset loops** (3): IWDG/WWDG, timeout arithmetic, refresh placement, RCC_CSR reset-cause flags. Interactive timeout calculator.
3. **I2C sensor not acknowledging** (4 · Interfaces): open-drain bus, address byte, ACK/NACK, pull-ups, HAL address convention. Interactive waveform.
4. **UART framing and baud tolerance** (4): frame anatomy, LSB-first, baud error budget, STM32 USARTDIV, reading garbage as a clue. Interactive frame with receiver-rate error.
5. **SPI modes, chip select and the first byte of garbage** (4): CPOL/CPHA from datasheet wording, CS framing, prescaler choice, shifted-byte diagnosis. Interactive mode/edge diagram.
6. **Register bit masks: read, modify, write safely** (5 · Embedded C): masks and fields, `volatile`, read-modify-write hazards, write-1-to-clear. Interactive register and RMW timeline.
7. **Fixed-width integers, overflow and shifts** (5): wrap-around, integer promotion, undefined shifts, wrap-safe elapsed time.
8. **Oscilloscope probing without lying to yourself** (10 · Instrumentation): probe loading, compensation, ground-lead ringing, bandwidth and rise time, aliasing. Interactive aliasing simulation.

Missions:

1. **Fresh board, no sign of life** (3): a held reset caused by the wrong supervisor variant.
2. **The board that resets every second** (3): a watchdog firing on a new blocking call; register evidence, firmware diff, fix judgement.
3. **The sensor that never answers** (4): an I2C address-strap mismatch.
4. **The UART that prints garbage** (4): a clock configuration inherited from the wrong board; one bit time on the scope settles it.

The 30-day journey (`content/journey.ts`) uses all of this in days 1–10; days 11–30 follow the fast-track plan and reference planned content.

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
