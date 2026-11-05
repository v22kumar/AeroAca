import { emptyProgress, progressStateSchema, STORAGE_KEY, type Confidence, type ProgressState } from "./schema";

/**
 * Device-local progress store.
 *
 * - Single source of truth kept in memory, mirrored to localStorage.
 * - Validated with zod on load; corrupt or foreign data is ignored, never crashes the app.
 * - Framework-agnostic: React subscribes through useSyncExternalStore.
 *
 * Limitation (by design for 0.1): progress lives in this browser profile only.
 */

type Listener = () => void;

export const REVIEW_INTERVALS_MS = [
  10 * 60 * 1000, // box 0: again soon
  1 * 24 * 3600 * 1000,
  3 * 24 * 3600 * 1000,
  7 * 24 * 3600 * 1000,
  14 * 24 * 3600 * 1000,
  30 * 24 * 3600 * 1000,
];

export function localDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export class ProgressStore {
  private state: ProgressState;
  private listeners = new Set<Listener>();
  private storage: StorageLike | null;
  private loaded = false;
  readonly now: () => number;

  constructor(storage: StorageLike | null, now: () => number = Date.now) {
    this.storage = storage;
    this.now = now;
    this.state = emptyProgress(now());
  }

  /** Load from storage once. Safe to call repeatedly. Returns whether data was restored. */
  load(): boolean {
    if (this.loaded) return true;
    this.loaded = true;
    let restored = false;
    if (this.storage) {
      try {
        const raw = this.storage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = progressStateSchema.safeParse(JSON.parse(raw));
          if (parsed.success) {
            this.state = parsed.data;
            restored = true;
          }
        }
      } catch {
        restored = false;
      }
    }
    this.emit();
    return restored;
  }

  getState(): ProgressState {
    return this.state;
  }

  /** True once load() has run in this environment. */
  isLoaded(): boolean {
    return this.loaded;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  private persist() {
    if (!this.storage) return;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* quota or private mode: keep in-memory state; UI shows the limitation */
    }
  }

  private update(mutate: (draft: ProgressState) => void) {
    const now = this.now();
    const draft: ProgressState = structuredClone(this.state);
    mutate(draft);
    draft.updatedAt = now;
    const day = localDayKey(now);
    if (!draft.activeDays.includes(day)) draft.activeDays = [...draft.activeDays, day].slice(-400);
    this.state = draft;
    this.persist();
    this.emit();
  }

  /* ---------- Lessons ---------- */

  startLesson(slug: string) {
    if (this.state.lessons[slug]) return;
    this.update((d) => {
      d.lessons[slug] = { startedAt: this.now(), lastStep: 0, stepsSeen: [0], exercises: {} };
    });
  }

  seeStep(slug: string, stepIndex: number) {
    const existing = this.state.lessons[slug];
    if (existing && existing.stepsSeen.includes(stepIndex) && existing.lastStep >= stepIndex) return;
    this.update((d) => {
      const lp = d.lessons[slug] ?? { startedAt: this.now(), lastStep: 0, stepsSeen: [], exercises: {} };
      if (!lp.stepsSeen.includes(stepIndex)) lp.stepsSeen = [...lp.stepsSeen, stepIndex].sort((a, b) => a - b);
      lp.lastStep = Math.max(lp.lastStep, stepIndex);
      d.lessons[slug] = lp;
    });
  }

  recordAttempt(slug: string, exerciseId: string, correct: boolean) {
    this.update((d) => {
      const lp = d.lessons[slug] ?? { startedAt: this.now(), lastStep: 0, stepsSeen: [], exercises: {} };
      const ex = lp.exercises[exerciseId] ?? { attempts: [] };
      ex.attempts = [...ex.attempts, { at: this.now(), correct }];
      if (correct && !ex.solvedAt) ex.solvedAt = this.now();
      lp.exercises[exerciseId] = ex;
      d.lessons[slug] = lp;
    });
  }

  /**
   * Mark a lesson complete only if every exercise is solved. Returns whether it is complete.
   * Also enrols the lesson's review cards.
   */
  completeLesson(slug: string, exerciseIds: string[], cardIds: string[]): boolean {
    const lp = this.state.lessons[slug];
    if (!lp) return false;
    const allSolved = exerciseIds.every((id) => lp.exercises[id]?.solvedAt);
    if (!allSolved) return false;
    if (lp.completedAt) return true;
    this.update((d) => {
      const l = d.lessons[slug];
      if (l) l.completedAt = this.now();
      for (const id of cardIds) {
        if (!d.review[id]) d.review[id] = { box: 0, due: this.now(), reviews: 0 };
      }
    });
    return true;
  }

  /* ---------- Missions ---------- */

  startMission(slug: string) {
    if (this.state.missions[slug]) return;
    this.update((d) => {
      d.missions[slug] = { startedAt: this.now(), runs: [] };
    });
  }

  recordMissionRun(slug: string, run: Omit<ProgressState["missions"][string]["runs"][number], "finishedAt">) {
    this.update((d) => {
      const mp = d.missions[slug] ?? { startedAt: run.startedAt, runs: [] };
      mp.runs = [...mp.runs, { ...run, finishedAt: this.now() }].slice(-20);
      d.missions[slug] = mp;
    });
  }

  /* ---------- Interview ---------- */

  rateInterview(questionId: string, confidence: Confidence) {
    this.update((d) => {
      d.interview[questionId] = { confidence, ratedAt: this.now() };
    });
  }

  /* ---------- Review cards ---------- */

  reviewCard(cardId: string, result: "again" | "good") {
    this.update((d) => {
      const entry = d.review[cardId] ?? { box: 0, due: this.now(), reviews: 0 };
      const box = result === "good" ? Math.min(entry.box + 1, REVIEW_INTERVALS_MS.length - 1) : 0;
      const interval = REVIEW_INTERVALS_MS[box] ?? REVIEW_INTERVALS_MS[0]!;
      d.review[cardId] = { box, due: this.now() + interval, reviews: entry.reviews + 1, lastResult: result };
    });
  }

  /* ---------- Profile ---------- */

  setName(name: string) {
    const trimmed = name.trim().slice(0, 40);
    this.update((d) => {
      d.profile = { ...(d.profile ?? {}), name: trimmed || undefined };
    });
  }

  /* ---------- Maintenance ---------- */

  exportJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importJson(raw: string): boolean {
    try {
      const parsed = progressStateSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) return false;
      this.state = parsed.data;
      this.persist();
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    this.state = emptyProgress(this.now());
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    this.emit();
  }
}

let browserStore: ProgressStore | null = null;

/** The singleton used by the app in the browser. */
export function getBrowserStore(): ProgressStore {
  if (!browserStore) {
    let storage: StorageLike | null = null;
    try {
      storage = typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      storage = null;
    }
    browserStore = new ProgressStore(storage);
  }
  return browserStore;
}
