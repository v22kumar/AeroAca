# Release candidate 1.0: merge preparation record

State of the release candidate on 2026-11-06, before any merge into `main`. This file is the evidence that the stacked chain is ready to merge in dependency order, and the record that is completed after the Product Owner authorises the merges and the production deploy. Nothing in the "After authorisation" section has happened yet.

## Scope

Pull requests #2 to #10, merged in that order per `docs/DEPLOYMENT.md`. No feature work is in progress; only fixes required for release readiness are permitted until learner acceptance is complete.

## Dependency order and per-PR state

Checked on 2026-11-06 against GitHub and GitHub Actions. Every PR is `mergeable_state: clean`, not a draft, with no conflicts against its current base.

| Order | PR | Branch | Head | Base now | CI on head | Preview deployment |
|---|---|---|---|---|---|---|
| 1 | #2 Release 0.2 | `feat/release-0.2` | `34fcb79` | `main` | run 42063774202, success | `dpl_6uMt2qeSmV8XJVa6F7yyqPGNGs1L` |
| 2 | #3 Release 0.3 | `feat/release-0.3` | `734ee74` | `feat/release-0.2` | run 42067388981, success | `dpl_DmiU2RKmZDzYuM4qY8NwXhi9hmZF` |
| 3 | #4 Release 0.4 | `feat/release-0.4` | `2115f7a` | `feat/release-0.3` | run 42070012573, success | `dpl_ERYMkkqFF2jtZfrRmFuiNSTgY1XE` |
| 4 | #5 Release 0.5 | `feat/release-0.5` | `5ac4afc` | `feat/release-0.4` | run 42073589265, success | `dpl_72SiSrfpKZeb1dotzJToxiMWxyPx` |
| 5 | #6 Release 0.6 | `feat/release-0.6` | `86f1085` | `feat/release-0.5` | run 42087215149, success | `dpl_DXCnSknpm1pSgU3oj41F13gY6qxe` (`8abfc72`; `86f1085` adds the table fix) |
| 6 | #7 Release 0.7 | `feat/release-0.7` | `df5a588` | `feat/release-0.6` | run 42087279719, success | `dpl_7AwpmSRh5WGasTdSYyuXdGhAA3jQ` (`8ed4f7c`; `df5a588` adds the table fix) |
| 7 | #8 Release 0.8 | `feat/release-0.8` | `1a0b903` | `feat/release-0.7` | run 42087279671, success | `dpl_7ng23Nni1YXDYjGzEVPgvVR5hDMu` |
| 8 | #9 Release 0.9 | `feat/release-0.9` | `b2e2d7d` | `feat/release-0.8` | run 42087278905, success | `dpl_BbzuN86oxDtrbSmDCEEn6zm978Q1` |
| 9 | #10 Release 1.0 prep | `feat/release-1.0` | `5553dcc` | `feat/release-0.9` | run 42090131793, success | `dpl_HdhcExte5Tg1hKHHEYuy9hK4Gmi8` |

Each PR's base is the branch below it, so GitHub will refuse an out-of-order merge. After each merge the next PR's base is changed to `main` on GitHub; GitHub recomputes the diff to that increment only and CI reruns on the new merge base. That rerun is checked before the next merge.

## Dry run of the whole chain

On 2026-11-06 the nine branches were merged locally onto `origin/main` (`3c9c722`) in the order above with `git merge --no-ff`, which is what GitHub's merge-commit button produces.

- All nine merges applied cleanly; no conflict in any step.
- The resulting tree is byte-identical to `feat/release-1.0` at `5553dcc` (`git diff --quiet` between the two is empty). The CI run that passed on `5553dcc` therefore tested exactly the files production will serve.
- Combined change against production: 129 files, 12 630 insertions, 277 deletions, 28 commits.

Quality gates on that merged tree, local, Node 22:

| Gate | Result |
|---|---|
| `npm run lint` | 0 errors, 0 warnings |
| `npm run typecheck` | clean |
| `npm test` | 11 files, 56 passed (includes the Release 0.1 backup migration test) |
| `npm run build` | compiled; every route static |
| `npm run test:e2e` | 130 passed (65 scenarios on Pixel 7 and Desktop Chrome, axe WCAG 2.0 A/AA on every screen type) |
| Route sweep of the production build | 57 prerendered routes fetched; 37 lessons, 10 missions and 8 pages (`/`, `/curriculum`, `/glossary`, `/interview`, `/journey`, `/portfolio`, `/progress`, `/review`) all 200 with no application error; the remaining two are the framework's 404 and 500 templates |

## Branch protection

`main` has no branch protection rules (GitHub reports `protected: false`). There is nothing to bypass; the quality gate is the green CI run on each PR head and the procedure in `docs/DEPLOYMENT.md`. Whether to require the `CI` status check and a pull request before merging to `main` is listed as a Product Owner decision in `docs/DEVELOPMENT_STATUS.md`.

## Rollback target

Production before the release: Vercel deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo` (READY, target production, `main` at `3c9c722`, Release 0.1), aliases `aeroaca.vercel.app`, `aeroaca-aero-aca.vercel.app`, `aeroaca-git-main-aero-aca.vercel.app`. Rollback is "Promote to Production" on that deployment in the Vercel dashboard, or `git revert -m 1 <merge-sha>` on `main` for a single increment. Learner progress is unaffected by either: the store is device-local and schema-versioned, and the 0.1 shape is read unchanged by 1.0 (`tests/store-migration.test.ts`).

## Awaiting human authorisation

The following were **not** done and will not be done without the Product Owner's explicit go-ahead:

1. Merging #2 into `main`, and each retarget-and-merge that follows (#3 to #10).
2. The production deploy that Vercel runs automatically from `main` after each merge.
3. Creating tags `v0.1.0` (at `3c9c722`) and `v1.0.0` on GitHub (the build environment cannot push tags).

## After authorisation (to be completed during the release)

Filled in as each step happens; blank means not done.

| Step | Record |
|---|---|
| Merge commits on `main` (#2 … #10) | |
| CI on `main` after the last merge | |
| Production deployment id and URL | |
| Rollback deployment confirmed still promotable | `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo` |
| Verification on production: all 30 journey days render and are completable; a lesson and a mission end to end; interview mock mode (`/interview?mock=1` from day 29); portfolio ticks persist; a Release 0.1 backup imports unchanged; bottom navigation on a phone-width viewport | |

## Sign-off status

Release 1.0 is **not signed off**. Two gates in `docs/RELEASE_1.0_CHECKLIST.md` still need people: an independent technical reader's signatures in `docs/CONTENT_REVIEW.md`, and Sushmita's feedback from the representative learner set. Deploying this release candidate to production starts learner acceptance; it does not close it.
