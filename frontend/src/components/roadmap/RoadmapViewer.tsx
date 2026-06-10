import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { roadmapNodeTypes } from "./nodes";
import { NodeHoverCard, RoadmapLegend, type HoverNodeInfo } from "./node-hover-card";
import { filterRoadmapNodes } from "@/lib/roadmap-layout/filters";
import type {
  GrowthTopicStatus,
  RoadmapDocument,
  RoadmapFlowEdge,
  RoadmapFlowNode,
} from "@/lib/roadmap-layout/types";

type RoadmapViewerProps = {
  document: RoadmapDocument;
  topicStatusesByNodeId?: Record<string, GrowthTopicStatus>;
  nodeToTopicId?: Record<string, string>;
  topicProofByNodeId?: Record<string, number>;
  topicExtrasByNodeId?: Record<string, { userResources: number; hasCapture: boolean }>;
  onNodeClick?: (node: RoadmapFlowNode, topicId: string | null) => void;
  activeNodeId?: string | null;
  pathKey?: string;
};

function resolveGrowthStatus(
  node: RoadmapFlowNode,
  topicStatusesByNodeId: Record<string, GrowthTopicStatus>,
): GrowthTopicStatus | undefined {
  if (!["topic", "subtopic"].includes(node.type)) return undefined;
  return topicStatusesByNodeId[node.id];
}

function toFlowNodes(
  nodes: RoadmapFlowNode[],
  topicStatusesByNodeId: Record<string, GrowthTopicStatus>,
  activeNodeId?: string | null,
): Node[] {
  return nodes.map((node) => {
    const growthStatus = resolveGrowthStatus(node, topicStatusesByNodeId);
    const isClickable = ["topic", "subtopic", "button"].includes(node.type);

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: "",
        ...node.data,
        growthStatus,
        clickable: isClickable,
      },
      width: node.measured?.width ?? node.width,
      height: node.measured?.height ?? node.height,
      zIndex:
        node.type === "vertical" || node.type === "horizontal"
          ? 1
          : node.type === "section"
            ? 4
            : node.type === "paragraph" || node.type === "label"
              ? 6
              : 10,
      draggable: false,
      selectable: isClickable,
      selected: activeNodeId === node.id,
    };
  });
}

function toFlowEdges(edges: RoadmapFlowEdge[], visibleNodeIds: Set<string>): Edge[] {
  return edges
    .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: "smoothstep",
      animated: false,
      style: {
        stroke: String(edge.style?.stroke ?? "#3f3f46"),
        strokeWidth: Number(edge.style?.strokeWidth ?? 2.5),
        strokeDasharray: edge.data?.edgeStyle === "dashed" ? "0.8 8" : "0",
        strokeLinecap: "round",
      },
      zIndex: 5,
    }));
}

