"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { interviewQuestions, lessons, missions } from "@/lib/content";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { DEFAULT_NAME, lessonSolvedCount, lessonStatus, missionBest, missionStatus, overallStats, skillLabel, weakSkills } from "@/lib/progress/selectors";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { Icon } from "@/components/ui/Icon";

export function ProgressView() {
  const { state, store, hydrated } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stats = overallStats(state);
  const weak = weakSkills(state);
  const weakInterview = interviewQuestions.filter((q) => {
    const r = state.interview[q.id]?.confidence;
    return r === "not-yet" || r === "shaky";
  });

  if (!hydrated) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const exportBackup = () => {
    const blob = new Blob([store.exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aeroaca-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (file: File) => {
    const text = await file.text();
    const ok = store.importJson(text);
    setImportMsg(ok ? "Backup restored." : "That file is not a valid AeroAca backup.");
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Progress</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Only what you have actually done.</h1>
        <p className="mt-2 text-[15px] text-ink-2">Completions come from solved exercises and evidence-backed missions. Weak areas come from your real wrong answers and your own interview ratings.</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Summary">
        <Stat label="Lessons" value={`${stats.lessonsDone}/${stats.lessonsTotal}`} />
        <Stat label="Missions" value={`${stats.missionsDone}/${stats.missionsTotal}`} />
        <Stat label="Exercise attempts" value={String(stats.attempts)} />
        <Stat label="Days active" value={String(stats.activeDays)} />
      </section>

      <section aria-labelledby="lessons-heading">
        <SectionTitle className="mb-2">
          <span id="lessons-heading">Lessons</span>
        </SectionTitle>
        <Card>
          <ul className="divide-y divide-line">
            {lessons.map((l) => {
              const status = lessonStatus(state, l);
              const { solved, total } = lessonSolvedCount(state, l);
              const lp = state.lessons[l.slug];
              const wrong = lp ? Object.values(lp.exercises).reduce((n, e) => n + e.attempts.filter((a) => !a.correct).length, 0) : 0;
              return (
                <li key={l.slug} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/lessons/${l.slug}`} className="min-w-0 flex-1 text-[15px] font-semibold hover:underline">
                      {l.title}
                    </Link>
                    <StatusPill kind={status} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={solved} max={total} label={`${l.title}: exercises solved`} className="flex-1" />
                    <span className="text-xs tabular-nums text-ink-3">
                      {solved}/{total} solved{wrong ? ` · ${wrong} wrong` : ""}
                    </span>
                  </div>
                  {lp?.completedAt && <p className="mt-1 text-xs text-ink-3">Completed {new Date(lp.completedAt).toLocaleDateString()}</p>}
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="missions-heading">
        <SectionTitle className="mb-2">
          <span id="missions-heading">Missions</span>
        </SectionTitle>
        <Card>
          <ul className="divide-y divide-line">
            {missions.map((m) => {
              const status = missionStatus(state, m);
              const runs = state.missions[m.slug]?.runs ?? [];
              const best = missionBest(state, m);
              return (
                <li key={m.slug} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/missions/${m.slug}`} className="block text-[15px] font-semibold hover:underline">
                      {m.title}
                    </Link>
                    <p className="text-xs text-ink-3">
                      {runs.length === 0 ? "No runs yet" : `${runs.length} run${runs.length > 1 ? "s" : ""} · best ${best?.score ?? 0}/100${best?.evidenceBacked ? " with evidence" : ""}`}
                    </p>
                  </div>
                  <StatusPill kind={status} />
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="weak-heading">
        <SectionTitle className="mb-2">
          <span id="weak-heading">Weak areas</span>
        </SectionTitle>
        <Card className="p-4">
          {weak.length === 0 && weakInterview.length === 0 ? (
            <p className="text-sm text-ink-2">Nothing flagged yet. Weak areas appear here after wrong exercise answers or “not yet” / “shaky” interview ratings.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {weak.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {weak.map((s) => (
                    <li key={s.skill} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold">{skillLabel(s.skill)}</span>
                      <span className="text-xs tabular-nums text-ink-3">
                        {s.wrong} wrong of {s.attempts} attempts · {s.solved}/{s.total} solved
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {weakInterview.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Interview questions to rehearse</p>
                  <ul className="flex flex-col gap-1 text-sm">
                    {weakInterview.map((q) => (
                      <li key={q.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate">{q.topic}: {q.question.replace(/[`*]/g, "").slice(0, 70)}…</span>
                        <span className="shrink-0 text-xs text-amber">{state.interview[q.id]?.confidence === "not-yet" ? "Not yet" : "Shaky"}</span>
                      </li>
                    ))}
                  </ul>
                  <LinkButton href="/interview" variant="ghost" size="sm" className="mt-2">
                    Practise these
                  </LinkButton>
                </div>
              )}
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby="review-heading">
        <SectionTitle className="mb-2">
          <span id="review-heading">Spaced review</span>
        </SectionTitle>
        <Card className="flex items-center justify-between gap-3 p-4">
          <div className="text-sm">
            <p className="font-semibold">{stats.enrolled} cards enrolled · {stats.due} due now</p>
            <p className="text-xs text-ink-3">Cards join the queue when you complete a lesson. Intervals grow when you get them right.</p>
          </div>
          <LinkButton href="/review" variant={stats.due > 0 ? "primary" : "secondary"} size="sm">
            Review
          </LinkButton>
        </Card>
      </section>

      <section aria-labelledby="data-heading">
        <SectionTitle className="mb-2">
          <span id="data-heading">Your data</span>
        </SectionTitle>
        <Card className="flex flex-col gap-3 p-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink-2">How should AeroAca greet you?</span>
            <input
              type="text"
              defaultValue={state.profile?.name ?? ""}
              placeholder={DEFAULT_NAME}
              maxLength={40}
              onBlur={(e) => store.setName(e.target.value)}
              className="min-h-11 rounded-lg border border-line bg-surface px-3 text-[15px] text-ink placeholder:text-ink-3"
              data-testid="name-input"
            />
          </label>
          <p className="text-ink-2">
            Progress is stored only in this browser on this device. It does not sync anywhere and is never sent to a server. Clearing site data deletes it, so export a backup if it matters.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={exportBackup}>
              <Icon name="download" size={16} /> Export backup
            </Button>
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
              Import backup
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="sr-only"
              aria-label="Import backup file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importBackup(f);
                e.target.value = "";
              }}
            />
            {!confirmReset ? (
              <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
                Reset progress
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-danger">Delete all progress on this device?</span>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    store.reset();
                    setConfirmReset(false);
                  }}
                  data-testid="confirm-reset"
                >
                  Yes, delete
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
          {importMsg && (
            <p role="status" className="text-xs text-ink-2">
              {importMsg}
            </p>
          )}
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="block text-xs text-ink-3">{label}</span>
    </div>
  );
}
