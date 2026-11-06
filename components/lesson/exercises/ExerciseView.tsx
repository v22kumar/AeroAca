"use client";

import type { Exercise } from "@/lib/content/schema";
import { SingleChoice } from "./SingleChoice";
import { MultiChoice } from "./MultiChoice";
import { OrderExercise } from "./OrderExercise";
import { NumericExercise } from "./NumericExercise";
import { RegisterExerciseView } from "./RegisterExerciseView";

export function ExerciseView({ exercise, onResult, solvedEarlier }: { exercise: Exercise; onResult: (correct: boolean, hints: number) => void; solvedEarlier: boolean }) {
  switch (exercise.kind) {
    case "single":
      return <SingleChoice exercise={exercise} onResult={onResult} solvedEarlier={solvedEarlier} />;
    case "multi":
      return <MultiChoice exercise={exercise} onResult={onResult} solvedEarlier={solvedEarlier} />;
    case "order":
      return <OrderExercise exercise={exercise} onResult={onResult} solvedEarlier={solvedEarlier} />;
    case "numeric":
      return <NumericExercise exercise={exercise} onResult={onResult} solvedEarlier={solvedEarlier} />;
    case "register":
      return <RegisterExerciseView exercise={exercise} onResult={onResult} solvedEarlier={solvedEarlier} />;
  }
}
