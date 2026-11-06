import { curriculum, interviewQuestions, lessons, missions } from "@/lib/content";
import { getLesson } from "@/lib/content";
import type { ProgressState } from "./schema";
import { lessonStatus, missionStatus, skillLabel } from "./selectors";
import { targetedReview } from "./targeted";

export type Recommendation = {
  id: string;
  kind: "retry" | "lesson" | "mission" | "interview";
  title: string;
  href: string;
  /** The evidence this recommendation rests on, in plain words. Never a percentage. */
  reason: string;
  /** Coarse priority for ordering: 3 retries from real mistakes, 2 lessons behind shaky ratings or weak skills, 1 coverage gaps. */
  priority: 3 | 2 | 1;
};

/**
 * Recommendations derived only from recorded evidence (ADR-13):
 * - exercises answered wrongly or left unsolved → retry that step;
 * - weak skills → not-yet-started lessons that exercise the same skill or sit in the same module;
 * - "not yet" / "shaky" interview ratings → the lesson the question is grounded in;
 * - modules with published content and no activity → their first lesson (lowest priority).
 * No mastery estimate is computed; every item carries the facts that produced it.
 */
export function recommendations(state: ProgressState, limit = 6): Recommendation[] {
  const out: Recommendation[] = [];
  const seen = new Set<string>();
  const push = (r: Recommendation) => {
    if (seen.has(r.href)) return;
    seen.add(r.href);
    out.push(r);
  };

  const groups = targetedReview(state);
  for (const g of groups.slice(0, 3)) {
    const t = g.targets[0];
    if (!t) continue;
    push({
      id: `retry:${t.lessonSlug}:${t.exerciseId}`,
      kind: "retry",
      title: `Retry: ${t.objective}`,
      href: `/lessons/${t.lessonSlug}?step=${t.stepIndex + 1}`,
      reason: t.wrong > 0 ? `${t.wrong} wrong attempt${t.wrong > 1 ? "s" : ""} on this exercise in ${t.lessonTitle}` : `Reached but not solved in ${t.lessonTitle}`,
      priority: 3,
    });
  }

  // Weak skills → lessons not yet started that exercise the same skill, then same module.
  for (const g of groups.slice(0, 3)) {
    const sourceLesson = g.targets[0] ? getLesson(g.targets[0].lessonSlug) : undefined;
    const candidates = lessons.filter((l) => lessonStatus(state, l) === "not-started" && l.steps.some((s) => s.type === "exercise" && s.exercise.skill === g.skill));
    const sameModule = sourceLesson ? lessons.filter((l) => l.moduleId === sourceLesson.moduleId && l.slug !== sourceLesson.slug && lessonStatus(state, l) === "not-started") : [];
    const pick = candidates[0] ?? sameModule[0];
    if (pick) {
      push({
        id: `lesson:${pick.slug}`,
        kind: "lesson",
        title: pick.title,
        href: `/lessons/${pick.slug}`,
        reason: `${g.wrong} wrong attempt${g.wrong > 1 ? "s" : ""} in ${g.label}; this lesson ${candidates[0] ? "exercises the same skill" : "is the next in the same module"}`,
        priority: 2,
      });
    }
  }

  // Shaky or not-yet interview ratings → the grounding lesson, when not completed.
  const weakQs = interviewQuestions.filter((q) => {
    const r = state.interview[q.id]?.confidence;
    return (r === "not-yet" || r === "shaky") && q.relatedLesson;
  });
  for (const q of weakQs) {
    const l = q.relatedLesson ? getLesson(q.relatedLesson) : undefined;
    if (!l) continue;
    const st = lessonStatus(state, l);
    if (st === "completed") {
      push({ id: `interview:${q.id}`, kind: "interview", title: `Rehearse again: ${q.topic}`, href: `/interview?q=${q.id}`, reason: `You rated this question "${state.interview[q.id]!.confidence}" and the lesson is already complete`, priority: 2 });
    } else {
      push({ id: `lesson:${l.slug}`, kind: "lesson", title: l.title, href: `/lessons/${l.slug}`, reason: `You rated "${q.question.slice(0, 60)}…" as ${state.interview[q.id]!.confidence}; this lesson grounds it`, priority: 2 });
    }
  }

  // Missions in modules where every lesson is complete but the mission is untouched.
  for (const m of missions) {
    if (missionStatus(state, m) !== "not-started") continue;
    const mod = curriculum.find((c) => c.id === m.moduleId);
    const modLessons = (mod?.lessons ?? []).flatMap((l) => (l.status === "published" && l.slug ? [getLesson(l.slug)] : [])).filter(Boolean);
    if (modLessons.length > 0 && modLessons.every((l) => l && lessonStatus(state, l) === "completed")) {
      push({ id: `mission:${m.slug}`, kind: "mission", title: m.title, href: `/missions/${m.slug}`, reason: `Every lesson in its module is complete; the mission is the evidence-backed test of it`, priority: 2 });
    }
  }

  // Coverage gaps: modules with published lessons and no activity at all.
  for (const mod of curriculum) {
    const slugs = mod.lessons.flatMap((l) => (l.status === "published" && l.slug ? [l.slug] : []));
    if (slugs.length === 0) continue;
    const touched = slugs.some((s) => state.lessons[s]);
    if (touched) continue;
    const first = getLesson(slugs[0]!);
    if (!first) continue;
    push({ id: `lesson:${first.slug}`, kind: "lesson", title: first.title, href: `/lessons/${first.slug}`, reason: `Module ${mod.number}, ${mod.title}: no lesson started yet`, priority: 1 });
  }

  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

export { skillLabel };
