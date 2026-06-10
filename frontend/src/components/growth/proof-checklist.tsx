import { CheckCircle2 } from "lucide-react";
import { useGrowthState } from "@/hooks/use-growth-state";

const PROOF_ITEMS = [
  { id: "video" as const, label: "Study the curated resource" },
  { id: "notes" as const, label: "Write notes in your own words" },
  { id: "quiz" as const, label: "Pass checkpoint quiz (70%+)" },
  { id: "commit" as const, label: "Submit build or GitHub proof" },
];

export function ProofChecklist({
  topicId,
  onStartQuiz,
}: {
  topicId: string;
  onStartQuiz?: () => void;
}) {
  const { state, updateTopicCheck } = useGrowthState();
  const topic = state.topics[topicId];
  if (!topic) return null;

  const checks = topic.checks;
  const doneCount = Object.values(checks).filter(Boolean).length;

  return (
    <div className="rounded-md border border-border bg-[var(--surface)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Proof checklist
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground">
          {doneCount}/{PROOF_ITEMS.length}
        </span>
      </div>
      <div className="space-y-2">
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
              className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-left hover:bg-[var(--surface-2)] transition-colors"
            >
              <span
                className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border ${
                  done ? "border-[var(--completed)] bg-[var(--completed)]" : "border-border"
                }`}
              >
                {done ? <CheckCircle2 className="h-3 w-3 text-background" strokeWidth={3} /> : null}
              </span>
              <span
                className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
