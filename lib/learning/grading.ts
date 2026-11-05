import type { Exercise, MultiChoiceExercise, NumericExercise, OrderExercise, RegisterExercise, SingleChoiceExercise } from "@/lib/content/schema";

/**
 * Pure grading functions. Every result carries learner-facing feedback that
 * explains *why*, so the UI never has to invent an explanation.
 */

export type GradeResult = {
  correct: boolean;
  /** Primary feedback shown in the result panel (Markdown). */
  feedback: string;
  /** Optional per-option/per-item notes (Markdown), keyed by option or item id. */
  notes?: Record<string, string>;
};

export function gradeSingle(ex: SingleChoiceExercise, optionId: string): GradeResult {
  const opt = ex.options.find((o) => o.id === optionId);
  if (!opt) return { correct: false, feedback: "Choose an option to check your answer." };
  return { correct: opt.correct, feedback: opt.feedback };
}

export function gradeMulti(ex: MultiChoiceExercise, selected: string[]): GradeResult {
  const sel = new Set(selected);
  const notes: Record<string, string> = {};
  let allRight = true;
  for (const o of ex.options) {
    const chosen = sel.has(o.id);
    if (chosen !== o.correct) allRight = false;
    if (chosen || o.correct) notes[o.id] = o.feedback;
  }
  if (selected.length === 0) return { correct: false, feedback: "Select every option that applies, then check." };
  const missed = ex.options.filter((o) => o.correct && !sel.has(o.id)).length;
  const extra = ex.options.filter((o) => !o.correct && sel.has(o.id)).length;
  const summary = allRight
    ? ex.solvedFeedback
    : `Not yet. ${missed ? `${missed} correct option${missed > 1 ? "s" : ""} missing` : ""}${missed && extra ? ", " : ""}${extra ? `${extra} selected option${extra > 1 ? "s" : ""} should not be` : ""}. Read the notes beside each option and try again.`;
  return { correct: allRight, feedback: summary, notes };
}

export function gradeOrder(ex: OrderExercise, order: string[]): GradeResult {
  if (order.length !== ex.correctOrder.length) {
    return { correct: false, feedback: "Place every item before checking." };
  }
  const notes: Record<string, string> = {};
  let wrong = 0;
  order.forEach((id, i) => {
    const item = ex.items.find((it) => it.id === id);
    if (!item) return;
    const correctIndex = ex.correctOrder.indexOf(id);
    if (correctIndex !== i) {
      wrong++;
      notes[id] = `Belongs at step ${correctIndex + 1}. ${item.why}`;
    }
  });
  if (wrong === 0) return { correct: true, feedback: ex.solvedFeedback };
  return {
    correct: false,
    feedback: `${wrong} item${wrong > 1 ? "s are" : " is"} out of place. The notes explain where each belongs and why; rebuild the sequence.`,
    notes,
  };
}

export function gradeNumeric(ex: NumericExercise, value: number): GradeResult {
  if (!Number.isFinite(value)) return { correct: false, feedback: "Enter a number." };
  if (Math.abs(value - ex.answer) <= ex.tolerance) return { correct: true, feedback: ex.solvedFeedback };
  const mis = ex.misconceptions?.find((m) => Math.abs(value - m.value) <= m.tolerance);
  if (mis) return { correct: false, feedback: `${mis.feedback}\n\n**Worked solution:** ${ex.solution}` };
  return { correct: false, feedback: `Not quite. **Worked solution:** ${ex.solution}` };
}

export function registerMask(width: 8 | 16 | 32): number {
  return width === 32 ? 0xffffffff : (1 << width) - 1;
}

export function gradeRegister(ex: RegisterExercise, value: number): GradeResult {
  const v = value >>> 0;
  const target = ex.target >>> 0;
  if (v === target) return { correct: true, feedback: ex.solvedFeedback };
  const diff = (v ^ target) >>> 0;
  const changedProtected = (ex.protectedBits ?? []).filter((b) => (((v ^ ex.initial) >>> b) & 1) === 1);
  const wrongBits: number[] = [];
  for (let b = 0; b < ex.width; b++) if ((diff >>> b) & 1) wrongBits.push(b);
  const parts: string[] = [];
  if (changedProtected.length) {
    parts.push(`You changed bit${changedProtected.length > 1 ? "s" : ""} ${changedProtected.sort((a, b) => b - a).join(", ")}, which belong to other pins and must stay as they were.`);
  }
  const stillWrong = wrongBits.filter((b) => !changedProtected.includes(b));
  if (stillWrong.length) {
    parts.push(`Bit${stillWrong.length > 1 ? "s" : ""} ${stillWrong.sort((a, b) => b - a).join(", ")} ${stillWrong.length > 1 ? "are" : "is"} not at the required value yet.`);
  }
  return { correct: false, feedback: `${parts.join(" ")}\n\n**Hint:** ${ex.solution}` };
}

export type ExerciseAnswer =
  | { kind: "single"; optionId: string }
  | { kind: "multi"; selected: string[] }
  | { kind: "order"; order: string[] }
  | { kind: "numeric"; value: number }
  | { kind: "register"; value: number };

export function gradeExercise(ex: Exercise, answer: ExerciseAnswer): GradeResult {
  switch (ex.kind) {
    case "single":
      return answer.kind === "single" ? gradeSingle(ex, answer.optionId) : mismatch();
    case "multi":
      return answer.kind === "multi" ? gradeMulti(ex, answer.selected) : mismatch();
    case "order":
      return answer.kind === "order" ? gradeOrder(ex, answer.order) : mismatch();
    case "numeric":
      return answer.kind === "numeric" ? gradeNumeric(ex, answer.value) : mismatch();
    case "register":
      return answer.kind === "register" ? gradeRegister(ex, answer.value) : mismatch();
  }
}

function mismatch(): GradeResult {
  return { correct: false, feedback: "Answer type does not match the exercise." };
}

export function toHex(value: number, width: 8 | 16 | 32): string {
  return "0x" + (value >>> 0).toString(16).toUpperCase().padStart(width / 4, "0");
}
