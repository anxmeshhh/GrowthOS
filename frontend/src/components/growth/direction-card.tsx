import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { inferSessionPhase } from "@/lib/session-phase";
import type { SessionPhase } from "@/hooks/use-growth-state";
import type { FocusTopic } from "@/lib/focus-topic";

const PHASE_LABEL: Record<SessionPhase, string> = {
  read: "Read",
  write: "Write",
  check: "Check",
  build: "Build",
  done: "Done",
};

const PROOF_KEYS = ["video", "notes", "quiz", "commit"] as const;

export function ProofProgressStrip({
  checks,
  className = "",
}: {
  checks: FocusTopic["checks"];
  className?: string;
}) {
  const done = PROOF_KEYS.filter((k) => checks[k]).length;
  return (
    <div className={`flex gap-1 ${className}`}>
      {PROOF_KEYS.map((key, i) => (
        <div
          key={key}
          className={`h-1.5 flex-1 rounded-full ${
            checks[key] ? "bg-emerald-500" : i === done ? "bg-amber-500/70" : "bg-[var(--muted)]"
          }`}
        />
      ))}
    </div>
  );
}

export function FlowStrip({ compact = false }: { compact?: boolean }) {
  const steps = ["Map", "Desk", "Proof", "Next"];
  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 text-muted-foreground ${
        compact ? "text-[10px]" : "text-xs"
      }`}
    >
      <span className="font-mono uppercase tracking-wider text-amber-400/80">Flow</span>
      {steps.map((step, i) => (
        <span key={step} className="inline-flex items-center gap-1.5">
          {i > 0 && <ArrowRight className="h-3 w-3 opacity-35" />}
          <span className="font-medium text-foreground/75">{step}</span>
        </span>
      ))}
    </div>
  );
}

export function MissionButton({
  to,
  params,
  search,
  children,
  size = "md",
  className = "",
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, string | undefined>;
  children: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <Link
      to={to}
      params={params}
      search={search}
      className={`btn-mission inline-flex items-center gap-2 shrink-0 ${
        size === "sm" ? "btn-mission-sm" : ""
      } ${className}`}
    >
      {children}
    </Link>
  );
}

type DirectionCardProps = {
  focusTopic: FocusTopic | null;
  reason?: string;
  pathTitle?: string;
  estimatedMinutes?: number;
  label?: string;
  footer?: ReactNode;
};

export function DirectionCard({
  focusTopic,
  reason,
  pathTitle,
  estimatedMinutes,
  label = "Your next move",
  footer,
}: DirectionCardProps) {
  const phase = focusTopic ? inferSessionPhase(focusTopic.checks) : null;
  const proofDone = focusTopic
    ? PROOF_KEYS.filter((k) => focusTopic.checks[k]).length
    : 0;
  const isContinue = focusTopic?.status === "in_progress";

  const ctaLabel = focusTopic
    ? isContinue
      ? `Continue · ${PHASE_LABEL[phase!]}`
      : `Start · ${focusTopic.title}`
    : null;

  const topicSearch = focusTopic?.roadmapNodeId
    ? { from: "/roadmap" as const, nodeId: focusTopic.roadmapNodeId }
    : { from: "/roadmap" as const };

  return (
    <section className="mission-card relative overflow-hidden p-6 md:p-8">
      <div className="mission-card-glow pointer-events-none" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-xl space-y-3">
          <div className="mission-label">
            <Zap className="h-3 w-3" />
            {label}
          </div>

          {focusTopic ? (
            <>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{focusTopic.title}</h2>
              {reason ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{reason}</p>
              ) : (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isContinue
                    ? "You have momentum — finish this topic's proof to unlock what comes next."
                    : "This is your next unlocked step. Open the desk and complete all four proof checks."}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {pathTitle && (
                  <span className="rounded-md border border-border bg-[var(--surface-2)] px-2 py-1">
                    {pathTitle}
                  </span>
                )}
                {phase && phase !== "done" && (
                  <span className="rounded-md border border-amber-500/30 bg-amber-950/30 px-2 py-1 capitalize text-amber-200/90">
                    Phase: {phase}
                  </span>
                )}
                <span>{proofDone}/4 proof</span>
                {estimatedMinutes ? <span>~{estimatedMinutes} min</span> : null}
              </div>
              <ProofProgressStrip checks={focusTopic.checks} className="max-w-md pt-1" />
            </>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Pick your first topic on the map
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                GrowthOS gives you one clear direction at a time. Choose a node, open your desk,
                prove you learned it — confidence builds with each check.
              </p>
              <FlowStrip />
            </>
          )}
        </div>

        {focusTopic && ctaLabel ? (
          <MissionButton
            to="/topic/$topicId"
            params={{ topicId: focusTopic.id }}
            search={topicSearch}
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </MissionButton>
        ) : (
          <MissionButton to="/roadmap">
            Open roadmap
            <ArrowRight className="h-4 w-4" />
          </MissionButton>
        )}
      </div>

      {(footer || focusTopic) && (
        <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/15 pt-4">
          {footer ?? <FlowStrip compact />}
          {focusTopic && (
            <p className="text-[11px] text-muted-foreground">
              Proof unlocks the next topic — not time spent, not videos watched.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
