# Engineering-audit batch validation

Date: 2026-11-06. Base: PR #16, commit `82920a440d96eb1097607568f0dcbaf715941125`. Scope: documentation and CSV only, including corrections to pilot evidence claims. No lesson registry, runtime, progress store, lab implementation or journey changes.

| Check | Result |
|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund --cache /workspace/work/npm-cache` | Passed; 520 packages installed. Lifecycle scripts disabled |
| `npm test` | Passed: 14 test files, 101 tests. Includes existing content/prerequisite/teaching-format, lab rebuild/output and review-log checks |
| `npm run lint` | Passed, exit 0 |
| `npm run typecheck` | Passed, exit 0 |
| `git diff --check` | Passed |
| One-off matrix/link/source consistency check | Passed: 114 unique rows; every required field populated; source paths exist; baseline 37 and pending 52 lesson files agree; relative planning links resolve |
| Open PR head checks | GitHub reports successful `checks` for all six audited PR heads. Links/SHAs in `ENGINEERING_GAP_AUDIT.md`; these are existing upstream results, not checks on this documentation change |
| Local browser/accessibility/production build | Not run: no app, content-data, route, visual or styling changes. Required for subsequent runtime/content batches; existing upstream CI success does not substitute for testing those future changes |

The initial unrestricted `npm ci` attempt was rejected by automatic approval review because dependency lifecycle scripts could execute with network access. Installation with `--ignore-scripts` was accepted; an initial cache-path failure was resolved by using a workspace-local cache. No approval block remains for this documentation batch.

Vite printed an existing configuration warning about `__dirname` under a future native config loader; tests passed. This batch does not change that unrelated configuration.

## Open gates

- Learner evaluation of the three pilot lessons is still unrecorded. No additional arc lesson or academy-wide format conversion was added.
- The advanced-module 17–25 proposal is now checked in and reconciled (`ADVANCED_SYLLABUS_2.0_PROPOSAL.md`, `ADVANCED_MODULE_CROSSWALK.md`); module cells in the matrix and CSV were updated in the same revision. This remains a documentation-only change.
- Passing CI establishes only what the checks test (schema, cross-references, lab outputs, browser flows, accessibility rules). Technical accuracy of content requires the second technical reader in `CONTENT_REVIEW.md`; learner understanding requires the recorded pilot in `PILOT.md`. Neither is claimed here.
- P0 curriculum execution awaits the approved first scope and learner-adjusted teaching template. The first proposed slice is the P0-1a C-module build/test task.
- Pathway recommendations are a specification, not a shipped feature; acceptance scenarios and migration/browser/accessibility checks are defined in `CAREER_PATHWAYS.md`.
- No physical board, manufactured PCB, instrument measurement, flight-use safety or standards-compliance result is claimed by this batch.

This change prepares reviewable planning artifacts. It does not merge the existing PR stack, deploy production, claim the full curriculum is built or claim a learner is professionally competent.
