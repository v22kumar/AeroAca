import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMission, missions } from "@/lib/content";
import { MissionPlayer } from "@/components/mission/MissionPlayer";

export function generateStaticParams() {
  return missions.map((m) => ({ slug: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const mission = getMission(slug);
  return { title: mission?.title ?? "Mission", description: mission?.summary };
}

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mission = getMission(slug);
  if (!mission) notFound();
  return <MissionPlayer mission={mission} />;
}
