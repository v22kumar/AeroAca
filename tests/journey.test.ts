import { describe, expect, it } from "vitest";
import { journey, lessons, missions, interviewQuestions } from "@/content";
import { journeyDaySchema } from "@/lib/content/schema";
import { ProgressStore } from "@/lib/progress/store";
import { journeyState, nextItem, applyKey } from "@/lib/progress/journey";
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

  it("days 1 to 10 are fully published and every published lesson and mission appears in them", () => {
    const first10 = journey.slice(0, 10);
    for (const d of first10) expect(d.items.some((i) => i.kind === "planned"), `day ${d.day}`).toBe(false);
    const used = new Set(first10.flatMap((d) => d.items.flatMap((i) => (i.kind === "lesson" || i.kind === "mission" ? [i.slug] : []))));
    for (const l of lessons) expect(used.has(l.slug), l.slug).toBe(true);
    for (const m of missions) expect(used.has(m.slug), m.slug).toBe(true);
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
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "lesson", slug: "mcu-board-does-not-boot" });

    // Complete the lesson
    const lesson = lessons.find((l) => l.slug === "mcu-board-does-not-boot")!;
    s.startLesson(lesson.slug);
    for (const id of lessonExerciseIds(lesson)) s.recordAttempt(lesson.slug, id, true);
    s.completeLesson(lesson.slug, lessonExerciseIds(lesson), lessonCards(lesson).map((c) => c.id));
    js = journeyState(s.getState(), now());
    expect(js.currentDay).toBe(1);
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "interview" });

    s.rateInterview("mcu-no-boot-walkthrough", "shaky");
    js = journeyState(s.getState(), now());
    expect(nextItem(js)?.item.item).toMatchObject({ kind: "apply", id: "bringup-card" });
    expect(js.completedDays).toBe(0);

    s.setApplyDone(applyKey(1, "bringup-card"), true);
    js = journeyState(s.getState(), now());
    expect(js.completedDays).toBe(1);
    expect(js.currentDay).toBe(2);
    // Day 2's review item: cards from day 1's lesson are due now
    const day2 = js.days[1]!;
    expect(day2.items.find((i) => i.item.kind === "review")?.done).toBe(false);
    // Days that only have planned content plus a review can be exhausted but never complete.
    for (const c of lessonCards(lesson)) s.reviewCard(c.id, "good");
    const after = journeyState(s.getState(), now());
    expect(after.days[1]!.items.find((i) => i.item.kind === "review")?.done).toBe(true);
    expect(after.days[15]!.complete).toBe(false);
    s.setApplyDone(applyKey(1, "bringup-card"), false);
    expect(journeyState(s.getState(), now()).currentDay).toBe(1);
  });

  it("planned items never count as done and cannot block a day with available work", () => {
    const s = new ProgressStore(null, now);
    const js = journeyState(s.getState(), now());
    const day11 = js.days[10]!;
    expect(day11.plannedCount).toBeGreaterThan(0);
    expect(day11.items.filter((i) => i.status === "planned").every((i) => !i.done && !i.available)).toBe(true);
    expect(day11.availableCount).toBeGreaterThan(0);
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
