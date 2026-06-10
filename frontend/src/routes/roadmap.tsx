import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Compass,
  Lock,
  Map,
  Settings2,
  Target,
  TrendingUp,
} from "lucide-react";
import { DirectionCard } from "@/components/growth/direction-card";
import { PageHeader } from "@/components/growth/page-header";
import { StatCard, StatusBadge } from "@/components/growth/shared";
import { RoadmapFlowGuide } from "@/components/roadmap/roadmap-flow-guide";
import { RoadmapViewer } from "@/components/roadmap/RoadmapViewer";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFocusTopic } from "@/lib/focus-topic";
import { getTodayMission } from "@/lib/mock/daily-mission";
import { hasVisualRoadmap } from "@/lib/roadmap-layout/bookmarks";
import { loadRoadmapDocument } from "@/lib/roadmap-layout/load-roadmap";
import { buildNodeTopicLookup, loadRoadmapMap } from "@/lib/roadmap-layout/load-map";
import type { RoadmapDocument, RoadmapFlowNode } from "@/lib/roadmap-layout/types";
import type { GrowthTopicStatus } from "@/lib/roadmap-layout/types";
import { getFlatTopics, LEARNING_PATHS, type LearningPath } from "@/lib/roadmaps";

export const Route = createFileRoute("/roadmap")({
  validateSearch: (search: Record<string, unknown>): { highlight?: string } => ({
    highlight: typeof search.highlight === "string" ? search.highlight : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Learning Roadmap · GrowthOS" },
      {
        name: "description",
        content: "Your ordered learning path with proof-based topic progress.",
      },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { state, setActivePath, openTopicFromNode, openTopicFromNodeId } = useGrowthState();
  const navigate = useNavigate();
  const { highlight } = Route.useSearch();
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    () => highlight || sessionStorage.getItem(`growthos_active_node_${state.profile.path}`) || null,
  );
  const [roadmapDoc, setRoadmapDoc] = useState<RoadmapDocument | null>(null);
  const [nodeToTopicId, setNodeToTopicId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const activePath = LEARNING_PATHS[state.profile.path];
  const selectedPaths = useMemo(
    () => state.profile.paths.map((path) => LEARNING_PATHS[path]),
    [state.profile.paths],
  );
  const flatTopics = useMemo(() => getFlatTopics(state.profile.path), [state.profile.path]);
  const completedCount = flatTopics.filter(
    (topic) => state.topics[topic.id]?.status === "completed",
  ).length;
  const focusTopic = useMemo(
    () => getFocusTopic(state, state.profile.path),
    [state, state.profile.path],
  );
  const mission = getTodayMission(state);
  const readiness = Math.round((completedCount / Math.max(flatTopics.length, 1)) * 100);
  const visualAvailable = hasVisualRoadmap(state.profile.path);

  const topicStatusesByNodeId = useMemo(() => {
    const map: Record<string, GrowthTopicStatus> = {};
    Object.entries(nodeToTopicId).forEach(([nodeId, topicId]) => {
      const status = state.topics[topicId]?.status ?? "locked";
      map[nodeId] = status as GrowthTopicStatus;
    });
    return map;
  }, [nodeToTopicId, state.topics]);

  const topicProofByNodeId = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(nodeToTopicId).forEach(([nodeId, topicId]) => {
      const topic = state.topics[topicId];
      if (!topic) return;
      map[nodeId] = Object.values(topic.checks).filter(Boolean).length;
    });
    return map;
  }, [nodeToTopicId, state.topics]);

  const topicExtrasByNodeId = useMemo(() => {
    const map: Record<string, { userResources: number; hasCapture: boolean }> = {};
    Object.entries(nodeToTopicId).forEach(([nodeId, topicId]) => {
      const topic = state.topics[topicId];
      if (!topic) return;
      map[nodeId] = {
        userResources: topic.userResources?.length ?? 0,
        hasCapture: Boolean(topic.captureWorkflow?.regions?.length),
      };
    });
    return map;
  }, [nodeToTopicId, state.topics]);

  useEffect(() => {
    if (highlight) setActiveNodeId(highlight);
  }, [highlight]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRoadmapDoc(null);
    setNodeToTopicId({});

    if (!visualAvailable) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    Promise.all([
      loadRoadmapDocument(state.profile.path),
      loadRoadmapMap(state.profile.path),
    ]).then(([doc, manifest]) => {
      if (cancelled) return;
      setRoadmapDoc(doc);
      if (manifest) {
        const { nodeToTopic } = buildNodeTopicLookup(manifest);
        const lookup: Record<string, string> = {};
        nodeToTopic.forEach((topicId, nodeId) => {
          lookup[nodeId] = topicId;
        });
        setNodeToTopicId(lookup);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [state.profile.path, visualAvailable]);

  const handleNodeClick = (node: RoadmapFlowNode, mappedTopicId: string | null) => {
    setActiveNodeId(node.id);
    sessionStorage.setItem(`growthos_active_node_${state.profile.path}`, node.id);
    const label = node.data?.label?.trim();
    if (!label) return;

    if (mappedTopicId && state.topics[mappedTopicId]?.status === "locked") return;

    const topicId = mappedTopicId
      ? openTopicFromNodeId(mappedTopicId, label, node.id)
      : openTopicFromNode(label);

    navigate({
      to: "/topic/$topicId",
      params: { topicId },
      search: { from: "/roadmap", nodeId: node.id },
    });
  };

  const handlePathSelect = (path: LearningPath) => {
    setActivePath(path);
    setActiveNodeId(null);
  };

  return (
    <div className="growth-page space-y-8">
      <PageHeader
        label="LEARNING ROADMAP"
        title={`${activePath.title} · your compass`}
        description="See the full path, know exactly what to do next, and prove each step before moving on."
        action={
          <Link to="/settings" className="btn-ghost">
            <Settings2 className="w-3.5 h-3.5" />
            Manage paths
          </Link>
        }
      />

      <DirectionCard
        focusTopic={focusTopic}
        reason={mission?.reason}
        pathTitle={activePath.shortTitle}
        estimatedMinutes={mission?.estimatedMinutes}
        label="Your next move"
      />

      <section className="grid sm:grid-cols-3 gap-3">
        <StatCard
          icon={Target}
          label="Topics cleared"
          value={`${completedCount} / ${flatTopics.length}`}
          progress={completedCount / Math.max(flatTopics.length, 1)}
          accent="var(--completed)"
        />
        <StatCard
          icon={Compass}
          label="Current focus"
          value={focusTopic?.title ?? "Pick a topic"}
          sub={focusTopic ? "On your path" : "Start from the map"}
          accent="var(--mission)"
        />
        <StatCard
          icon={TrendingUp}
          label="Path readiness"
          value={`${readiness}%`}
          progress={readiness / 100}
          accent="var(--in-progress)"
        />
      </section>

      <RoadmapFlowGuide
        focusTopic={focusTopic}
        visualMap={visualAvailable}
        completedCount={completedCount}
      />

      <section className="section-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-[var(--surface)] px-3 py-1 text-sm">
              <Map className="w-3.5 h-3.5 text-[var(--mission)]" />
              {visualAvailable ? "Visual roadmap" : "Topic list"}
            </div>
            <h2 className="mt-3 text-lg md:text-xl font-semibold tracking-tight">
              {activePath.shortTitle} learning map
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {visualAvailable
                ? "Yellow = topics, peach = subtopics. Scroll to zoom · drag to pan."
                : "Topics unlock in order — one proof at a time."}
            </p>
          </div>
          {focusTopic && focusTopic.status !== "locked" && (
            <StatusBadge status={focusTopic.status} />
          )}
        </div>

        {loading ? (
          <div className="grid h-[min(720px,calc(100dvh-14rem))] min-h-[480px] place-items-center bg-[#f8f8f5] text-sm font-medium text-muted-foreground">
            Loading roadmap…
          </div>
        ) : roadmapDoc ? (
          <RoadmapViewer
            document={roadmapDoc}
            topicStatusesByNodeId={topicStatusesByNodeId}
            nodeToTopicId={nodeToTopicId}
            topicProofByNodeId={topicProofByNodeId}
            topicExtrasByNodeId={topicExtrasByNodeId}
            activeNodeId={activeNodeId}
            pathKey={state.profile.path}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <ListRoadmapFallback path={state.profile.path} />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookMarked className="w-4 h-4" />
            Switch path
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {selectedPaths.length} in workspace
          </span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedPaths.map((path) => {
            const selected = state.profile.path === path.id;
            const count = getFlatTopics(path.id).length;
            const visual = hasVisualRoadmap(path.id);
            return (
              <button
                key={path.id}
                type="button"
                onClick={() => handlePathSelect(path.id)}
                className={`min-h-[58px] rounded-lg border px-4 py-3 text-left transition-colors ${
                  selected
                    ? "border-amber-500/40 bg-amber-950/20"
                    : "border-border bg-card hover:bg-[var(--surface-2)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm md:text-base">{path.title}</span>
                  <BookMarked
                    className={`w-4 h-4 shrink-0 ${
                      selected ? "text-amber-400 fill-amber-400" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                  <span>
                    {path.modules.length} modules · {count} topics
                  </span>
                  {visual ? (
                    <span className="text-[var(--completed)]">visual map</span>
                  ) : (
                    <span>list view</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ListRoadmapFallback({ path }: { path: LearningPath }) {
  const { state } = useGrowthState();
  const topics = getFlatTopics(path);

  return (
    <div className="divide-y divide-border">
      {topics.map((topic) => {
        const status = state.topics[topic.id]?.status ?? "locked";
        const disabled = status === "locked";

        return (
          <Link
            key={topic.id}
            to="/topic/$topicId"
            params={{ topicId: topic.id }}
            search={{ from: "/roadmap" }}
            disabled={disabled}
            className={`flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors ${
              disabled ? "pointer-events-none opacity-60" : "hover:bg-[var(--surface-2)]"
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{topic.title}</div>
              <div className="text-xs text-muted-foreground truncate">{topic.meta}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {disabled && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
              <StatusBadge status={status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
