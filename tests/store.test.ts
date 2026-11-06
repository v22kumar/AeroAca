import { beforeEach, describe, expect, it } from "vitest";
import { ProgressStore, REVIEW_INTERVALS_MS, type StorageLike } from "@/lib/progress/store";
import { STORAGE_KEY } from "@/lib/progress/schema";
import { lessons } from "@/content";
import { lessonCards, lessonExerciseIds } from "@/lib/content";
import { lessonStatus, weakSkills, dueCards } from "@/lib/progress/selectors";
import { journeyState, nextItem } from "@/lib/progress/journey";

class MemoryStorage implements StorageLike {
  map = new Map<string, string>();
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const lesson = lessons[0]!;
let clock = 1_700_000_000_000;
const now = () => clock;

describe("progress store", () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
    clock = 1_700_000_000_000;
  });

  it("persists and restores across instances", () => {
    const a = new ProgressStore(storage, now);
    a.load();
    a.startLesson(lesson.slug);
    a.seeStep(lesson.slug, 3);
    a.recordAttempt(lesson.slug, "x", false);
    const b = new ProgressStore(storage, now);
    expect(b.load()).toBe(true);
    expect(b.getState().lessons[lesson.slug]?.lastStep).toBe(3);
    expect(b.getState().lessons[lesson.slug]?.exercises.x?.attempts).toHaveLength(1);
    expect(b.getState().activeDays).toHaveLength(1);
  });

  it("ignores corrupt or foreign data instead of crashing", () => {
    storage.setItem(STORAGE_KEY, "{not json");
    const a = new ProgressStore(storage, now);
    expect(a.load()).toBe(false);
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 99 }));
    const b = new ProgressStore(storage, now);
    expect(b.load()).toBe(false);
    expect(b.getState().lessons).toEqual({});
  });

  it("works without storage at all (private mode)", () => {
    const a = new ProgressStore(null, now);
    expect(a.load()).toBe(false);
    a.startLesson(lesson.slug);
    expect(a.getState().lessons[lesson.slug]).toBeDefined();
  });

  it("only completes a lesson when every exercise is solved, then enrols review cards", () => {
    const s = new ProgressStore(storage, now);
    const ids = lessonExerciseIds(lesson);
    const cards = lessonCards(lesson).map((c) => c.id);
    s.startLesson(lesson.slug);
    expect(s.completeLesson(lesson.slug, ids, cards)).toBe(false);
    for (const id of ids.slice(0, -1)) s.recordAttempt(lesson.slug, id, true);
    expect(s.completeLesson(lesson.slug, ids, cards)).toBe(false);
    expect(lessonStatus(s.getState(), lesson)).toBe("in-progress");
    s.recordAttempt(lesson.slug, ids[ids.length - 1]!, false);
    expect(s.completeLesson(lesson.slug, ids, cards)).toBe(false);
    s.recordAttempt(lesson.slug, ids[ids.length - 1]!, true);
    expect(s.completeLesson(lesson.slug, ids, cards)).toBe(true);
    expect(lessonStatus(s.getState(), lesson)).toBe("completed");
    expect(Object.keys(s.getState().review)).toEqual(cards);
    expect(dueCards(s.getState(), now())).toHaveLength(cards.length);
  });

  it("tracks weak skills from wrong attempts", () => {
    const s = new ProgressStore(storage, now);
    s.startLesson(lesson.slug);
    s.recordAttempt(lesson.slug, "crystal-no-target", false);
    s.recordAttempt(lesson.slug, "crystal-no-target", true);
    const weak = weakSkills(s.getState());
    expect(weak.map((w) => w.skill)).toContain("clock");
  });

  it("schedules review cards with growing intervals", () => {
    const s = new ProgressStore(storage, now);
    s.reviewCard("c1", "good");
    expect(s.getState().review.c1?.box).toBe(1);
    expect(s.getState().review.c1?.due).toBe(now() + REVIEW_INTERVALS_MS[1]!);
    s.reviewCard("c1", "good");
    expect(s.getState().review.c1?.box).toBe(2);
    s.reviewCard("c1", "again");
    expect(s.getState().review.c1?.box).toBe(0);
    expect(s.getState().review.c1?.due).toBe(now() + REVIEW_INTERVALS_MS[0]!);
  });

  it("the journey's next step is the first lesson, and shows in-progress once started", () => {
    const s = new ProgressStore(storage, now);
    expect(nextItem(journeyState(s.getState(), now()))?.item).toMatchObject({ item: { slug: "career-gap-contract-and-ownership" }, status: "todo" });
    s.startLesson("career-gap-contract-and-ownership");
    expect(nextItem(journeyState(s.getState(), now()))?.item).toMatchObject({ item: { slug: "career-gap-contract-and-ownership" }, status: "in-progress" });
  });

  it("export, import and reset round-trip", () => {
    const s = new ProgressStore(storage, now);
    s.startLesson(lesson.slug);
    const json = s.exportJson();
    s.reset();
    expect(s.getState().lessons).toEqual({});
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(s.importJson(json)).toBe(true);
    expect(s.getState().lessons[lesson.slug]).toBeDefined();
    expect(s.importJson("nope")).toBe(false);
  });
});

