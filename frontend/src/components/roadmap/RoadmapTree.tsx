import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { RoadmapNode, RoadmapNodeData, getKind, NodeKind } from './RoadmapNode';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

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
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        type?: string;
    }[];
};

type RoadmapTreeProps = {
    topics: any[];
    graphData?: GraphData | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildProgressMap(topics: any[]): Record<string, string> {
    const map: Record<string, string> = {};
    topics.forEach(t => {
        const key = t.graph_node_id ?? t.slug ?? String(t.id);
        map[key] = t.user_progress ?? 'available';
    });
    return map;
}

function resolveTopicId(graphNodeId: string, topics: any[]): string {
    const match = topics.find(
        t => (t.graph_node_id ?? t.slug ?? String(t.id)) === graphNodeId
    );
    return match ? String(match.id) : graphNodeId;
}

type TreeNode = {
    id: string;
    data: RoadmapNodeData;
    kind: NodeKind;
    children: TreeNode[];
    originalY: number;
};

function buildForest(
    graphNodes: GraphData['nodes'],
    edges: GraphData['edges'],
    progressMap: Record<string, string>,
    topics: any[]
): TreeNode[] {
    const nodeMap = new Map<string, TreeNode>();

    graphNodes.forEach(n => {
        const progress = progressMap[n.id] ?? 'available';
        const kind = getKind(n.bgColor);
        nodeMap.set(n.id, {
            id: n.id,
            kind,
            originalY: n.y,
            data: {
                label: n.label,
                topicId: resolveTopicId(n.id, topics),
                status: progress === 'completed' ? 'completed' : 'available',
                bgColor: n.bgColor,
                textColor: n.textColor,
                width: n.width,
                height: n.height,
            },
            children: [],
        });
    });

    // Build parent→child edges, but SKIP milestone→milestone edges
    // so every milestone becomes a root-level section header
    const childIds = new Set<string>();
    edges.forEach(e => {
        const parent = nodeMap.get(e.source);
        const child = nodeMap.get(e.target);
        if (parent && child) {
            // Skip if both are milestones (section→section chain)
            if (parent.kind === 'milestone' && child.kind === 'milestone') return;
            parent.children.push(child);
            childIds.add(e.target);
        }
    });

    nodeMap.forEach(node => {
        node.children.sort((a, b) => a.originalY - b.originalY);
    });

    // All milestones are roots, plus any non-milestone orphans
    return graphNodes
        .filter(n => {
            const node = nodeMap.get(n.id)!;
            if (node.kind === 'milestone') return true; // always root
            return !childIds.has(n.id); // non-milestone orphans
        })
        .sort((a, b) => a.y - b.y)
        .map(n => nodeMap.get(n.id)!)
        .filter(Boolean);
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
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
                background: isOpen ? '#0d1428' : '#0a0f1e',
                border: '1.5px solid #3b5bdb',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0d1428'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isOpen ? '#0d1428' : '#0a0f1e'; }}
        >
            <span className="font-mono font-semibold tracking-wide" style={{ fontSize: '11px', color: '#60a5fa' }}>
                {node.data.label}
            </span>
            <span className="ml-auto shrink-0" style={{ color: '#3b5bdb' }}>
                {isOpen
                    ? <ChevronDown size={12} strokeWidth={2} />
                    : <ChevronRight size={12} strokeWidth={2} />}
            </span>
        </button>
    );
}

// ─── Tree branch ──────────────────────────────────────────────────────────────

