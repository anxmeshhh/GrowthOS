import type { GrowthTopicStatus } from "@/lib/roadmap-layout/types";
import { StatusBadge } from "@/components/growth/shared";
import { ExternalLink, Lock } from "lucide-react";

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
      {info.status === "locked" ? (
        <p className="mt-3 flex items-start gap-2 rounded-md border border-border bg-[var(--surface-2)] px-3 py-2 text-[11px] leading-snug text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Finish the previous topic&apos;s proof (Read → Write → Check → Build) to unlock this one.
        </p>
      ) : (
        <>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Opens your desk — complete all four proof checks to unlock what&apos;s next.
          </p>
          <button
            type="button"
            onClick={onOpenDesk}
            className="mt-2 w-full btn-mission btn-mission-sm justify-center"
          >
            Open desk
            <ExternalLink className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  );
}

export function RoadmapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-600">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded border-2 border-black bg-[#ffffa5]" />
        Topic
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-5 rounded border-2 border-black bg-[#ffe8a3]" />
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
