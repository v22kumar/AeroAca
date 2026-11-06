import type { Project, ProjectDeliverable, DeliverablePath } from "@/lib/content/schema";
import type { ProgressState } from "./schema";

export type Path = "doc" | "sim" | "hw";

/** Key under applyDone for one deliverable on one path. Stays stable across releases. */
export function projectKey(project: string, stage: string, deliverable: string, path: Path) {
  return `project:${project}:${stage}:${deliverable}:${path}`;
}

/** The recordable paths for a deliverable: a "both" deliverable has separate simulation and hardware records. */
export function pathsFor(path: DeliverablePath): Path[] {
  return path === "both" ? ["sim", "hw"] : [path];
}

export type DeliverableState = {
  deliverable: ProjectDeliverable;
  /** Which paths are recorded done. Never inferred; only what the learner ticked. */
  done: Record<Path, boolean>;
  paths: Path[];
  /** Every recordable path ticked. */
  complete: boolean;
  /** At least one path ticked. */
  started: boolean;
};

export type StageState = {
  id: string;
  title: string;
  deliverables: DeliverableState[];
  doneCount: number;
  total: number;
  complete: boolean;
};

export type ProjectState = {
  stages: StageState[];
  /** Deliverables with every recordable path done. */
  completeCount: number;
  total: number;
  /** Counts kept separate on purpose: simulation evidence is never presented as hardware evidence. */
  sim: { done: number; total: number };
  hw: { done: number; total: number };
  doc: { done: number; total: number };
  /** First stage with an incomplete deliverable; null when the whole project is complete. */
  currentStage: string | null;
};

export function projectState(state: ProgressState, project: Project): ProjectState {
  const applied = state.applyDone ?? {};
  const counts = { sim: { done: 0, total: 0 }, hw: { done: 0, total: 0 }, doc: { done: 0, total: 0 } };
  const stages: StageState[] = project.stages.map((st) => {
    const deliverables = st.deliverables.map((d): DeliverableState => {
      const paths = pathsFor(d.path);
      const done: Record<Path, boolean> = { doc: false, sim: false, hw: false };
      for (const p of paths) {
        done[p] = Boolean(applied[projectKey(project.slug, st.id, d.id, p)]);
        counts[p].total += 1;
        if (done[p]) counts[p].done += 1;
      }
      return { deliverable: d, done, paths, complete: paths.every((p) => done[p]), started: paths.some((p) => done[p]) };
    });
    const doneCount = deliverables.filter((d) => d.complete).length;
    return { id: st.id, title: st.title, deliverables, doneCount, total: deliverables.length, complete: doneCount === deliverables.length };
  });
  const completeCount = stages.reduce((n, s) => n + s.doneCount, 0);
  const total = stages.reduce((n, s) => n + s.total, 0);
  const current = stages.find((s) => !s.complete);
  return { stages, completeCount, total, ...counts, currentStage: current ? current.id : null };
}

export type EvidenceRow = { stage: string; deliverable: string; path: DeliverablePath; sim: "done" | "not done" | "n/a"; hw: "done" | "not done" | "n/a"; doc: "done" | "not done" | "n/a" };

/** The simulated-versus-hardware table for the report, derived only from recorded ticks. */
export function evidenceTable(ps: ProjectState): EvidenceRow[] {
  const cell = (d: DeliverableState, p: Path) => (d.paths.includes(p) ? (d.done[p] ? "done" : "not done") : "n/a") as EvidenceRow["sim"];
  return ps.stages.flatMap((s) => s.deliverables.map((d) => ({ stage: s.title, deliverable: d.deliverable.title, path: d.deliverable.path, sim: cell(d, "sim"), hw: cell(d, "hw"), doc: cell(d, "doc") })));
}
