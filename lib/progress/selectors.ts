import { lessons, missions, interviewQuestions, learningPath, lessonExerciseIds, allReviewCards, type PathItem } from "@/lib/content";
import type { Lesson, Mission } from "@/lib/content/schema";
import type { ProgressState } from "./schema";

export type ItemStatus = "not-started" | "in-progress" | "completed";

export function lessonStatus(state: ProgressState, lesson: Lesson): ItemStatus {
  const lp = state.lessons[lesson.slug];
  if (!lp) return "not-started";
  if (lp.completedAt) return "completed";
  return "in-progress";
}

export function lessonSolvedCount(state: ProgressState, lesson: Lesson): { solved: number; total: number } {
  const ids = lessonExerciseIds(lesson);
  const lp = state.lessons[lesson.slug];
  const solved = ids.filter((id) => lp?.exercises[id]?.solvedAt).length;
  return { solved, total: ids.length };
}

export function missionStatus(state: ProgressState, mission: Mission): ItemStatus {
  const mp = state.missions[mission.slug];
  if (!mp) return "not-started";
  if (mp.runs.some((r) => r.correct && r.evidenceBacked)) return "completed";
  return "in-progress";
}

export function missionBest(state: ProgressState, mission: Mission) {
  const runs = state.missions[mission.slug]?.runs ?? [];
  if (runs.length === 0) return undefined;
  return runs.reduce((best, r) => (r.score > best.score ? r : best), runs[0]!);
}

export function itemStatus(state: ProgressState, item: PathItem): ItemStatus {
  if (item.kind === "lesson") {
    const l = lessons.find((x) => x.slug === item.slug);
    return l ? lessonStatus(state, l) : "not-started";
  }
  const m = missions.find((x) => x.slug === item.slug);
  return m ? missionStatus(state, m) : "not-started";
}

/**
 * The single next action for Today:
 * 1. an in-progress lesson or mission (resume),
 * 2. otherwise the first not-started item on the path,
 * 3. otherwise review cards / interview practice.
 */
export type NextAction =
  | { kind: "resume"; item: PathItem; status: ItemStatus }
  | { kind: "start"; item: PathItem }
  | { kind: "review"; due: number }
  | { kind: "interview" }
  | { kind: "done" };

export function nextAction(state: ProgressState, now = Date.now()): NextAction {
  const path = learningPath();
  const inProgress = path.find((p) => itemStatus(state, p) === "in-progress");
  if (inProgress) return { kind: "resume", item: inProgress, status: "in-progress" };
  const next = path.find((p) => itemStatus(state, p) === "not-started");
  if (next) return { kind: "start", item: next };
  const due = dueCards(state, now).length;
  if (due > 0) return { kind: "review", due };
  const unrated = interviewQuestions.filter((q) => !state.interview[q.id]);
  if (unrated.length > 0) return { kind: "interview" };
  return { kind: "done" };
}

export function dueCards(state: ProgressState, now = Date.now()) {
  return allReviewCards().filter(({ card }) => {
    const e = state.review[card.id];
    return e && e.due <= now;
  });
}

export function enrolledCards(state: ProgressState) {
  return allReviewCards().filter(({ card }) => Boolean(state.review[card.id]));
}

export type SkillSummary = { skill: string; attempts: number; wrong: number; solved: number; total: number };

/** Weak areas computed from real attempts: skills with wrong attempts or unsolved exercises. */
export function skillSummaries(state: ProgressState): SkillSummary[] {
  const map = new Map<string, SkillSummary>();
  for (const lesson of lessons) {
    const lp = state.lessons[lesson.slug];
    for (const step of lesson.steps) {
      if (step.type !== "exercise") continue;
      const ex = step.exercise;
      const s = map.get(ex.skill) ?? { skill: ex.skill, attempts: 0, wrong: 0, solved: 0, total: 0 };
      s.total += 1;
      const rec = lp?.exercises[ex.id];
      if (rec) {
        s.attempts += rec.attempts.length;
        s.wrong += rec.attempts.filter((a) => !a.correct).length;
        if (rec.solvedAt) s.solved += 1;
      }
      map.set(ex.skill, s);
    }
  }
  return [...map.values()];
}

export function weakSkills(state: ProgressState): SkillSummary[] {
  return skillSummaries(state)
    .filter((s) => s.attempts > 0 && (s.wrong > 0 || s.solved < s.total))
    .sort((a, b) => b.wrong / Math.max(1, b.attempts) - a.wrong / Math.max(1, a.attempts));
}

export const skillLabels: Record<string, string> = {
  "debug-order": "Bring-up debugging order",
  clock: "Clocks and oscillators",
  reset: "Reset behaviour",
  "i2c-addressing": "I2C addressing",
  "i2c-physical": "I2C physical layer",
  "bit-ops": "Bit masks and fields",
  volatile: "volatile and memory access",
};

export function skillLabel(skill: string): string {
  return skillLabels[skill] ?? skill;
}

export function overallStats(state: ProgressState, now = Date.now()) {
  const path = learningPath();
  const completed = path.filter((p) => itemStatus(state, p) === "completed").length;
  const lessonsDone = lessons.filter((l) => lessonStatus(state, l) === "completed").length;
  const missionsDone = missions.filter((m) => missionStatus(state, m) === "completed").length;
  const attempts = Object.values(state.lessons).reduce(
    (n, lp) => n + Object.values(lp.exercises).reduce((m, e) => m + e.attempts.length, 0),
    0,
  );
  const rated = Object.keys(state.interview).length;
  const confident = Object.values(state.interview).filter((r) => r.confidence === "confident").length;
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const activeThisWeek = state.activeDays.filter((d) => new Date(d + "T12:00:00").getTime() >= weekAgo).length;
  return {
    pathTotal: path.length,
    pathCompleted: completed,
    lessonsDone,
    lessonsTotal: lessons.length,
    missionsDone,
    missionsTotal: missions.length,
    attempts,
    interviewRated: rated,
    interviewConfident: confident,
    interviewTotal: interviewQuestions.length,
    due: dueCards(state, now).length,
    enrolled: enrolledCards(state).length,
    activeThisWeek,
    activeDays: state.activeDays.length,
  };
}
