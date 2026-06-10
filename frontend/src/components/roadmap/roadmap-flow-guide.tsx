import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Unlock,
} from "lucide-react";
import { inferSessionPhase } from "@/lib/session-phase";
import type { SessionPhase } from "@/hooks/use-growth-state";

const COMPACT_KEY = "growthos_roadmap_flow_compact";

const PHASE_LABEL: Record<SessionPhase, string> = {
  read: "Read",
  write: "Write",
  check: "Check",
  build: "Build",
  done: "Done",
};

const STEPS = [
  {
    icon: MapPin,
    title: "Pick a topic",
    detail: "Yellow = topic, peach = subtopic. Click one to open it.",
  },
  {
    icon: BookOpen,
    title: "Open your desk",
    detail: "Resources, notes, and capture live on your topic workspace.",
  },
  {
    icon: CheckCircle2,
    title: "Complete proof",
    detail: "Read → Write → Check → Build. All four unlock the next node.",
  },
  {
    icon: Unlock,
    title: "Move forward",
    detail: "Return here anytime — your progress stays on the map.",
  },
] as const;

export type RoadmapFlowTopic = {
  id: string;
  title: string;
  roadmapNodeId?: string | null;
  checks: { video: boolean; notes: boolean; quiz: boolean; commit: boolean };
  status: "in_progress" | "available" | "completed" | "locked";
};

type RoadmapFlowGuideProps = {
  focusTopic: RoadmapFlowTopic | null;
  visualMap: boolean;
  completedCount: number;
};

export function RoadmapFlowGuide({
  focusTopic,
  visualMap,
  completedCount,
}: RoadmapFlowGuideProps) {
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    if (completedCount === 0) return false;
    return localStorage.getItem(COMPACT_KEY) === "1";
  });

  const setCompactMode = (value: boolean) => {
    setCompact(value);
    localStorage.setItem(COMPACT_KEY, value ? "1" : "0");
  };

  const phase = focusTopic ? inferSessionPhase(focusTopic.checks) : null;
  const isContinue = focusTopic?.status === "in_progress";
  const ctaLabel = focusTopic
    ? isContinue
      ? `Continue · ${PHASE_LABEL[phase!]}`
      : `Start · ${focusTopic.title}`
    : null;

  const listSteps = STEPS.map((step) =>
    step.title === "Pick a topic" && !visualMap
      ? { ...step, detail: "Choose the next unlocked topic in the list below." }
      : step,
  );

  if (compact) {
    return (
      <section className="rounded-lg border border-border bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wider text-[10px] text-[var(--in-progress)]">
              Flow
            </span>
            {listSteps.map((step, index) => (
              <span key={step.title} className="inline-flex items-center gap-2">
                {index > 0 && <ArrowRight className="h-3 w-3 opacity-40" />}
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <step.icon className="h-3.5 w-3.5 text-[var(--in-progress)]" />
                  {step.title.replace(" a topic", "").replace(" your desk", "").replace(" proof", "")}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {focusTopic && ctaLabel && (
              <Link
                to="/topic/$topicId"
                params={{ topicId: focusTopic.id }}
                search={
                  focusTopic.roadmapNodeId
                    ? { from: "/roadmap", nodeId: focusTopic.roadmapNodeId }
                    : { from: "/roadmap" }
                }
                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--in-progress)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {ctaLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={() => setCompactMode(false)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              How it works
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[var(--in-progress)]/25 bg-gradient-to-br from-[var(--surface-2)] via-card to-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--in-progress)] mb-1">
            How GrowthOS works
          </div>
          <h2 className="text-lg font-semibold tracking-tight">
            Map → Desk → Proof → Next topic
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            The roadmap is your compass. Each node opens a desk where you prove you learned it —
            then the path unlocks forward.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCompactMode(true)}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
        >
          Collapse
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {listSteps.map((step, index) => (
          <li
            key={step.title}
            className="relative rounded-md border border-border bg-card/80 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--in-progress)]/15 text-[11px] font-bold text-[var(--in-progress)]">
                {index + 1}
              </span>
              <step.icon className="h-4 w-4 text-[var(--in-progress)]" />
              <span className="text-sm font-semibold">{step.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-[var(--surface)] px-4 py-3">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Proof checklist: </span>
          Read resource · Write notes · Quick quiz · Build something small
        </div>
        {focusTopic && ctaLabel ? (
          <Link
            to="/topic/$topicId"
            params={{ topicId: focusTopic.id }}
            search={
              focusTopic.roadmapNodeId
                ? { from: "/roadmap", nodeId: focusTopic.roadmapNodeId }
                : { from: "/roadmap" }
            }
            className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {visualMap ? "Click a node on the map to begin" : "Open the first unlocked topic below"}
          </span>
        )}
      </div>
    </section>
  );
}
