import { useMemo, useState, useEffect } from "react";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getTopicKeywords } from "@/lib/mock/explain-prompts";
import { Award, BrainCircuit, Check, CheckCircle2, AlertCircle } from "lucide-react";

export function ExplainBackCard({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const { state, saveExplainBack } = useGrowthState();
  const topic = state.topics[topicId];
  
  // Load existing feynman answer if saved
  const savedEntry = useMemo(() => {
    return topic?.explainBack?.find((a) => a.promptId === "feynman");
  }, [topic]);

  const [answer, setAnswer] = useState(savedEntry?.answer ?? "");
  const [showCritique, setShowCritique] = useState(false);
  const [isSaved, setIsSaved] = useState(savedEntry?.done ?? false);

  // Keep answer in sync if topic changes
  useEffect(() => {
    setAnswer(savedEntry?.answer ?? "");
    setIsSaved(savedEntry?.done ?? false);
  }, [savedEntry]);

  const keywords = useMemo(() => getTopicKeywords(topicTitle), [topicTitle]);

  const coveredKeywords = useMemo(() => {
    if (!answer.trim()) return [];
    return keywords.filter((kw) => 
      answer.toLowerCase().includes(kw.toLowerCase())
    );
  }, [answer, keywords]);

  const metrics = useMemo(() => {
    const text = answer.trim();
    if (!text) return { label: "Waiting for explanation...", color: "text-[var(--paper-muted)]", val: 0 };
    if (text.length < 40) return { label: "Too short (aim for 40+ chars)", color: "text-amber-600", val: 25 };

    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((acc, w) => acc + w.length, 0) / words.length;

    if (avgWordLength > 6.0) {
      return { 
        label: "Academic (Complex / Jargon-heavy)", 
        color: "text-rose-600 font-medium", 
        val: 50,
        tip: "Try replacing complex terminology with simpler analogies."
      };
    }
    if (avgWordLength < 4.8) {
      return { 
        label: "Feynman Level (Superb simplicity!)", 
        color: "text-emerald-700 font-semibold", 
        val: 100,
        tip: "Perfect! You explained it with simple words that anyone can grasp."
      };
    }
    return { 
      label: "Peer Level (Clear & technical)", 
      color: "text-blue-600 font-medium", 
      val: 75,
      tip: "Good clarity, but could be slightly simplified for a layperson."
    };
  }, [answer]);

  const handleSave = () => {
    if (answer.trim().length < 40) return;
    saveExplainBack(topicId, "feynman", answer);
    setIsSaved(true);
    setShowCritique(true);
  };

  const coveragePercent = keywords.length > 0 
    ? Math.round((coveredKeywords.length / keywords.length) * 100) 
    : 100;

  return (
    <div className="space-y-4 rounded-xl border border-[var(--paper-line)] bg-[var(--paper-bg)]/40 p-5 shadow-sm transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-amber-700/80" />
            <h3 className="text-sm font-semibold text-[var(--paper-ink)] font-sans">
              Feynman active recall
            </h3>
          </div>
          <p className="text-[11px] text-[var(--paper-muted)] mt-1">
            Explain this concept to a child or beginner. Use analogies and keep sentences simple.
          </p>
        </div>
        {isSaved && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Check className="w-3 h-3" />
            Proof locked
          </span>
        )}
      </div>

      <div className="space-y-2">
        <textarea
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (isSaved) setIsSaved(false);
          }}
          placeholder={`e.g., "Imagine ${topicTitle} is like a..."`}
          rows={3}
          className="paper-editor w-full resize-none rounded-lg border border-[var(--paper-line)] bg-white/70 px-4 py-3 text-sm text-[var(--paper-ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-serif placeholder:italic leading-relaxed shadow-inner"
        />
      </div>

      {/* Concept checklist */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--paper-muted)] block">
          Key concepts covered ({coveredKeywords.length}/{keywords.length})
        </span>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => {
            const covered = coveredKeywords.includes(kw);
            return (
              <span
                key={kw}
                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border transition-all duration-300 ${
                  covered
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                    : "bg-white/40 border-[var(--paper-line)] text-[var(--paper-muted)]"
                }`}
              >
                {covered && <Check className="w-2.5 h-2.5 text-emerald-700 shrink-0" />}
                {kw}
              </span>
            );
          })}
        </div>
      </div>

      {/* Simplicity gauge */}
      <div className="space-y-2 border-t border-[var(--paper-line)]/60 pt-3">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[var(--paper-muted)]">Simplicity:</span>
          <span className={metrics.color}>{metrics.label}</span>
        </div>
        <div className="w-full h-1.5 bg-white/40 rounded-full overflow-hidden border border-[var(--paper-line)]/40">
          <div 
            className={`h-full transition-all duration-500 ${
              metrics.val === 100 
                ? "bg-emerald-600" 
                : metrics.val === 75 
                ? "bg-blue-500" 
                : metrics.val === 50 
                ? "bg-rose-400" 
                : "bg-amber-400"
            }`}
            style={{ width: `${metrics.val}%` }}
          />
        </div>
        {metrics.tip && (
          <p className="text-[10px] italic text-[var(--paper-muted)] mt-1 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600/70 shrink-0 mt-0.5" />
            <span>{metrics.tip}</span>
          </p>
        )}
      </div>

      {/* Action button */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <p className="text-[10px] text-[var(--paper-muted)] font-mono">
          Aim for 40+ characters & cover at least 1 keyword
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={answer.trim().length < 40}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            answer.trim().length >= 40
              ? "bg-amber-700 hover:bg-amber-800 text-white shadow-sm"
              : "bg-white/40 border border-[var(--paper-line)] text-[var(--paper-muted)] cursor-not-allowed"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Lock proof notes
        </button>
      </div>

      {/* Simulation AI Critique Panel */}
      {showCritique && answer.trim().length >= 40 && (
        <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-3.5 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Feynman active recall check passed!</span>
          </div>
          <div className="text-[11px] text-emerald-900/90 leading-relaxed font-sans">
            <strong>Critique:</strong> You successfully explained the concept using simple terms.
            {coveredKeywords.length > 0 ? (
              <span> Covered key terms: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono text-[10px]">{coveredKeywords.join(", ")}</code>.</span>
            ) : (
              " Try covering a few more concepts on your next revision."
            )}
            {" "}Excellent work mapping this to your notes. <strong>+15 XP</strong> added to your profile!
          </div>
          <button
            type="button"
            onClick={() => setShowCritique(false)}
            className="text-[10px] text-emerald-700 hover:text-emerald-900 font-mono block mt-1 hover:underline cursor-pointer"
          >
            Dismiss review
          </button>
        </div>
      )}
    </div>
  );
}
