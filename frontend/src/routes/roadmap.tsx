import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkCheck, Loader2, ArrowRight, Map as MapIcon } from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  Btn,
  Progress,
  StatCard,
  Badge,
} from "@/components/growth-ui";
import { RoadmapTree, type GraphData } from "@/components/roadmap/RoadmapTree";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useState, useMemo, useEffect, useRef } from "react";

// ─── Lazy graph loader ────────────────────────────────────────────────────────
// FIX #2: Removed 8 eager JSON imports. Each JSON is loaded on-demand only when
// that specific roadmap slug becomes the active path, not on page mount.
// This cuts initial parse cost by ~8× for pages where the user only views 1 path.

const GRAPH_SLUGS = [
  "backend",
  "frontend",
  "ai-engineer",
  "datastructures-and-algorithms",
  "django",
  "sql",
  "system-design",
  "api-design",
] as const;

type GraphSlug = typeof GRAPH_SLUGS[number];

const GRAPH_LOADERS: Record<GraphSlug, () => Promise<GraphData>> = {
  "backend":                        () => import("@/assets/roadmaps/backend.json").then(m => m.default as unknown as GraphData),
  "frontend":                       () => import("@/assets/roadmaps/frontend.json").then(m => m.default as unknown as GraphData),
  "ai-engineer":                    () => import("@/assets/roadmaps/ai-engineer.json").then(m => m.default as unknown as GraphData),
  "datastructures-and-algorithms":  () => import("@/assets/roadmaps/datastructures-and-algorithms.json").then(m => m.default as unknown as GraphData),
  "django":                         () => import("@/assets/roadmaps/django.json").then(m => m.default as unknown as GraphData),
  "sql":                            () => import("@/assets/roadmaps/sql.json").then(m => m.default as unknown as GraphData),
  "system-design":                  () => import("@/assets/roadmaps/system-design.json").then(m => m.default as unknown as GraphData),
  "api-design":                     () => import("@/assets/roadmaps/api-design.json").then(m => m.default as unknown as GraphData),
};

// Cache so we don't re-fetch the same JSON after the first load
const graphCache = new Map<string, GraphData>();

function useGraphData(slug: string | undefined, isCustomPath: boolean) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const lastSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || isCustomPath) {
      setGraphData(null);
      return;
    }
    if (!(slug in GRAPH_LOADERS)) {
      setGraphData(null);
      return;
    }
    if (lastSlugRef.current === slug) return; // already loaded this slug
    lastSlugRef.current = slug;

    if (graphCache.has(slug)) {
      setGraphData(graphCache.get(slug)!);
      return;
    }

    setLoading(true);
    const loader = GRAPH_LOADERS[slug as GraphSlug];
    loader().then(data => {
      graphCache.set(slug, data);
      setGraphData(data);
      setLoading(false);
    }).catch(() => {
      setGraphData(null);
      setLoading(false);
    });
  }, [slug, isCustomPath]);

  return { graphData, graphLoading: loading };
}

// ─── node_kind → bgColor ──────────────────────────────────────────────────────
// These exact hex values are what getKind() in RoadmapNode.tsx keys on:
//   milestone → '#ffee55' → blue section header
//   topic     → '#ffdfb3' → green recommended node
//   optional  → '#e0e0e0' → cyan dashed optional node
const KIND_BGCOLOR: Record<string, string> = {
  milestone: '#ffee55',
  topic:     '#ffdfb3',
  optional:  '#e0e0e0',
};

