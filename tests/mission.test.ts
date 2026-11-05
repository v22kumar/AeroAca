import { describe, expect, it } from "vitest";
import { missions } from "@/content";
import { availableActions, evaluateMission, initialMissionState, missionReducer, type MissionState } from "@/lib/learning/mission";

const board = missions.find((m) => m.slug === "fresh-board-no-sign-of-life")!;

function run(ids: string[], diagnosisId: string, fixId: string): MissionState {
  let s = initialMissionState;
  for (const id of ids) s = missionReducer(board, s, { type: "perform", actionId: id });
  s = missionReducer(board, s, { type: "go-diagnose" });
  s = missionReducer(board, s, { type: "diagnose", diagnosisId });
  s = missionReducer(board, s, { type: "fix", fixId });
  return s;
}

describe("mission engine", () => {
  it("gates actions on prerequisites so the investigation branches", () => {
    const before = availableActions(board, initialMissionState).map((a) => a.id);
    expect(before).not.toContain("nrst-scope");
    expect(before).not.toContain("isolate-reset");
    const s = missionReducer(board, initialMissionState, { type: "perform", actionId: "nrst" });
    const after = availableActions(board, s).map((a) => a.id);
    expect(after).toContain("nrst-scope");
    expect(after).toContain("isolate-reset");
    expect(after).toContain("compare-marking");
    expect(after).not.toContain("nrst");
  });

  it("ignores unavailable or repeated actions", () => {
    const s = missionReducer(board, initialMissionState, { type: "perform", actionId: "isolate-reset" });
    expect(s).toBe(initialMissionState);
    const s1 = missionReducer(board, initialMissionState, { type: "perform", actionId: "vin" });
    const s2 = missionReducer(board, s1, { type: "perform", actionId: "vin" });
    expect(s2.performed).toEqual(["vin"]);
    expect(s2.minutesUsed).toBe(2);
  });

  it("cannot diagnose before investigating", () => {
    const s = missionReducer(board, initialMissionState, { type: "go-diagnose" });
    expect(s.phase).toBe("investigate");
  });

  it("scores the optimal path as solved with evidence, within budget", () => {
    const s = run(board.optimalPath, "wrong-supervisor", "fit-correct");
    const o = evaluateMission(board, s);
    expect(o.verdict).toBe("solved");
    expect(o.withinBudget).toBe(true);
    expect(o.score).toBe(100);
  });

  it("a correct guess without evidence is marked unjustified", () => {
    const s = run(["vin", "rail"], "wrong-supervisor", "fit-correct");
    const o = evaluateMission(board, s);
    expect(o.verdict).toBe("solved-unjustified");
    expect(o.missingEvidence).toEqual(["nrst-low", "wrong-variant"]);
    expect(o.score).toBeLessThan(100);
  });

  it("risky rework and wrong diagnosis are penalised, and outcome text differs", () => {
    const s = run(["hse", "swap-mcu"], "crystal", "pullup-override");
    const o = evaluateMission(board, s);
    expect(o.verdict).toBe("not-solved");
    expect(o.riskyActions).toEqual(["swap-mcu"]);
    expect(o.withinBudget).toBe(false);
    expect(o.score).toBeLessThan(20);
  });

  it("reset returns to the initial state", () => {
    const s = run(["vin"], "mcu-dead", "fit-correct");
    expect(missionReducer(board, s, { type: "reset" })).toEqual(initialMissionState);
  });
});
