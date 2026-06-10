import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ClipboardCheck, Lock, RotateCcw } from "lucide-react";
import { QuizDrawer, StatusBadge } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFlatTopics, LEARNING_PATHS } from "@/lib/roadmaps";

export const Route = createFileRoute("/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments · GrowthOS" },
      { name: "description", content: "Validate your understanding with proof-based checkpoints." },
    ],
  }),
  component: AssessmentsPage,
});

function AssessmentsPage() {
  const { state } = useGrowthState();
  const [quizTopic, setQuizTopic] = useState<string | null>(null);
  const activePath = LEARNING_PATHS[state.profile.path];

  const assessments = useMemo(
    () =>
      getFlatTopics(state.profile.path).map((topic) => ({
        ...topic,
        progress: state.topics[topic.id],
      })),
    [state.profile.path, state.topics],
  );

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <header>
        <div className="text-xs font-mono text-[var(--in-progress)] font-bold tracking-wider mb-2">
          ASSESSMENTS
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Checkpoints</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Validate topics from {activePath.title}. Passing scores create quiz proof.
        </p>
      </header>

      <div className="space-y-2">
        {assessments.map((assessment) => {
          const status = assessment.progress?.status || "locked";
          const locked = status === "locked";
          return (
            <div
              key={assessment.id}
              className="flex items-center justify-between p-4 rounded-md border border-border bg-card gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-[var(--in-progress)]" />
                  {assessment.title}
                </div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                  {Math.max(3, Math.round(assessment.minutes / 20))} questions · ~10 min
                  {assessment.progress?.quizScore !== undefined
                    ? ` · last score ${assessment.progress.quizScore}%`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={status} />
                <button
                  onClick={() => setQuizTopic(assessment.id)}
                  disabled={locked}
                  className="text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {locked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  {assessment.progress?.quizScore !== undefined ? "Retake" : "Start"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <QuizDrawer
        open={!!quizTopic}
        onClose={() => setQuizTopic(null)}
        topicId={quizTopic || undefined}
      />
    </div>
  );
}
