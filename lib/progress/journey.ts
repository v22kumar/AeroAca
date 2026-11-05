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

export function itemState(state: ProgressState, day: JourneyDay, item: JourneyItem, index: number, now: number): ItemState {
  switch (item.kind) {
    case "lesson": {
      const lesson = getLesson(item.slug);
      const st = lesson ? lessonStatus(state, lesson) : "not-started";
      return {
        item,
        key: `${day.day}-${index}`,
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
        key: `${day.day}-${index}`,
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
      const qs = item.questionIds.map((id) => getInterviewQuestion(id)).filter(Boolean);
      const rated = item.questionIds.filter((id) => state.interview[id]).length;
      const done = rated === item.questionIds.length;
      const n = item.questionIds.length;
      return {
        item,
        key: `${day.day}-${index}`,
        kindLabel: "Interview",
        title: n === 1 ? `Rehearse: ${qs[0]?.topic ?? "question"}` : `Rehearse ${n} interview questions`,
        detail: qs.map((q) => q?.topic).filter(Boolean).join(" · "),
        href: `/interview?q=${item.questionIds.join(",")}`,
        minutes: 5 * n,
        available: true,
        done,
        status: done ? "done" : rated > 0 ? "in-progress" : "todo",
      };
    }
    case "review": {
      const due = dueCards(state, now).length;
      const enrolled = enrolledCards(state).length;
      // Nothing enrolled means no review has happened yet; that is not "done".
      const done = enrolled > 0 && due === 0;
      return {
        item,
        key: `${day.day}-${index}`,
        kindLabel: "Review",
        title: enrolled === 0 ? "Spaced review: complete a lesson first" : due === 0 ? "Spaced review: nothing due" : `Spaced review: ${due} card${due > 1 ? "s" : ""} due`,
        href: "/review",
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
        key: `${day.day}-${index}`,
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
        key: `${day.day}-${index}`,
        kindLabel: "Coming soon",
        title: item.title,
        minutes: item.minutes,
        available: false,
        done: false,
        status: "planned",
      };
  }
}

export function dayState(state: ProgressState, day: JourneyDay, now: number): DayState {
  const items = day.items.map((it, i) => itemState(state, day, it, i, now));
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
  /** 1-based index of the day the learner is on: the first incomplete day. */
  currentDay: number;
  completedDays: number;
  finished: boolean;
};

export function journeyState(state: ProgressState, now = Date.now()): JourneyState {
  const days = journey.map((d) => dayState(state, d, now));
  const firstOpen = days.findIndex((d) => !d.exhausted);
  const finished = firstOpen === -1;
  return {
    days,
    currentDay: finished ? journey.length : firstOpen + 1,
    completedDays: days.filter((d) => d.complete).length,
    finished,
  };
}

/** The single next step for Today: the first available, not-done item of the current day. */
export function nextItem(js: JourneyState): { day: DayState; item: ItemState } | null {
  const day = js.days[js.currentDay - 1];
  if (!day) return null;
  const item = day.items.find((i) => i.available && !i.done);
  return item ? { day, item } : null;
}
