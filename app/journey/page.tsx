import type { Metadata } from "next";
import { JourneyView } from "@/components/journey/JourneyView";

export const metadata: Metadata = { title: "30-day journey" };

export default function JourneyPage() {
  return <JourneyView />;
}
