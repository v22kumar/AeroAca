import { describe, expect, it } from "vitest";
import { ProgressStore } from "@/lib/progress/store";
import { learnerName, DEFAULT_NAME } from "@/lib/progress/selectors";
import { STORAGE_KEY, progressStateSchema } from "@/lib/progress/schema";

describe("learner profile", () => {
  it("defaults the name and accepts a custom one, trimmed and bounded", () => {
    const s = new ProgressStore(null);
    expect(learnerName(s.getState())).toBe(DEFAULT_NAME);
    s.setName("  Sush  ");
    expect(learnerName(s.getState())).toBe("Sush");
    s.setName("x".repeat(60));
    expect(s.getState().profile?.name?.length).toBe(40);
    s.setName("   ");
    expect(learnerName(s.getState())).toBe(DEFAULT_NAME);
  });

  it("loads release-0.1 data saved without a profile field", () => {
    const old = { version: 1, createdAt: 1, updatedAt: 1, lessons: {}, missions: {}, interview: {}, review: {}, activeDays: [] };
    expect(progressStateSchema.safeParse(old).success).toBe(true);
    const storage = new Map<string, string>();
    const store = new ProgressStore({ getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => void storage.set(k, v), removeItem: (k) => void storage.delete(k) });
    storage.set(STORAGE_KEY, JSON.stringify(old));
    expect(store.load()).toBe(true);
    expect(learnerName(store.getState())).toBe(DEFAULT_NAME);
  });
});
