# AeroAca — MVP implementation brief

## Learner experience

A calm, attractive, mobile-first **personal academy**, not a generic corporate LMS. Emphasize one next action at a time. Accessible reading sizes, strong contrast, keyboard support and reduced-motion support.

### Required screens

1. **Today:** personalized welcome, one recommended mission, daily study plan, active skills and recent progress.
2. **Curriculum:** sections/modules; open lesson and track completion.
3. **Lesson:** problem-led 5–10-minute content; diagrams; expandable explanations; flashcards and concise recap.
4. **Engineering mission:** scenario-based interaction with meaningful feedback, not just multiple-choice memorization.
5. **Interview practice:** structured questions and sample answer rubric, evidence-based skill confidence.
6. **Progress:** actual completed lessons, quiz attempts and weak areas; never award fictitious accomplishment.

## Initial lesson slice

Ship one excellent vertical slice:
- Circuit diagnosis: MCU board does not boot.
- Communication failure: I2C sensor does not acknowledge.
- Embedded C: decode a register bit-mask snippet.
- A short knowledge check and realistic troubleshooting hints.
- Data-driven lesson content and progress persistence.

## Technical constraints

- Next.js App Router, TypeScript, Tailwind.
- Markdown/MDX learning content, validated metadata, reusable lesson renderer.
- Installable PWA: manifest, icons and tested mobile home-screen behavior.
- Local persistence for prototype, with clear limitation regarding device sync.
- No provider API keys in the browser, no unnecessary AI cost at MVP.
- Future hosting via Vercel; repo commits alone do not make a live website.
- Automated lint, typecheck, build; lightweight tests for progression and answers.

## Security and privacy

- GitHub repository is public unless changed in GitHub settings.
- Do not publish personal data, employer-confidential designs, internal screenshots or secrets.
- If the academy is to be private, add application authentication before collecting private progress, and deploy with appropriate protections.

## Acceptance criteria

- A new learner can open the deployed URL on a phone, start a mission and finish it without developer guidance.
- Progress is restored after page reload on the same device.
- Incorrect quiz answers give diagnostic explanations; correct answers explain why.
- Content can be added without editing each page component.
- The site is buildable and has a clearly documented deployment path.
