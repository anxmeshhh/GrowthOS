import { memo, type CSSProperties } from "react";
import { type NodeProps, type Node } from "@xyflow/react";
import { Check, Lock } from "lucide-react";
import { LegendBadge } from "./legend-badge";
import { RoadmapHandles } from "./handles";
import type { GrowthTopicStatus, RoadmapNodeData } from "@/lib/roadmap-layout/types";

type RoadmapNode = Node<RoadmapNodeData, string>;

const ROADMAP_FONT = "Inter, system-ui, sans-serif";

function nodeSize(props: NodeProps<RoadmapNode>) {
  const width = props.width ?? props.data?.style?.width ?? props.measured?.width ?? 160;
  const height = props.height ?? props.measured?.height ?? 48;
  return { width: Number(width), height: Number(height) };
}

function statusSurface(status?: GrowthTopicStatus, selected = false, isSubtopic = false) {
  if (selected) {
    return "bg-[var(--in-progress)] text-white border-[var(--in-progress)] shadow-[0_0_12px_rgba(59,130,246,0.35)]";
  }
  const base = isSubtopic
    ? "bg-[var(--roadmap-subtopic)] text-[var(--foreground)] border-[var(--border)]"
    : "bg-[var(--roadmap-topic)] text-[var(--foreground)] border-[var(--border)]";

  switch (status) {
    case "completed":
      return `${base} ring-2 ring-[var(--completed)] shadow-[0_0_8px_rgba(16,185,129,0.25)]`;
    case "in_progress":
      return `${base} ring-2 ring-[var(--in-progress)] animate-pulse`;
    case "available":
      return `${base} border-[var(--available)]/40`;
    case "locked":
      return "bg-[var(--muted)] text-[var(--muted-foreground)] border-[var(--border)] opacity-60";
    default:
      return base;
  }
}

function GrowthStatusDot({ status }: { status?: GrowthTopicStatus }) {
  if (!status || status === "available") return null;

  const color =
    status === "completed"
      ? "bg-[var(--completed)]"
      : status === "in_progress"
        ? "bg-[var(--in-progress)]"
        : "bg-[var(--locked)]";

  return (
    <span
      className={`absolute -left-2 -top-2 grid h-5 w-5 place-items-center rounded-full text-white shadow-md ${color}`}
    >
      {status === "locked" ? (
        <Lock className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" strokeWidth={3} />
      )}
    </span>
  );
}

const nodeShell = "relative flex items-center justify-center rounded-md border px-3 py-2 text-center font-medium transition-colors";

function TopicNode(props: NodeProps<RoadmapNode>) {
  const { data, selected } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 15);
  const surface = data.growthStatus
    ? statusSurface(data.growthStatus, selected, false)
    : selected
      ? statusSurface(undefined, true, false)
      : statusSurface(undefined, false, false);

  return (
    <div
      className={`${nodeShell} ${surface}`}
      style={{ width, minHeight: height, fontSize, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      <GrowthStatusDot status={data.growthStatus} />
      {data.label}
    </div>
  );
}

function SubtopicNode(props: NodeProps<RoadmapNode>) {
  const { data, selected } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 14);
  const surface = data.growthStatus
    ? statusSurface(data.growthStatus, selected, true)
    : selected
      ? statusSurface(undefined, true, true)
      : statusSurface(undefined, false, true);

  return (
    <div
      className={`${nodeShell} ${surface}`}
      style={{ width, minHeight: height, fontSize, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      {data.legend ? (
        <LegendBadge color={data.legend.color} position={data.legend.position} />
      ) : null}
      <GrowthStatusDot status={data.growthStatus} />
      <span className="leading-tight">{data.label}</span>
    </div>
  );
}

function ButtonNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 14);

  const className = `${nodeShell} bg-[var(--roadmap-button)] text-white border-[var(--in-progress)]/50 hover:border-[var(--in-progress)] shadow-[0_0_8px_rgba(59,130,246,0.15)]`;

  return (
    <div style={{ width, minHeight: height }}>
      <RoadmapHandles />
      {data.href ? (
        <a
          href={data.href}
          target="_blank"
          rel="noreferrer"
          className={className}
          style={{ fontSize, fontFamily: ROADMAP_FONT, minHeight: height }}
          onClick={(e) => e.stopPropagation()}
        >
          {data.label}
        </a>
      ) : (
        <div className={className} style={{ fontSize, fontFamily: ROADMAP_FONT, minHeight: height }}>
          {data.label}
        </div>
      )}
    </div>
  );
}

function SectionNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 15);

  return (
    <div
      className="relative rounded-lg border border-[var(--roadmap-section-border)] bg-[var(--roadmap-section)] shadow-inner"
      style={{ width, minHeight: height, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      {data.label ? (
        <div
          className="px-3 py-2 text-center font-semibold text-[var(--foreground)]"
          style={{ fontSize }}
        >
          {data.label}
        </div>
      ) : null}
    </div>
  );
}

function ParagraphNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 13);

  return (
    <div
      className="relative rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 font-normal leading-snug text-[var(--muted-foreground)]"
      style={{ width, minHeight: height, fontSize, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      {data.label}
    </div>
  );
}

function LabelNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 14);

  return (
    <div
      className="relative flex items-center justify-center text-center font-semibold text-[var(--muted-foreground)]"
      style={{ width, minHeight: height, fontSize, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      {data.label}
    </div>
  );
}

function TitleNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 24);

  return (
    <div
      className="relative flex items-center justify-center text-center font-bold text-[var(--foreground)]"
      style={{ width, minHeight: height, fontSize, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      {data.label}
    </div>
  );
}

function LegendNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);

  return (
    <div
      className="relative rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
      style={{ width, minHeight: height, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      <div className="space-y-1.5 text-[12px] font-medium leading-tight text-[var(--muted-foreground)]">
        {data.legends?.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-white"
              style={{ backgroundColor: item.color }}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineNode({
  direction,
  style,
  width,
  height,
}: {
  direction: "vertical" | "horizontal";
  style?: CSSProperties;
  width: number;
  height: number;
}) {
  const stroke = String(style?.stroke ?? "var(--roadmap-edge)");
  const strokeWidth = Number(style?.strokeWidth ?? 2.5);
  const strokeDasharray = String(style?.strokeDasharray ?? "0.8 8");

  if (direction === "vertical") {
    return (
      <svg width={width} height={height} className="overflow-visible">
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={height}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <line
        x1={0}
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeLinecap="round"
      />
    </svg>
  );
}

function VerticalNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);

  return (
    <div style={{ width, height }}>
      <RoadmapHandles />
      <LineNode direction="vertical" style={data.style as CSSProperties} width={width} height={height} />
    </div>
  );
}

function HorizontalNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);

  return (
    <div style={{ width, height }}>
      <RoadmapHandles />
      <LineNode
        direction="horizontal"
        style={data.style as CSSProperties}
        width={width}
        height={height}
      />
    </div>
  );
}

export const roadmapNodeTypes = {
  topic: memo(TopicNode),
  subtopic: memo(SubtopicNode),
  button: memo(ButtonNode),
  section: memo(SectionNode),
  paragraph: memo(ParagraphNode),
  label: memo(LabelNode),
  title: memo(TitleNode),
  legend: memo(LegendNode),
  vertical: memo(VerticalNode),
  horizontal: memo(HorizontalNode),
};