function RoadmapViewport({
  document,
  pathKey,
}: {
  document: RoadmapDocument;
  pathKey?: string;
}) {
  const { fitView, setViewport, getViewport } = useReactFlow();
  const storageKey = pathKey ? `growthos_roadmap_vp_${pathKey}` : null;

  useEffect(() => {
    const saved = storageKey ? sessionStorage.getItem(storageKey) : null;
    if (saved) {
      try {
        const vp = JSON.parse(saved);
        setViewport(vp);
        return;
      } catch {
        /* fall through */
      }
    }
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.12, minZoom: 0.35, maxZoom: 1.2 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [document.slug, fitView, setViewport, storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    const save = () => {
      sessionStorage.setItem(storageKey, JSON.stringify(getViewport()));
    };
    window.addEventListener("beforeunload", save);
    return () => {
      save();
      window.removeEventListener("beforeunload", save);
    };
  }, [storageKey, getViewport]);

  return null;
}

function RoadmapCanvas({
  document,
  topicStatusesByNodeId = {},
  nodeToTopicId = {},
  topicProofByNodeId = {},
  topicExtrasByNodeId = {},
  onNodeClick,
  activeNodeId,
  pathKey,
}: RoadmapViewerProps) {
  const { setCenter } = useReactFlow();
  const [hoverInfo, setHoverInfo] = useState<HoverNodeInfo | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 16, y: 16 });

  const visibleNodes = useMemo(() => filterRoadmapNodes(document.nodes), [document.nodes]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const nodes = useMemo(
    () => toFlowNodes(visibleNodes, topicStatusesByNodeId, activeNodeId),
    [visibleNodes, topicStatusesByNodeId, activeNodeId],
  );
  const edges = useMemo(
    () => toFlowEdges(document.edges, visibleNodeIds),
    [document.edges, visibleNodeIds],
  );

  const topicProofCounts = topicProofByNodeId;

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const original = visibleNodes.find((item) => item.id === node.id);
      if (!original?.data?.label?.trim()) return;
      if (!["topic", "subtopic", "button"].includes(original.type)) return;
      const topicId = nodeToTopicId[node.id] ?? null;
      onNodeClick?.(original, topicId);
    },
    [visibleNodes, onNodeClick, nodeToTopicId],
  );

  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (event, node) => {
      const original = visibleNodes.find((item) => item.id === node.id);
      if (!original?.data?.label?.trim()) return;
      if (!["topic", "subtopic", "button"].includes(original.type)) return;

      const topicId = nodeToTopicId[node.id] ?? null;
      const rect = (event.target as HTMLElement).closest(".roadmap-canvas")?.getBoundingClientRect();
      const x = rect ? event.clientX - rect.left + 12 : 16;
      const y = rect ? event.clientY - rect.top + 12 : 16;

      setHoverPos({ x: Math.min(x, (rect?.width ?? 400) - 280), y });
      setHoverInfo({
        nodeId: node.id,
        label: original.data.label!,
        type: original.type,
        topicId,
        status: topicStatusesByNodeId[node.id],
        proofDone: topicProofCounts[node.id],
        mapped: Boolean(topicId),
        extras: topicExtrasByNodeId[node.id],
      });
    },
    [visibleNodes, nodeToTopicId, topicStatusesByNodeId, topicProofCounts, topicExtrasByNodeId],
  );

  const handleSectionZoom = useCallback(
    (node: RoadmapFlowNode) => {
      const w = node.measured?.width ?? node.width ?? 200;
      const h = node.measured?.height ?? node.height ?? 100;
      setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: 0.85, duration: 400 });
    },
    [setCenter],
  );

  const handlePaneClick = useCallback(() => setHoverInfo(null), []);

  const sectionLabels = useMemo(
    () =>
      visibleNodes.filter(
        (n) => n.type === "section" && n.data?.label?.trim(),
      ),
    [visibleNodes],
  );

  const mappedCount = Object.keys(nodeToTopicId).length;
  const completedCount = Object.values(topicStatusesByNodeId).filter((s) => s === "completed").length;
  const topicCount = visibleNodes.filter((node) => ["topic", "subtopic"].includes(node.type)).length;

  return (
    <div className="roadmap-canvas relative min-h-[560px] w-full overflow-hidden rounded-b-lg border-t border-border bg-[var(--background)] md:min-h-[640px] md:h-[calc(100vh-320px)]">
      {sectionLabels.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-8rem)] flex-wrap gap-1.5">
          {sectionLabels.slice(0, 8).map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionZoom(section)}
              className="rounded-full border border-border bg-card/90 px-2.5 py-1 text-[10px] font-medium text-muted-foreground backdrop-blur hover:text-foreground hover:border-[var(--in-progress)]/50 transition-colors truncate max-w-[140px]"
            >
              {section.data.label}
            </button>
          ))}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={roadmapNodeTypes}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={() => setHoverInfo(null)}
        onPaneClick={handlePaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnScroll
        zoomOnScroll
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        fitView
      >
        <Background color="#27272a" gap={24} size={1} />
        <MiniMap
          nodeColor={() => "#27272a"}
          maskColor="rgba(9, 9, 11, 0.75)"
          className="!bg-[var(--surface)] !border-[var(--border)]"
          pannable
          zoomable
        />
        <RoadmapViewport document={document} pathKey={pathKey} />
      </ReactFlow>

      {hoverInfo && (
        <NodeHoverCard
          info={hoverInfo}
          position={hoverPos}
          onOpenDesk={() => {
            const original = visibleNodes.find((n) => n.id === hoverInfo.nodeId);
            if (original) onNodeClick?.(original, hoverInfo.topicId);
          }}
        />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2">
        <div className="pointer-events-auto rounded-md border border-border bg-card/90 px-3 py-2 backdrop-blur">
          <RoadmapLegend />
        </div>
        <div className="rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11px] font-mono text-muted-foreground backdrop-blur">
          {completedCount}/{mappedCount || topicCount} mapped · {topicCount} nodes
        </div>
      </div>
    </div>
  );
}

export function RoadmapViewer(props: RoadmapViewerProps) {
  return (
    <ReactFlowProvider>
      <RoadmapCanvas {...props} />
    </ReactFlowProvider>
  );
}
