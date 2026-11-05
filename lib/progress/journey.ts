import { journey, getLesson, getMission, getInterviewQuestion } from "@/lib/content";
import type { JourneyDay, JourneyItem } from "@/lib/content/schema";
import type { ProgressState } from "./schema";
import { dueCards, enrolledCards, lessonStatus, missionStatus } from "./selectors";

export type ItemState = {
  item: JourneyItem;
  key: string;
  kindLabel: string;
  title: string;
  detail?: string;
  href?: string;
  minutes: number;
  available: boolean;
  done: boolean;
  /** Short status for the checklist. */
  status: "done" | "in-progress" | "todo" | "planned";
};

export type DayState = {
  day: JourneyDay;
  items: ItemState[];
  minutes: number;
  doneCount: number;
  availableCount: number;
  plannedCount: number;
  /** Every available item done. The learner moves on from an exhausted day. */
  exhausted: boolean;
  /** Exhausted and nothing planned: the day genuinely counts as complete. */
  complete: boolean;
};

export function applyKey(day: number, id: string) {
  return `d${day}:${id}`;
}
export function reviewKey(day: number) {
  return `d${day}:review`;
}
export function interviewKey(day: number) {
  return `d${day}:interview`;
}

/** Facts shared by every item of a journey evaluation; computed once per call. */
type Facts = { due: number; enrolled: number };

export function itemState(state: ProgressState, day: JourneyDay, item: JourneyItem, index: number, facts: Facts): ItemState {
  const key = `${day.day}-${index}`;
  switch (item.kind) {
    case "lesson": {
      const lesson = getLesson(item.slug);
      const st = lesson ? lessonStatus(state, lesson) : "not-started";
      return {
        item,
        key,
        kindLabel: "Lesson",
        title: lesson?.title ?? item.slug,
        href: `/lessons/${item.slug}`,
        minutes: lesson?.durationMinutes ?? 10,
        available: Boolean(lesson),
        done: st === "completed",
        status: st === "completed" ? "done" : st === "in-progress" ? "in-progress" : "todo",
      };
    }
    case "mission": {
      const mission = getMission(item.slug);
      const st = mission ? missionStatus(state, mission) : "not-started";
      return {
        item,
        key,
        kindLabel: "Mission",
        title: mission?.title ?? item.slug,
        href: `/missions/${item.slug}`,
        minutes: mission?.durationMinutes ?? 10,
        available: Boolean(mission),
        done: st === "completed",
        status: st === "completed" ? "done" : st === "in-progress" ? "in-progress" : "todo",
      };
    }
    case "interview": {
      // Done only when rehearsed in this day's context (recorded by the Interview page or a lesson's
      // interview step), so a question repeated on a later day must be rehearsed again.
      const qs = item.questionIds.map((id) => getInterviewQuestion(id)).filter(Boolean);
      const done = Boolean(state.journeyDone?.[interviewKey(day.day)]);
      const n = item.questionIds.length;
      return {
        item,
        key,
        kindLabel: "Interview",
        title: n === 1 ? `Rehearse: ${qs[0]?.topic ?? "question"}` : `Rehearse ${n} interview questions`,
        detail: qs.map((q) => q?.topic).filter(Boolean).join(" · "),
        href: `/interview?q=${item.questionIds.join(",")}&day=${day.day}`,
        minutes: 5 * n,
        available: true,
        done,
        status: done ? "done" : "todo",
      };
    }
    case "review": {
      // Done when a review session was completed on this day (recorded by the Review page),
      // not whenever the live queue happens to be empty, so finished days stay finished.
      const done = Boolean(state.journeyDone?.[reviewKey(day.day)]);
      const { due, enrolled } = facts;
      return {
        item,
        key,
        kindLabel: "Review",
        title: done
          ? "Spaced review done"
          : enrolled === 0
            ? "Spaced review: complete a lesson first"
            : due === 0
              ? "Spaced review: nothing due, check in"
              : `Spaced review: ${due} card${due > 1 ? "s" : ""} due`,
        href: `/review?day=${day.day}`,
        minutes: Math.max(3, Math.min(10, due)),
        available: true,
        done,
        status: done ? "done" : "todo",
      };
    }
    case "apply": {
      const done = Boolean(state.applyDone?.[applyKey(day.day, item.id)]);
      return {
        item,
        key,
        kindLabel: "Career action",
        title: item.title,
        detail: item.detail,
        minutes: item.minutes,
        available: true,
        done,
        status: done ? "done" : "todo",
      };
    }
    case "planned":
      return {
        item,
        key,
        kindLabel: "Coming soon",
        title: item.title,
        minutes: item.minutes,
        available: false,
        done: false,
        status: "planned",
      };
  }
}

export function dayState(state: ProgressState, day: JourneyDay, facts: Facts): DayState {
  const items = day.items.map((it, i) => itemState(state, day, it, i, facts));
  const available = items.filter((i) => i.available);
  const doneCount = available.filter((i) => i.done).length;
  const exhausted = available.length > 0 && doneCount === available.length;
  const plannedCount = items.length - available.length;
  return {
    day,
    items,
    minutes: available.reduce((n, i) => n + i.minutes, 0),
    doneCount,
    availableCount: available.length,
    plannedCount,
    exhausted,
    complete: exhausted && plannedCount === 0,
  };
}

export type JourneyState = {
  days: DayState[];
  /** 1-based index of the day the learner is on: the first day with something left to do. */
  currentDay: number;
  completedDays: number;
  finished: boolean;
  /** Index of the last day (1-based) before any day that still references planned content; 0 if none. */
  lastFullyPublishedDay: number;
};

export function journeyState(state: ProgressState, now = Date.now()): JourneyState {
  const facts: Facts = { due: dueCards(state, now).length, enrolled: enrolledCards(state).length };
  const days = journey.map((d) => dayState(state, d, facts));
  const firstOpen = days.findIndex((d) => !d.exhausted);
  const finished = firstOpen === -1;
  const firstPlanned = days.findIndex((d) => d.plannedCount > 0);
  return {
    days,
    currentDay: finished ? journey.length : firstOpen + 1,
    completedDays: days.filter((d) => d.complete).length,
    finished,
    lastFullyPublishedDay: firstPlanned === -1 ? days.length : firstPlanned,
  };
}

/** The single next step for Today: the first available, not-done item of the current day. */
export function nextItem(js: JourneyState): { day: DayState; item: ItemState } | null {
  const day = js.days[js.currentDay - 1];
  if (!day) return null;
  const item = day.items.find((i) => i.available && !i.done);
  return item ? { day, item } : null;
}

/** The interview item of a given day, if it contains this question (used by lesson interview steps). */
export function interviewItemFor(js: JourneyState, day: number, questionId: string): ItemState | undefined {
  const d = js.days[day - 1];
  return d?.items.find((i) => i.item.kind === "interview" && i.item.questionIds.includes(questionId));
}
