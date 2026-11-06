# Release candidate 1.0: merge preparation record

State of the release candidate on 2026-11-06, before and after the merge into `main`. The first sections are the pre-merge evidence; the "After authorisation" section records the release itself. The Product Owner authorised the merges on 2026-11-06 ("Merge all into main"); the chain was merged in order and production now serves the release candidate. Release 1.0 is **not signed off** (see the last section).

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

## Authorisation

The Product Owner authorised the merges on 2026-11-06. Still needing a person: creating tags `v0.1.0` (at `3c9c722`) and `v1.0.0` on GitHub (the build environment cannot push tags); `v1.0.0` waits for sign-off.

## After authorisation (the release, 2026-11-06)

Procedure followed per `docs/DEPLOYMENT.md`: merge the lowest PR with a merge commit, change the next PR's base to `main`, confirm GitHub reports it clean with only its own increment, wait for the `main` push CI run to succeed, merge the next. Nine merges, nine green `main` runs, no conflict, no fix needed.

| Order | PR | Merge commit on `main` | CI on `main` after the merge |
|---|---|---|---|
| 1 | #2 | `a607e29` | run 42138036454, success |
| 2 | #3 | `d388bbd` | run 42139554834, success |
| 3 | #4 | `dbdec3d` | run 42139965795, success |
| 4 | #5 | `557dd90` | run 42140444354, success |
| 5 | #6 | `c731134` | run 42140923811, success |
| 6 | #7 | `2fdf435` | run 42141515350, success |
| 7 | #8 | `4d0e12c` | run 42142033761, success |
| 8 | #9 | `65f64e7` | run 42142626138, success |
| 9 | #10 | `d291bf5` | run 42143243848, success |

| Step | Record |
|---|---|
| Deployed commit | `main` at `d291bf50f155b2ca8aff0e18b55064a5bd9a7f8d`; tree identical to `feat/release-1.0` at `719ebcb` (`git diff --quiet` empty) |
| Production deployment | `dpl_5YtF9Jv77rmVFhrDHQkU5gX8YryN` (READY, target production, built from `d291bf5`), aliases `aeroaca.vercel.app`, `aeroaca-aero-aca.vercel.app`, `aeroaca-git-main-aero-aca.vercel.app`; URL https://aeroaca.vercel.app |
| CI evidence | the nine `main` runs above; the last is https://github.com/v22kumar/AeroAca/actions/runs/42143243848 |
| Rollback | Release 0.1 deployment `dpl_DzDWiodmXiHacxUGqJCM5EaCSTjo` (`3c9c722`) is READY and can be promoted to production from the Vercel dashboard. Each intermediate merge also produced a READY production deployment (0.2 `dpl_JDkLhCbPqgtnFxuYpfADRfgFbDzm` … 0.9 `dpl_41xx83JnGxBZRigL3pKQSDaqajUE`), so any increment boundary is a rollback point; `git revert -m 1 <merge-sha>` reverts one increment in source |
| Route sweep on production | 55 prerendered routes (37 lessons, 10 missions, `/`, `/curriculum`, `/glossary`, `/interview`, `/journey`, `/portfolio`, `/progress`, `/review`) all 200 with no application error; `/manifest.webmanifest` 200 (`display: standalone`, 3 icons), `/sw.js` 200, unknown path 404 |
| Browser suite on production | the repository's Playwright suite run with `baseURL` https://aeroaca.vercel.app: **130 passed** on Pixel 7 and Desktop Chrome (128 in the first run; the two PWA-manifest tests failed only because the build container's HTTP client needed the outbound proxy, and passed when it was configured). This covers: all 30 journey days published and playable, day 29 opening the timed mock interview, lessons and missions end to end with misconception feedback, portfolio ticks persisting across reload with the evidence table, the Release 0.1 backup importing unchanged and driving journey, review, recommendations and portfolio, bottom navigation and axe WCAG 2.0 A/AA scans on the phone profile |
| Verified by a person on a phone | not yet; this is part of learner acceptance |

## Sign-off status

Release 1.0 is **not signed off**. Production serves the release candidate for learner acceptance. Two gates in `docs/RELEASE_1.0_CHECKLIST.md` still need people: an independent technical reader's signatures in `docs/CONTENT_REVIEW.md`, and Sushmita's feedback from the representative learner set. The `v1.0.0` tag is applied only after both are complete and any resulting fixes are released. No feature development starts before then; only fixes required for release readiness.
