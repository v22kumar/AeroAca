"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { journeyBlocks, lessons, missions } from "@/lib/content";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { learnerName, overallStats } from "@/lib/progress/selectors";
import { journeyState, nextItem, type ItemState } from "@/lib/progress/journey";
import { Card, SectionTitle } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { InstallHint } from "@/components/pwa/InstallHint";
import { JourneyDayChecklist } from "@/components/journey/JourneyDayCard";
import { Recommendations } from "@/components/progress/Recommendations";

function greeting(hour: number) {
  if (hour < 5) return "Late session";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function ctaFor(it: ItemState): { eyebrow: string; cta: string } {
  switch (it.item.kind) {
    case "lesson":
      return it.status === "in-progress" ? { eyebrow: "Continue lesson", cta: "Continue lesson" } : { eyebrow: "Next lesson", cta: "Start lesson" };
    case "mission":
      return it.status === "in-progress" ? { eyebrow: "Continue mission", cta: "Continue mission" } : { eyebrow: "Next mission", cta: "Start mission" };
    case "interview":
      return { eyebrow: "Interview practice", cta: "Practise" };
    case "review":
      return { eyebrow: "Spaced review", cta: "Review now" };
    default:
      return { eyebrow: "Next step", cta: "Open" };
  }
}

export function TodayView() {
  const { state, hydrated } = useProgress();
  // Captured once per mount: "today" should not change mid-render.
  const [now] = useState(() => Date.now());
  const stats = overallStats(state, now);
  const hour = new Date(now).getHours();
  const js = useMemo(() => (hydrated ? journeyState(state, now) : null), [hydrated, state, now]);
  const current = js ? js.days[js.currentDay - 1] : null;
  const next = js ? nextItem(js) : null;
  const block = current ? journeyBlocks[current.day.block] : null;

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

      {!hydrated || !js || !current ? (
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading your next step">
          <Card className="min-h-[13.5rem] p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-5 h-12 w-full sm:w-40" />
          </Card>
          <div>
            <Skeleton className="mb-2 h-4 w-48" />
            <Card className="min-h-[17rem] p-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-4 h-10 w-full" />
              <Skeleton className="mt-2 h-10 w-full" />
              <Skeleton className="mt-2 h-10 w-full" />
            </Card>
          </div>
        </div>
      ) : (
        <>
          <Card className="hero-glow relative overflow-hidden p-5" data-testid="next-action">
            <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-accent-soft opacity-60" aria-hidden />
            {next ? (
              <>
                <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  Day {current.day.day} of 30 · {ctaFor(next.item).eyebrow}
                </p>
                <h2 className="relative mt-1 pr-6 text-xl font-bold leading-snug">{next.item.title}</h2>
                <p className="relative mt-2 text-[15px] text-ink-2">
                  {next.item.kindLabel} · about {next.item.minutes} min. Today’s session: about {current.minutes} min in total.
                </p>
                <div className="relative mt-4">
                  {next.item.href ? (
                    <LinkButton href={next.item.href} size="lg" data-testid="next-action-cta">
                      {ctaFor(next.item).cta}
                      <Icon name="chevron-right" size={18} />
                    </LinkButton>
                  ) : (
                    <p className="text-sm text-ink-2" data-testid="next-action-cta">
                      Tick it off below when it is done.
                    </p>
                  )}
                </div>
              </>
            ) : js.finished ? (
              <>
                <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-accent">All 30 days complete</p>
                <h2 className="relative mt-1 text-xl font-bold leading-snug">The fast track is done. The curriculum is not.</h2>
                <p className="relative mt-2 text-[15px] text-ink-2">Lessons outside the 30 days wait under Learn, the portfolio track wants its evidence, and the recommendations below come from your own wrong answers. Keep the review queue warm.</p>
                <div className="relative mt-4">
                  <LinkButton href="/review" size="lg" data-testid="next-action-cta">
                    Review now <Icon name="chevron-right" size={18} />
                  </LinkButton>
                </div>
              </>
            ) : (
              <>
                <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-accent">Day {current.day.day} of 30</p>
                <h2 className="relative mt-1 text-xl font-bold leading-snug">Today’s content is still being written</h2>
                <p className="relative mt-2 text-[15px] text-ink-2">The available parts are below. Nothing unpublished will ever be marked done.</p>
              </>
            )}
          </Card>

          <section aria-labelledby="day-heading">
            <div className="mb-2 flex items-baseline justify-between">
              <SectionTitle>
                <span id="day-heading">
                  Day {current.day.day}: {current.day.title}
                </span>
              </SectionTitle>
              <span className="text-xs text-ink-3">
                {current.doneCount}/{current.availableCount} done
              </span>
            </div>
            <Card className="overflow-hidden" data-testid="day-card">
              <p className="border-b border-line px-4 py-3 text-sm text-ink-2">{current.day.focus}</p>
              <JourneyDayChecklist ds={current} />
              <div className="flex items-center justify-between border-t border-line px-4 py-2 text-xs text-ink-3">
                <span data-testid="day-progress">
                  {current.doneCount}/{current.availableCount} done today · {js.completedDays} of 30 days complete
                </span>
                <Link href="/journey" className="font-semibold text-accent underline underline-offset-2">
                  All 30 days
                </Link>
              </div>
            </Card>
          </section>

          <Recommendations limit={3} heading="Retry and reinforce, from your own evidence" />

          <section aria-labelledby="week-heading" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SectionTitle className="sr-only">
              <span id="week-heading">This week</span>
            </SectionTitle>
            <Stat label="Lessons done" value={`${stats.lessonsDone}/${stats.lessonsTotal}`} />
            <Stat label="Missions solved" value={`${stats.missionsDone}/${stats.missionsTotal}`} />
            <Stat label="Cards due" value={String(stats.due)} href={stats.due > 0 ? "/review" : undefined} />
            <Stat label="Days active, 7d" value={String(stats.activeThisWeek)} />
          </section>

          {block && (
            <section aria-labelledby="plan-heading">
              <SectionTitle className="mb-2">
                <span id="plan-heading">30-day interview fast track</span>
              </SectionTitle>
              <Card className="p-4">
                <p className="text-[15px]">
                  <strong>Block {current.day.block}, days {block.days}:</strong> {block.focus}.
                </p>
                <div className="mt-3">
                  <ProgressBar value={js.completedDays} max={30} label="Journey progress" />
                  <p className="mt-1 text-xs text-ink-3">Progress counts completed days only: solved exercises, evidence-backed missions, rated questions and ticked actions.</p>
                </div>
                <p className="mt-3 text-sm text-ink-2">
                  Apply for roles and practise interviews from day one, independently of lesson completion. Studying firmware does not create professional firmware experience; say so clearly in interviews.
                </p>
              </Card>
            </section>
          )}
        </>
      )}

      <p className="text-xs text-ink-3">
        {lessons.length} lessons and {missions.length} missions are published across the 16 modules under Learn. The 30 days are the fast track; the other lessons are reachable from their module and from your recommendations.
      </p>

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

      <p className="text-xs text-ink-3">Progress is stored in this browser only. Clearing site data removes it. Export a backup from the Progress page.</p>
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
