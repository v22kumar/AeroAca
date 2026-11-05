import { describe, expect, it } from "vitest";
import { gradeMulti, gradeNumeric, gradeOrder, gradeRegister, gradeSingle, toHex } from "@/lib/learning/grading";
import { lessons } from "@/content";
import type { MultiChoiceExercise, NumericExercise, OrderExercise, RegisterExercise, SingleChoiceExercise } from "@/lib/content/schema";

function find<T extends { kind: string }>(id: string): T {
  for (const l of lessons) for (const s of l.steps) if (s.type === "exercise" && s.exercise.id === id) return s.exercise as unknown as T;
  throw new Error("missing " + id);
}

describe("grading", () => {
  it("single choice returns option-specific feedback", () => {
    const ex = find<SingleChoiceExercise>("crystal-no-target");
    expect(gradeSingle(ex, "b").correct).toBe(true);
    const wrong = gradeSingle(ex, "a");
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toContain("HSI");
    expect(gradeSingle(ex, "zzz").correct).toBe(false);
  });

  it("multi choice requires the exact set and annotates each option", () => {
    const ex = find<MultiChoiceExercise>("idle-low-causes");
    expect(gradeMulti(ex, ["a", "b", "d"]).correct).toBe(true);
    const partial = gradeMulti(ex, ["a", "b"]);
    expect(partial.correct).toBe(false);
    expect(partial.feedback).toMatch(/1 correct option missing/);
    expect(partial.notes?.d).toBeDefined();
    const extra = gradeMulti(ex, ["a", "b", "d", "e"]);
    expect(extra.correct).toBe(false);
    expect(extra.notes?.e).toContain("idle");
    expect(gradeMulti(ex, []).correct).toBe(false);
  });

  it("ordering explains misplaced items", () => {
    const ex = find<OrderExercise>("boot-check-order");
    expect(gradeOrder(ex, ["vdd", "nrst", "boot0", "swd", "rebuild"]).correct).toBe(true);
    const r = gradeOrder(ex, ["rebuild", "vdd", "nrst", "boot0", "swd"]);
    expect(r.correct).toBe(false);
    expect(r.notes?.rebuild).toMatch(/step 5/);
    expect(gradeOrder(ex, ["vdd"]).correct).toBe(false);
  });

  it("numeric accepts tolerance and names misconceptions", () => {
    const ex = find<NumericExercise>("pullup-current");
    expect(gradeNumeric(ex, 3.0).correct).toBe(true);
    expect(gradeNumeric(ex, 2.95).correct).toBe(true);
    const half = gradeNumeric(ex, 1.5);
    expect(half.correct).toBe(false);
    expect(half.feedback).toMatch(/one/);
    expect(gradeNumeric(ex, 42).feedback).toMatch(/Worked solution/);
    expect(gradeNumeric(ex, Number.NaN).correct).toBe(false);
  });

  it("register exercise flags protected bits and remaining bits", () => {
    const ex = find<RegisterExercise>("moder-pa5-output");
    expect(gradeRegister(ex, 0x04a3).correct).toBe(true);
    const touchedUart = gradeRegister(ex, 0x0483);
    expect(touchedUart.correct).toBe(false);
    expect(touchedUart.feedback).toMatch(/bit 5/i);
    const wrongField = gradeRegister(ex, 0x08a3);
    expect(wrongField.correct).toBe(false);
    expect(wrongField.feedback).toMatch(/Bits? 11, 10|Bit 11/);
    expect(toHex(0x04a3, 16)).toBe("0x04A3");
    expect(toHex(0xffffffff, 32)).toBe("0xFFFFFFFF");
  });
});
