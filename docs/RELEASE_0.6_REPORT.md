# Release 0.6 report: journey days 26–30

Branch `feat/release-0.6`, stacked on `feat/release-0.5` (PR #5). Block 6 of the 30-day journey: standards as scope, cross-industry transfer, portfolio presentation and the timed mock interview. With this release every one of the 30 days references published content only.

## What was implemented

**Five lessons** (technically reviewed; references cited in each file; no certification claims)
- *What DO-178C, DO-254 and ISO 26262 are for* (standards): the avionics family (ARP4754A, ARP4761 as the source of DAL, DO-178C objectives by level, the structural-coverage ladder, DO-254, DO-160) and the automotive one (ISO 26262 HARA → ASIL → safety goals, ASPICE as process capability, AUTOSAR as architecture); what a verification engineer produces; the honest phrasing of involvement. Interactive **standards map**: five industries, each standard's scope, the artefacts a test or hardware engineer produces, and one honest sentence. Exercises: coverage by DAL, source of ASIL, honest claims.
- *Medical and industrial standards in one page each* (standards): ISO 13485 and the DHF, ISO 14971, IEC 62304 classes, IEC 60601-1 and -1-2, IEC 61508 and the SIL ladder with PFD/PFH, hardware fault tolerance and systematic capability, IEC 61511, ISO 13849, IEC 62443; the dictionary from avionics artefacts to medical and industrial names. Exercises: leakage-current standard, non-convertibility of SIL/ASIL/DAL, Class C implications.
- *Same skills, different industries* (applications): the transfer sentence (what I did, the evidence, their name for it), what each target industry values, five inflated claims rewritten, and the rule that training is not employment. Exercises: transfer sentence, honest claims, cover-note order.
- *Presenting a portfolio project without inflating it* (interviews): the six-heading one-page outline, the simulated-versus-hardware table, verifiable evidence, inflating phrases replaced. Exercises: inflating phrase, evidence items, outline order.
- *Telling a debugging story* (interviews): symptom, evidence, decision, outcome, prevention; 90-second and five-minute versions; what to cut; the academy's missions as labelled rehearsal stories. Exercises: beat order, what to cut first, strong elements.

**Mock-interview tooling**: the Interview page gains a timed mock mode (`?mock=1` on a journey focus set): four minutes per question, start, pause, next, finish, with the rubrics revealed afterwards as usual. Journey interview items can set `mock: true`; day 29 does. Nothing about the timer is stored.

**Interview bank**: 31 questions (3 new: standards scope and involvement, transfer across industries, portfolio walkthrough), 24 with cross-industry notes.

**Glossary**: 179 terms (22 new: DO-178C family, DAL, MC/DC and the coverage ladder, ARP4761, ISO 26262, ASIL, ASPICE, AUTOSAR, IEC 62304, IEC 60601-1, ISO 13485, ISO 14971, IEC 61508, safety integrity level, diagnostic coverage, performance level, IEC 62443, transfer sentence, training is not employment, portfolio outline, debugging story, mock interview).

**Journey**: days 26–30 now use published content only. **All 30 days are fully published**; the Journey page says so. Day 27 pairs the medical/industrial lesson with the transfer lesson; day 29 pairs the debugging-story lesson with a four-question timed mock.

**Skills**: three new skill labels (standards, cross-industry transfer, engineering communication). Curriculum: modules 14, 15 and 16 now have published lessons; every one of the 16 modules has at least one published lesson.

## Test and build evidence (local, Node 22)

| Check | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 7 files, 43 passed (journey tests now assert all 30 days fully published; the planned-item rule is checked on a synthetic day) |
| `npm run build` | 26 lessons and 8 missions prerendered; all routes static |
| `npm run test:e2e` | 104 passed (52 scenarios × Pixel 7 and Desktop Chrome). New: standards map tabs and honest phrasing with axe WCAG 2.0 A/AA scan; the "certified" claim rejected with its reason; timed mock interview start, pause, advance, finish and rubric reveal; journey shows all 30 days published and day 29 opens the mock |

## Known gaps

- The portfolio track itself (STM32 sensor monitoring and fault detection, simulation path plus optional hardware path) is the next release (0.7); day 28 asks for the outline and the presentation lesson teaches how to write it.
- Standards content is scope-level by design; exact objective counts and tables are left to the standards.
- No second human technical review of block 6 yet; standards wording in particular should be checked by someone who has worked under each.
