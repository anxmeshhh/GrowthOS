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
        if (e.key === "1") submitGradeMutation.mutate({ quality: 'hard' }); // Actually 'again' but we'll map it to hard
        if (e.key === "2") submitGradeMutation.mutate({ quality: 'hard' });
        if (e.key === "3") submitGradeMutation.mutate({ quality: 'good' });
        if (e.key === "4") submitGradeMutation.mutate({ quality: 'easy' });
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
          <p className="text-[#888] max-w-md mb-8">
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
            className="flex items-center gap-2 text-[#888] hover:text-[#fff] transition-colors"
          >
            <X size={20} />
            <span className="text-sm font-mono uppercase tracking-widest">End Session</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[#22c55e] border border-[#22c55e]/20 bg-[#22c55e]/10 px-3 py-1 rounded">
              {dueCards.length} Due
            </div>
          </div>
        </header>

        {/* Card Container */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full mb-20">
          <div className="w-full text-center mb-6">
            <div className="text-sm font-mono text-[#888] uppercase tracking-widest mb-1">
              {currentItem.path_title}
            </div>
            <div className="text-lg text-[#eee] font-semibold">{currentItem.topic_title}</div>
          </div>

          <div
            className="perspective-1000 min-h-[300px] w-full cursor-pointer"
            onClick={() => !flipped && setFlipped(true)}
          >
            <div
              className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? "rotate-y-180" : ""}`}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden rounded-xl border-2 border-[#181818] bg-[#0a0a0a] hover:border-[#222] transition-colors flex flex-col items-center justify-center p-8 shadow-2xl">
                <div className="text-sm uppercase font-mono tracking-widest text-[#888] mb-6">
                  Question
                </div>
                <div className="text-2xl sm:text-3xl font-semibold text-[#e8e8e8] text-center leading-snug">
                  {currentItem.card.front}
                </div>
                {!flipped && (
                  <div className="absolute bottom-6 text-[#555] text-sm font-mono uppercase tracking-widest animate-pulse">
                    Spacebar to reveal
                  </div>
                )}
              </div>
              {/* Back */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-2 border-[#22c55e]/30 bg-[#061008] flex flex-col items-center justify-center p-8 shadow-2xl">
                <div className="text-sm uppercase font-mono tracking-widest text-[#22c55e]/60 mb-6">
                  Answer
                </div>
                <div className="text-xl sm:text-2xl text-[#eee] text-center leading-relaxed">
                  {currentItem.card.back}
                </div>
              </div>
            </div>
          </div>

          {/* Grading Buttons */}
          {flipped && (
            <div className="w-full grid grid-cols-4 gap-2 sm:gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: 'hard' });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-[#ef4444] text-lg mb-1">Again</span>
                <span className="text-xs font-mono text-[#ef4444]/60 opacity-80">&lt; 1m (1)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: 'hard' });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-[#f59e0b] text-lg mb-1">Hard</span>
                <span className="text-xs font-mono text-[#f59e0b]/60 opacity-80">1d (2)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: 'good' });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl border border-[#22c55e]/30 bg-[#22c55e]/10 hover:bg-[#22c55e]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-[#22c55e] text-lg mb-1">Good</span>
                <span className="text-xs font-mono text-[#22c55e]/60 opacity-80">3d (3)</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  submitGradeMutation.mutate({ quality: 'easy' });
                }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-[#3b82f6] text-lg mb-1">Easy</span>
                <span className="text-xs font-mono text-[#3b82f6]/60 opacity-80">4d (4)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
