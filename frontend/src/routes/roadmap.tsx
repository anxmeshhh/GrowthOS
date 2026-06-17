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
import { RoadmapTree } from "@/components/roadmap/RoadmapTree";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useState, useEffect } from "react";

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
  const [selectedPathId, setSelectedPathId] = useState<number | null>(() => {
    if (searchPathId) return searchPathId;
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("roadmap_selected_path");
      return cached ? Number(cached) : null;
    }
    return null;
  });

  useEffect(() => {
    if (selectedPathId && typeof window !== "undefined") {
      localStorage.setItem("roadmap_selected_path", selectedPathId.toString());
    }
  }, [selectedPathId]);

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

  // ── Active path ───────────────────────────────────────────────────────────
  const activePath = customPath
    ? customPath
    : (selectedPathId
        ? paths.find((p: any) => p.id === selectedPathId)
        : paths.find((p: any) => p.is_bookmarked) || paths[0] || null);

  // Auto-sync viewed path in roadmap to dashboard
  useEffect(() => {
    if (activePath && typeof window !== "undefined") {
      const uid = customPath ? `cust-${activePath.id}` : `std-${activePath.id}`;
      localStorage.setItem("dashboard_selected_path", uid);
    }
  }, [activePath, customPath]);

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
    paths={paths}
    selectedPathId={selectedPathId}
    onSelectPath={setSelectedPathId}
  />;
}

function RoadmapPageInner({
  activePath,
  paths,
  selectedPathId,
  onSelectPath,
}: {
  activePath: any;
  paths: any[];
  selectedPathId: number | null;
  onSelectPath: (id: number) => void;
}) {
  const topics: any[] = activePath.topics || [];

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
          {activePath.title} — full roadmap
        </span>
      </div>

      <div
        className="w-full mb-12 rounded-xl overflow-hidden border border-[#1a1a1a]"
        style={{ height: "820px" }}
      >
        <RoadmapTree topics={topics} />
      </div>
    </PageShell>
  );
}