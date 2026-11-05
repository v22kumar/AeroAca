import type { Metadata } from "next";
import { CurriculumView } from "@/components/curriculum/CurriculumView";

export const metadata: Metadata = { title: "Curriculum" };

export default function CurriculumPage() {
  return <CurriculumView />;
}
