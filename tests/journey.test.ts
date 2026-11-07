import { describe, expect, it } from "vitest";
import { journey, journeyStages, lessons, missions, interviewQuestions, curriculum } from "@/content";
import { journeySessionSchema, journeyStageSchema } from "@/lib/content/schema";
import { ProgressStore } from "@/lib/progress/store";
import { journeyState, sessionState, nextItem, applyKey, interviewKey, reviewKey } from "@/lib/progress/journey";
import { targetedReview } from "@/lib/progress/targeted";
import { lessonCards, lessonExerciseIds } from "@/lib/content";

const now = () => 1_800_000_000_000;

describe("journey content", () => {
  it("has 30 consecutive valid sessions in six contiguous stages, whose references resolve", () => {
    expect(journey).toHaveLength(30);
    expect(journeyStages).toHaveLength(6);
    journeyStages.forEach((st, i) => {
      expect(st.stage).toBe(i + 1);
      expect(journeyStageSchema.safeParse(st).success, `stage ${st.stage}`).toBe(true);
      expect(journey.some((s) => s.stage === st.stage), `stage ${st.stage} has sessions`).toBe(true);
    });
    // sessions of a stage are contiguous and stages appear in order
    let stage = 1;
    for (const s of journey) {
      expect(s.stage === stage || s.stage === stage + 1, `session ${s.session} in stage ${s.stage}`).toBe(true);
      stage = s.stage;
    }
    const lessonSlugs = new Set(lessons.map((l) => l.slug));
    const missionSlugs = new Set(missions.map((m) => m.slug));
    const qIds = new Set(interviewQuestions.map((q) => q.id));
    journey.forEach((d, i) => {
      expect(d.session).toBe(i + 1);
      expect(journeySessionSchema.safeParse(d).success, `session ${d.session}`).toBe(true);
      for (const it of d.items) {
        if (it.kind === "lesson") expect(lessonSlugs.has(it.slug), `session ${d.session}: ${it.slug}`).toBe(true);
        if (it.kind === "mission") expect(missionSlugs.has(it.slug), `session ${d.session}: ${it.slug}`).toBe(true);
        if (it.kind === "interview") for (const q of it.questionIds) expect(qIds.has(q), `session ${d.session}: ${q}`).toBe(true);
      }
    });
  });

  it("all 30 sessions are fully published; the journey covers at least 26 lessons and 5 missions, and every extra lesson is reachable from a curriculum module", () => {
    const first10 = journey.slice(0, 30);
    for (const d of first10) expect(d.items.some((i) => i.kind === "planned"), `session ${d.session}`).toBe(false);
    const used = new Set(first10.flatMap((d) => d.items.flatMap((i) => (i.kind === "lesson" || i.kind === "mission" ? [i.slug] : []))));
    expect(lessons.filter((l) => used.has(l.slug)).length).toBeGreaterThanOrEqual(26);
    expect(missions.filter((m) => used.has(m.slug)).length).toBeGreaterThanOrEqual(5);
    const inCurriculum = new Set(curriculum.flatMap((m) => [...m.lessons, ...(m.missions ?? [])].flatMap((x) => (x.status === "published" ? [x.slug] : []))));
    for (const l of lessons) expect(inCurriculum.has(l.slug), l.slug).toBe(true);
    for (const m of missions) expect(inCurriculum.has(m.slug), m.slug).toBe(true);
  });

  it("every session is a realistic sitting of 15 to 45 minutes", () => {
    const store = new ProgressStore(null, now);
    const js = journeyState(store.getState(), now());
    for (const d of js.sessions) {
      const total = d.items.reduce((n, i) => n + i.minutes, 0);
      expect(total, `session ${d.session.session}: ${total} min`).toBeGreaterThanOrEqual(15);
      expect(total, `session ${d.session.session}: ${total} min`).toBeLessThanOrEqual(45);
    }
  });

  it("stage states group the sessions in order, and a fresh profile is in stage 1 with nothing complete", () => {
    const js = journeyState(new ProgressStore(null, now).getState(), now());
    expect(js.stages).toHaveLength(6);
    expect(js.stages.map((s) => s.first)).toEqual([1, 6, 11, 16, 21, 26]);
    expect(js.stages.map((s) => s.last)).toEqual([5, 10, 15, 20, 25, 30]);
    expect(js.currentStage).toBe(1);
    expect(js.stages[0]!.current).toBe(true);
    expect(js.completedStages).toBe(0);
    for (const st of js.stages) expect(st.stage.outcome.length).toBeGreaterThan(80);
  });
});

