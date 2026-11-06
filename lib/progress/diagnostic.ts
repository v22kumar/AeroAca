import { diagnostic } from "@/content/diagnostic";
import { getLesson } from "@/lib/content";
import type { ProgressState } from "./schema";
import { lessonStatus } from "./selectors";

export type StartHereLesson = { slug: string; title: string; minutes: number; reasons: string[] };

export type StartHere =
  | { status: "not-taken"; questions: number; minutes: number }
  | { status: "skipped" }
  | { status: "in-progress"; answered: number; questions: number }
  | { status: "done"; correct: number; questions: number; lessons: StartHereLesson[]; completedAt: number };

/** About 45 seconds a question, rounded up to a whole minute. */
export function diagnosticMinutes(): number {
  return Math.ceil((diagnostic.length * 45) / 60);
}

/**
 * The "Start here" list, derived only from the diagnostic's wrong answers (ADR-13, ADR-15):
 * each wrong answer names the foundation lesson that teaches it; lessons already completed
 * are left out. No score is computed. When every answer was right, the list is empty and
 * day 1 of the fast track is the right start.
 */
export function startHere(state: ProgressState): StartHere {
  const d = state.diagnostic;
  if (!d || (Object.keys(d.answers).length === 0 && !d.skippedAt)) return { status: "not-taken", questions: diagnostic.length, minutes: diagnosticMinutes() };
  if (d.skippedAt && !d.completedAt) return { status: "skipped" };
  if (!d.completedAt) return { status: "in-progress", answered: Object.keys(d.answers).length, questions: diagnostic.length };
  const lessons = new Map<string, StartHereLesson>();
  let correct = 0;
  for (const q of diagnostic) {
    const a = d.answers[q.exercise.id];
    if (!a) continue;
    if (a.correct) {
      correct += 1;
      continue;
    }
    for (const slug of q.foundations) {
      const lesson = getLesson(slug);
      if (!lesson || lessonStatus(state, lesson) === "completed") continue;
      const entry = lessons.get(slug) ?? { slug, title: lesson.title, minutes: lesson.durationMinutes, reasons: [] };
      if (!entry.reasons.includes(q.topic)) entry.reasons.push(q.topic);
      lessons.set(slug, entry);
    }
  }
  return { status: "done", correct, questions: diagnostic.length, lessons: [...lessons.values()], completedAt: d.completedAt };
}

/** The next unanswered question index, or null when all are answered. */
export function nextUnanswered(state: ProgressState): number | null {
  const answers = state.diagnostic?.answers ?? {};
  const i = diagnostic.findIndex((q) => !answers[q.exercise.id]);
  return i === -1 ? null : i;
}
