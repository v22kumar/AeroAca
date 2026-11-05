import { curriculum, interviewQuestions, lessons, missions } from "@/content";
import type { CurriculumModule, InterviewQuestion, Lesson, Mission, ReviewCard } from "./schema";

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((l) => l.slug === slug);
}

export function getMission(slug: string): Mission | undefined {
  return missions.find((m) => m.slug === slug);
}

export function getModule(id: string): CurriculumModule | undefined {
  return curriculum.find((m) => m.id === id);
}

export function getInterviewQuestion(id: string): InterviewQuestion | undefined {
  return interviewQuestions.find((q) => q.id === id);
}

export function lessonExerciseIds(lesson: Lesson): string[] {
  return lesson.steps.flatMap((s) => (s.type === "exercise" ? [s.exercise.id] : []));
}

export function lessonCards(lesson: Lesson): ReviewCard[] {
  return lesson.steps.flatMap((s) => (s.type === "recap" ? s.cards : []));
}

export function allReviewCards(): { card: ReviewCard; lessonSlug: string; lessonTitle: string }[] {
  return lessons.flatMap((l) => lessonCards(l).map((card) => ({ card, lessonSlug: l.slug, lessonTitle: l.title })));
}

/**
 * The learning path: published lessons and missions in curriculum order.
 * Missions follow their module's lessons.
 */
export type PathItem =
  | { kind: "lesson"; slug: string; title: string; moduleId: string; minutes: number }
  | { kind: "mission"; slug: string; title: string; moduleId: string; minutes: number };

export function learningPath(): PathItem[] {
  const items: PathItem[] = [];
  for (const mod of curriculum) {
    for (const l of mod.lessons) {
      if (l.status === "published" && l.slug) {
        const lesson = getLesson(l.slug);
        if (lesson) items.push({ kind: "lesson", slug: lesson.slug, title: lesson.title, moduleId: mod.id, minutes: lesson.durationMinutes });
      }
    }
    for (const m of mod.missions ?? []) {
      if (m.status === "published" && m.slug) {
        const mission = getMission(m.slug);
        if (mission) items.push({ kind: "mission", slug: mission.slug, title: mission.title, moduleId: mod.id, minutes: mission.durationMinutes });
      }
    }
  }
  return items;
}

export { curriculum, interviewQuestions, lessons, missions };
