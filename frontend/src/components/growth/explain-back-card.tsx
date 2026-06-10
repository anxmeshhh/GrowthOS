import { useGrowthState } from "@/hooks/use-growth-state";
import { getExplainPrompts } from "@/lib/mock/explain-prompts";

export function ExplainBackCard({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const { state, saveExplainBack } = useGrowthState();
  const topic = state.topics[topicId];
  const prompts = getExplainPrompts(topicTitle);
  const answers = topic?.explainBack ?? [];
  const doneCount = answers.filter((a) => a.done).length;

  return (
    <div className="space-y-3 rounded-md border border-[var(--paper-line)] bg-[var(--paper-bg)]/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-[var(--paper-ink)]">Explain it back</h3>
        <span className="text-[10px] text-[var(--paper-muted)]">
          {doneCount}/2 needed for notes proof
        </span>
      </div>
      {prompts.map((prompt) => {
        const existing = answers.find((a) => a.promptId === prompt.id);
        return (
          <div key={prompt.id} className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--paper-ink)] leading-snug block">
              {prompt.question}
            </label>
            <p className="text-[10px] text-[var(--paper-muted)] italic">{prompt.hint}</p>
            <textarea
              value={existing?.answer ?? ""}
              onChange={(e) => saveExplainBack(topicId, prompt.id, e.target.value)}
              placeholder="Write your answer…"
              rows={3}
              className="paper-editor w-full resize-none rounded border border-[var(--paper-line)] bg-white/60 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--paper-margin)]"
            />
            {existing?.done && (
              <span className="text-[10px] text-emerald-700">✓ Saved</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
