import type { SessionPhase } from "@/hooks/use-growth-state";
import { inferSessionPhase } from "@/lib/session-phase";
import { BookOpen, CheckCircle2, Hammer, PenLine } from "lucide-react";

const PHASES: { id: SessionPhase; label: string; icon: typeof BookOpen; minutes: string }[] = [
  { id: "read", label: "Read", icon: BookOpen, minutes: "15–25m" },
  { id: "write", label: "Write", icon: PenLine, minutes: "10–15m" },
  { id: "check", label: "Check", icon: CheckCircle2, minutes: "5m" },
  { id: "build", label: "Build", icon: Hammer, minutes: "15–20m" },
];

export function SessionStepper({
  phase,
  checks,
  onPhaseChange,
}: {
  phase: SessionPhase;
  checks: { video: boolean; notes: boolean; quiz: boolean; commit: boolean };
  onPhaseChange: (phase: SessionPhase) => void;
}) {
  const checkMap: Record<SessionPhase, boolean> = {
    read: checks.video,
    write: checks.notes,
    check: checks.quiz,
    build: checks.commit,
    done: Object.values(checks).every(Boolean),
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-white/5 px-4 py-2 bg-[var(--desk-surface)]">
      {PHASES.map((step, index) => {
        const active = phase === step.id;
        const done = checkMap[step.id];
        const Icon = step.icon;
        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 && <span className="text-white/20 mx-0.5">→</span>}
            <button
              type="button"
              onClick={() => onPhaseChange(step.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                active
                  ? "bg-amber-700/80 text-amber-50"
                  : done
                    ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40"
                    : "text-[#c4bdb3] hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {step.label}
              <span className="text-[9px] opacity-70 hidden sm:inline">{step.minutes}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
