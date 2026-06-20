import { useMemo, useState, useCallback, memo } from "react";
import { Link } from "@tanstack/react-router";
import { RoadmapNode, NodeKind } from "./RoadmapNode";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

type RoadmapTreeProps = {
  topics: any[];
};

type TreeNode = {
  id: string;
  kind: NodeKind;
  originalY: number;
  data: any;
  children: TreeNode[];
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = memo(function SectionHeader({
  node,
  isOpen,
  onToggle,
}: {
  node: TreeNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-md transition-colors duration-150"
      style={{
        background: isOpen ? "#0d1428" : "#0a0f1e",
        border: "1.5px solid #3b5bdb",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "#0d1428";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = isOpen ? "#0d1428" : "#0a0f1e";
      }}
    >
      <span
        className="font-mono font-semibold tracking-wide flex items-center gap-1.5"
        style={{
          fontSize: "11px",
          color: node.data.status === "completed" ? "#22c55e" : "#60a5fa",
        }}
      >
        {node.data.status === "completed" && <CheckCircle2 size={12} strokeWidth={2.5} />}
        {node.data.label}
      </span>
      <span className="ml-auto shrink-0" style={{ color: "#3b5bdb" }}>
        {isOpen ? (
          <ChevronDown size={12} strokeWidth={2} />
        ) : (
          <ChevronRight size={12} strokeWidth={2} />
        )}
      </span>
    </button>
  );
});

// ─── Tree branch ──────────────────────────────────────────────────────────────

const TreeBranch = memo(function TreeBranch({ node, depth, isFirst, isLast }: { node: TreeNode; depth: number; isFirst?: boolean; isLast?: boolean }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  const handleToggle = useCallback(() => setOpen((v) => !v), []);

  if (node.kind === "note" || node.kind === "callout") return null;

  const indent = depth * 20;
  const connectorColor = "#1e3a1e";

  // Top-level milestone
  if (node.kind === "milestone" && depth === 0) {
    const isCompleted = node.data.status === "completed";
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px flex-1" style={{ background: "#1a2a40" }} />
          <Link
            to="/topic/$topicId"
            params={{ topicId: node.data.topicId }}
            className="no-underline"
          >
            <span
              className="font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{
                fontSize: "10px",
                color: isCompleted ? "#4ade80" : "#60a5fa",
                background: isCompleted ? "#061a0f" : "#0a0f1e",
                border: `1px solid ${isCompleted ? "#22c55e" : "#3b5bdb"}`,
              }}
            >
              {isCompleted && <CheckCircle2 size={11} strokeWidth={3} />}
              {node.data.label}
            </span>
          </Link>
          <div className="h-px flex-1" style={{ background: "#1a2a40" }} />
        </div>
        {hasChildren && (
          <div className="space-y-1 pl-2">
            {node.children.map((child, idx) => (
              <TreeBranch key={child.id} node={child} depth={1} isFirst={idx === 0} isLast={idx === node.children.length - 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // All other nodes
  return (
    <div className="relative">
      {depth > 0 && (
        <>
          <span
            className="absolute"
            style={{ 
              left: indent - 13, 
              top: isFirst ? -16 : -4, 
              bottom: isLast ? "auto" : 0, 
              height: isLast ? (isFirst ? 35 : 23) : "auto",
              width: 1, 
              background: connectorColor 
            }}
            aria-hidden
          />
          <span
            className="absolute"
            style={{ left: indent - 13, top: 18, width: 13, height: 1, background: connectorColor }}
            aria-hidden
          />
        </>
      )}

      <div style={{ paddingLeft: indent }}>
        {node.kind === "milestone" && depth > 0 ? (
          <SectionHeader node={node} isOpen={open} onToggle={handleToggle} />
        ) : (
          <Link
            to="/topic/$topicId"
            params={{ topicId: node.data.topicId }}
            className="block no-underline"
          >
            <RoadmapNode data={{ ...node.data, isTreeMode: true }} />
          </Link>
        )}
      </div>

      {hasChildren && open && (
        <div className="mt-1 space-y-1">
          {node.children.map((child, idx) => (
            <TreeBranch key={child.id} node={child} depth={depth + 1} isFirst={idx === 0} isLast={idx === node.children.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
});

function LegendItem({ kind, label }: { kind: NodeKind; label: string }) {
  const colors: Record<string, { border: string; bg: string; borderStyle: string }> = {
    topic: { border: "#2a3a1e", bg: "#0f120a", borderStyle: "solid" },
    milestone: { border: "#3b5bdb", bg: "#0a0f1e", borderStyle: "solid" },
    optional: { border: "#263840", bg: "#0d0d0d", borderStyle: "dashed" },
  };
  const c = colors[kind] ?? colors.topic;
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-5 h-3 rounded-sm"
        style={{ background: c.bg, border: `1px ${c.borderStyle} ${c.border}` }}
      />
      <span style={{ fontSize: "10px", color: "#3a4a3a", fontFamily: "monospace" }}>{label}</span>
    </div>
  );
}

export function RoadmapTree({ topics = [] }: RoadmapTreeProps) {
  const forest = useMemo(() => {
    const sorted = [...topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const roots: TreeNode[] = [];
    let currentMilestone: TreeNode | null = null;

    sorted.forEach((t) => {
      const kind = t.node_kind || "topic";
      const bgColor =
        kind === "milestone" ? "#ffee55" : kind === "optional" ? "#e0e0e0" : "#ffdfb3";

      const node: TreeNode = {
        id: String(t.id),
        kind,
        originalY: t.order ?? 0,
        data: {
          label: t.title,
          topicId: String(t.id),
          status: t.user_progress || "available",
          bgColor,
          textColor: "#000000",
          aiScore: t.verified_project?.ai_score,
        },
        children: [],
      };

      if (kind === "milestone") {
        currentMilestone = node;
        roots.push(node);
      } else {
        if (currentMilestone) {
          currentMilestone.children.push(node);
        } else {
          roots.push(node);
        }
      }
    });

    // Auto-mark milestones as completed if all their child topics are completed
    roots.forEach((root) => {
      if (root.kind === "milestone" && root.children.length > 0) {
        const allCompleted = root.children.every((c) => c.data.status === "completed");
        if (allCompleted) {
          root.data.status = "completed";
        }
      }
    });

    return roots;
  }, [topics]);

  return (
    <div
      className="w-full h-full overflow-y-auto overflow-x-hidden"
      style={{ background: "#080c08", scrollbarWidth: "thin", scrollbarColor: "#1e3a1e #080c08" }}
    >
      <div
        className="sticky top-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 border-b"
        style={{
          background: "rgba(8,12,8,0.96)",
          backdropFilter: "blur(8px)",
          borderColor: "#111a11",
        }}
      >
        <LegendItem kind="topic" label="Recommended" />
        <LegendItem kind="milestone" label="Milestone" />
        <LegendItem kind="optional" label="Optional" />
        <div className="ml-auto flex items-center gap-1.5">
          <CheckCircle2 size={12} style={{ color: "#22c55e" }} strokeWidth={2} />
          <span style={{ fontSize: "10px", color: "#444", fontFamily: "monospace" }}>
            completed
          </span>
        </div>
      </div>

      <div className="p-4 pb-16 space-y-1">
        {forest.map((root, idx) => (
          <TreeBranch key={root.id} node={root} depth={0} isFirst={idx === 0} isLast={idx === forest.length - 1} />
        ))}
      </div>
    </div>
  );
}
