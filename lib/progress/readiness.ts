import { curriculum, interviewQuestions, getLesson, getMission } from "@/lib/content";
import type { ProgressState } from "./schema";
import { lessonStatus, missionStatus } from "./selectors";

export type ModuleReadiness = {
  moduleId: string;
  number: number;
  title: string;
  lessons: { completed: number; started: number; total: number };
  missions: { solved: number; total: number };
  interview: { confident: number; rated: number; total: number };
  /** Exercises in this module's lessons answered wrongly and still unsolved. */
  openWrong: number;
  /** Plain-words status derived from the counts; never a percentage. */
  status: "no evidence yet" | "started" | "lessons complete" | "lessons and missions complete" | "evidence complete";
  /** What is still missing, in words, so the learner knows exactly what would change the status. */
  gaps: string[];
};

/**
 * Readiness is a list of evidence per module, with the gaps spelled out (ADR-13).
 * "Evidence complete" means every published lesson completed, every mission solved with evidence,
 * every interview question in the module rated confident, and no open wrong answers.
 */
export function moduleReadiness(state: ProgressState): ModuleReadiness[] {
  return curriculum.map((mod) => {
    const ls = mod.lessons.flatMap((l) => (l.status === "published" && l.slug ? [getLesson(l.slug)] : [])).flatMap((l) => (l ? [l] : []));
    const ms = (mod.missions ?? []).flatMap((m) => (m.status === "published" && m.slug ? [getMission(m.slug)] : [])).flatMap((m) => (m ? [m] : []));
    const qs = interviewQuestions.filter((q) => q.moduleId === mod.id);
    const completed = ls.filter((l) => lessonStatus(state, l) === "completed").length;
    const started = ls.filter((l) => lessonStatus(state, l) !== "not-started").length;
    const solved = ms.filter((m) => missionStatus(state, m) === "completed").length;
    const rated = qs.filter((q) => state.interview[q.id]).length;
    const confident = qs.filter((q) => state.interview[q.id]?.confidence === "confident").length;
    let openWrong = 0;
    for (const l of ls) {
      const lp = state.lessons[l.slug];
      if (!lp) continue;
      for (const rec of Object.values(lp.exercises)) if (!rec.solvedAt && rec.attempts.some((a) => !a.correct)) openWrong += 1;
    }
    const gaps: string[] = [];
    if (completed < ls.length) gaps.push(`${ls.length - completed} lesson${ls.length - completed > 1 ? "s" : ""} not yet completed`);
    if (solved < ms.length) gaps.push(`${ms.length - solved} mission${ms.length - solved > 1 ? "s" : ""} not yet solved with evidence`);
    if (qs.length > 0 && confident < qs.length) gaps.push(`${qs.length - confident} interview question${qs.length - confident > 1 ? "s" : ""} not yet rated confident`);
    if (openWrong > 0) gaps.push(`${openWrong} exercise${openWrong > 1 ? "s" : ""} answered wrongly and still unsolved`);
    let status: ModuleReadiness["status"];
    if (started === 0 && solved === 0 && rated === 0) status = "no evidence yet";
    else if (completed < ls.length || ls.length === 0) status = "started";
    else if (solved < ms.length) status = "lessons complete";
    else if (qs.length > 0 && confident < qs.length) status = "lessons and missions complete";
    else if (openWrong > 0) status = "lessons and missions complete";
    else status = "evidence complete";
    return {
      moduleId: mod.id,
      number: mod.number,
      title: mod.title,
      lessons: { completed, started, total: ls.length },
      missions: { solved, total: ms.length },
      interview: { confident, rated, total: qs.length },
      openWrong,
      status,
      gaps,
    };
  });
}
