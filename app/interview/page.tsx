import type { Metadata } from "next";
import { Suspense } from "react";
import { InterviewView } from "@/components/interview/InterviewView";

export const metadata: Metadata = { title: "Interview practice" };

export default function InterviewPage() {
  return (
    <Suspense fallback={null}>
      <InterviewView />
    </Suspense>
  );
}