function TreeBranch({
    node,
    depth,
    topics,
}: {
    node: TreeNode;
    depth: number;
    topics: any[];
}) {
    const [open, setOpen] = useState(true);
    const hasChildren = node.children.length > 0;

    if (node.kind === 'note' || node.kind === 'callout') return null;

    const indent = depth * 20;
    const connectorColor = '#1e3a1e';

    // ── Top-level milestone: section group ────────────────────────────────────
    if (node.kind === 'milestone' && depth === 0) {
        return (
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-px flex-1" style={{ background: '#1a2a40' }} />
                    <Link to="/topic/$topicId" params={{ topicId: node.data.topicId }} className="no-underline">
                        <span
                            className="font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                            style={{ fontSize: '10px', color: '#60a5fa', background: '#0a0f1e', border: '1px solid #3b5bdb' }}
                        >
                            {node.data.label}
                        </span>
                    </Link>
                    <div className="h-px flex-1" style={{ background: '#1a2a40' }} />
                </div>
                {hasChildren && (
                    <div className="space-y-1 pl-2">
                        {node.children.map(child => (
                            <TreeBranch key={child.id} node={child} depth={1} topics={topics} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ── All other nodes ───────────────────────────────────────────────────────
    return (
        <div className="relative">
            {depth > 0 && (
                <>
                    <span
                        className="absolute"
                        style={{ left: indent - 13, top: 0, bottom: 0, width: 1, background: connectorColor }}
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
                {node.kind === 'milestone' && depth > 0 ? (
                    <SectionHeader node={node} isOpen={open} onToggle={() => setOpen(v => !v)} />
                ) : (
                    <Link to="/topic/$topicId" params={{ topicId: node.data.topicId }} className="block no-underline">
                        <RoadmapNode data={{ ...node.data, isTreeMode: true }} />
                    </Link>
                )}
            </div>

            {hasChildren && open && (
                <div className="mt-1 space-y-1">
                    {node.children.map(child => (
                        <TreeBranch key={child.id} node={child} depth={depth + 1} topics={topics} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Legend helpers ───────────────────────────────────────────────────────────

function LegendItem({ kind, label }: { kind: NodeKind; label: string }) {
    const colors: Record<string, { border: string; bg: string; borderStyle: string }> = {
        topic: { border: '#2a3a1e', bg: '#0f120a', borderStyle: 'solid' },
        milestone: { border: '#3b5bdb', bg: '#0a0f1e', borderStyle: 'solid' },
        optional: { border: '#263840', bg: '#0d0d0d', borderStyle: 'dashed' },
    };
    const c = colors[kind] ?? colors.topic;
    return (
        <div className="flex items-center gap-1.5">
            <span
                className="w-5 h-3 rounded-sm"
                style={{ background: c.bg, border: `1px ${c.borderStyle} ${c.border}` }}
            />
            <span style={{ fontSize: '10px', color: '#3a4a3a', fontFamily: 'monospace' }}>{label}</span>
        </div>
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function RoadmapTree({ topics = [], graphData }: RoadmapTreeProps) {
    const forest = useMemo(() => {
        let activeGraphData = graphData;

        if (!activeGraphData) {
            const nodes = topics.map((t, idx) => ({
                id: String(t.id),
                label: t.title,
                x: 0,
                y: idx * 100, // Ensure predictable sorting
                bgColor: '#ffee55',
                textColor: '#000000',
            }));

            const edges: any[] = [];
            let hasDependencies = false;
            
            topics.forEach((t) => {
                if (t.dependencies && t.dependencies.length > 0) {
                    hasDependencies = true;
                    t.dependencies.forEach((depId: any) => {
                        edges.push({
                            id: `e${depId}-${t.id}`,
                            source: String(depId),
                            target: String(t.id),
                        });
                    });
                }
            });

            // Fallback for purely sequential topics if no dependencies at all
            if (!hasDependencies && topics.length > 1) {
                for (let i = 0; i < topics.length - 1; i++) {
                    edges.push({
                        id: `e${topics[i].id}-${topics[i+1].id}`,
                        source: String(topics[i].id),
                        target: String(topics[i+1].id),
                    });
                }
            }

            activeGraphData = { nodes, edges };
        }

        const progressMap = buildProgressMap(topics);
        return buildForest(activeGraphData.nodes, activeGraphData.edges, progressMap, topics);
    }, [topics, graphData]);

    return (
        <div
            className="w-full h-full overflow-y-auto overflow-x-hidden"
            style={{ background: '#080c08', scrollbarWidth: 'thin', scrollbarColor: '#1e3a1e #080c08' }}
        >
            {/* Legend */}
            <div
                className="sticky top-0 z-10 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-4 py-2.5 border-b"
                style={{ background: 'rgba(8,12,8,0.96)', backdropFilter: 'blur(8px)', borderColor: '#111a11' }}
            >
                <LegendItem kind="topic" label="Recommended" />
                <LegendItem kind="milestone" label="Milestone" />
                <LegendItem kind="optional" label="Optional" />
                <div className="ml-auto flex items-center gap-1.5">
                    <CheckCircle2 size={12} style={{ color: '#22c55e' }} strokeWidth={2} />
                    <span style={{ fontSize: '10px', color: '#444', fontFamily: 'monospace' }}>completed</span>
                </div>
            </div>

            {/* Tree */}
            <div className="p-4 pb-16 space-y-1">
                {forest.map(root => (
                    <TreeBranch key={root.id} node={root} depth={0} topics={topics} />
                ))}
            </div>
        </div>
    );
}