describe("journey progression", () => {
  it("starts on session 1 with the first lesson, and advances only when every available item is done", () => {
    const s = new ProgressStore(null, now);
    let js = journeyState(s.getState(), now());
    expect(js.currentSession).toBe(1);
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "lesson", slug: "career-gap-contract-and-ownership" });

    // Complete the lesson
    const lesson = lessons.find((l) => l.slug === "career-gap-contract-and-ownership")!;
    s.startLesson(lesson.slug);
    for (const id of lessonExerciseIds(lesson)) s.recordAttempt(lesson.slug, id, true);
    s.completeLesson(lesson.slug, lessonExerciseIds(lesson), lessonCards(lesson).map((c) => c.id));
    js = journeyState(s.getState(), now());
    expect(js.currentSession).toBe(1);
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "interview" });

    // Rating alone is not enough: the rehearsal must happen in the day's context.
    s.rateInterview("what-did-you-own", "shaky");
    js = journeyState(s.getState(), now());
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "interview" });
    s.setJourneyDone(interviewKey(1));
    js = journeyState(s.getState(), now());
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "apply", id: "ownership-sentences" });
    expect(js.completedSessions).toBe(0);

    s.setApplyDone(applyKey(1, "ownership-sentences"), true);
    js = journeyState(s.getState(), now());
    expect(js.completedSessions).toBe(1);
    expect(js.currentSession).toBe(2);
    // Session 2's review item is not done until a review is recorded for session 2, and stays done afterwards
    // even when cards come due again.
    const session2 = js.sessions[1]!;
    expect(session2.items.find((i) => i.item.kind === "review")?.done).toBe(false);
    for (const c of lessonCards(lesson)) s.reviewCard(c.id, "good");
    expect(journeyState(s.getState(), now()).sessions[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(false);
    s.setJourneyDone(reviewKey(2));
    const later = now() + 3 * 24 * 3600 * 1000; // cards due again
    const after = journeyState(s.getState(), later);
    expect(after.sessions[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(true);
    // A question rated in session 1 does not pre-complete session 29's rehearsal of the same question.
    expect(after.sessions[28]!.items.find((i) => i.item.kind === "interview")?.done).toBe(false);
    // A later session with real content is not complete on this profile.
    expect(after.sessions[15]!.complete).toBe(false);
    expect(after.lastFullyPublishedSession).toBe(30);
    s.setApplyDone(applyKey(1, "ownership-sentences"), false);
    expect(journeyState(s.getState(), now()).currentSession).toBe(1);
  });

  it("planned items never count as done and cannot block a session with available work", () => {
    const s = new ProgressStore(null, now);
    const js = journeyState(s.getState(), now());
    // No session references planned content any more; the rule is checked on a synthetic session.
    expect(js.sessions.every((d) => d.plannedCount === 0)).toBe(true);
    const synthetic = { ...journey[0]!, items: [...journey[0]!.items, { kind: "planned" as const, title: "Lesson: not yet written", minutes: 10 }] };
    const ds = sessionState(s.getState(), synthetic, { due: 0, enrolled: 0 });
    expect(ds.plannedCount).toBe(1);
    expect(ds.items.filter((i) => i.status === "planned").every((i) => !i.done && !i.available)).toBe(true);
    expect(ds.availableCount).toBe(journey[0]!.items.length);
    expect(ds.complete).toBe(false);
    // A fresh profile has no complete sessions, and a review item with nothing enrolled is not done.
    expect(js.completedSessions).toBe(0);
    expect(js.sessions.every((d) => !d.complete)).toBe(true);
    expect(js.sessions[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(false);
  });
});

describe("targeted review", () => {
  it("lists exercises with wrong attempts or left unsolved, grouped by skill, worst first", () => {
    const s = new ProgressStore(null, now);
    expect(targetedReview(s.getState())).toEqual([]);
    s.startLesson("i2c-sensor-not-acknowledging");
    s.recordAttempt("i2c-sensor-not-acknowledging", "first-byte-0x4a", false);
    s.recordAttempt("i2c-sensor-not-acknowledging", "first-byte-0x4a", true);
    s.recordAttempt("i2c-sensor-not-acknowledging", "pullup-current", false);
    s.recordAttempt("i2c-sensor-not-acknowledging", "pullup-current", false);
    s.seeStep("i2c-sensor-not-acknowledging", 6); // reached the multi-choice but never answered
    const groups = targetedReview(s.getState());
    expect(groups.map((g) => g.skill)).toEqual(["i2c-physical", "i2c-addressing"]);
    const physical = groups[0]!;
    expect(physical.wrong).toBe(2);
    expect(physical.targets.map((t) => t.exerciseId)).toEqual(["pullup-current", "idle-low-causes"]);
    expect(physical.targets[0]).toMatchObject({ stepIndex: 7, solved: false, wrong: 2 });
    expect(physical.targets[1]).toMatchObject({ stepIndex: 6, solved: false, wrong: 0 });
    expect(groups[1]!.targets[0]).toMatchObject({ exerciseId: "first-byte-0x4a", solved: true, wrong: 1 });
  });
});
