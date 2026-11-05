"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { interviewQuestions, getLesson } from "@/lib/content";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { Card } from "@/components/ui/Card";
import { InterviewCard } from "./InterviewCard";
import Link from "next/link";

const filters = [
  { id: "all", label: "All" },
  { id: "unrated", label: "Not yet rated" },
  { id: "weak", label: "Not yet / shaky" },
] as const;

export function InterviewView() {
  const { state, hydrated } = useProgress();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [topic, setTopic] = useState<string>("all");
  const topics = useMemo(() => [...new Set(interviewQuestions.map((q) => q.topic))], []);
  const params = useSearchParams();
  const requested = useMemo(() => new Set((params.get("q") ?? "").split(",").filter(Boolean)), [params]);
  const [showAll, setShowAll] = useState(false);
  const focusSet = requested.size > 0 && !showAll ? requested : null;

  const visible = interviewQuestions.filter((q) => {
    if (focusSet && !focusSet.has(q.id)) return false;
    if (topic !== "all" && q.topic !== topic) return false;
    const r = state.interview[q.id]?.confidence;
    if (filter === "unrated") return !r;
    if (filter === "weak") return r === "not-yet" || r === "shaky";
    return true;
  });

  const rated = Object.keys(state.interview).length;
  const confident = Object.values(state.interview).filter((r) => r.confidence === "confident").length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Interview practice</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Say it out loud, then grade yourself.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          These questions probe reasoning, not slogans. Answer first, reveal the rubric second, and rate yourself honestly: the rating is only useful if it is true.
        </p>
        {hydrated && (
          <p className="mt-2 text-sm text-ink-3">
            {rated} of {interviewQuestions.length} rated · {confident} confident
          </p>
        )}
      </div>

      {focusSet && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft/50 px-3 py-2 text-sm" data-testid="interview-focus">
          <span>
            Today’s {focusSet.size} question{focusSet.size > 1 ? "s" : ""} from the journey.
          </span>
          <button type="button" onClick={() => setShowAll(true)} className="shrink-0 font-semibold text-accent underline underline-offset-2">
            Show all
          </button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <div role="group" aria-label="Filter by rating" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)} className={`min-h-9 rounded-full border px-3 text-sm font-semibold ${filter === f.id ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-2"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={topic === "all"} onClick={() => setTopic("all")} className={`min-h-8 rounded-full border px-3 text-xs font-semibold ${topic === "all" ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2"}`}>
            All topics
          </button>
          {topics.map((t) => (
            <button key={t} type="button" aria-pressed={topic === t} onClick={() => setTopic(t)} className={`min-h-8 rounded-full border px-3 text-xs font-semibold ${topic === t ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <Card className="p-6 text-center text-sm text-ink-2">Nothing matches this filter. Rate a few questions first, or widen the filter.</Card>
      ) : (
        <ol className="flex flex-col gap-4">
          {visible.map((q) => {
            const lesson = q.relatedLesson ? getLesson(q.relatedLesson) : undefined;
            return (
              <li key={q.id}>
                <Card className="p-4">
                  <InterviewCard question={q} />
                  {lesson && (
                    <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
                      Grounded in{" "}
                      <Link href={`/lessons/${lesson.slug}`} className="font-semibold text-accent underline underline-offset-2">
                        {lesson.title}
                      </Link>
                    </p>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      )}
      <p className="text-xs text-ink-3">Never claim professional experience you gained only through study. Separate your real responsibilities from coursework and portfolio work.</p>
    </div>
  );
}
