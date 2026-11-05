import { lessons } from "@/lib/content";
import type { ProgressState } from "./schema";
import { skillLabel } from "./selectors";

export type RetryTarget = {
  lessonSlug: string;
  lessonTitle: string;
  stepIndex: number;
  exerciseId: string;
  objective: string;
  skill: string;
  wrong: number;
  solved: boolean;
};

/**
 * Targeted revision built only from real attempts: exercises answered wrongly
 * (whether or not eventually solved) and exercises left unsolved in started lessons.
 * Grouped by skill, worst first. No percentages, no invented mastery.
 */
export function targetedReview(state: ProgressState): { skill: string; label: string; wrong: number; targets: RetryTarget[] }[] {
  const bySkill = new Map<string, RetryTarget[]>();
  for (const lesson of lessons) {
    const lp = state.lessons[lesson.slug];
    if (!lp) continue;
    lesson.steps.forEach((step, stepIndex) => {
      if (step.type !== "exercise") return;
      const rec = lp.exercises[step.exercise.id];
      const wrong = rec?.attempts.filter((a) => !a.correct).length ?? 0;
      const solved = Boolean(rec?.solvedAt);
      const reached = lp.stepsSeen.includes(stepIndex);
      if (wrong === 0 && (solved || !reached)) return;
      const t: RetryTarget = {
        lessonSlug: lesson.slug,
        lessonTitle: lesson.title,
        stepIndex,
        exerciseId: step.exercise.id,
        objective: step.exercise.objective,
        skill: step.exercise.skill,
        wrong,
        solved,
      };
      const list = bySkill.get(t.skill) ?? [];
      list.push(t);
      bySkill.set(t.skill, list);
    });
  }
  return [...bySkill.entries()]
    .map(([skill, targets]) => ({ skill, label: skillLabel(skill), wrong: targets.reduce((n, t) => n + t.wrong, 0), targets: targets.sort((a, b) => b.wrong - a.wrong) }))
    .sort((a, b) => b.wrong - a.wrong || a.label.localeCompare(b.label));
}
