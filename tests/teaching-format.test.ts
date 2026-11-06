import { describe, expect, it } from "vitest";
import { lessons } from "@/content";
import { glossary } from "@/content/glossary";
import { DEPTHS, type Lesson } from "@/lib/content/schema";
import { deepestCompleted, exerciseIdsAt, hiddenAbove, stepVisibleAt, visibleStepIndices } from "@/lib/content/depth";

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const arc = lessons.filter((l) => l.format === "arc");

/**
 * Teaching format 2.0 (docs/CONTENT_AUTHORING.md): the authoring rules that answer the learner's
 * "it's not easy understanding", enforced on every lesson that declares format "arc".
 */
describe("teaching format 2.0 lessons", () => {
  it("there are arc lessons to check", () => {
    expect(arc.length).toBeGreaterThanOrEqual(3);
  });

  it("every concept step is one idea: at most 220 words of body (the 'deeper' box is extra)", () => {
    for (const l of arc) {
      for (const s of l.steps) {
        if (s.type !== "concept") continue;
        const n = words(s.body);
        expect(n, `${l.slug} / ${s.title}: ${n} words`).toBeLessThanOrEqual(220);
      }
    }
  });

  it("follows the arc: why first, intuition before theory, a visual or walkthrough, an example before any exercise, complexity, check, work, recap last", () => {
    for (const l of arc) {
      const stages: (string | undefined)[] = l.steps.map((s) => s.stage ?? (s.type === "recap" ? "recap" : undefined));
      expect(l.steps[0]!.type, l.slug).toBe("scenario");
      expect(l.steps[0]!.stage, l.slug).toBe("why");
      expect(l.steps.at(-1)!.type, l.slug).toBe("recap");
      const first = (st: string) => stages.indexOf(st);
      expect(first("intuition"), `${l.slug}: intuition step`).toBeGreaterThan(0);
      expect(first("theory"), `${l.slug}: theory step`).toBeGreaterThan(first("intuition"));
      expect(l.steps.some((s) => s.type === "visual" || s.type === "walkthrough" || s.type === "figure"), `${l.slug}: a visual, figure or walkthrough`).toBe(true);
      const firstExercise = l.steps.findIndex((s) => s.type === "exercise");
      const firstExample = l.steps.findIndex((s) => s.type === "example");
      expect(firstExample, `${l.slug}: worked example`).toBeGreaterThanOrEqual(0);
      expect(firstExample, `${l.slug}: example before the first exercise`).toBeLessThan(firstExercise);
      for (const st of ["complexity", "check", "work"]) expect(first(st), `${l.slug}: ${st} step`).toBeGreaterThan(0);
    }
  });

  it("every step carries a stage; every step except the scenario and recap (shown at every depth) carries a depth; the first exercise is guided and at Understand depth", () => {
    for (const l of arc) {
      for (const s of l.steps) {
        if (s.type === "recap") continue;
        expect(s.stage, `${l.slug}: step without stage (${s.type})`).toBeDefined();
        if (s.type === "scenario") continue;
        expect(s.depth, `${l.slug}: step without depth (${s.type} ${"title" in s ? s.title : ""})`).toBeDefined();
      }
      const firstExercise = l.steps.find((s) => s.type === "exercise")!;
      expect(firstExercise.depth, l.slug).toBe("understand");
      expect(firstExercise.exercise.hints?.length ?? 0, `${l.slug}: first exercise has hints`).toBeGreaterThanOrEqual(2);
      // and an independent exercise of the same kind follows without hints
      const independent = l.steps.filter((s) => s.type === "exercise").slice(1);
      expect(independent.some((s) => !s.exercise.hints), `${l.slug}: an exercise without hints`).toBe(true);
    }
  });

  it("every interactive step has guidance that starts with 'Try this first'", () => {
    for (const l of arc) {
      for (const s of l.steps) {
        if (s.type === "visual") expect(s.body ?? "", `${l.slug} / ${s.title}`).toMatch(/\*\*Try this first\.\*\*/);
      }
    }
  });

  it("every code block in a concept, example or scenario is short or has a walkthrough step in the lesson", () => {
    for (const l of arc) {
      const hasWalkthrough = l.steps.some((s) => s.type === "walkthrough");
      for (const s of l.steps) {
        const body = (s as { body?: unknown }).body;
        if (typeof body !== "string") continue;
        const blocks = body.match(/```[\s\S]*?```/g) ?? [];
        for (const b of blocks) {
          const lines = b.split("\n").length - 2;
          const title = (s as { title?: string }).title ?? s.type;
          expect(lines <= 6 || hasWalkthrough, `${l.slug} / ${title}: ${lines}-line code block without a walkthrough`).toBe(true);
        }
      }
    }
  });

  it("walkthrough notes reference lines that exist, in order, and cover the code", () => {
    for (const l of arc) {
      for (const s of l.steps) {
        if (s.type !== "walkthrough") continue;
        const n = s.code.split("\n").length;
        let last = 0;
        for (const note of s.notes) {
          const [a, b] = note.lines.split("-").map(Number);
          expect(a, `${l.slug}: ${note.lines}`).toBeGreaterThan(last);
          expect(b ?? a, `${l.slug}: ${note.lines} beyond ${n} lines`).toBeLessThanOrEqual(n);
          last = b ?? a!;
        }
      }
    }
  });

  it("every depth shows a playable lesson: a scenario, at least one exercise, and the recap", () => {
    for (const l of arc) {
      for (const d of DEPTHS) {
        const idx = visibleStepIndices(l, d);
        expect(l.steps[idx[0]!]!.type, `${l.slug} @ ${d}`).toBe("scenario");
        expect(l.steps[idx.at(-1)!]!.type, `${l.slug} @ ${d}`).toBe("recap");
        expect(exerciseIdsAt(l, d).length, `${l.slug} @ ${d}: exercises`).toBeGreaterThan(0);
      }
      expect(exerciseIdsAt(l, "apply").length).toBeGreaterThan(exerciseIdsAt(l, "understand").length);
      expect(exerciseIdsAt(l, "master").length).toBeGreaterThan(exerciseIdsAt(l, "apply").length);
    }
  });

  it("the 'where you will use this' step names development, aerospace, R&D or design, and verification or interviews", () => {
    for (const l of arc) {
      const work = l.steps.find((s) => s.stage === "work") as { body: string };
      for (const re of [/development/i, /aerospace|UAV|avionics/i, /R&D|design/i, /verification|interview/i]) expect(work.body, `${l.slug}: ${re}`).toMatch(re);
    }
  });

  it("glossary terms used in the intuition steps are introduced inline or are everyday words", () => {
    // The intuition steps are allowed to use glossary terms only when the step itself says what they mean
    // (bold term followed by a plain-language sentence). We check that every bold **term** in an intuition
    // step that is a glossary term appears at most once bolded (introduced there), as a proxy for "defined here".
    const terms = new Set(glossary.map((g) => g.term.toLowerCase()));
    for (const l of arc) {
      for (const s of l.steps) {
        if (s.type !== "concept" || s.stage !== "intuition") continue;
        const bolds = [...s.body.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]!.toLowerCase());
        const glossaryBolds = bolds.filter((b) => terms.has(b));
        for (const b of glossaryBolds) expect(bolds.filter((x) => x === b).length, `${l.slug} / ${s.title}: ${b} bolded more than once`).toBe(1);
      }
    }
  });
});

describe("depth helpers", () => {
  const lesson = arc[0]!;
  it("untagged steps are visible at every depth and hiddenAbove counts only deeper tags", () => {
    expect(stepVisibleAt({ type: "scenario", title: "x", body: "y" }, "understand")).toBe(true);
    const h = hiddenAbove(lesson, "understand");
    expect(h.map((x) => x.depth)).toEqual(["apply", "master"]);
    expect(hiddenAbove(lesson, "master")).toEqual([]);
  });
  it("deepestCompleted stops at the first depth with an unsolved exercise", () => {
    const understand = new Set(exerciseIdsAt(lesson, "understand"));
    expect(deepestCompleted(lesson, () => false)).toBeNull();
    expect(deepestCompleted(lesson, (id) => understand.has(id))).toBe("understand");
    expect(deepestCompleted(lesson, () => true)).toBe("master");
  });
  it("1.0 lessons have no depth tags and expose every exercise at Understand", () => {
    const old = lessons.find((l) => !l.format) as Lesson;
    expect(exerciseIdsAt(old, "understand").length).toBe(old.steps.filter((s) => s.type === "exercise").length);
  });
});
