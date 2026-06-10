import type { GrowthTopicStatus } from "@/lib/roadmap-layout/types";
import { StatusBadge } from "@/components/growth/shared";
import { ExternalLink } from "lucide-react";

export type HoverNodeInfo = {
  nodeId: string;
  label: string;
  type: string;
  topicId: string | null;
  status?: GrowthTopicStatus;
  proofDone?: number;
  mapped: boolean;
  extras?: { userResources: number; hasCapture: boolean };
};

export function NodeHoverCard({
  info,
  position,
  onOpenDesk,
}: {
  info: HoverNodeInfo;
  position: { x: number; y: number };
  onOpenDesk: () => void;
}) {
  return (
    <div
      className="pointer-events-auto absolute z-50 w-64 rounded-lg border border-border bg-card/95 p-3 shadow-xl backdrop-blur-md"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
        {info.type} {!info.mapped && "· explore"}
      </div>
      <div className="text-sm font-semibold leading-snug">{info.label}</div>
      {info.status && (
        <div className="mt-2">
          <StatusBadge status={info.status} />
        </div>
      )}
      {info.proofDone !== undefined && info.mapped && (
        <div className="mt-2 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < (info.proofDone ?? 0) ? "bg-[var(--completed)]" : "bg-[var(--muted)]"}`}
            />
          ))}
        </div>
      )}
      {info.extras && (info.extras.userResources > 0 || info.extras.hasCapture) && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          {info.extras.userResources > 0 && `${info.extras.userResources} your links · `}
          {info.extras.hasCapture && "capture workflow saved"}
        </div>
      )}
      <button
        type="button"
        onClick={onOpenDesk}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-md bg-[var(--in-progress)] text-white hover:opacity-90"
      >
        Open desk
        <ExternalLink className="w-3 h-3" />
      </button>
    </div>
  );
}

export function RoadmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded border border-border bg-[var(--roadmap-topic)]" />
        Topic
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded border border-border bg-[var(--roadmap-subtopic)]" />
        Subtopic
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[var(--completed)]" />
        Done
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[var(--in-progress)]" />
        In progress
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-3 rounded-full bg-[var(--locked)]" />
        Locked
      </span>
    </div>
  );
}