describe("active mission runs", () => {
  it("persists an in-progress run, records a finished run once, and clears on reset", () => {
    const storage = new MemoryStorage();
    const s = new ProgressStore(storage, now);
    s.setActiveRun("m", { startedAt: now(), phase: "investigate", performed: ["a"], minutesUsed: 2 });
    const b = new ProgressStore(storage, now);
    b.load();
    expect(b.getState().activeRuns?.m?.performed).toEqual(["a"]);
    b.recordMissionRun("m", { startedAt: now(), actions: ["a"], minutesUsed: 2, diagnosisId: "d", correct: true, evidenceBacked: true, score: 100 });
    expect(b.getState().activeRuns?.m?.recorded).toBe(true);
    expect(b.getState().missions.m?.runs).toHaveLength(1);
    b.clearActiveRun("m");
    expect(b.getState().activeRuns?.m).toBeUndefined();
    expect(b.getState().missions.m?.runs).toHaveLength(1);
  });

  it("records the starting-level diagnostic without touching lesson progress, and can be skipped or reset", () => {
    const storage = new MemoryStorage();
    const store = new ProgressStore(storage, () => 1000);
    store.load();
    store.startLesson("mcu-board-does-not-boot");
    store.recordDiagnosticAnswer("diag-divider", false);
    store.recordDiagnosticAnswer("diag-hex", true);
    expect(store.getState().diagnostic?.answers["diag-divider"]).toEqual({ correct: false, at: 1000 });
    expect(store.getState().diagnostic?.completedAt).toBeUndefined();
    store.completeDiagnostic();
    expect(store.getState().diagnostic?.completedAt).toBe(1000);
    expect(store.getState().lessons["mcu-board-does-not-boot"]).toBeDefined();
    // persisted and re-read
    const again = new ProgressStore(storage, () => 2000);
    again.load();
    expect(again.getState().diagnostic?.answers["diag-hex"]?.correct).toBe(true);
    again.skipDiagnostic();
    expect(again.getState().diagnostic?.skippedAt).toBe(2000);
    again.resetDiagnostic();
    expect(again.getState().diagnostic).toBeUndefined();
    expect(again.getState().lessons["mcu-board-does-not-boot"]).toBeDefined();
  });
});

describe("teaching format 2.0 progress", () => {
  let storage: MemoryStorage;
  beforeEach(() => {
    storage = new MemoryStorage();
    clock = 1_700_000_000_000;
  });

  it("records hints with an attempt only when used, and keeps 1.0 attempts shape otherwise", () => {
    const s = new ProgressStore(storage, now);
    s.load();
    s.startLesson("reading-a-power-tree");
    s.recordAttempt("reading-a-power-tree", "sag-guided", false, 2);
    s.recordAttempt("reading-a-power-tree", "sag-guided", true, 3);
    s.recordAttempt("reading-a-power-tree", "ldo-dissipation", true);
    const ex = s.getState().lessons["reading-a-power-tree"]!.exercises;
    expect(ex["sag-guided"]!.attempts.map((a) => a.hints)).toEqual([2, 3]);
    expect(ex["ldo-dissipation"]!.attempts[0]).not.toHaveProperty("hints");
  });

  it("completes at a depth, records the deepest depth reached, and never lowers it", () => {
    const s = new ProgressStore(storage, now);
    s.load();
    const slug = "priority-inversion";
    s.startLesson(slug);
    s.recordAttempt(slug, "inversion-guided", true, 1);
    expect(s.completeLesson(slug, ["inversion-guided"], ["pi-1"], "understand")).toBe(true);
    expect(s.getState().lessons[slug]!.completedDepth).toBe("understand");
    expect(s.getState().lessons[slug]!.completedAt).toBeDefined();
    // Apply not yet solved: completion at apply is refused, understand stays
    expect(s.completeLesson(slug, ["inversion-guided", "inversion-bound"], ["pi-1"], "apply")).toBe(false);
    expect(s.getState().lessons[slug]!.completedDepth).toBe("understand");
    s.recordAttempt(slug, "inversion-bound", true);
    expect(s.completeLesson(slug, ["inversion-guided", "inversion-bound"], ["pi-1"], "apply")).toBe(true);
    expect(s.getState().lessons[slug]!.completedDepth).toBe("apply");
    // switching back to understand does not lower it
    expect(s.completeLesson(slug, ["inversion-guided"], ["pi-1"], "understand")).toBe(true);
    expect(s.getState().lessons[slug]!.completedDepth).toBe("apply");
  });

  it("accumulates step time per step with a cap, and stores the depth preference", () => {
    const s = new ProgressStore(storage, now);
    s.load();
    s.startLesson("priority-inversion");
    s.addStepTime("priority-inversion", 2, 30.4);
    s.addStepTime("priority-inversion", 2, 10);
    s.addStepTime("priority-inversion", 3, 99_999);
    s.addStepTime("priority-inversion", 4, 0.2);
    const t = s.getState().lessons["priority-inversion"]!.stepTime!;
    expect(t["2"]).toBe(40);
    expect(t["3"]).toBe(1200);
    expect(t["4"]).toBeUndefined();
    s.setDepth("apply");
    expect(s.getState().profile?.depth).toBe("apply");
  });

  it("a 1.0 backup without the new fields imports unchanged and round-trips", () => {
    const s = new ProgressStore(storage, now);
    s.load();
    const raw = JSON.stringify({
      version: 1,
      createdAt: 1,
      updatedAt: 2,
      lessons: { "priority-inversion": { startedAt: 1, lastStep: 2, stepsSeen: [0, 1, 2], exercises: { "inversion-bound": { attempts: [{ at: 1, correct: true }], solvedAt: 1 } } } },
      missions: {},
      interview: {},
      review: {},
      activeDays: [],
    });
    expect(s.importJson(raw)).toBe(true);
    const lp = s.getState().lessons["priority-inversion"]!;
    expect(lp.completedDepth).toBeUndefined();
    expect(lp.stepTime).toBeUndefined();
    expect(lp.exercises["inversion-bound"]!.solvedAt).toBe(1);
  });
});
