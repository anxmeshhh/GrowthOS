import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { roadmapNodeTypes } from "./nodes";
import { filterRoadmapNodes } from "@/lib/roadmap-layout/filters";
import type {
  GrowthTopicStatus,
  RoadmapDocument,
  RoadmapFlowEdge,
  RoadmapFlowNode,
} from "@/lib/roadmap-layout/types";

type RoadmapViewerProps = {
  document: RoadmapDocument;
  topicStatusesByLabel?: Record<string, GrowthTopicStatus>;
  onNodeClick?: (node: RoadmapFlowNode) => void;
  activeNodeId?: string | null;
};

function resolveGrowthStatus(
  node: RoadmapFlowNode,
  topicStatusesByLabel: Record<string, GrowthTopicStatus>,
): GrowthTopicStatus | undefined {
  const label = node.data?.label?.trim().toLowerCase();
  if (!label || !["topic", "subtopic"].includes(node.type)) return undefined;
  return topicStatusesByLabel[label];
}

function toFlowNodes(
  nodes: RoadmapFlowNode[],
  topicStatusesByLabel: Record<string, GrowthTopicStatus>,
  activeNodeId?: string | null,
): Node[] {
  return nodes.map((node) => {
    const growthStatus = resolveGrowthStatus(node, topicStatusesByLabel);
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
      className: undefined,
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
        stroke: String(edge.style?.stroke ?? "#2b78e4"),
        strokeWidth: Number(edge.style?.strokeWidth ?? 3.5),
        strokeDasharray: edge.data?.edgeStyle === "dashed" ? "0.8 8" : "0",
        strokeLinecap: "round",
      },
      zIndex: 5,
    }));
}

function RoadmapViewport({ document }: { document: RoadmapDocument }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ padding: 0.12, minZoom: 0.35, maxZoom: 1.2 });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [document.slug, fitView]);

  return null;
}

function RoadmapCanvas({
  document,
  topicStatusesByLabel = {},
  onNodeClick,
  activeNodeId,
}: RoadmapViewerProps) {
  const visibleNodes = useMemo(() => filterRoadmapNodes(document.nodes), [document.nodes]);
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);

  const nodes = useMemo(
    () => toFlowNodes(visibleNodes, topicStatusesByLabel, activeNodeId),
    [visibleNodes, topicStatusesByLabel, activeNodeId],
  );
  const edges = useMemo(
    () => toFlowEdges(document.edges, visibleNodeIds),
    [document.edges, visibleNodeIds],
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const original = visibleNodes.find((item) => item.id === node.id);
      if (!original?.data?.label?.trim()) return;
      if (!["topic", "subtopic", "button"].includes(original.type)) return;
      onNodeClick?.(original);
    },
    [visibleNodes, onNodeClick],
  );

  const topicCount = visibleNodes.filter((node) => ["topic", "subtopic"].includes(node.type)).length;
  const trackedCount = Object.keys(topicStatusesByLabel).length;
  const completedCount = Object.values(topicStatusesByLabel).filter((s) => s === "completed").length;

  return (
    <div className="roadmap-canvas relative min-h-[560px] w-full overflow-hidden rounded-b-lg border-t border-border bg-[#f8f8f5] md:min-h-[640px] md:h-[calc(100vh-320px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={roadmapNodeTypes}
        onNodeClick={handleNodeClick}
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
        <Background color="#d4d4d8" gap={24} size={1} />
        <RoadmapViewport document={document} />
      </ReactFlow>
      <div className="pointer-events-none absolute bottom-3 right-4 rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11px] font-mono text-muted-foreground backdrop-blur">
        {completedCount}/{trackedCount || topicCount} tracked · {topicCount} nodes
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
