# Remaining engineering gaps: source audit

Snapshot: 2026-11-06. Repository: [v22kumar/AeroAca](https://github.com/v22kumar/AeroAca). [Coverage matrix](LEARNING_COVERAGE_MATRIX.md), [career-pathway specification](CAREER_PATHWAYS.md), and [implementation plan](ENGINEERING_IMPLEMENTATION_PLAN.md) replace module-count targets as the long-term engineering plan.

## Source baselines and all open PRs

Default branch was `main` at `d291bf50f155b2ca8aff0e18b55064a5bd9a7f8d`. The release record says this is the production candidate; this audit did not independently re-run production browser checks. Open PR inventory returned exactly six entries, all open and not draft, on the audit date:

| PR | Audited head | Base | Scope to reuse | GitHub `checks` result at this head |
|---|---|---|---|---|
| [11](https://github.com/v22kumar/AeroAca/pull/11) | `0d9e868e7874653e21c20b30e2c7118c4ca16249` | main | Release/deployment record; no new curriculum | [success](https://github.com/v22kumar/AeroAca/actions/runs/42144100365/job/127651285585) |
| [12](https://github.com/v22kumar/AeroAca/pull/12) | `564c91d879c723ae88e2c7c965123558ae9ce543` | docs/release-1.0-record | Original topic audit and wording corrections | [success](https://github.com/v22kumar/AeroAca/actions/runs/42146490879/job/127659106179) |
| [13](https://github.com/v22kumar/AeroAca/pull/13) | `55c4562ec1e1fba7d7a5f56f2f67a4a52fcb48cc` | audit/syllabus-coverage | Prerequisites, diagnostic, lab pipeline and portfolio harness | [success](https://github.com/v22kumar/AeroAca/actions/runs/42158974831/job/127699806625) |
| [14](https://github.com/v22kumar/AeroAca/pull/14) | `a07f4123079959bca2e39145d632e01bff6a37a5` | feat/learner-readiness | Six fundamentals/instrument lessons; divider and RC labs | [success](https://github.com/v22kumar/AeroAca/actions/runs/42158980372/job/127699824268) |
| [15](https://github.com/v22kumar/AeroAca/pull/15) | `941ce1d589bc4abc80d0210eb6a135f2df596014` | feat/fundamentals-depth | Eight C/STM32 lessons, clock tree and five host labs | [success](https://github.com/v22kumar/AeroAca/actions/runs/42159019786/job/127699956301) |
| [16](https://github.com/v22kumar/AeroAca/pull/16) | `82920a440d96eb1097607568f0dcbaf715941125` | feat/embedded-c-stm32-depth | Three-lesson teaching pilot, hints/depth/walkthrough platform, 1553 lab | [success](https://github.com/v22kumar/AeroAca/actions/runs/42173114689/job/127745309769) |

These are stacked increments, not six independent implementations. Count baseline plus incremental changes once. Inspect actual diffs when retargeting; a successful check on the old base does not validate a new merge result. The audit patch is based on #16 so it can reuse all pending source; it does not merge, deploy or imply approval of those PRs. The Vercel bot reports a [pilot preview](https://aeroaca-git-feat-pilot-teaching-format-aero-aca.vercel.app). Its bot comments contain no learner evaluation; code review was skipped by CodeRabbit on the non-default base. Automated CI success is not independent technical review or teaching validation.

## What the audit found

The historical matrix mixes a production introduction with “Published”/“done” rows updated on unmerged branches. Its original 46/23/28 count is a historical 97-row snapshot, not a current competence measure. `SYLLABUS_GAP_REPORT.md` still describes pre-PR-13 gaps as current and calls lesson quality consistent despite later learner feedback. Preserve it as history and use this audit for current decisions.

Production has 37 lesson files. The cumulative pilot branch has 52, including 15 new lesson files across #14–16. `labs/manifest.json` has 16 entries, including the intentional-failure portfolio demonstration; that is not 16 independent assessed capabilities. The source supports basic decode/review/test-writing skills, but independent driver writing, circuit/PCB creation, debugging, timing analysis, calibration and integrated product evidence remain uneven or absent. Target setup instructions and a host register-arithmetic program do not establish that firmware was flashed or a board worked.

The original audit already planned interfaces/RTOS/Python, PCB/EMC/tools, GDB, unit tests, Git, requirements and release lessons (old batches E–H). Reuse those plans. Elevate practical build/debug/test automation to P0 even where the old module priority said P1. Do not create a second module for Python, a second sensor-monitor project, or a second introductory 1553 lesson.

The four pathways are absent as a career-goal/evidence feature. Existing recommendations use mistakes, lesson activity and interview ratings; module “evidence complete” can include confident self-ratings. Those remain activity summaries and cannot serve as professional competence credentials. The new specification separates retained engineering artifacts from learning activity.

## Advanced modules 17–25: unavailable proposal (resolved in the next revision)

> **Resolution, 2026-11-06.** The proposal had been reviewed outside the repository. It is now checked in as [ADVANCED_SYLLABUS_2.0_PROPOSAL.md](ADVANCED_SYLLABUS_2.0_PROPOSAL.md) and reconciled in [ADVANCED_MODULE_CROSSWALK.md](ADVANCED_MODULE_CROSSWALK.md): modules 17–25 keep their original identifiers and scope, the provisional groupings below are retired, and the subjects they added (controls, estimation, mathematics/AI, edge AI, autonomy, ownership) become modules 26–31. The matrix and CSV module cells were updated accordingly. The text below is kept as the audit record.

No checked-in proposal, numbered module list or dedicated DFCC/Kalman/AI/product-ownership specification was found in the documentation and curriculum trees of any of the six open PRs. PR descriptions mention a two-tier retargeting and advanced modules under review, but do not define them. Therefore the earlier advanced proposal could not be audited or preserved verbatim.

The revised syllabus provides **provisional groupings** for architecture, links, controls, estimation, advanced assurance, engineering math/AI, edge inference, autonomy/simulation and technical ownership. Reconcile these against the original proposal when supplied; retain its advanced V&V objectives and identifiers where they exist, map shared subjects once, and never silently renumber public slugs/progress ids. No provisional grouping is published as a playable module in this increment.

## Teaching gate and evidence corrections

The user requires: **“Do not expand the teaching format across the entire platform before the three-lesson pilot has been evaluated by the learner.”** `docs/PILOT.md` still says “Pending the first use.” No recorded feedback was found in PR #16's discussion. The implementation plan makes new-content rollout dependent on recorded learner findings and an adjusted template. Planning and specification can proceed now. No additional lesson rollout is represented as approved or validated.

Pilot dwell time and interview self-ratings are weak observational signals; neither proves understanding, explanation ability, job readiness or safety. Retain an independent unseen variant and an optional plain-language explanation/review as stronger evidence, without requiring a questionnaire or publishing personal results. Physical hardware and independent review remain separately evidenced.

## Standards and safety boundaries

Existing standards lessons are scope overviews. Their public summary references do not verify exact obligations, objective counts or qualification limits. For every new normative claim retain the document title, edition, clause/objective, authorized source, reviewer and applicability rationale; if these are unavailable, label the material a simplified educational model or scope summary and avoid “the standard requires” wording. Use ARP4754A/ARP4761 concepts as requested, identify the edition and note successor editions when actually consulted. Do not invent environmental levels or claim compliance from a synthetic test.

All controls/ML/autonomy tasks use public or simulated educational systems. Passing a host, SIL, HIL or AI lab never establishes flight safety. Keep operational flight use, certification and employer-specific processes outside the claims made by this academy.

## Delivery boundary

This batch delivers the audit, full subject matrix, pathway/recommendation contract, revised long-term syllabus and sequenced acceptance plan. It leaves production runtime and journey/progress identifiers untouched. New curriculum batches await the learner-evaluation gate and the approval condition in the request (“implement the approved P0 curriculum … using the learner-validated teaching format”). Local validation and outstanding gates are recorded in `ENGINEERING_VALIDATION.md`.