// ─── FIX #1 (page-level): generateGraphDataFromTopics moved outside component
// and memoized at call site. Now reads node_kind from the API response so
// custom paths render identically to JSON roadmaps (same getKind() mapping).
function generateGraphDataFromTopics(topicsArray: any[]): GraphData {
  const nodes: GraphData['nodes'] = [];
  const edges: GraphData['edges'] = [];

  const sorted = [...topicsArray].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  sorted.forEach((topic, idx) => {
    const kind: string = topic.node_kind ?? 'topic';
    const bgColor = KIND_BGCOLOR[kind] ?? KIND_BGCOLOR.topic;

    nodes.push({
      id: String(topic.id),
      label: topic.title,
      x: 0,
      y: idx * 60,
      bgColor,
      textColor: '#000000',
    });

    if (topic.dependencies && Array.isArray(topic.dependencies)) {
      topic.dependencies.forEach((depId: number) => {
        edges.push({
          id: `dep-${depId}-${topic.id}`,
          source: String(depId),
          target: String(topic.id),
        });
      });
    }
  });

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/roadmap")({
  validateSearch: (search: Record<string, unknown>): { pathId?: number; pathSlug?: string } => ({
    pathId: typeof search.pathId === 'number' ? search.pathId : undefined,
    pathSlug: typeof search.pathSlug === 'string' ? search.pathSlug : undefined,
  }),
  head: () => ({ meta: [{ title: "Roadmap — GrowthOS" }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const queryClient = useQueryClient();
  const { pathId: searchPathId, pathSlug: searchPathSlug } = Route.useSearch();
  const [selectedPathId, setSelectedPathId] = useState<number | null>(searchPathId ?? null);

  // Fetch predefined paths
  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch custom path if pathSlug provided
  const { data: customPath, isLoading: customPathLoading } = useQuery({
    queryKey: ["custom-path", searchPathSlug],
    queryFn: async () => {
      if (!searchPathSlug) return null;
      const res = await apiFetch(`/custom-paths/${searchPathSlug}/`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!searchPathSlug,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/bookmark/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onMutate: async (slug: string) => {
      await queryClient.cancelQueries({ queryKey: ["paths"] });
      const previousPaths = queryClient.getQueryData(["paths"]);
      queryClient.setQueryData(["paths"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) => p.slug === slug ? { ...p, is_bookmarked: !p.is_bookmarked } : p);
      });
      return { previousPaths };
    },
    onError: (err, slug, context: any) => {
      if (context?.previousPaths) {
        queryClient.setQueryData(["paths"], context.previousPaths);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pathsLoading || customPathLoading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12 text-[#666]">
          <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading Roadmap...
        </div>
      </PageShell>
    );
  }

  // ── Active path ───────────────────────────────────────────────────────────
  const activePath = customPath
    ? customPath
    : (selectedPathId
        ? paths.find((p: any) => p.id === selectedPathId)
        : paths.find((p: any) => p.is_bookmarked) || paths[0] || null);

  if (!activePath) {
    return (
      <PageShell>
        <PageHeader
          kicker="Learning Roadmap"
          title="No paths available."
          subtitle="Go to Discover to find a path."
        />
        <Link to="/discover">
          <Btn>Discover Paths</Btn>
        </Link>
      </PageShell>
    );
  }

  return <RoadmapPageInner
    activePath={activePath}
    isCustomPath={!!customPath}
    paths={paths}
    selectedPathId={selectedPathId}
    onSelectPath={setSelectedPathId}
  />;
}

// ─── Split into inner component so hooks run after activePath is confirmed ───
// This also means the lazy graph loader and memos below don't run during the
// loading/empty state branches above.

function RoadmapPageInner({
  activePath,
  isCustomPath,
  paths,
  selectedPathId,
  onSelectPath,
}: {
  activePath: any;
  isCustomPath: boolean;
  paths: any[];
  selectedPathId: number | null;
  onSelectPath: (id: number) => void;
}) {
  const topics: any[] = activePath.topics || [];

  // FIX #1: memoized — won't re-run unless topics array identity changes
  const customGraphData = useMemo(
    () => isCustomPath ? generateGraphDataFromTopics(topics) : null,
    [topics, isCustomPath]
  );

  // FIX #2: lazy-load the correct JSON only when slug changes
  const { graphData: lazyGraphData, graphLoading } = useGraphData(
    isCustomPath ? undefined : activePath.slug,
    isCustomPath
  );

  const graphData = isCustomPath ? customGraphData : lazyGraphData;

  // ── Computed stats ──────────────────────────────────────────────────────
  const completedCount = topics.filter((t: any) => t.user_progress === "completed").length;
  const completionPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const nextTopic = topics.find((t: any) => t.user_progress !== "completed") || topics[0];

  return (
    <PageShell>
      <PageHeader
        kicker="Learning Roadmap"
        title={activePath.title}
        subtitle={`${completedCount} of ${topics.length} topics completed`}
      />

      {/* ── Bookmarks switcher ──────────────────────────────────────────── */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookmarkCheck size={13} className="text-[#22c55e]" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#555]">
            Saved Paths
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {paths
            .filter((p: any) => p.is_bookmarked)
            .map((p: any) => {
              const isActive = p.id === activePath.id;
              const pTopics = p.topics || [];
              const pDone = pTopics.filter((t: any) => t.user_progress === "completed").length;
              const pPct = pTopics.length > 0 ? Math.round((pDone / pTopics.length) * 100) : 0;

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPath(p.id)}
                  className={`
                    flex flex-col gap-2 px-4 py-3 rounded-md border text-left
                    transition-all duration-150
                    ${isActive
                      ? "border-[#22c55e]/40 bg-[#071a0f]"
                      : "border-[#1f1f1f] bg-[#0d0d0d] hover:border-[#2a2a2a] hover:bg-[#111]"
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium truncate ${isActive ? "text-[#22c55e]" : "text-[#c0c0c0]"}`}>
                      {p.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#444] shrink-0">{pPct}%</span>
                  </div>
                  <Progress value={pPct} color={isActive ? "#22c55e" : "#2a2a2a"} />
                </button>
              );
            })}

          {paths.filter((p: any) => p.is_bookmarked).length === 0 && (
            <p className="text-xs text-[#444] py-1 col-span-3">
              No bookmarks yet —{" "}
              <Link to="/discover" className="text-[#22c55e] underline">
                Discover paths
              </Link>
            </p>
          )}
        </div>
      </Card>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          label="Topics Cleared"
          value={
            <span className="font-mono">
              {completedCount}{" "}
              <span className="text-[#333] text-xl">/ {topics.length}</span>
            </span>
          }
          sub={<Progress value={completionPct} />}
        />
        <StatCard
          label="Up Next"
          value={
            <span className="text-base truncate block leading-snug">
              {nextTopic?.title ?? "All clear"}
            </span>
          }
          sub={
            nextTopic ? (
              <Badge tone="amber">In progress</Badge>
            ) : (
              <Badge tone="green">Done</Badge>
            )
          }
        />
        <StatCard
          label="Completion"
          value={<span className="font-mono">{completionPct}%</span>}
          sub={<Progress value={completionPct} />}
          accent={completionPct === 100}
        />
      </div>

      {/* ── Next topic CTA ──────────────────────────────────────────────── */}
      {nextTopic && (
        <Card className="p-4 mb-6 border-[#22c55e]/20 bg-[#071a0f]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#22c55e]/70 mb-1">
                Continue where you left off
              </div>
              <div className="text-base font-semibold tracking-tight text-[#f0f0f0] truncate">
                {nextTopic.title}
              </div>
            </div>
            <Link to="/topic/$topicId" params={{ topicId: String(nextTopic.id) }}>
              <Btn>
                Continue <ArrowRight size={13} />
              </Btn>
            </Link>
          </div>
        </Card>
      )}

      {/* ── Roadmap tree ─────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center gap-2">
        <MapIcon size={13} className="text-[#444]" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#444]">
          {graphData ? `${activePath.title} — full roadmap` : "Learning path"}
        </span>
        {graphLoading && (
          <Loader2 size={11} className="animate-spin text-[#333] ml-1" />
        )}
      </div>

      <div
        className="w-full mb-12 rounded-xl overflow-hidden border border-[#1a1a1a]"
        style={{ height: "820px" }}
      >
        <RoadmapTree topics={topics} graphData={graphData} />
      </div>
    </PageShell>
  );
}