import { useState, useMemo } from "react";
import { useGrowthState, type Flashcard } from "@/hooks/use-growth-state";
import { Plus, Trash2, Eye, RefreshCw, Check, AlertCircle, Smile } from "lucide-react";

export function FlashcardsSandbox({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const { state, addFlashcard, updateFlashcardReview, deleteFlashcard } = useGrowthState();
  const topic = state.topics[topicId];
  const cards = topic?.flashcards ?? [];

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [activeTab, setActiveTab] = useState<"study" | "manage">("study");

  // Spaced Repetition Scheduling: SM-2 simplified algorithm
  // Ratings: 1 = Again (fail), 2 = Hard, 3 = Good, 4 = Easy
  const handleReviewCard = (card: Flashcard, rating: number) => {
    let easeFactor = card.easeFactor;
    let repetitions = card.repetitions;
    let intervalDays = card.intervalDays;

    if (rating === 1) {
      // Failed card review
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
      // Succeeded card review
      if (repetitions === 0) {
        intervalDays = 1;
      } else if (repetitions === 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.round(intervalDays * easeFactor);
      }
      repetitions += 1;
      if (rating === 2) easeFactor = Math.max(1.3, easeFactor - 0.15);
      if (rating === 4) easeFactor = Math.min(2.8, easeFactor + 0.15);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const nextReviewDate = nextDate.toISOString().split("T")[0];

    updateFlashcardReview(
      topicId,
      card.id,
      easeFactor,
      intervalDays,
      repetitions,
      nextReviewDate
    );
  };

  const todayStr = new Date().toISOString().split("T")[0];
  
  const dueCards = useMemo(() => {
    return cards.filter((card) => card.nextReviewDate <= todayStr);
  }, [cards, todayStr]);

  const upcomingCards = useMemo(() => {
    return cards.filter((card) => card.nextReviewDate > todayStr);
  }, [cards, todayStr]);

  const [currentDueIndex, setCurrentDueIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    addFlashcard(topicId, front, back);
    setFront("");
    setBack("");
  };

  const currentCard = dueCards[currentDueIndex];

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--paper-line)] text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("study");
            setFlipped(false);
            setCurrentDueIndex(0);
          }}
          className={`px-4 py-2 border-b-2 font-medium cursor-pointer transition-colors ${
            activeTab === "study"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
          }`}
        >
          Study Deck ({dueCards.length} due)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-2 border-b-2 font-medium cursor-pointer transition-colors ${
            activeTab === "manage"
              ? "border-amber-700 text-amber-900"
              : "border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
          }`}
        >
          Manage cards ({cards.length})
        </button>
      </div>

      {activeTab === "study" && (
        <div className="space-y-4 pt-1">
          {dueCards.length > 0 && currentCard ? (
            <div className="space-y-4">
              <div className="text-[10px] text-[var(--paper-muted)] font-mono flex items-center justify-between">
                <span>Card {currentDueIndex + 1} of {dueCards.length}</span>
                <span>Interval: {currentCard.intervalDays} days</span>
              </div>

              {/* Flipping card container */}
              <div 
                onClick={() => setFlipped(!flipped)}
                className="w-full min-h-[160px] bg-white/80 hover:bg-white border border-[var(--paper-line)] rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-300 flex flex-col justify-between items-center relative overflow-hidden"
              >
                <div className="absolute top-2 right-3 text-[9px] font-mono text-[var(--paper-muted)]">
                  Click card to flip
                </div>
                <div className="flex-1 flex items-center justify-center text-center max-w-md">
                  {!flipped ? (
                    <span className="text-sm font-medium text-[var(--paper-ink)] leading-relaxed">
                      {currentCard.front}
                    </span>
                  ) : (
                    <span className="text-sm text-amber-950 font-serif leading-relaxed">
                      {currentCard.back}
                    </span>
                  )}
                </div>
                <div className="mt-4 text-[10px] font-medium tracking-wide uppercase font-mono text-[var(--paper-muted)]">
                  {!flipped ? "Question" : "Answer"}
                </div>
              </div>

              {/* Spaced Repetition Buttons */}
              {flipped && (
                <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-[10px] text-center block font-mono text-[var(--paper-muted)]">
                    How well did you recall this?
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleReviewCard(currentCard, 1);
                        setFlipped(false);
                      }}
                      className="px-2 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer text-center"
                    >
                      Again
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReviewCard(currentCard, 2);
                        setFlipped(false);
                      }}
                      className="px-2 py-2 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer text-center"
                    >
                      Hard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReviewCard(currentCard, 3);
                        setFlipped(false);
                      }}
                      className="px-2 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer text-center"
                    >
                      Good
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReviewCard(currentCard, 4);
                        setFlipped(false);
                      }}
                      className="px-2 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer text-center"
                    >
                      Easy
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-[var(--paper-line)] bg-white/40 rounded-xl space-y-3">
              <Smile className="w-10 h-10 text-emerald-700/60" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-emerald-800">All caught up!</h4>
                <p className="text-[11px] text-[var(--paper-muted)] max-w-[280px]">
                  {cards.length === 0
                    ? "You haven't created any cards yet. Go to the Manage tab to build your first recall card!"
                    : "No cards due for revision today. Repeat active recall review tomorrow!"}
                </p>
              </div>
            </div>
          )}

          {upcomingCards.length > 0 && (
            <div className="border-t border-[var(--paper-line)]/60 pt-3 mt-3">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-[var(--paper-muted)] mb-2">
                Up next in spaced repetition ({upcomingCards.length})
              </h4>
              <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                {upcomingCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-2 rounded bg-white/40 border border-[var(--paper-line)]/50 text-[11px]">
                    <span className="truncate max-w-[200px] text-[var(--paper-ink)]">{card.front}</span>
                    <span className="text-[10px] text-[var(--paper-muted)] font-mono shrink-0">
                      due {card.nextReviewDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "manage" && (
        <div className="space-y-4 pt-1">
          {/* Create Form */}
          <form onSubmit={handleAddCard} className="space-y-3 bg-white/60 p-4 border border-[var(--paper-line)] rounded-xl shadow-sm">
            <h4 className="text-xs font-semibold text-[var(--paper-ink)]">Create new flashcard</h4>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono text-[var(--paper-muted)] block mb-1">
                  FRONT (QUESTION OR TERM)
                </label>
                <input
                  type="text"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g. What are CSS selectors?"
                  className="paper-editor w-full text-xs rounded border border-[var(--paper-line)] bg-white/80 px-3 py-1.5 text-[var(--paper-ink)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[var(--paper-muted)] block mb-1">
                  BACK (SHORT ANSWER OR EXPLANATION)
                </label>
                <textarea
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  placeholder="e.g. Patterns used to select and style elements on a web page..."
                  rows={2}
                  className="paper-editor w-full text-xs rounded border border-[var(--paper-line)] bg-white/80 px-3 py-1.5 text-[var(--paper-ink)] focus:outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!front.trim() || !back.trim()}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                  front.trim() && back.trim()
                    ? "bg-amber-700 hover:bg-amber-800 text-white"
                    : "bg-white/40 border border-[var(--paper-line)] text-[var(--paper-muted)] cursor-not-allowed"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add card
              </button>
            </div>
          </form>

          {/* Cards List */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-[var(--paper-muted)] block">
              Active Deck ({cards.length})
            </h4>
            {cards.length === 0 ? (
              <p className="text-xs italic text-[var(--paper-muted)] py-4 text-center">
                No cards created yet. Add one above!
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-start justify-between gap-3 p-3 bg-white/50 border border-[var(--paper-line)] rounded-lg text-xs hover:bg-white/70 transition-colors">
                    <div className="space-y-1">
                      <div className="font-medium text-[var(--paper-ink)]">{card.front}</div>
                      <div className="text-[11px] text-[var(--paper-muted)] italic leading-relaxed">{card.back}</div>
                      <div className="text-[9px] font-mono text-[var(--paper-muted)] pt-1">
                        Interval: {card.intervalDays}d · EF: {card.easeFactor.toFixed(2)} · Due: {card.nextReviewDate}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteFlashcard(topicId, card.id)}
                      className="text-[var(--paper-muted)] hover:text-rose-700 transition-colors cursor-pointer shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
