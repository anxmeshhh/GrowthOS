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
function calculateNextReview(quality: number, currentInterval: number, currentEase: number, currentRepetitions: number) {
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
    mutationFn: async ({ quality }: { quality: number }) => {
      if (!currentItem || !topicFlashcards) throw new Error("No card selected");
      
      const { interval, ease, repetitions, next_review } = calculateNextReview(
        quality,
        currentItem.card.interval || 0,
        currentItem.card.ease || 2.5,
        currentItem.card.repetitions || 0
      );

      // Create updated cards array
      const updatedCards = [...topicFlashcards.flashcards];
      updatedCards[currentItem.card_index] = {
        ...updatedCards[currentItem.card_index],
        interval,
        ease,
        repetitions,
        next_review
      };

      const res = await apiFetch(`/topics/${currentItem.topic_id}/flashcards/`, {
        method: "POST",
        body: JSON.stringify({ cards: updatedCards }),
      });
      
      if (!res.ok) throw new Error("Failed to save progress");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global_review"] });
      setFlipped(false);
    }
  });

  useEffect(() => {
    if (!isLoading && dueCards.length === 0) {
      setSessionCompleted(true);
    }
  }, [dueCards, isLoading]);

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
          <h2 className="text-3xl font-bold tracking-tight text-[#f0f0f0] mb-2">You're all caught up!</h2>
          <p className="text-[#888] max-w-md mb-8">
            You have successfully cleared your entire review queue. Excellent work! Your spaced repetition algorithm will schedule the next batch.
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
          <Link to="/roadmap" className="flex items-center gap-2 text-[#888] hover:text-[#fff] transition-colors">
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
            <div className="text-sm font-mono text-[#888] uppercase tracking-widest mb-1">{currentItem.path_title}</div>
            <div className="text-lg text-[#eee] font-semibold">{currentItem.topic_title}</div>
          </div>

          <div 
            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl min-h-[300px] flex flex-col justify-center items-center p-8 text-center cursor-pointer hover:border-[#333] transition-colors shadow-2xl"
            onClick={() => !flipped && setFlipped(true)}
          >
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#fff] leading-relaxed mb-6">
              {currentItem.card.front}
            </h2>
            
            {flipped ? (
              <div className="pt-6 mt-6 border-t border-[#1a1a1a] w-full animate-in fade-in slide-in-from-top-4 duration-500">
                <p className="text-xl text-[#ccc] leading-relaxed">
                  {currentItem.card.back}
                </p>
              </div>
            ) : (
              <div className="text-sm font-mono uppercase tracking-widest text-[#555] mt-12 animate-pulse">
                Click to reveal answer
              </div>
            )}
          </div>

          {/* Grading Buttons */}
          {flipped && (
            <div className="w-full grid grid-cols-4 gap-2 sm:gap-4 mt-8">
              <button
                onClick={(e) => { e.stopPropagation(); submitGradeMutation.mutate({ quality: 0 }); }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-lg mb-1">Again</span>
                <span className="text-xs font-mono opacity-80">&lt; 1m</span>
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); submitGradeMutation.mutate({ quality: 3 }); }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#f97316]/10 text-[#f97316] border border-[#f97316]/20 hover:bg-[#f97316]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-lg mb-1">Hard</span>
                <span className="text-xs font-mono opacity-80">1d</span>
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); submitGradeMutation.mutate({ quality: 4 }); }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-lg mb-1">Good</span>
                <span className="text-xs font-mono opacity-80">3d</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); submitGradeMutation.mutate({ quality: 5 }); }}
                disabled={submitGradeMutation.isPending}
                className="flex flex-col items-center justify-center py-4 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 hover:bg-[#3b82f6]/20 transition-all disabled:opacity-50"
              >
                <span className="font-bold text-lg mb-1">Easy</span>
                <span className="text-xs font-mono opacity-80">4d</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
