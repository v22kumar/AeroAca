import type { Metadata } from "next";
import { JourneyView } from "@/components/journey/JourneyView";

export const metadata: Metadata = { title: "Career track" };

export default function JourneyPage() {
  return <JourneyView />;
}
