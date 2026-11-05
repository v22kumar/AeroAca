"use client";

import Link from "next/link";
import { useState } from "react";
import { curriculum, learningPath, lessons, missions } from "@/lib/content";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { itemStatus, learnerName, nextAction, overallStats, type NextAction } from "@/lib/progress/selectors";
import { Card, SectionTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InstallHint } from "@/components/pwa/InstallHint";

function greeting(hour: number) {
  if (hour < 5) return "Late session";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function describe(action: NextAction): { eyebrow: string; title: string; detail: string; href: string; cta: string } {
  switch (action.kind) {
    case "resume":
      return {
        eyebrow: action.item.kind === "lesson" ? "Continue lesson" : "Continue mission",
        title: action.item.title,
        detail: `Pick up where you left off. About ${action.item.minutes} minutes.`,
        href: `/${action.item.kind === "lesson" ? "lessons" : "missions"}/${action.item.slug}`,
        cta: "Continue learning",
      };
    case "start":
      return {
        eyebrow: action.item.kind === "lesson" ? "Next lesson" : "Next mission",
        title: action.item.title,
        detail: `${action.item.kind === "lesson" ? "Problem-led lesson" : "Fault-isolation mission"} · about ${action.item.minutes} minutes.`,
        href: `/${action.item.kind === "lesson" ? "lessons" : "missions"}/${action.item.slug}`,
        cta: action.item.kind === "lesson" ? "Start lesson" : "Start mission",
      };
    case "review":
      return {
        eyebrow: "Spaced review",
        title: `${action.due} review card${action.due > 1 ? "s" : ""} due`,
        detail: "Short recall practice on what you have already completed. Two minutes.",
        href: "/review",
        cta: "Review now",
      };
    case "interview":
      return {
        eyebrow: "Interview practice",
        title: "Rehearse a question out loud",
        detail: "Rate your confidence honestly; it feeds the weak-area list.",
        href: "/interview",
        cta: "Practise",
      };
    case "done":
      return {
        eyebrow: "All caught up",
        title: "You have completed everything published so far",
        detail: "More lessons are planned. Revisit a mission or rehearse interview questions in the meantime.",
        href: "/curriculum",
        cta: "Browse curriculum",
      };
  }
}

export function TodayView() {
  const { state, hydrated } = useProgress();
  // Captured once per mount: "today" should not change mid-render.
  const [now] = useState(() => Date.now());
  const action = nextAction(state, now);
  const stats = overallStats(state, now);
  const path = learningPath();
  const hour = new Date(now).getHours();
  const d = describe(action);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          {greeting(hour)}
          {hydrated ? `, ${learnerName(state)}` : ""}
        </p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">One good step today.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Short, problem-led practice that builds the reasoning interviewers listen for. Ten minutes, one real engineering problem, your own answers.
        </p>
      </div>

      {hydrated ? (
        <Card className="hero-glow relative overflow-hidden p-5" data-testid="next-action">
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent-soft opacity-60" aria-hidden />
          <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-accent">{d.eyebrow}</p>
          <h2 className="relative mt-1 pr-6 text-xl font-bold leading-snug">{d.title}</h2>
          <p className="relative mt-2 text-[15px] text-ink-2">{d.detail}</p>
          <div className="relative mt-4">
            <LinkButton href={d.href} size="lg" data-testid="next-action-cta">
              {d.cta}
              <Icon name="chevron-right" size={18} />
            </LinkButton>
          </div>
        </Card>
      ) : (
        <Card className="p-5" aria-busy="true" aria-label="Loading your next step">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-3/4" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-5 h-12 w-full sm:w-40" />
        </Card>
      )}

      <section aria-labelledby="path-heading">
        <div className="mb-2 flex items-baseline justify-between">
          <SectionTitle>
            <span id="path-heading">Learning path · Release 0.1</span>
          </SectionTitle>
          {hydrated && (
            <span className="text-xs text-ink-3">
              {stats.pathCompleted}/{stats.pathTotal} done
            </span>
          )}
        </div>
        <Card>
          <ol className="divide-y divide-line">
            {path.map((item, i) => {
              const status = hydrated ? itemStatus(state, item) : "not-started";
              const mod = curriculum.find((m) => m.id === item.moduleId);
              return (
                <li key={item.slug}>
                  <Link
                    href={`/${item.kind === "lesson" ? "lessons" : "missions"}/${item.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        status === "completed" ? "bg-ok-soft text-ok" : status === "in-progress" ? "bg-amber-soft text-amber" : "bg-surface-2 text-ink-3"
                      }`}
                      aria-hidden
                    >
                      {status === "completed" ? <Icon name="check" size={16} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold">{item.title}</span>
                      <span className="block text-xs text-ink-3">
                        {item.kind === "mission" ? "Mission" : "Lesson"} · {mod?.title} · {item.minutes} min
                      </span>
                    </span>
                    <StatusPill kind={status} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
        <p className="mt-2 text-xs text-ink-3">
          {lessons.length} lessons and {missions.length} missions are published. The rest of the 16-module curriculum is listed under Learn as coming soon.
        </p>
      </section>

      {hydrated && (
        <section aria-labelledby="week-heading" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SectionTitle className="sr-only">
            <span id="week-heading">This week</span>
          </SectionTitle>
          <Stat label="Lessons done" value={`${stats.lessonsDone}/${stats.lessonsTotal}`} />
          <Stat label="Missions solved" value={`${stats.missionsDone}/${stats.missionsTotal}`} />
          <Stat label="Cards due" value={String(stats.due)} href={stats.due > 0 ? "/review" : undefined} />
          <Stat label="Days active, 7d" value={String(stats.activeThisWeek)} />
        </section>
      )}

      <section aria-labelledby="plan-heading">
        <SectionTitle className="mb-2">
          <span id="plan-heading">30-day interview fast track</span>
        </SectionTitle>
        <Card className="p-4">
          <p className="text-[15px]">
            <strong>Days 1–10</strong> cover circuit fundamentals, MCU bring-up, measurements, Embedded C and the I2C/UART/SPI/CAN interfaces. The published lessons sit in this block.
          </p>
          {hydrated && (
            <div className="mt-3">
              <ProgressBar value={stats.pathCompleted} max={stats.pathTotal} label="Fast-track block progress" />
              <p className="mt-1 text-xs text-ink-3">Progress is based on completed lessons and solved missions, nothing else.</p>
            </div>
          )}
          <p className="mt-3 text-sm text-ink-2">
            Apply for roles and practise interviews from day one, independently of lesson completion. Studying firmware does not create professional firmware experience; say so clearly in interviews.
          </p>
        </Card>
      </section>

      <Link href="/glossary" className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 hover:bg-surface-2">
        <span className="text-accent">
          <Icon name="search" size={20} />
        </span>
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold">Not sure what a word means?</span>
          <span className="block text-ink-2">Every technical term in the lessons is tappable, and the full glossary lives here.</span>
        </span>
        <Icon name="chevron-right" size={18} className="text-ink-3" />
      </Link>

      <InstallHint />

      <p className="text-xs text-ink-3">
        Progress is stored in this browser only. Clearing site data removes it. Export a backup from the Progress page.
      </p>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span className="block text-2xl font-bold tabular-nums">{value}</span>
      <span className="block text-xs text-ink-3">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="rounded-card border border-line bg-surface p-3 hover:bg-surface-2">
      {inner}
    </Link>
  ) : (
    <div className="rounded-card border border-line bg-surface p-3">{inner}</div>
  );
}
