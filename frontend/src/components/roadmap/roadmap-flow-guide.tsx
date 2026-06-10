import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Unlock,
} from "lucide-react";
import { FlowStrip, MissionButton } from "@/components/growth/direction-card";
import { inferSessionPhase } from "@/lib/session-phase";
import type { FocusTopic } from "@/lib/focus-topic";
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

type RoadmapFlowGuideProps = {
  focusTopic: FocusTopic | null;
  visualMap: boolean;
  completedCount: number;
};

export function RoadmapFlowGuide({
  focusTopic,
  visualMap,
  completedCount,
}: RoadmapFlowGuideProps) {
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined") return completedCount === 0;
    if (completedCount === 0) return true;
    return localStorage.getItem(COMPACT_KEY) !== "1";
  });

  const setExpandedMode = (value: boolean) => {
    setExpanded(value);
    localStorage.setItem(COMPACT_KEY, value ? "0" : "1");
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

  if (!expanded) {
    return (
      <section className="section-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <FlowStrip compact />
        <div className="flex items-center gap-2">
          {focusTopic && ctaLabel && (
            <MissionButton
              to="/topic/$topicId"
              params={{ topicId: focusTopic.id }}
              search={
                focusTopic.roadmapNodeId
                  ? { from: "/roadmap", nodeId: focusTopic.roadmapNodeId }
                  : { from: "/roadmap" }
              }
              size="sm"
            >
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </MissionButton>
          )}
          <button
            type="button"
            onClick={() => setExpandedMode(true)}
            className="btn-ghost text-muted-foreground hover:text-foreground"
          >
            How it works
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mission-label mb-1">How GrowthOS works</div>
          <h2 className="text-lg font-semibold tracking-tight">Map → Desk → Proof → Next</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            One direction at a time. The map shows where you are; proof — not passive watching —
            builds real confidence.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpandedMode(false)}
          className="btn-ghost text-muted-foreground hover:text-foreground shrink-0"
        >
          Collapse
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {listSteps.map((step, index) => (
          <li key={step.title} className="rounded-lg border border-border bg-[var(--surface)] p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500/15 text-[11px] font-bold text-amber-400">
                {index + 1}
              </span>
              <step.icon className="h-4 w-4 text-amber-400/90" />
              <span className="text-sm font-semibold">{step.title}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-[var(--surface-2)] px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Proof = confidence: </span>
          read a resource · write it in your words · pass a quick check · build something small
        </p>
        {focusTopic && ctaLabel ? (
          <MissionButton
            to="/topic/$topicId"
            params={{ topicId: focusTopic.id }}
            search={
              focusTopic.roadmapNodeId
                ? { from: "/roadmap", nodeId: focusTopic.roadmapNodeId }
                : { from: "/roadmap" }
            }
            size="sm"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </MissionButton>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {visualMap ? "Click a node on the map below" : "Open the first unlocked topic"}
          </span>
        )}
      </div>
    </section>
  );
}

// Re-export for roadmap page typing compatibility
export type { FocusTopic as RoadmapFlowTopic };
