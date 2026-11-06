import { describe, expect, it } from "vitest";
import { diagnostic } from "@/content/diagnostic";
import { exerciseSchema } from "@/lib/content/schema";
import { lessons } from "@/content";
import { emptyProgress, type ProgressState } from "@/lib/progress/schema";
import { nextUnanswered, startHere } from "@/lib/progress/diagnostic";

function withAnswers(answers: Record<string, boolean>, completed = true): ProgressState {
  const s = emptyProgress(1000);
  s.diagnostic = { answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, { correct: v, at: 1000 }])), completedAt: completed ? 2000 : undefined };
  return s;
}

describe("starting-level diagnostic", () => {
  it("every question is a valid exercise with a unique id, a topic and published foundation lessons", () => {
    const slugs = new Set(lessons.map((l) => l.slug));
    const ids = diagnostic.map((q) => q.exercise.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of diagnostic) {
      expect(exerciseSchema.safeParse(q.exercise).success, q.exercise.id).toBe(true);
      expect(q.exercise.id.startsWith("diag-")).toBe(true);
      expect(q.topic.length).toBeGreaterThan(2);
      expect(q.foundations.length).toBeGreaterThan(0);
      for (const f of q.foundations) expect(slugs.has(f), `${q.exercise.id} -> ${f}`).toBe(true);
    }
    expect(diagnostic.length).toBeGreaterThanOrEqual(12);
    expect(diagnostic.length).toBeLessThanOrEqual(16);
  });

  it("a fresh profile has not taken it; a skipped one says so; a partial one is in progress", () => {
    expect(startHere(emptyProgress(0)).status).toBe("not-taken");
    const skipped = emptyProgress(0);
    skipped.diagnostic = { answers: {}, skippedAt: 5 };
    expect(startHere(skipped).status).toBe("skipped");
    const partial = withAnswers({ "diag-divider": true }, false);
    const sh = startHere(partial);
    expect(sh.status).toBe("in-progress");
    if (sh.status === "in-progress") expect(sh.answered).toBe(1);
    expect(nextUnanswered(partial)).toBe(1);
    expect(nextUnanswered(emptyProgress(0))).toBe(0);
  });

  it("all correct gives an empty start-here list; wrong answers name their foundation lessons with the topic as the reason", () => {
    const allRight = withAnswers(Object.fromEntries(diagnostic.map((q) => [q.exercise.id, true])));
    const a = startHere(allRight);
    expect(a.status).toBe("done");
    if (a.status === "done") {
      expect(a.lessons).toEqual([]);
      expect(a.correct).toBe(diagnostic.length);
    }
    const some = withAnswers({ ...Object.fromEntries(diagnostic.map((q) => [q.exercise.id, true])), "diag-hex": false, "diag-mask": false, "diag-uart-bits": false });
    const b = startHere(some);
    expect(b.status).toBe("done");
    if (b.status === "done") {
      expect(b.correct).toBe(diagnostic.length - 3);
      const bits = b.lessons.find((l) => l.slug === "embedded-c-register-bit-masks")!;
      expect(bits).toBeDefined();
      expect(bits.reasons).toEqual(["Hexadecimal", "Bit masks"]);
      expect(b.lessons.find((l) => l.slug === "uart-framing-and-baud")?.reasons).toEqual(["UART framing"]);
      expect(b.lessons).toHaveLength(2);
    }
  });

  it("a foundation lesson already completed drops off the list", () => {
    const s = withAnswers({ ...Object.fromEntries(diagnostic.map((q) => [q.exercise.id, true])), "diag-uart-bits": false });
    s.lessons["uart-framing-and-baud"] = { startedAt: 1, completedAt: 2, lastStep: 0, stepsSeen: [0], exercises: {} };
    const sh = startHere(s);
    expect(sh.status).toBe("done");
    if (sh.status === "done") expect(sh.lessons).toEqual([]);
  });

  it("a Release 1.0 state without the diagnostic field still parses and reports not-taken", () => {
    const s = emptyProgress(0);
    delete (s as Partial<ProgressState>).diagnostic;
    expect(startHere(s).status).toBe("not-taken");
  });
});
