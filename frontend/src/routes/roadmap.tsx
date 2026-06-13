import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkCheck, Loader2, ArrowRight, Map } from "lucide-react";
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
import { useState } from "react";

// ─── Roadmap JSON imports ─────────────────────────────────────────────────────
import backendGraph from "@/assets/roadmaps/backend.json";
import frontendGraph from "@/assets/roadmaps/frontend.json";
import aiGraph from "@/assets/roadmaps/ai-engineer.json";
import dsaGraph from "@/assets/roadmaps/datastructures-and-algorithms.json";
import djangoGraph from "@/assets/roadmaps/django.json";
import sqlGraph from "@/assets/roadmaps/sql.json";
import systemGraph from "@/assets/roadmaps/system-design.json";
import apiGraph from "@/assets/roadmaps/api-design.json";

const GRAPH_MAP: Record<string, { nodes: any[]; edges: any[] }> = {
  backend: backendGraph,
  frontend: frontendGraph,
  "ai-engineer": aiGraph,
  "datastructures-and-algorithms": dsaGraph,
  django: djangoGraph,
  sql: sqlGraph,
  "system-design": systemGraph,
  "api-design": apiGraph,
};
// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/roadmap")({
  validateSearch: (search: Record<string, unknown>): { pathId?: number } => ({
    pathId: typeof search.pathId === 'number' ? search.pathId : undefined,
  }),
  head: () => ({ meta: [{ title: "Roadmap — GrowthOS" }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const queryClient = useQueryClient();
  const { pathId: searchPathId } = Route.useSearch();
  const [selectedPathId, setSelectedPathId] = useState<number | null>(searchPathId ?? null);

  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/bookmark/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["paths"] }),
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pathsLoading) {
    return (
      <PageShell>
        <div className="flex justify-center p-12 text-[#666]">
          <Loader2 className="animate-spin w-6 h-6 mr-2" /> Loading Roadmap...
        </div>
      </PageShell>
    );
  }

  // ── Active path ───────────────────────────────────────────────────────────
  const activePath = selectedPathId
    ? paths.find((p: any) => p.id === selectedPathId)
    : paths.find((p: any) => p.is_bookmarked) || paths[0] || null;

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

  // ── Computed stats ────────────────────────────────────────────────────────
  const topics = activePath.topics || [];
  const completedCount = topics.filter((t: any) => t.user_progress === "completed").length;
  const completionPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const nextTopic = topics.find((t: any) => t.user_progress !== "completed") || topics[0];

  // ── Graph data ────────────────────────────────────────────────────────────
  const graphData = GRAPH_MAP[activePath.slug] ?? null;

  return (
    <PageShell>
      <PageHeader
        kicker="Learning Roadmap"
        title={activePath.title}
        subtitle={`${completedCount} of ${topics.length} topics completed`}
      />

      {/* ── Bookmarks switcher ────────────────────────────────────────────── */}
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
                  onClick={() => setSelectedPathId(p.id)}
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

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
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

      {/* ── Next topic CTA ────────────────────────────────────────────────── */}
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

      {/* ── Roadmap tree ──────────────────────────────────────────────────── */}
      <div className="mb-2 flex items-center gap-2">
        <Map size={13} className="text-[#444]" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#444]">
          {graphData ? `${activePath.title} — full roadmap` : "Learning path"}
        </span>
      </div>

      {/*
        Height cap so it's tall enough to be useful but doesn't push
        the rest of the page off screen. overflow-y-auto is inside RoadmapTree.
      */}
      <div
        className="w-full mb-12 rounded-xl overflow-hidden border border-[#1a1a1a]"
        style={{ height: "820px" }}
      >
        <RoadmapTree topics={topics} graphData={graphData} />
      </div>
    </PageShell>
  );
}