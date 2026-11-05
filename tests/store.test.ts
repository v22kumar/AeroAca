import { beforeEach, describe, expect, it } from "vitest";
import { ProgressStore, REVIEW_INTERVALS_MS, type StorageLike } from "@/lib/progress/store";
import { STORAGE_KEY } from "@/lib/progress/schema";
import { lessons } from "@/content";
import { lessonCards, lessonExerciseIds } from "@/lib/content";
import { lessonStatus, nextAction, weakSkills, dueCards } from "@/lib/progress/selectors";

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

  it("next action resumes in-progress work, then starts the next item", () => {
    const s = new ProgressStore(storage, now);
    expect(nextAction(s.getState(), now())).toMatchObject({ kind: "start", item: { slug: lesson.slug } });
    s.startLesson(lesson.slug);
    expect(nextAction(s.getState(), now())).toMatchObject({ kind: "resume", item: { slug: lesson.slug } });
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
