import { CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { Handle, Position } from "@xyflow/react";
import { memo } from "react";

export type RoadmapNodeData = {
  label: string;
  topicId: string;
  status: "available" | "in_progress" | "completed";
  bgColor?: string;
  textColor?: string;
  width?: number;
  height?: number;

  // Tree expansion props
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (nodeId: string) => void;
  isTreeMode?: boolean;
  aiScore?: number;
};

export type NodeKind = "topic" | "milestone" | "optional" | "note" | "callout";

export function getKind(bgColor?: string): NodeKind {
  if (!bgColor) return "topic";
  const c = bgColor.toLowerCase();
  if (c === "#ffee55") return "milestone";
  if (c === "#4147d3") return "milestone";
  if (c === "#343434") return "callout";
  if (c === "#ffffff") return "note";
  if (c === "#e0e0e0") return "optional";
  return "topic";
}

type S = {
  bg: string;
  bgHov: string;
  border: string;
  bdStyle: "solid" | "dashed";
  text: string;
  dot: string;
  opacity: string;
};

function resolveStyles(kind: NodeKind, status: string): S {
  const isCompleted = status === "completed";
  const isInProgress = status === "in_progress";
  if (kind === "milestone")
    return {
      bg: isCompleted ? "#0a1a2e" : "#0a0f1e",
      bgHov: "#0d1428",
      border: isCompleted ? "#60a5fa" : "#3b5bdb",
      bdStyle: "solid",
      text: isCompleted ? "#93c5fd" : "#60a5fa",
      dot: isCompleted ? "#60a5fa" : "#3b5bdb",
      opacity: "1",
    };
  if (kind === "optional")
    return {
      bg: isCompleted ? "#0d1a1f" : "#0d0d0d",
      bgHov: "#101418",
      border: isCompleted ? "#22d3ee" : "#2a3a40",
      bdStyle: "dashed",
      text: isCompleted ? "#67e8f9" : "#4a6a70",
      dot: isCompleted ? "#22d3ee" : "#2a3a40",
      opacity: "1",
    };
  if (isInProgress)
    return {
      bg: "#1a1305",
      bgHov: "#1f1708",
      border: "#f59e0b",
      bdStyle: "solid",
      text: "#fbbf24",
      dot: "#f59e0b",
      opacity: "1",
    };
  return {
    bg: isCompleted ? "#0c1a07" : "#0f120a",
    bgHov: "#151f0e",
    border: isCompleted ? "#22c55e" : "#2a3a1e",
    bdStyle: "solid",
    text: isCompleted ? "#4ade80" : "#a8c078",
    dot: isCompleted ? "#22c55e" : "#4a6a2a",
    opacity: "1",
  };
}

// FIX #3: Use CSS variables + a data-attribute hover trick so the browser
// handles hover purely in CSS — no JS style mutations, no reflow storms.
// We inject a <style> once per unique style combination via a CSS custom-property
// approach embedded directly in the element's style attribute so Tailwind JIT
// stays out of it, and we use a plain CSS :hover pseudo-class via a wrapper
// <style> tag appended once to <head> (lazy singleton).

let _hoverStyleInjected = false;
function ensureHoverStyle() {
  if (_hoverStyleInjected) return;
  _hoverStyleInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    .rmn-btn:hover:not(:disabled) {
      background: var(--rmn-bg-hov) !important;
    }
  `;
  document.head.appendChild(style);
}

export const RoadmapNode = memo(function RoadmapNode({
  data,
  onClick,
}: {
  data: RoadmapNodeData;
  onClick?: () => void;
}) {
  ensureHoverStyle();

  const isCompleted = data.status === "completed";
  const isInProgress = data.status === "in_progress";
  const kind = getKind(data.bgColor);

  if (kind === "note" || kind === "callout") return null;

  const s = resolveStyles(kind, data.status);

  return (
    <div className="relative" style={{ width: "100%", height: "100%" }}>
      {!data.isTreeMode && (
        <Handle type="target" position={Position.Top} className="!opacity-0 !w-1 !h-1" />
      )}

      <button
        onClick={onClick}
        className="rmn-btn flex items-center gap-2 text-left px-3 py-[7px] rounded-[4px] transition-colors duration-100 select-none cursor-pointer"
        style={
          {
            // FIX #3: pass bg-hover as a CSS variable so :hover rule above can use it
            "--rmn-bg-hov": s.bgHov,
            background: s.bg,
            border: `1px ${s.bdStyle} ${s.border}`,
            opacity: s.opacity,
            width: "100%",
            height: "100%",
          } as React.CSSProperties
        }
      >
        <span className="shrink-0 w-[14px] flex items-center justify-center">
          {isCompleted ? (
            <CheckCircle2 size={12} style={{ color: s.dot }} strokeWidth={2.5} />
          ) : isInProgress ? (
            <span
              className="w-[10px] h-[10px] rounded-full animate-pulse"
              style={{ background: "#f59e0b" }}
            />
          ) : (
            <Circle size={11} style={{ color: s.dot }} strokeWidth={1.5} />
          )}
        </span>
        <span
          className="flex-1 font-mono font-medium leading-snug"
          style={{ fontSize: "12px", color: s.text }}
        >
          {data.label}
        </span>
        {isCompleted && data.aiScore !== undefined && (
          <span className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-[#162a16] border border-[#22c55e]/30 text-[#4ade80] ml-2 shrink-0 flex items-center shadow-sm">
            ★ {data.aiScore}
          </span>
        )}
      </button>

      {data.hasChildren && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#111] border border-[#666] hover:bg-[#222] hover:border-[#fff] transition-colors shadow-md z-10"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.(data.topicId);
          }}
        >
          {data.isExpanded ? (
            <ChevronDown size={14} className="text-[#a0a0a0]" />
          ) : (
            <ChevronRight size={14} className="text-[#a0a0a0]" />
          )}
        </button>
      )}

      {!data.isTreeMode && (
        <Handle type="source" position={Position.Bottom} className="!opacity-0 !w-1 !h-1" />
      )}
    </div>
  );
});
