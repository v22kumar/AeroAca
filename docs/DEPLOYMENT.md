# Deployment

AeroAca is a static Next.js application with no environment variables, no secrets and no backend. It deploys to Vercel directly from GitHub.

## One-time setup on Vercel

1. Create a Vercel project from the `v22kumar/AeroAca` repository (the Vercel project `aeroaca` already exists under the `aero-aca` team).
2. Framework preset: **Next.js** (auto-detected). Build command `npm run build`, install `npm ci`, output handled by Next. Node 22.
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

Vercel keeps every production deployment. Use "Promote to Production" on the previous good deployment, or revert the merge commit on `main`.
