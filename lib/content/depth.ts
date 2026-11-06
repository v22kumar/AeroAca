import { DEPTHS, depthRank, type Depth, type Lesson, type LessonStep, type Stage } from "@/lib/content/schema";

/** Whether a step is shown at the chosen depth. Untagged steps are shown at every depth. */
export function stepVisibleAt(step: LessonStep, depth: Depth): boolean {
  return !step.depth || depthRank[step.depth] <= depthRank[depth];
}

/** Indices of the steps shown at a depth, in lesson order. */
export function visibleStepIndices(lesson: Lesson, depth: Depth): number[] {
  return lesson.steps.flatMap((s, i) => (stepVisibleAt(s, depth) ? [i] : []));
}

/** Exercise ids a learner must solve to complete the lesson at a depth. */
export function exerciseIdsAt(lesson: Lesson, depth: Depth): string[] {
  return lesson.steps.flatMap((s) => (s.type === "exercise" && stepVisibleAt(s, depth) ? [s.exercise.id] : []));
}

/** Whether the lesson uses depth tags at all (1.0 lessons do not; they have one depth). */
export function lessonHasDepths(lesson: Lesson): boolean {
  return lesson.steps.some((s) => s.depth !== undefined);
}

/** The smallest depth that shows a given step; "understand" for untagged steps. */
export function depthOfStep(step: LessonStep): Depth {
  return step.depth ?? "understand";
}

/** The depths deeper than `depth` that still hide steps, with the count hidden at each. */
export function hiddenAbove(lesson: Lesson, depth: Depth): { depth: Depth; steps: number; exercises: number }[] {
  return DEPTHS.filter((d) => depthRank[d] > depthRank[depth]).map((d) => {
    const steps = lesson.steps.filter((s) => s.depth === d);
    return { depth: d, steps: steps.length, exercises: steps.filter((s) => s.type === "exercise").length };
  }).filter((x) => x.steps > 0);
}

/** The deepest depth at which every visible exercise is solved, or null if none is complete. */
export function deepestCompleted(lesson: Lesson, solved: (id: string) => boolean): Depth | null {
  let result: Depth | null = null;
  for (const d of DEPTHS) {
    const ids = exerciseIdsAt(lesson, d);
    if (ids.every(solved)) result = d;
    else break;
  }
  return result;
}

export const depthLabel: Record<Depth, string> = { understand: "Understand", apply: "Apply", master: "Master" };
export const depthBlurb: Record<Depth, string> = {
  understand: "Plain-language explanations, the picture, a worked example and a guided exercise.",
  apply: "Adds the calculations, code and independent exercises you would do at work.",
  master: "Adds real complexity: failure modes, trade-offs and the interview question.",
};

export const stageLabel: Record<Stage, string> = {
  why: "Why am I learning this",
  intuition: "Build intuition",
  how: "See how it works",
  theory: "The engineering theory",
  example: "Worked example",
  practice: "Practise",
  complexity: "Real engineering complexity",
  check: "Check your understanding",
  work: "Where you will use this",
};

/** Stage of a step: the authored tag, or a sensible default from its type for 1.0 lessons. */
export function stageOf(step: LessonStep): Stage | undefined {
  if (step.stage) return step.stage;
  switch (step.type) {
    case "scenario":
      return "why";
    case "visual":
    case "walkthrough":
      return "how";
    case "example":
      return "example";
    case "lab":
      return "practice";
    case "interview":
      return "check";
    default:
      return undefined;
  }
}
