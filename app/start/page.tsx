import type { Metadata } from "next";
import { DiagnosticView } from "@/components/start/DiagnosticView";

export const metadata: Metadata = { title: "Find your starting level" };

export default function StartPage() {
  return <DiagnosticView />;
}
