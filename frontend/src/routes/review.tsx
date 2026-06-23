import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Zap, CheckCircle2, X } from "lucide-react";
import { PageShell, Btn } from "@/components/growth-ui";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/review")({
  component: GlobalReviewPage,
});

/* ─────────────────────────────────────────────
   Algorithm Utility
───────────────────────────────────────────── */
function calculateNextReview(
  quality: number,
  currentInterval: number,
  currentEase: number,
  currentRepetitions: number,
) {
  let repetitions = currentRepetitions;
  let interval = currentInterval;
  let ease = currentEase;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return { interval, ease, repetitions, next_review: nextReviewDate.toISOString() };
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
function GlobalReviewPage() {
  const queryClient = useQueryClient();
  const [flipped, setFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["global_review"],
    queryFn: async () => {
      const res = await apiFetch("/flashcards/review-queue/");
      if (!res.ok) throw new Error("Failed to load queue");
      return res.json();
    },
  });

  const dueCards = data?.due_cards || [];
  const currentItem = dueCards.length > 0 ? dueCards[0] : null;

  // We need to fetch the full flashcard array for the CURRENT topic so we can update it.
  const { data: topicFlashcards } = useQuery({
    queryKey: ["flashcards", currentItem?.topic_id],
    queryFn: async () => {
      if (!currentItem) return null;
      const res = await apiFetch(`/topics/${currentItem.topic_id}/flashcards/`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!currentItem,
  });

  const submitGradeMutation = useMutation({
    mutationFn: async ({ quality }: { quality: string }) => {
      if (!currentItem) throw new Error("No card selected");

      const res = await apiFetch(`/flashcards/review-queue/`, {
        method: "POST",
        body: JSON.stringify({ card_id: currentItem.id, grade: quality }),
      });

      if (!res.ok) throw new Error("Failed to save progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global_review"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      if (currentItem?.topic_id) {
        queryClient.invalidateQueries({ queryKey: ["topic", String(currentItem.topic_id)] });
        queryClient.invalidateQueries({ queryKey: ["flashcards", String(currentItem.topic_id)] });
      }
      setFlipped(false);
    },
  });

  useEffect(() => {
    if (!isLoading && dueCards.length === 0) {
      setSessionCompleted(true);
    }
  }, [dueCards, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        if (!flipped) setFlipped(true);
      } else if (flipped && !submitGradeMutation.isPending) {
        if (e.key === "1") submitGradeMutation.mutate({ quality: "hard" }); // Actually 'again' but we'll map it to hard
        if (e.key === "2") submitGradeMutation.mutate({ quality: "hard" });
        if (e.key === "3") submitGradeMutation.mutate({ quality: "good" });
        if (e.key === "4") submitGradeMutation.mutate({ quality: "easy" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, submitGradeMutation]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
          <Zap className="h-8 w-8 animate-pulse text-[#22c55e]" />
        </div>
      </PageShell>
    );
  }

  if (sessionCompleted) {
    return (
      <PageShell>
        <div className="flex h-[calc(100vh-6rem)] flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20">
            <CheckCircle2 size={40} className="text-[#22c55e]" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#f0f0f0] mb-2">
            You're all caught up!
          </h2>
          <p className="text-[#aaa] max-w-md mb-8 leading-relaxed text-lg">
            You have successfully cleared your entire review queue. Excellent work! Your spaced
            repetition algorithm will schedule the next batch.
          </p>
          <Link to="/roadmap">
            <Btn>Return to Dashboard</Btn>
          </Link>
        </div>
      </PageShell>
    );
  }

  if (!currentItem) return null;

  return (
    <PageShell>
      <div className="flex flex-col h-full bg-[#030303] min-h-screen p-4 sm:p-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 max-w-4xl mx-auto w-full">
          <Link
            to="/roadmap"
            className="flex items-center gap-2 text-[#666] hover:text-[#fff] transition-colors"
          >
            <X size={20} />
            <span className="text-xs font-mono uppercase tracking-[0.2em] font-medium">End Session</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono uppercase tracking-[0.2em] font-medium text-[#22c55e] border border-[#22c55e]/20 bg-[#22c55e]/5 px-3 py-1.5 rounded-md shadow-inner">
              {dueCards.length} Due
            </div>
          </div>
        </header>

        {/* Card Container */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full mb-20">
          <div className="w-full text-center mb-8">
            <div className="text-xs font-mono text-[#666] uppercase tracking-[0.2em] font-medium mb-1.5">
              {currentItem.path_title}
            </div>
            <div className="text-xl text-[#e8e8e8] font-semibold">{currentItem.topic_title}</div>
          </div>

          <div
            className="perspective-1000 min-h-[350px] sm:min-h-[400px] w-full cursor-pointer"
            onClick={() => !flipped && setFlipped(true)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a] flex flex-col items-center justify-center p-8 sm:p-12 shadow-2xl overflow-y-auto">
                <div className="text-xs uppercase font-mono tracking-[0.2em] font-medium text-[#666] mb-8 shrink-0">
                  Question
                </div>
                <div className="text-2xl sm:text-4xl font-semibold text-[#e8e8e8] text-center leading-relaxed my-auto">
                  {currentItem.card.front}
                </div>
                {!flipped && (
                  <div className="absolute bottom-8 text-[#444] text-xs font-mono uppercase tracking-[0.2em] font-medium animate-pulse shrink-0">
                    Press spacebar to reveal
                  </div>
                )}
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] flex flex-col items-center justify-center p-8 sm:p-12 shadow-2xl overflow-y-auto">
                <div className="text-xs uppercase font-mono tracking-[0.2em] font-medium text-[#22c55e]/80 mb-8 shrink-0">
                  Answer
                </div>
                <div className="text-xl sm:text-3xl font-medium text-[#d4d4d4] text-center leading-relaxed my-auto">
                  {currentItem.card.back}
                </div>
              </div>
            </div>
          </div>

          {/* Grading Buttons */}
          {flipped && (
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: "hard" });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-5 rounded-2xl border border-[#ef4444]/20 bg-[#ef4444]/5 hover:bg-[#ef4444]/15 hover:border-[#ef4444]/40 transition-all disabled:opacity-50 shadow-inner"
              >
                <span className="font-bold text-[#ef4444] text-xl mb-1.5">Again</span>
                <span className="text-[10px] font-mono text-[#ef4444]/50 tracking-[0.2em] uppercase">&lt; 1m (1)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: "hard" });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-5 rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/5 hover:bg-[#f59e0b]/15 hover:border-[#f59e0b]/40 transition-all disabled:opacity-50 shadow-inner"
              >
                <span className="font-bold text-[#f59e0b] text-xl mb-1.5">Hard</span>
                <span className="text-[10px] font-mono text-[#f59e0b]/50 tracking-[0.2em] uppercase">1d (2)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: "good" });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-5 rounded-2xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 hover:bg-[#3b82f6]/15 hover:border-[#3b82f6]/40 transition-all disabled:opacity-50 shadow-inner"
              >
                <span className="font-bold text-[#3b82f6] text-xl mb-1.5">Good</span>
                <span className="text-[10px] font-mono text-[#3b82f6]/50 tracking-[0.2em] uppercase">3d (3)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: "easy" });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-5 rounded-2xl border border-[#22c55e]/20 bg-[#22c55e]/5 hover:bg-[#22c55e]/15 hover:border-[#22c55e]/40 transition-all disabled:opacity-50 shadow-inner"
              >
                <span className="font-bold text-[#22c55e] text-xl mb-1.5">Easy</span>
                <span className="text-[10px] font-mono text-[#22c55e]/50 tracking-[0.2em] uppercase">4d (4)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
