import { describe, expect, it } from "vitest";
import { journey, lessons, missions, interviewQuestions, curriculum } from "@/content";
import { journeyDaySchema } from "@/lib/content/schema";
import { ProgressStore } from "@/lib/progress/store";
import { journeyState, dayState, nextItem, applyKey, interviewKey, reviewKey } from "@/lib/progress/journey";
import { targetedReview } from "@/lib/progress/targeted";
import { lessonCards, lessonExerciseIds } from "@/lib/content";

const now = () => 1_800_000_000_000;

describe("journey content", () => {
  it("has 30 consecutive valid days whose references resolve", () => {
    expect(journey).toHaveLength(30);
    const lessonSlugs = new Set(lessons.map((l) => l.slug));
    const missionSlugs = new Set(missions.map((m) => m.slug));
    const qIds = new Set(interviewQuestions.map((q) => q.id));
    journey.forEach((d, i) => {
      expect(d.day).toBe(i + 1);
      expect(journeyDaySchema.safeParse(d).success, `day ${d.day}`).toBe(true);
      for (const it of d.items) {
        if (it.kind === "lesson") expect(lessonSlugs.has(it.slug), `day ${d.day}: ${it.slug}`).toBe(true);
        if (it.kind === "mission") expect(missionSlugs.has(it.slug), `day ${d.day}: ${it.slug}`).toBe(true);
        if (it.kind === "interview") for (const q of it.questionIds) expect(qIds.has(q), `day ${d.day}: ${q}`).toBe(true);
      }
    });
  });

  it("all 30 days are fully published; the journey covers at least 26 lessons and 5 missions, and every extra lesson is reachable from a curriculum module", () => {
    const first10 = journey.slice(0, 30);
    for (const d of first10) expect(d.items.some((i) => i.kind === "planned"), `day ${d.day}`).toBe(false);
    const used = new Set(first10.flatMap((d) => d.items.flatMap((i) => (i.kind === "lesson" || i.kind === "mission" ? [i.slug] : []))));
    expect(lessons.filter((l) => used.has(l.slug)).length).toBeGreaterThanOrEqual(26);
    expect(missions.filter((m) => used.has(m.slug)).length).toBeGreaterThanOrEqual(5);
    const inCurriculum = new Set(curriculum.flatMap((m) => [...m.lessons, ...(m.missions ?? [])].flatMap((x) => (x.status === "published" ? [x.slug] : []))));
    for (const l of lessons) expect(inCurriculum.has(l.slug), l.slug).toBe(true);
    for (const m of missions) expect(inCurriculum.has(m.slug), m.slug).toBe(true);
  });

  it("every day is a realistic session of 15 to 45 minutes", () => {
    const store = new ProgressStore(null, now);
    const js = journeyState(store.getState(), now());
    for (const d of js.days) {
      const total = d.items.reduce((n, i) => n + i.minutes, 0);
      expect(total, `day ${d.day.day}: ${total} min`).toBeGreaterThanOrEqual(15);
      expect(total, `day ${d.day.day}: ${total} min`).toBeLessThanOrEqual(45);
    }
  });
});

describe("journey progression", () => {
  it("starts on day 1 with the first lesson, and advances only when every available item is done", () => {
    const s = new ProgressStore(null, now);
    let js = journeyState(s.getState(), now());
    expect(js.currentDay).toBe(1);
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "lesson", slug: "career-gap-contract-and-ownership" });

    // Complete the lesson
    const lesson = lessons.find((l) => l.slug === "career-gap-contract-and-ownership")!;
    s.startLesson(lesson.slug);
    for (const id of lessonExerciseIds(lesson)) s.recordAttempt(lesson.slug, id, true);
    s.completeLesson(lesson.slug, lessonExerciseIds(lesson), lessonCards(lesson).map((c) => c.id));
    js = journeyState(s.getState(), now());
    expect(js.currentDay).toBe(1);
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "interview" });

    // Rating alone is not enough: the rehearsal must happen in the day's context.
    s.rateInterview("what-did-you-own", "shaky");
    js = journeyState(s.getState(), now());
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "interview" });
    s.setJourneyDone(interviewKey(1));
    js = journeyState(s.getState(), now());
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "apply", id: "ownership-sentences" });
    expect(js.completedDays).toBe(0);

    s.setApplyDone(applyKey(1, "ownership-sentences"), true);
    js = journeyState(s.getState(), now());
    expect(js.completedDays).toBe(1);
    expect(js.currentDay).toBe(2);
    // Day 2's review item is not done until a session is recorded for day 2, and stays done afterwards
    // even when cards come due again.
    const day2 = js.days[1]!;
    expect(day2.items.find((i) => i.item.kind === "review")?.done).toBe(false);
    for (const c of lessonCards(lesson)) s.reviewCard(c.id, "good");
    expect(journeyState(s.getState(), now()).days[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(false);
    s.setJourneyDone(reviewKey(2));
    const later = now() + 3 * 24 * 3600 * 1000; // cards due again
    const after = journeyState(s.getState(), later);
    expect(after.days[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(true);
    // A question rated on day 1 does not pre-complete day 29's rehearsal of the same question.
    expect(after.days[28]!.items.find((i) => i.item.kind === "interview")?.done).toBe(false);
    // A later day with real content is not complete on this profile.
    expect(after.days[15]!.complete).toBe(false);
    expect(after.lastFullyPublishedDay).toBe(30);
    s.setApplyDone(applyKey(1, "ownership-sentences"), false);
    expect(journeyState(s.getState(), now()).currentDay).toBe(1);
  });

  it("planned items never count as done and cannot block a day with available work", () => {
    const s = new ProgressStore(null, now);
    const js = journeyState(s.getState(), now());
    // No day references planned content any more; the rule is checked on a synthetic day.
    expect(js.days.every((d) => d.plannedCount === 0)).toBe(true);
    const synthetic = { ...journey[0]!, items: [...journey[0]!.items, { kind: "planned" as const, title: "Lesson: not yet written", minutes: 10 }] };
    const ds = dayState(s.getState(), synthetic, { due: 0, enrolled: 0 });
    expect(ds.plannedCount).toBe(1);
    expect(ds.items.filter((i) => i.status === "planned").every((i) => !i.done && !i.available)).toBe(true);
    expect(ds.availableCount).toBe(journey[0]!.items.length);
    expect(ds.complete).toBe(false);
    // A fresh profile has no complete days, and a review item with nothing enrolled is not done.
    expect(js.completedDays).toBe(0);
    expect(js.days.every((d) => !d.complete)).toBe(true);
    expect(js.days[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(false);
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
