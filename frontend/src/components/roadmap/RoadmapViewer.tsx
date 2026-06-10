import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Maximize2, Minus, Plus } from "lucide-react";
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
        stroke: String(edge.style?.stroke ?? "#2b78e4"),
        strokeWidth: Number(edge.style?.strokeWidth ?? 3.5),
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
        setViewport(JSON.parse(saved));
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

function RoadmapZoomToolbar() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 rounded-lg border border-black/10 bg-white/95 shadow-md backdrop-blur-sm p-1">
      <button
        type="button"
        onClick={() => zoomIn({ duration: 200 })}
        className="p-2 rounded-md hover:bg-zinc-100 text-zinc-700"
        title="Zoom in"
        aria-label="Zoom in"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomOut({ duration: 200 })}
        className="p-2 rounded-md hover:bg-zinc-100 text-zinc-700"
        title="Zoom out"
        aria-label="Zoom out"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.12, duration: 300 })}
        className="p-2 rounded-md hover:bg-zinc-100 text-zinc-700"
        title="Fit to screen"
        aria-label="Fit to screen"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
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
  const shellRef = useRef<HTMLDivElement>(null);
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

  /* Trap wheel events so the page doesn't scroll while zooming/panning the map */
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const original = visibleNodes.find((item) => item.id === node.id);
      if (!original?.data?.label?.trim()) return;
      if (!["topic", "subtopic", "button"].includes(original.type)) return;
      if (topicStatusesByNodeId[node.id] === "locked") return;
      onNodeClick?.(original, nodeToTopicId[node.id] ?? null);
    },
    [visibleNodes, onNodeClick, nodeToTopicId, topicStatusesByNodeId],
  );

  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (event, node) => {
      const original = visibleNodes.find((item) => item.id === node.id);
      if (!original?.data?.label?.trim()) return;
      if (!["topic", "subtopic", "button"].includes(original.type)) return;

      const topicId = nodeToTopicId[node.id] ?? null;
      const rect = shellRef.current?.getBoundingClientRect();
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

  const sectionLabels = useMemo(
    () => visibleNodes.filter((n) => n.type === "section" && n.data?.label?.trim()),
    [visibleNodes],
  );

  const mappedCount = Object.keys(nodeToTopicId).length;
  const completedCount = Object.values(topicStatusesByNodeId).filter((s) => s === "completed").length;
  const topicCount = visibleNodes.filter((node) => ["topic", "subtopic"].includes(node.type)).length;

  return (
    <div
      ref={shellRef}
      className="roadmap-canvas-shell relative w-full h-[min(720px,calc(100dvh-14rem))] min-h-[480px] shrink-0 overflow-hidden rounded-b-lg border-t border-border bg-[#f8f8f5] touch-none"
    >
      {sectionLabels.length > 0 && (
        <div className="absolute top-3 left-3 z-20 flex max-w-[calc(100%-10rem)] flex-wrap gap-1.5 pointer-events-auto">
          {sectionLabels.slice(0, 8).map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => handleSectionZoom(section)}
              className="rounded-full border border-black/15 bg-white/90 px-2.5 py-1 text-[10px] font-medium text-zinc-700 shadow-sm hover:bg-white truncate max-w-[140px]"
            >
              {section.data.label}
            </button>
          ))}
        </div>
      )}

      <RoadmapZoomToolbar />

      <div className="roadmap-canvas absolute inset-0 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={roadmapNodeTypes}
          onNodeClick={handleNodeClick}
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={() => setHoverInfo(null)}
          onPaneClick={() => setHoverInfo(null)}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          panOnScroll={false}
          zoomOnScroll
          zoomOnPinch
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          className="!bg-[#f8f8f5]"
        >
          <Background color="#d4d4d8" gap={24} size={1} />
          <Controls
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            className="!hidden"
          />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === "topic") return "#ffffa5";
              if (n.type === "subtopic") return "#ffe8a3";
              return "#e4e4e7";
            }}
            maskColor="rgba(248, 248, 245, 0.75)"
            className="!bg-white !border-black/10 !rounded-md !shadow-md"
            pannable
            zoomable
            style={{ bottom: 12, right: 12 }}
          />
          <RoadmapViewport document={document} pathKey={pathKey} />
        </ReactFlow>
      </div>

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

      <div className="pointer-events-none absolute bottom-3 left-3 right-14 flex flex-wrap items-end justify-between gap-2 z-10">
        <div className="pointer-events-auto rounded-md border border-black/10 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <RoadmapLegend />
        </div>
        <div className="rounded-md border border-black/10 bg-white/95 px-2.5 py-1 text-[11px] font-mono text-zinc-600 shadow-sm backdrop-blur-sm">
          {completedCount}/{mappedCount || topicCount} done · click node → desk → proof
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
