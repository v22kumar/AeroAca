import { describe, expect, it } from "vitest";
import { lessons, interviewQuestions, curriculum } from "@/content";
import { ProgressStore } from "@/lib/progress/store";
import { recommendations } from "@/lib/progress/recommend";
import { moduleReadiness } from "@/lib/progress/readiness";
import { lessonCards, lessonExerciseIds } from "@/lib/content";

const now = () => 1_800_000_000_000;

describe("recommendations from evidence", () => {
  it("a fresh profile gets only coverage-gap suggestions, each naming its module", () => {
    const s = new ProgressStore(null, now);
    const recs = recommendations(s.getState(), 20);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => r.kind === "lesson" && r.priority === 1 && /^Module \d+, /.test(r.reason))).toBe(true);
    expect(recs.every((r) => !/%/.test(r.reason))).toBe(true);
  });

  it("a wrong answer produces a retry first, then a lesson that exercises the same skill, with the counts in the reason", () => {
    const s = new ProgressStore(null, now);
    s.startLesson("i2c-sensor-not-acknowledging");
    s.recordAttempt("i2c-sensor-not-acknowledging", "pullup-current", false);
    s.recordAttempt("i2c-sensor-not-acknowledging", "pullup-current", false);
    const recs = recommendations(s.getState(), 6);
    expect(recs[0]).toMatchObject({ kind: "retry", href: expect.stringMatching(/\/lessons\/i2c-sensor-not-acknowledging\?step=\d+/) });
    expect(recs[0]!.reason).toContain("2 wrong attempts");
    const follow = recs.find((r) => r.kind === "lesson" && r.priority === 2);
    expect(follow).toBeDefined();
    expect(follow!.reason).toMatch(/2 wrong attempts in .*; this lesson (exercises the same skill|is the next in the same module)/);
  });

  it("a shaky interview rating recommends the grounding lesson, or a rehearsal once that lesson is complete", () => {
    const s = new ProgressStore(null, now);
    const q = interviewQuestions.find((x) => x.relatedLesson)!;
    s.rateInterview(q.id, "shaky");
    let recs = recommendations(s.getState(), 20);
    expect(recs.some((r) => r.kind === "lesson" && r.href === `/lessons/${q.relatedLesson}` && r.reason.includes("shaky"))).toBe(true);
    const lesson = lessons.find((l) => l.slug === q.relatedLesson)!;
    s.startLesson(lesson.slug);
    for (const id of lessonExerciseIds(lesson)) s.recordAttempt(lesson.slug, id, true);
    s.completeLesson(lesson.slug, lessonExerciseIds(lesson), lessonCards(lesson).map((c) => c.id));
    recs = recommendations(s.getState(), 20);
    expect(recs.some((r) => r.kind === "interview" && r.href === `/interview?q=${q.id}`)).toBe(true);
  });
});

describe("readiness, explained", () => {
  it("starts with no evidence and lists gaps in words, never percentages", () => {
    const s = new ProgressStore(null, now);
    const rows = moduleReadiness(s.getState());
    expect(rows).toHaveLength(curriculum.length);
    for (const r of rows) {
      expect(r.status).toBe("no evidence yet");
      expect(r.gaps.join(" ")).not.toMatch(/%/);
      if (r.lessons.total > 0) expect(r.gaps[0]).toMatch(/lesson/);
    }
  });

  it("moves through started → lessons complete → evidence complete as evidence is recorded", () => {
    const s = new ProgressStore(null, now);
    const mod = curriculum.find((m) => m.id === "embedded-cpp")!; // one lesson, no missions
    const slug = mod.lessons[0]!.slug!;
    const lesson = lessons.find((l) => l.slug === slug)!;
    s.startLesson(slug);
    s.recordAttempt(slug, lessonExerciseIds(lesson)[0]!, false);
    let r = moduleReadiness(s.getState()).find((x) => x.moduleId === mod.id)!;
    expect(r.status).toBe("started");
    expect(r.openWrong).toBe(1);
    for (const id of lessonExerciseIds(lesson)) s.recordAttempt(slug, id, true);
    s.completeLesson(slug, lessonExerciseIds(lesson), lessonCards(lesson).map((c) => c.id));
    r = moduleReadiness(s.getState()).find((x) => x.moduleId === mod.id)!;
    expect(r.lessons.completed).toBe(1);
    expect(r.openWrong).toBe(0);
    expect(["lessons complete", "lessons and missions complete"]).toContain(r.status);
    for (const q of interviewQuestions.filter((q) => q.moduleId === mod.id)) s.rateInterview(q.id, "confident");
    r = moduleReadiness(s.getState()).find((x) => x.moduleId === mod.id)!;
    expect(r.status).toBe("evidence complete");
    expect(r.gaps).toEqual([]);
  });
});
