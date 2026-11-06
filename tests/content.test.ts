import { describe, expect, it } from "vitest";
import { curriculum, interviewQuestions, lessons, missions } from "@/content";
import { curriculumModuleSchema, interviewQuestionSchema, lessonSchema, missionSchema } from "@/lib/content/schema";
import { allReviewCards, learningPath } from "@/lib/content";

describe("content validity", () => {
  it("every lesson passes the schema", () => {
    for (const lesson of lessons) {
      const r = lessonSchema.safeParse(lesson);
      expect(r.success, `${lesson.slug}: ${r.success ? "" : JSON.stringify(r.error.issues, null, 2)}`).toBe(true);
    }
  });

  it("every mission passes the schema", () => {
    for (const mission of missions) {
      const r = missionSchema.safeParse(mission);
      expect(r.success, `${mission.slug}: ${r.success ? "" : JSON.stringify(r.error.issues, null, 2)}`).toBe(true);
    }
  });

  it("every interview question passes the schema and links to real lessons", () => {
    const slugs = new Set(lessons.map((l) => l.slug));
    for (const q of interviewQuestions) {
      const r = interviewQuestionSchema.safeParse(q);
      expect(r.success, `${q.id}: ${r.success ? "" : JSON.stringify(r.error.issues)}`).toBe(true);
      if (q.relatedLesson) expect(slugs.has(q.relatedLesson), `${q.id} -> ${q.relatedLesson}`).toBe(true);
    }
    const ids = interviewQuestions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("lesson interview steps reference existing questions", () => {
    const ids = new Set(interviewQuestions.map((q) => q.id));
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        if (step.type === "interview") expect(ids.has(step.questionId), `${lesson.slug} -> ${step.questionId}`).toBe(true);
      }
    }
  });

  it("curriculum is valid and published entries resolve to content", () => {
    const lessonSlugs = new Set(lessons.map((l) => l.slug));
    const missionSlugs = new Set(missions.map((m) => m.slug));
    const numbers = new Set<number>();
    for (const mod of curriculum) {
      expect(curriculumModuleSchema.safeParse(mod).success).toBe(true);
      expect(numbers.has(mod.number)).toBe(false);
      numbers.add(mod.number);
      for (const l of mod.lessons) {
        if (l.status === "published") {
          expect(l.slug, `${mod.id}: published lesson needs slug`).toBeDefined();
          expect(lessonSlugs.has(l.slug!), `${mod.id} -> ${l.slug}`).toBe(true);
          const lesson = lessons.find((x) => x.slug === l.slug)!;
          expect(lesson.moduleId).toBe(mod.id);
        } else {
          expect(l.slug).toBeUndefined();
        }
      }
      for (const m of mod.missions ?? []) {
        if (m.status === "published") expect(missionSlugs.has(m.slug!)).toBe(true);
      }
    }
    expect(curriculum).toHaveLength(16);
  });

  it("every published lesson and mission appears on the learning path", () => {
    const path = learningPath();
    expect(path.filter((p) => p.kind === "lesson")).toHaveLength(lessons.length);
    expect(path.filter((p) => p.kind === "mission")).toHaveLength(missions.length);
  });

  it("every lesson declares prerequisites that exist, form no cycle, and only starting points declare none", () => {
    const bySlug = new Map(lessons.map((l) => [l.slug, l]));
    // The academy's deliberate starting points: one per entry route (power, boot, C, instruments).
    const startingPoints = new Set(["circuit-laws-on-the-bench", "the-dmm-and-the-bench-supply", "embedded-c-register-bit-masks"]);
    for (const lesson of lessons) {
      expect(lesson.prerequisites, `${lesson.slug} must declare prerequisites (an empty list means a starting point)`).toBeDefined();
      const pre = lesson.prerequisites!;
      if (startingPoints.has(lesson.slug)) expect(pre, `${lesson.slug} is a starting point`).toHaveLength(0);
      else expect(pre.length, `${lesson.slug} is not a starting point and must rest on at least one earlier lesson`).toBeGreaterThan(0);
      for (const p of pre) {
        expect(bySlug.has(p), `${lesson.slug} -> ${p} is not a published lesson`).toBe(true);
        expect(p).not.toBe(lesson.slug);
      }
    }
    // no cycles: depth-first search over the prerequisite graph
    const seen = new Set<string>();
    const onPath = new Set<string>();
    const visit = (slug: string, path: string[]) => {
      if (onPath.has(slug)) throw new Error(`prerequisite cycle: ${[...path, slug].join(" -> ")}`);
      if (seen.has(slug)) return;
      onPath.add(slug);
      for (const p of bySlug.get(slug)!.prerequisites ?? []) visit(p, [...path, slug]);
      onPath.delete(slug);
      seen.add(slug);
    };
    for (const l of lessons) visit(l.slug, []);
  });

  it("review card ids are globally unique", () => {
    const ids = allReviewCards().map((c) => c.card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exercise ids and skills are unique per lesson and tagged", () => {
    for (const lesson of lessons) {
      const ids = lesson.steps.flatMap((s) => (s.type === "exercise" ? [s.exercise.id] : []));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("missions give every wrong diagnosis a substantive explanation", () => {
    for (const m of missions) {
      for (const d of m.diagnoses) expect(d.feedback.length).toBeGreaterThan(80);
      for (const a of m.actions) expect(a.assessmentNote.length).toBeGreaterThan(40);
      // the optimal path must be achievable in order
      const done = new Set<string>();
      for (const id of m.optimalPath) {
        const a = m.actions.find((x) => x.id === id)!;
        if (a.requiresAnyOf) expect(a.requiresAnyOf.some((r) => done.has(r)), `${m.slug}: ${id} not reachable`).toBe(true);
        done.add(id);
      }
      // the optimal path must collect the evidence needed for the correct diagnosis
      const correct = m.diagnoses.find((d) => d.correct)!;
      const evidence = new Set(m.optimalPath.map((id) => m.actions.find((a) => a.id === id)!.evidence));
      for (const e of correct.requiresEvidence ?? []) expect(evidence.has(e), `${m.slug}: optimal path lacks ${e}`).toBe(true);
      const optimalMinutes = m.optimalPath.reduce((n, id) => n + m.actions.find((a) => a.id === id)!.costMinutes, 0);
      expect(optimalMinutes).toBeLessThanOrEqual(m.budgetMinutes);
    }
  });
});
