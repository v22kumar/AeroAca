import type { Metadata } from "next";
import { InterviewView } from "@/components/interview/InterviewView";

export const metadata: Metadata = { title: "Interview practice" };

export default function InterviewPage() {
  return <InterviewView />;
}
