import { CheckCircle2, Circle } from "lucide-react";
import { useGrowthState } from "@/hooks/use-growth-state";

const PROOF_ITEMS = [
  { id: "video" as const, label: "Study topic", hint: "Review guides & resources" },
  { id: "notes" as const, label: "Write notes", hint: "Explain in your own words" },
  { id: "quiz" as const, label: "Take quiz", hint: "70% score to pass" },
  { id: "commit" as const, label: "Build proof", hint: "Small practical code build" },
];

export function ProofChecklist({
  topicId,
  onStartQuiz,
  variant = "default",
}: {
  topicId: string;
  onStartQuiz?: () => void;
  variant?: "default" | "desk";
}) {
  const { state, updateTopicCheck } = useGrowthState();
  const topic = state.topics[topicId];
  if (!topic) return null;

  const checks = topic.checks;
  const doneCount = Object.values(checks).filter(Boolean).length;
  const isDesk = variant === "desk";

  return (
    <div
      className={
        isDesk
          ? "space-y-2"
          : "rounded-md border border-border bg-[var(--surface)] p-4 space-y-3"
      }
    >
      {!isDesk && (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Your progress
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">
            {doneCount}/{PROOF_ITEMS.length}
          </span>
        </div>
      )}

      <div className={isDesk ? "flex flex-wrap gap-2" : "space-y-2"}>
        {PROOF_ITEMS.map((item) => {
          const done = checks[item.id];
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "quiz" && onStartQuiz) {
                  onStartQuiz();
                  return;
                }
                updateTopicCheck(topicId, item.id, !done);
              }}
              title={item.hint}
              className={
                isDesk
                  ? `inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
                      done
                        ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/50"
                        : "bg-white/5 text-[#c4bdb3] border border-white/10 hover:bg-white/10"
                    }`
                  : `flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors`
              }
            >
              {done ? (
                <CheckCircle2 className={`shrink-0 ${isDesk ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
              ) : (
                <Circle className={`shrink-0 opacity-50 ${isDesk ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
              )}
              <span className={done && !isDesk ? "text-muted-foreground line-through text-sm" : "text-sm"}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
