# Deployment

AeroAca is a static Next.js application with no environment variables, no secrets and no backend. It deploys to Vercel directly from GitHub.

## One-time setup on Vercel

1. Create a Vercel project from the `v22kumar/AeroAca` repository (the Vercel project `aeroaca` already exists under the `aero-aca` team).
2. Framework preset: **Next.js**. `vercel.json` pins `"framework": "nextjs"` because the project was first created while the repository held only docs, which left the preset at "Other" and made Vercel serve just the `public` folder (every page 404, `sw.js` fine). Build command `npm run build`, install `npm ci`. Node 22.
3. No environment variables are required.
4. Production branch: `main`. Pull requests get preview deployments automatically when the Git integration is enabled.

## Each release

1. Open a pull request. CI runs lint, typecheck, unit tests, build and Playwright e2e.
2. Check the Vercel preview on a phone: Today → start a lesson → answer an exercise → reload → the step and the solved state are restored.
3. Merge to `main`. Vercel builds and promotes production.

## Verification checklist after a production deploy

- `https://<domain>/` loads with styles, light and dark.
- `/manifest.webmanifest` returns JSON with 192, 512 and maskable icons; `/icons/icon-512.png` returns a PNG.
- `/sw.js` returns with `Cache-Control: no-cache`.
- Chrome on Android: the browser offers "Install app" / "Add to Home screen"; the installed app opens standalone on `/`.
- Safari on iOS: Share → Add to Home Screen; the icon and standalone launch work. (iOS does not fire `beforeinstallprompt`; the app shows written instructions instead.)
- Airplane mode after visiting a lesson: the lesson still opens (best-effort offline).

## Privacy and protection

The GitHub repository is public; the deployed site is a separate decision. If the academy should not be reachable by anyone with the URL, enable Vercel Deployment Protection (password or Vercel Authentication) on the project. Nothing in the app sends learner data anywhere; progress stays in the browser.

## Rollback

Vercel keeps every production deployment and marks them as rollback candidates; use "Promote to Production" (or the `request_rollback` API) on the previous good deployment. In git, each release is merged with a merge commit so `git revert -m 1 <merge-sha>` restores the previous state; releases are also tagged (`v0.1.0`).

## Deployment protection

Vercel Authentication is enabled for **preview** deployments only (set during the 0.1 release), so the production URL `https://aeroaca.vercel.app` is reachable without a Vercel login while branch previews still require one or a share link. Switch the project's protection to "all deployments" if production should be private.

## Merging the stacked release chain (0.2 to 1.0)

Releases 0.2 to 1.0 were opened as a chain of stacked pull requests, each based on the previous branch so every PR shows only its own increment: #2 `feat/release-0.2` → `main`, #3 `feat/release-0.3` → `feat/release-0.2`, … #10 `feat/release-1.0` → `feat/release-0.9`. Merge them in order, lowest first:

1. Review and merge #2 into `main` (merge commit, as for 0.1). Production deploys automatically from `main`; verify with the checklist above.
2. On GitHub, change the base of #3 from `feat/release-0.2` to `main`. GitHub recomputes the diff to the increment only. CI reruns. Merge.
3. Repeat for each following PR: retarget to `main`, let CI pass, merge.
4. After the last merge, tag `main` (`v1.0.0`) and record the production deployment id in `docs/DEVELOPMENT_STATUS.md`.

Each merge is independently revertible with `git revert -m 1 <merge-sha>`, and each production deployment is a Vercel rollback candidate. Merging a later PR before an earlier one is refused by GitHub because its base branch would be unmerged; do not force it.

The pre-merge state of the chain (per-PR CI runs, the local dry run of all nine merges, the rollback deployment) and the record completed during the release live in `docs/RELEASE_CANDIDATE_1.0.md`.

If a fix is needed low in the stack after review, commit it on that branch and merge the branch forward into each later branch (`git merge feat/release-0.6` on `feat/release-0.7`, and so on), as was done for the scrollable-table accessibility fix.

