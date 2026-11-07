import { journey, journeyStages, getLesson, getMission, getInterviewQuestion } from "@/lib/content";
import type { JourneyItem, JourneySession, JourneyStage } from "@/lib/content/schema";
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

export type SessionState = {
  session: JourneySession;
  items: ItemState[];
  minutes: number;
  doneCount: number;
  availableCount: number;
  plannedCount: number;
  /** Every available item done. The learner moves on from an exhausted session. */
  exhausted: boolean;
  /** Exhausted and nothing planned: the session genuinely counts as complete. */
  complete: boolean;
};

export type StageState = {
  stage: JourneyStage;
  sessions: SessionState[];
  /** 1-based session numbers covered by the stage, for display ("sessions 6 to 10"). */
  first: number;
  last: number;
  completedSessions: number;
  complete: boolean;
  /** The learner's current session is in this stage. */
  current: boolean;
};

/*
 * Progress keys keep the historical "d<n>:" prefix (the journey was first written in days) so that no
 * stored progress has to migrate; the number is the session number, which is what the day number was.
 */
export function applyKey(session: number, id: string) {
  return `d${session}:${id}`;
}
export function reviewKey(session: number) {
  return `d${session}:review`;
}
export function interviewKey(session: number) {
  return `d${session}:interview`;
}

/** Facts shared by every item of a journey evaluation; computed once per call. */
type Facts = { due: number; enrolled: number };

export function itemState(state: ProgressState, session: JourneySession, item: JourneyItem, index: number, facts: Facts): ItemState {
  const key = `${session.session}-${index}`;
  const n = session.session;
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
      // Done only when rehearsed in this session's context (recorded by the Interview page or a lesson's
      // interview step), so a question repeated in a later session must be rehearsed again.
      const qs = item.questionIds.map((id) => getInterviewQuestion(id)).filter(Boolean);
      const done = Boolean(state.journeyDone?.[interviewKey(n)]);
      const count = item.questionIds.length;
      return {
        item,
        key,
        kindLabel: "Interview",
        title: count === 1 ? `Rehearse: ${qs[0]?.topic ?? "question"}` : `Rehearse ${count} interview questions`,
        detail: qs.map((q) => q?.topic).filter(Boolean).join(" · "),
        href: `/interview?q=${item.questionIds.join(",")}&session=${n}${item.mock ? "&mock=1" : ""}`,
        minutes: 5 * count,
        available: true,
        done,
        status: done ? "done" : "todo",
      };
    }
    case "review": {
      // Done when a review session was completed in this journey session (recorded by the Review page),
      // not whenever the live queue happens to be empty, so finished sessions stay finished.
      const done = Boolean(state.journeyDone?.[reviewKey(n)]);
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
        href: `/review?session=${n}`,
        minutes: Math.max(3, Math.min(10, due)),
        available: true,
        done,
        status: done ? "done" : "todo",
      };
    }
    case "apply": {
      const done = Boolean(state.applyDone?.[applyKey(n, item.id)]);
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

export function sessionState(state: ProgressState, session: JourneySession, facts: Facts): SessionState {
  const items = session.items.map((it, i) => itemState(state, session, it, i, facts));
  const available = items.filter((i) => i.available);
  const doneCount = available.filter((i) => i.done).length;
  const exhausted = available.length > 0 && doneCount === available.length;
  const plannedCount = items.length - available.length;
  return {
    session,
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
  sessions: SessionState[];
  stages: StageState[];
  /** 1-based number of the session the learner is on: the first with something left to do. */
  currentSession: number;
  /** 1-based number of the stage that holds the current session. */
  currentStage: number;
  completedSessions: number;
  completedStages: number;
  finished: boolean;
  /** Number of the last session before any that still references planned content; equals the total if none. */
  lastFullyPublishedSession: number;
};

export function journeyState(state: ProgressState, now = Date.now()): JourneyState {
  const facts: Facts = { due: dueCards(state, now).length, enrolled: enrolledCards(state).length };
  const sessions = journey.map((s) => sessionState(state, s, facts));
  const firstOpen = sessions.findIndex((s) => !s.exhausted);
  const finished = firstOpen === -1;
  const currentSession = finished ? journey.length : firstOpen + 1;
  const firstPlanned = sessions.findIndex((s) => s.plannedCount > 0);
  const stages: StageState[] = journeyStages.map((stage) => {
    const own = sessions.filter((s) => s.session.stage === stage.stage);
    const completed = own.filter((s) => s.complete).length;
    return {
      stage,
      sessions: own,
      first: own[0]?.session.session ?? 0,
      last: own.at(-1)?.session.session ?? 0,
      completedSessions: completed,
      complete: own.length > 0 && completed === own.length,
      current: own.some((s) => s.session.session === currentSession),
    };
  });
  return {
    sessions,
    stages,
    currentSession,
    currentStage: stages.find((s) => s.current)?.stage.stage ?? stages.length,
    completedSessions: sessions.filter((s) => s.complete).length,
    completedStages: stages.filter((s) => s.complete).length,
    finished,
    lastFullyPublishedSession: firstPlanned === -1 ? sessions.length : firstPlanned,
  };
}

/** The single next step for Today: the first available, not-done item of the current session. */
export function nextItem(js: JourneyState): { session: SessionState; item: ItemState } | null {
  const session = js.sessions[js.currentSession - 1];
  if (!session) return null;
  const item = session.items.find((i) => i.available && !i.done);
  return item ? { session, item } : null;
}

/** The interview item of a given session, if it contains this question (used by lesson interview steps). */
export function interviewItemFor(js: JourneyState, session: number, questionId: string): ItemState | undefined {
  const s = js.sessions[session - 1];
  return s?.items.find((i) => i.item.kind === "interview" && i.item.questionIds.includes(questionId));
}
