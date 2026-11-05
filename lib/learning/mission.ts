import type { Mission, MissionAction } from "@/lib/content/schema";

/**
 * Mission engine: a small, pure state machine for branching fault isolation.
 * The UI dispatches events; everything here is deterministic and testable.
 */

export type MissionPhase = "investigate" | "diagnose" | "fix" | "debrief";

export type MissionState = {
  phase: MissionPhase;
  performed: string[];
  minutesUsed: number;
  diagnosisId?: string;
  fixId?: string;
};

export const initialMissionState: MissionState = { phase: "investigate", performed: [], minutesUsed: 0 };

export type MissionEvent =
  | { type: "perform"; actionId: string }
  | { type: "go-diagnose" }
  | { type: "back-to-investigate" }
  | { type: "diagnose"; diagnosisId: string }
  | { type: "fix"; fixId: string }
  | { type: "reset" };

export function availableActions(mission: Mission, state: MissionState): MissionAction[] {
  const done = new Set(state.performed);
  return mission.actions.filter((a) => {
    if (done.has(a.id)) return false;
    if (!a.requiresAnyOf || a.requiresAnyOf.length === 0) return true;
    return a.requiresAnyOf.some((r) => done.has(r));
  });
}

export function collectedEvidence(mission: Mission, state: MissionState): Set<string> {
  const ev = new Set<string>();
  for (const id of state.performed) {
    const a = mission.actions.find((x) => x.id === id);
    if (a?.evidence) ev.add(a.evidence);
  }
  return ev;
}

export function missionReducer(mission: Mission, state: MissionState, event: MissionEvent): MissionState {
  switch (event.type) {
    case "perform": {
      if (state.phase !== "investigate") return state;
      const action = availableActions(mission, state).find((a) => a.id === event.actionId);
      if (!action) return state;
      return { ...state, performed: [...state.performed, action.id], minutesUsed: state.minutesUsed + action.costMinutes };
    }
    case "go-diagnose":
      return state.phase === "investigate" && state.performed.length > 0 ? { ...state, phase: "diagnose" } : state;
    case "back-to-investigate":
      return state.phase === "diagnose" ? { ...state, phase: "investigate" } : state;
    case "diagnose": {
      if (state.phase !== "diagnose") return state;
      if (!mission.diagnoses.some((d) => d.id === event.diagnosisId)) return state;
      return { ...state, diagnosisId: event.diagnosisId, phase: "fix" };
    }
    case "fix": {
      if (state.phase !== "fix") return state;
      if (!mission.fixes.some((f) => f.id === event.fixId)) return state;
      return { ...state, fixId: event.fixId, phase: "debrief" };
    }
    case "reset":
      return initialMissionState;
  }
}

export type MissionOutcome = {
  correct: boolean;
  evidenceBacked: boolean;
  missingEvidence: string[];
  fixQuality: "best" | "acceptable" | "wrong" | "none";
  minutesUsed: number;
  budgetMinutes: number;
  withinBudget: boolean;
  riskyActions: string[];
  wastefulActions: string[];
  keyActionsHit: number;
  keyActionsTotal: number;
  /** 0–100, explained in the UI. */
  score: number;
  verdict: "solved" | "solved-unjustified" | "not-solved";
};

export function evaluateMission(mission: Mission, state: MissionState): MissionOutcome {
  const diagnosis = mission.diagnoses.find((d) => d.id === state.diagnosisId);
  const fix = mission.fixes.find((f) => f.id === state.fixId);
  const evidence = collectedEvidence(mission, state);
  const correct = diagnosis?.correct === true;
  const required = diagnosis?.requiresEvidence ?? [];
  const missingEvidence = required.filter((e) => !evidence.has(e));
  const evidenceBacked = correct && missingEvidence.length === 0;
  const performed = state.performed.map((id) => mission.actions.find((a) => a.id === id)).filter((a): a is MissionAction => Boolean(a));
  const riskyActions = performed.filter((a) => a.assessment === "risky").map((a) => a.id);
  const wastefulActions = performed.filter((a) => a.assessment === "wasteful").map((a) => a.id);
  const keyTotal = mission.actions.filter((a) => a.assessment === "key").length;
  const keyHit = performed.filter((a) => a.assessment === "key").length;
  const withinBudget = state.minutesUsed <= mission.budgetMinutes;

  let score = 0;
  if (correct) score += 50;
  if (evidenceBacked) score += 20;
  if (fix?.quality === "best") score += 15;
  else if (fix?.quality === "acceptable") score += 8;
  if (withinBudget) score += 10;
  else score += Math.max(0, 10 - Math.ceil((state.minutesUsed - mission.budgetMinutes) / 10));
  score += 5;
  score -= riskyActions.length * 10;
  score -= wastefulActions.length * 3;
  score = Math.max(0, Math.min(100, score));

  const verdict: MissionOutcome["verdict"] = !correct ? "not-solved" : evidenceBacked ? "solved" : "solved-unjustified";

  return {
    correct,
    evidenceBacked,
    missingEvidence,
    fixQuality: fix?.quality ?? "none",
    minutesUsed: state.minutesUsed,
    budgetMinutes: mission.budgetMinutes,
    withinBudget,
    riskyActions,
    wastefulActions,
    keyActionsHit: keyHit,
    keyActionsTotal: keyTotal,
    score,
    verdict,
  };
}
