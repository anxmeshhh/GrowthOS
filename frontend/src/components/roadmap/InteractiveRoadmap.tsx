import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RoadmapNode, RoadmapNodeData } from './RoadmapNode';
import dagre from 'dagre';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GraphData = {
  nodes: {
    id: string;
    label: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    bgColor?: string;
    textColor?: string;
    category?: string | null;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type?: string;
    label?: string | null;
  }[];
};

type InteractiveRoadmapProps = {
  topics: any[];
  graphData?: GraphData | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const nodeTypes = { roadmapNode: RoadmapNode };

const EDGE_BASE = {
  style: { stroke: '#2a2a2a', strokeWidth: 1.5 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 10,
    height: 10,
    color: '#2a2a2a',
  },
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 44;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProgressMap(topics: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  topics.forEach((t) => {
    const key = t.graph_node_id ?? t.slug ?? String(t.id);
    map[key] = t.user_progress ?? 'available';
  });
  return map;
}

function resolveTopicId(graphNodeId: string, topics: any[]): string {
  const match = topics.find(
    (t) => (t.graph_node_id ?? t.slug ?? String(t.id)) === graphNodeId
  );
  return match ? String(match.id) : graphNodeId;
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 80 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// ─── Component ────────────────────────────────────────────────────────────────

export function InteractiveRoadmap({ topics = [], graphData }: InteractiveRoadmapProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    let rawNodes: any[] = [];
    let rawEdges: any[] = [];

    // 1. Get raw nodes and edges
    if (!graphData) {
      rawNodes = topics.map((t) => ({
        id: String(t.id),
        label: t.title,
        bgColor: t.bgColor,
      }));
      
      rawEdges = [];
      let hasDependencies = false;
      
      topics.forEach((t) => {
        if (t.dependencies && t.dependencies.length > 0) {
          hasDependencies = true;
          t.dependencies.forEach((depId: any) => {
            rawEdges.push({
              id: `e${depId}-${t.id}`,
              source: String(depId),
              target: String(t.id),
            });
          });
        }
      });

      if (!hasDependencies && topics.length > 1) {
        rawEdges = topics.slice(1).map((t, i) => ({
          id: `e${topics[i].id}-${t.id}`,
          source: String(topics[i].id),
          target: String(t.id),
        }));
      }
    } else {
      rawNodes = graphData.nodes;
      rawEdges = graphData.edges;
    }

    const progressMap = buildProgressMap(topics);

    // 2. Compute root nodes and children map
    const incomingEdgeCount: Record<string, number> = {};
    const childrenMap: Record<string, string[]> = {};

    rawNodes.forEach(n => {
      incomingEdgeCount[n.id] = 0;
      childrenMap[n.id] = [];
    });

    rawEdges.forEach(e => {
      if (incomingEdgeCount[e.target] !== undefined) {
        incomingEdgeCount[e.target]++;
      }
      if (childrenMap[e.source]) {
        childrenMap[e.source].push(e.target);
      }
    });

    const rootNodes = rawNodes.filter(n => incomingEdgeCount[n.id] === 0).map(n => n.id);

    // 3. Find visible nodes (BFS from roots, only traverse if expanded)
    const visibleNodeIds = new Set<string>();
    const queue = [...rootNodes];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      visibleNodeIds.add(curr);
      if (expandedNodes.has(curr)) {
        queue.push(...(childrenMap[curr] || []));
      }
    }

    // 4. Build React Flow Nodes and Edges for visible items
    const flowNodes: Node<RoadmapNodeData>[] = rawNodes
      .filter(n => visibleNodeIds.has(n.id))
      .map((n) => {
        const progress = (progressMap[n.id] ?? 'available') as 'available' | 'in_progress' | 'completed';
        const hasChildren = childrenMap[n.id].length > 0;
        return {
          id: n.id,
          type: 'roadmapNode',
          position: { x: 0, y: 0 },
          data: {
            label: n.label,
            topicId: resolveTopicId(n.id, topics),
            status: progress,
            bgColor: n.bgColor,
            textColor: n.textColor,
            hasChildren,
            isExpanded: expandedNodes.has(n.id),
            onToggleExpand: toggleNode,
          },
        };
      });

    const flowEdges: Edge[] = rawEdges
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((e) => ({
        ...EDGE_BASE,
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type ?? 'smoothstep',
      }));

    // 5. Layout with Dagre
    return getLayoutedElements(flowNodes, flowEdges, 'TB');
  }, [topics, graphData, expandedNodes, toggleNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when tree changes (expand/collapse)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.06, minZoom: 0.05, maxZoom: 1.2 }}
        minZoom={0.04}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        // Neutral dark canvas to match your theme
        style={{ background: '#0a0a0a' }}
      >
        {/* Subtle dot grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1f1f1f"
        />

        {/* Controls — styled dark */}
        <Controls
          showInteractive={false}
          className="
            !bg-[#111] !border !border-[#222] !rounded-lg !shadow-xl
            [&>button]:!bg-transparent [&>button]:!border-0
            [&>button]:!text-[#555] [&>button:hover]:!text-[#f0f0f0]
            [&>button]:!transition-colors
          "
        />

        {/* Mini map — small overview thumbnail */}
        <MiniMap
          nodeColor={(n) => {
            const bg = (n.data as RoadmapNodeData)?.bgColor ?? '';
            if (bg === '#4147d3') return '#22c55e';
            if (bg === '#e0e0e0') return '#374151';
            if (bg === '#ffffff') return '#1f1f1f';
            return '#2a2a2a';
          }}
          maskColor="rgba(0,0,0,0.6)"
          className="!bg-[#0d0d0d] !border !border-[#222] !rounded-lg"
          style={{ bottom: 60, right: 12 }}
        />
      </ReactFlow>

      {/* Inline legend — bottom left, always visible */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5 bg-[#0d0d0d]/90 backdrop-blur border border-[#1f1f1f] rounded-lg px-3 py-2.5 pointer-events-none">
        <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#444] mb-0.5">Legend</div>
        <LegendRow color="border-[#ffe92b]" label="Topic" />
        <LegendRow color="border-[#22c55e]" label="Milestone" isGreen />
        <LegendRow color="border-[#555] border-dashed" label="Optional" />
        <LegendRow completed label="Completed" />
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  isGreen,
  completed,
}: {
  color?: string;
  label: string;
  isGreen?: boolean;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {completed ? (
        <span className="w-3 h-3 rounded-full bg-[#22c55e]/20 border border-[#22c55e] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
        </span>
      ) : (
        <span
          className={`w-5 h-3 rounded-sm bg-[#111] border ${color}`}
          style={{ borderWidth: isGreen ? '1.5px' : '1px' }}
        />
      )}
      <span className="text-[10px] font-mono text-[#444]">{label}</span>
    </div>
  );
}