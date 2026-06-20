import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, ArrowRight, Map as MapIcon, Bookmark } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { RoadmapTree } from "@/components/roadmap/RoadmapTree";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/roadmap")({
  validateSearch: (search: Record<string, unknown>): { pathId?: number; pathSlug?: string } => ({
    pathId: typeof search.pathId === "number" ? search.pathId : undefined,
    pathSlug: typeof search.pathSlug === "string" ? search.pathSlug : undefined,
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

  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

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

  // kept for parity with prior bookmark-toggle behavior elsewhere in the app
  useMutation({
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
        return old.map((p: any) =>
          p.slug === slug ? { ...p, is_bookmarked: !p.is_bookmarked } : p,
        );
      });
      return { previousPaths };
    },
    onError: (_err, _slug, context: any) => {
      if (context?.previousPaths) {
        queryClient.setQueryData(["paths"], context.previousPaths);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const activePath = customPath
    ? customPath
    : selectedPathId
      ? paths.find((p: any) => p.id === selectedPathId)
      : paths.find((p: any) => p.is_bookmarked) || paths[0] || null;

  useEffect(() => {
    if (activePath && typeof window !== "undefined") {
      const uid = customPath ? `cust-${activePath.id}` : `std-${activePath.id}`;
      localStorage.setItem("dashboard_selected_path", uid);
    }
  }, [activePath, customPath]);

  if (pathsLoading || customPathLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center gap-2 py-24 text-lg text-[#eee]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roadmap…
        </div>
      </PageShell>
    );
  }

  if (!activePath) {
    return (
      <PageShell>
        <PageHeader
          kicker="Learning roadmap"
          title="No paths available yet"
          subtitle="Pick something to learn and it'll show up here."
        />
        <Link to="/discover">
          <Btn>Discover paths</Btn>
        </Link>
      </PageShell>
    );
  }

  return (
    <RoadmapPageInner activePath={activePath} paths={paths} onSelectPath={setSelectedPathId} />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RoadmapPageInner({
  activePath,
  paths,
  onSelectPath,
}: {
  activePath: any;
  paths: any[];
  onSelectPath: (id: number) => void;
}) {
  const topics: any[] = activePath.topics || [];

  const completedCount = topics.filter((t: any) => t.user_progress === "completed").length;
  const inProgressCount = topics.filter((t: any) => t.user_progress === "in_progress").length;
  const lockedCount = Math.max(topics.length - completedCount - inProgressCount, 0);
  const completionPct = topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;
  const nextTopic = topics.find((t: any) => t.user_progress !== "completed") || topics[0];

  const bookmarked = paths.filter((p: any) => p.is_bookmarked);
  const ringCircumference = 2 * Math.PI * 42;
  const ringOffset = ringCircumference - (completionPct / 100) * ringCircumference;

  return (
    <PageShell>
      <PageHeader
        kicker="Learning roadmap"
        title={activePath.title}
        subtitle={`${completedCount} of ${topics.length} topics completed`}
      />

      {/* ── Saved paths rail ──────────────────────────────────────────── */}
      {bookmarked.length > 0 && (
        <div className="mb-10 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {bookmarked.map((p: any) => {
            const isActive = p.id === activePath.id;
            const pTopics = p.topics || [];
            const pDone = pTopics.filter((t: any) => t.user_progress === "completed").length;
            const pPct = pTopics.length > 0 ? Math.round((pDone / pTopics.length) * 100) : 0;

            return (
              <button
                key={p.id}
                onClick={() => onSelectPath(p.id)}
                className={`
                  group flex shrink-0 items-center gap-2.5 rounded-full border px-3.5 py-2
                  transition-colors duration-150
                  ${
                    isActive
                      ? "border-[#22c55e]/35 bg-[#0a1a10]"
                      : "border-[#1c1c1c] bg-transparent hover:border-[#2a2a2a] hover:bg-[#0d0d0d]"
                  }
                `}
              >
                <Bookmark
                  size={11}
                  className={isActive ? "fill-[#22c55e] text-[#22c55e]" : "text-[#fff]"}
                />
                <span
                  className={`whitespace-nowrap text-lg font-medium ${isActive ? "text-[#22c55e]" : "text-[#fff]"}`}
                >
                  {p.title}
                </span>
                <span
                  className={`whitespace-nowrap text-sm font-mono ${isActive ? "text-[#22c55e]/60" : "text-[#eee]"}`}
                >
                  {pPct}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Progress hero ─────────────────────────────────────────────── */}
      <Card className="mb-10 overflow-hidden p-0">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1px_1fr]">
          {/* Ring + headline metric */}
          <div className="flex items-center gap-5 p-6">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
              <svg viewBox="0 0 96 96" className="h-24 w-24 -rotate-90">
                <circle cx="48" cy="48" r="42" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 600ms ease" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-xl font-semibold text-[#f0f0f0]">
                  {completionPct}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm uppercase tracking-[0.18em] font-mono text-[#fff]">
                Overall progress
              </div>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-semibold text-[#f0f0f0]">
                  {completedCount}
                </span>
                <span className="text-lg text-[#fff]">/ {topics.length} topics</span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-[#eee]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> {completedCount} done
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#d4a72c]" /> {inProgressCount}{" "}
                  active
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3a3a3a]" /> {lockedCount} queued
                </span>
              </div>
            </div>
          </div>

          {/* divider */}
          <div className="hidden bg-[#1a1a1a] md:block" />

          {/* Up next */}
          <div className="flex items-center justify-between gap-4 p-6">
            <div className="min-w-0">
              <div className="text-sm uppercase tracking-[0.18em] font-mono text-[#fff]">
                {nextTopic ? "Continue where you left off" : "Path complete"}
              </div>
              <div className="mt-1.5 truncate text-lg font-semibold tracking-tight text-[#f0f0f0]">
                {nextTopic?.title ?? "Every topic cleared"}
              </div>
              <div className="mt-1.5">
                {nextTopic ? (
                  <Badge tone="amber">In progress</Badge>
                ) : (
                  <Badge tone="green">All done</Badge>
                )}
              </div>
            </div>
            {nextTopic && (
              <Link
                to="/topic/$topicId"
                params={{ topicId: String(nextTopic.id) }}
                className="shrink-0"
              >
                <Btn>
                  Continue <ArrowRight size={13} />
                </Btn>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* ── Roadmap section ──────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={13} className="text-[#eee]" />
          <span className="text-sm uppercase tracking-[0.18em] font-mono text-[#fff]">
            Full roadmap
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-[#eee]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" /> Done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4a72c]" /> Active
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3a3a3a]" /> Locked
          </span>
        </div>
      </div>

      <div
        className="mb-16 w-full overflow-hidden rounded-xl border border-[#1a1a1a] bg-[#0a0a0a]"
        style={{ height: "820px" }}
      >
        <RoadmapTree topics={topics} />
      </div>
    </PageShell>
  );
}
