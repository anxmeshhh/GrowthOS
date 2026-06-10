import { memo, type CSSProperties } from "react";
import { type NodeProps, type Node } from "@xyflow/react";
import { Check, Lock } from "lucide-react";
import { LegendBadge } from "./legend-badge";
import { RoadmapHandles } from "./handles";
import type { GrowthTopicStatus, RoadmapNodeData } from "@/lib/roadmap-layout/types";

type RoadmapNode = Node<RoadmapNodeData, string>;

const ROADMAP_FONT = '"Balsamiq Sans", "Varela Round", "Segoe UI", sans-serif';

function nodeSize(props: NodeProps<RoadmapNode>) {
  const width = props.width ?? props.data?.style?.width ?? props.measured?.width ?? 160;
  const height = props.height ?? props.measured?.height ?? 48;
  return { width: Number(width), height: Number(height) };
}

function statusSurface(status?: GrowthTopicStatus, selected = false) {
  if (selected) return "bg-[var(--in-progress)] text-white";
  switch (status) {
    case "completed":
      return "bg-[#d7f5e5] text-black ring-2 ring-[var(--completed)]";
    case "in_progress":
      return "bg-[#dbeafe] text-black ring-2 ring-[var(--in-progress)]";
    case "available":
      return "bg-[#ffe8a3] text-black";
    case "locked":
      return "bg-[#ececec] text-zinc-500 opacity-70";
    default:
      return "bg-[#ffffa5] text-black";
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
      className={`absolute -left-2 -top-2 grid h-5 w-5 place-items-center rounded-full text-white ${color}`}
    >
      {status === "locked" ? (
        <Lock className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" strokeWidth={3} />
      )}
    </span>
  );
}

function TopicNode(props: NodeProps<RoadmapNode>) {
  const { data, selected } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 17);
  const surface = data.growthStatus
    ? statusSurface(data.growthStatus, selected)
    : selected
      ? "bg-[var(--in-progress)] text-white"
      : "bg-[#ffffa5] text-black";

  return (
    <div
      className={`relative flex items-center justify-center rounded-md border-2 border-black px-3 py-2 text-center font-semibold shadow-[2px_2px_0_#00000014] ${surface}`}
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
  const fontSize = Number(data.style?.fontSize ?? 17);
  const surface = data.growthStatus
    ? statusSurface(data.growthStatus, selected)
    : selected
      ? "bg-[var(--in-progress)] text-white"
      : "bg-[#ffe8a3] text-black";

  return (
    <div
      className={`relative flex items-center justify-center rounded-md border-2 border-black px-3 py-2 text-center font-semibold shadow-[2px_2px_0_#00000014] transition-colors ${surface}`}
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
  const fontSize = Number(data.style?.fontSize ?? 17);
  const bg = data.backgroundColor ?? "#4136d4";
  const color = data.color ?? "#ffffff";

  return (
    <div style={{ width, minHeight: height }}>
      <RoadmapHandles />
      {data.href ? (
        <a
          href={data.href}
          target="_blank"
          rel="noreferrer"
          className="flex h-full w-full items-center justify-center rounded-md border-2 border-black px-4 py-2 text-center font-semibold shadow-[2px_2px_0_#00000014]"
          style={{ backgroundColor: bg, color, fontSize, fontFamily: ROADMAP_FONT }}
        >
          {data.label}
        </a>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-md border-2 border-black px-4 py-2 text-center font-semibold shadow-[2px_2px_0_#00000014]"
          style={{ backgroundColor: bg, color, fontSize, fontFamily: ROADMAP_FONT }}
        >
          {data.label}
        </div>
      )}
    </div>
  );
}

function SectionNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 17);
  const bg = data.style?.backgroundColor ?? "#ffffff";

  return (
    <div
      className="relative rounded-md border-2 border-black shadow-[2px_2px_0_#00000014]"
      style={{
        width,
        minHeight: height,
        backgroundColor: String(bg),
        fontFamily: ROADMAP_FONT,
      }}
    >
      <RoadmapHandles />
      {data.label ? (
        <div className="px-3 py-2 text-center font-semibold text-black" style={{ fontSize }}>
          {data.label}
        </div>
      ) : null}
    </div>
  );
}

function ParagraphNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 15);
  const bg = data.style?.backgroundColor ?? "#ffffff";

  return (
    <div
      className="relative rounded-md border-2 border-black px-3 py-2 font-medium leading-snug text-black shadow-[2px_2px_0_#00000014]"
      style={{
        width,
        minHeight: height,
        backgroundColor: String(bg),
        fontSize,
        fontFamily: ROADMAP_FONT,
      }}
    >
      <RoadmapHandles />
      {data.label}
    </div>
  );
}

function LabelNode(props: NodeProps<RoadmapNode>) {
  const { data } = props;
  const { width, height } = nodeSize(props);
  const fontSize = Number(data.style?.fontSize ?? 15);

  return (
    <div
      className="relative flex items-center justify-center text-center font-bold text-black"
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
  const fontSize = Number(data.style?.fontSize ?? 28);

  return (
    <div
      className="relative flex items-center justify-center text-center font-bold text-black"
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
      className="relative rounded-md border-2 border-black bg-white px-3 py-2.5 shadow-[2px_2px_0_#00000014]"
      style={{ width, minHeight: height, fontFamily: ROADMAP_FONT }}
    >
      <RoadmapHandles />
      <div className="space-y-1.5 text-[13px] font-semibold leading-tight text-black">
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
  const stroke = String(style?.stroke ?? "#2B78E4");
  const strokeWidth = Number(style?.strokeWidth ?? 3.5);
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
