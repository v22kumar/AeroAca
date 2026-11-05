# AeroAca — Product Owner Development Brief (Release 0.1)

**Owner:** Product Owner (ChatGPT)  
**Implementation owner:** Fabby 5.0 (autonomous engineering and architecture agent)  
**Primary learner:** Sushmita  
**Learner career headline:** Associate Avionics Engineer  
**Primary outcome:** Real engineering learning and interview readiness, applicable beyond avionics.

## 1. Problem to solve

Sushmita works in an avionics R&D environment with electronics testing/integration exposure. She is preparing for an immediate job switch while strengthening her skills for electronics R&D and embedded engineering roles across aerospace, automotive, medical, industrial, and other sectors. She has limited time, may disengage with long conventional textbooks, and should not be forced to learn deep firmware implementation before applying to suitable jobs.

AeroAca must become a mobile-first learning companion that helps her learn *real engineering reasoning* through concise, accurate, engaging, practical experiences. It is not a generic LMS, résumé-inflation machine, or a dashboard of decorative progress indicators.

## 2. Release goal

Ship a real, deployed, mobile-usable vertical slice. A learner should be able to:
1. Open AeroAca on her phone and immediately see a useful next action.
2. Start a short problem-led electronics/embedded lesson.
3. Explore a clear technical explanation and relevant diagram.
4. Perform a meaningful engineering diagnosis or exercise.
5. Get correct, specific feedback (including why wrong answers are wrong).
6. See completion and progress persist after refresh.
7. Return to the next lesson without needing developer guidance.

The academy should feel calm, polished, mature and motivating. Avoid childish gamification and generic enterprise-LMS complexity.

## 3. Scope of first release (must work, not just appear)

- Responsive mobile-first learner home with *Continue learning* as the main action.
- Course/module navigation based on `docs/CURRICULUM.md`; distinguish published lessons from planned content. Do not show unbuilt lessons as completed or playable.
- A reusable content-driven lesson template: scenario → concept → visual explanation → example → interactive exercise → feedback → interview question → recap.
- At least **three technically reviewed complete lessons**:
  1. MCU board does not boot: power, reset, clock, boot configuration and debugging order.
  2. I2C sensor not acknowledging: supply, ground, pull-ups, address, timing, waveform and firmware configuration.
  3. Embedded C register bit masks: interpret and safely modify a peripheral register; discuss `volatile` and read-modify-write limitations.
- At least one **genuinely interactive engineering mission** (not a single trivial quiz): multi-step fault isolation with evidence, user choices and explanatory outcomes.
- Quiz/interview practice with answer-specific explanations, not only correct/incorrect.
- Local progress persistence on same browser/device, clearly labeled as device-local. Only mark a lesson complete after defined learning criteria.
- PWA metadata/icons and mobile installation support when feasible; validate real installability.
- Accessible UI, empty/error/loading states, keyboard interaction and readable content.
- Straightforward Vercel deployment instructions and CI/build checks.

## 4. Explicit non-goals for 0.1

- Full 16-module content generation.
- Fake AI tutor, invented personalization or LLM evaluation.
- Payments, subscriptions, social feed, badges/leaderboards.
- Multi-user platform, complex roles or custom admin dashboard.
- Cloud database or authentication unless a compelling security/use-case need is documented.
- Claims of actual hardware measurements when using simulation.
- Use of confidential employer designs, source code, data or test procedures.
- Fancy diagrams that are technically misleading.

## 5. Content quality and instructional design

- Explain concepts from first principles without patronizing the learner.
- Use a motivating problem first, then progressively reveal theory.
- Every exercise must have an explicit learning objective, correct answer or scoring rubric, misconception feedback, and practical context.
- Use accurate circuits/protocol descriptions; do not pretend that simulated measurements are real.
- Distinguish industry-standard facts from illustrative assumptions. Prefer primary datasheets, vendor manuals and standards summaries where available; include source references with content.
- Interview questions should probe reasoning, not reward memorized slogans.
- Keep lessons short and chunked; optional deeper explanations can be longer.
- Content must be extendable by adding files/structured content, not duplicating UI code.
- No résumé claims about professional firmware experience acquired solely from study.

## 6. UX direction

Do not merely copy a course marketplace or a music streaming app. Find a coherent visual concept appropriate to an adult engineer. Give the learner a sense of progression without overwhelming her with all 16 modules.

Prioritize:
- A single obvious next step.
- Readable mobile layouts and fast load times.
- Interactive illustrations where they materially improve comprehension.
- A mission flow with diagnostic decisions, evidence and feedback.
- Clear distinction between 'not started', 'in progress', 'completed', and 'coming soon'.
- Genuine progress based on saved attempts and completions.

The implementation agent may improve UX architecture and interaction design substantially, as long as these outcomes remain intact.

## 7. Engineering autonomy and constraints

Fabby owns solution architecture, component organization, visual design, tests and implementation. Prefer a maintainable, low-cost, GitHub/Vercel-friendly web stack. The existing proposal is Next.js + TypeScript + Tailwind + MDX, but alternatives are permitted if justified by deployment speed, maintenance and learning-content extensibility.

Avoid unnecessary dependencies, vendor lock-in, paid services, external secrets, and premature backend infrastructure. Use clear content schemas and type-safe validation. Implement accessible interactions and responsive behavior. No external API keys should be required for core learning.

Repository currently public: do not commit personal identifiers, credentials, proprietary materials, or employer-internal content. Production app privacy is a separate decision from GitHub repo visibility.

## 8. Acceptance criteria

1. Fresh clone: documented install and build succeed.
2. At least three complete, accurate, navigable lessons; not placeholders.
3. At least one multi-step diagnostic mission that genuinely changes with learner decisions.
4. Wrong answers provide meaningful technical explanations.
5. Saved progress survives reload in the same browser.
6. Navigation works at mobile widths; no clipped text or dead buttons.
7. Curriculum clearly marks available vs planned lessons.
8. PWA manifest and mobile install experience tested or limitations documented.
9. Typecheck, lint and automated tests pass; provide test evidence.
10. Deployment path documented, and live URL supplied only after deployment is verified.
11. README explains architecture, content authoring, limitations, and how to add new lessons.

## 9. Delivery and collaboration

- Implement autonomously in this repository. Prefer a feature branch and PR for PO review, unless user explicitly authorizes direct main changes.
- Work in small verifiable milestones: foundation → complete learning vertical slice → interaction/progress → mobile QA → deployment.
- Record architecture decisions and scope changes in concise docs.
- Report: what works, what remains, how to run it, test evidence, deployment status, known defects, and next decisions needed.
- If blocked on credentials or deployment permissions, complete local/buildable work and request only the missing access.
- Do not declare success based solely on screenshots, mock data or passing a build.

## 10. Roadmap beyond 0.1 (not a blocker)

- Expand 30-day interview fast track and content coverage from the 16-module curriculum.
- Add simulations for UART, SPI, CAN, measurement/debugging and small embedded C programs.
- Introduce spaced retrieval and meaningful weak-skill review based on real quiz outcomes.
- Add portfolio project progression (STM32 sensor monitoring and fault detection).
- Optional AI tutor later, grounded in verified lessons with transparent uncertainty and costs.
- Cloud progress sync/auth only if real usage justifies it.

**Product definition of done:** Sushmita can learn something technically correct and useful in a short mobile session, return tomorrow, and continue without assistance.
