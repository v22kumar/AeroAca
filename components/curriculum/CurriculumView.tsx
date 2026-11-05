"use client";

import Link from "next/link";
import { curriculum, getLesson, getMission } from "@/lib/content";
import { sectionTitles, type CurriculumModule } from "@/lib/content/schema";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { lessonStatus, missionStatus } from "@/lib/progress/selectors";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";

export function CurriculumView() {
  const { state, hydrated } = useProgress();
  const sections = (["A", "B", "C", "D", "E"] as const).map((s) => ({ id: s, title: sectionTitles[s], modules: curriculum.filter((m) => m.section === s) }));
  const published = curriculum.reduce((n, m) => n + m.lessons.filter((l) => l.status === "published").length + (m.missions ?? []).filter((x) => x.status === "published").length, 0);
  const planned = curriculum.reduce((n, m) => n + m.lessons.filter((l) => l.status === "planned").length + (m.missions ?? []).filter((x) => x.status === "planned").length, 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Curriculum</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">16 modules, built in the order you need them.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          {published} items are published and playable. {planned} are planned and shown as coming soon so you can see the shape of the whole programme. Nothing unbuilt is ever marked complete.
        </p>
      </div>

      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`}>
          <h2 id={`section-${section.id}`} className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
            {section.id} · {section.title}
          </h2>
          <div className="flex flex-col gap-3">
            {section.modules.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} hydrated={hydrated} state={state} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ModuleCard({ mod, hydrated, state }: { mod: CurriculumModule; hydrated: boolean; state: ReturnType<typeof useProgress>["state"] }) {
  const hasPublished = mod.lessons.some((l) => l.status === "published") || (mod.missions ?? []).some((m) => m.status === "published");
  return (
    <Card className="overflow-hidden">
      <details open={hasPublished} className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-bold text-ink-2" aria-hidden>
            {mod.number}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[15px] font-semibold">{mod.title}</span>
              <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-bold text-ink-3">{mod.priority}</span>
            </span>
            <span className="mt-0.5 block text-sm text-ink-2">{mod.summary}</span>
          </span>
          <span aria-hidden className="mt-1 text-ink-3 transition-transform group-open:rotate-90">
            <Icon name="chevron-right" size={18} />
          </span>
        </summary>
        <ul className="divide-y divide-line border-t border-line">
          {mod.lessons.map((l) => {
            if (l.status === "published" && l.slug) {
              const lesson = getLesson(l.slug);
              const status = hydrated && lesson ? lessonStatus(state, lesson) : "not-started";
              return (
                <li key={l.title}>
                  <Link href={`/lessons/${l.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{l.title}</span>
                      <span className="block text-xs text-ink-3">Lesson · {lesson?.durationMinutes} min</span>
                    </span>
                    <StatusPill kind={status} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={l.title} className="flex items-center gap-3 px-4 py-3 text-ink-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{l.title}</span>
                  <span className="block text-xs">Lesson · planned</span>
                </span>
                <StatusPill kind="planned" />
              </li>
            );
          })}
          {(mod.missions ?? []).map((m) => {
            if (m.status === "published" && m.slug) {
              const mission = getMission(m.slug);
              const status = hydrated && mission ? missionStatus(state, mission) : "not-started";
              return (
                <li key={m.title}>
                  <Link href={`/missions/${m.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2">
                    <span className="text-accent" aria-hidden>
                      <Icon name="target" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium">{m.title}</span>
                      <span className="block text-xs text-ink-3">Mission · {mission?.durationMinutes} min</span>
                    </span>
                    <StatusPill kind={status} />
                  </Link>
                </li>
              );
            }
            return (
              <li key={m.title} className="flex items-center gap-3 px-4 py-3 text-ink-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px]">{m.title}</span>
                  <span className="block text-xs">Mission · planned</span>
                </span>
                <StatusPill kind="planned" />
              </li>
            );
          })}
        </ul>
      </details>
    </Card>
  );
}
