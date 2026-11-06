import { describe, expect, it } from "vitest";
import { projects, lessons, missions } from "@/content";
import { projectSchema } from "@/lib/content/schema";
import { ProgressStore } from "@/lib/progress/store";
import { projectState, projectKey, evidenceTable, pathsFor } from "@/lib/progress/portfolio";

const now = () => 1_800_000_000_000;

describe("portfolio track content", () => {
  it("validates and references real lessons and missions", () => {
    expect(projects.length).toBeGreaterThan(0);
    const slugs = new Set([...lessons.map((l) => l.slug), ...missions.map((m) => m.slug)]);
    for (const p of projects) {
      const r = projectSchema.safeParse(p);
      expect(r.success, JSON.stringify(r.success ? null : r.error.issues)).toBe(true);
      for (const st of p.stages) for (const s of st.relatedLessons) expect(slugs.has(s), `${p.slug}/${st.id}: ${s}`).toBe(true);
      // Every stage says what to keep as evidence and marks each deliverable's path.
      for (const st of p.stages) for (const d of st.deliverables) expect(d.evidence.length).toBeGreaterThan(10);
      // Both a simulation-only and a hardware-only deliverable exist, so the two paths can never be conflated.
      const paths = p.stages.flatMap((s) => s.deliverables.map((d) => d.path));
      expect(paths).toContain("sim");
      expect(paths).toContain("hw");
      expect(paths).toContain("both");
    }
  });
});

describe("portfolio progress", () => {
  it("records simulation and hardware paths separately and derives the evidence table only from ticks", () => {
    const s = new ProgressStore(null, now);
    const p = projects[0]!;
    let ps = projectState(s.getState(), p);
    expect(ps.completeCount).toBe(0);
    expect(ps.sim.done).toBe(0);
    expect(ps.hw.done).toBe(0);
    expect(ps.currentStage).toBe(p.stages[0]!.id);
    expect(evidenceTable(ps).every((r) => r.sim !== "done" && r.hw !== "done" && r.doc !== "done")).toBe(true);

    // A "both" deliverable: ticking the simulation path alone does not complete it or count as hardware.
    const stage = p.stages.find((st) => st.deliverables.some((d) => d.path === "both"))!;
    const both = stage.deliverables.find((d) => d.path === "both")!;
    expect(pathsFor("both")).toEqual(["sim", "hw"]);
    s.setApplyDone(projectKey(p.slug, stage.id, both.id, "sim"), true);
    ps = projectState(s.getState(), p);
    const ds = ps.stages.find((st) => st.id === stage.id)!.deliverables.find((d) => d.deliverable.id === both.id)!;
    expect(ds.done.sim).toBe(true);
    expect(ds.done.hw).toBe(false);
    expect(ds.started).toBe(true);
    expect(ds.complete).toBe(false);
    expect(ps.sim.done).toBe(1);
    expect(ps.hw.done).toBe(0);
    const row = evidenceTable(ps).find((r) => r.deliverable === both.title)!;
    expect(row).toMatchObject({ sim: "done", hw: "not done", doc: "n/a" });

    // Hardware ticked too: complete; untick and it reverts. Nothing is inferred.
    s.setApplyDone(projectKey(p.slug, stage.id, both.id, "hw"), true);
    expect(projectState(s.getState(), p).stages.find((st) => st.id === stage.id)!.deliverables.find((d) => d.deliverable.id === both.id)!.complete).toBe(true);
    s.setApplyDone(projectKey(p.slug, stage.id, both.id, "hw"), false);
    expect(projectState(s.getState(), p).hw.done).toBe(0);
  });

  it("completes the whole project only when every path of every deliverable is ticked, and survives export/import", () => {
    const s = new ProgressStore(null, now);
    const p = projects[0]!;
    for (const st of p.stages) for (const d of st.deliverables) for (const path of pathsFor(d.path)) s.setApplyDone(projectKey(p.slug, st.id, d.id, path), true);
    let ps = projectState(s.getState(), p);
    expect(ps.completeCount).toBe(ps.total);
    expect(ps.currentStage).toBeNull();
    const json = s.exportJson();
    const s2 = new ProgressStore(null, now);
    expect(s2.importJson(json)).toBe(true);
    ps = projectState(s2.getState(), p);
    expect(ps.completeCount).toBe(ps.total);
  });
});
