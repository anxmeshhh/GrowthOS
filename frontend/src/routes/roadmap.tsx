import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Layers3,
  Lock,
  Menu,
  PlayCircle,
  Route as RouteIcon,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { QuizDrawer, StatusBadge, TopicDrawer, type TopicStatus } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFlatTopics, LEARNING_PATHS, type LearningPath } from "@/lib/roadmaps";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Learning Roadmap - GrowthOS" },
      { name: "description", content: "A compact, resource-led roadmap workspace." },
    ],
  }),
  component: RoadmapPage,
});

const statusIcon: Record<TopicStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  in_progress: PlayCircle,
  available: BookOpen,
  locked: Lock,
};

function RoadmapPage() {
  const { state, setActivePath } = useGrowthState();
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const activePath = LEARNING_PATHS[state.profile.path];
  const flatTopics = useMemo(() => getFlatTopics(state.profile.path), [state.profile.path]);
  const completedCount = flatTopics.filter(
    (topic) => state.topics[topic.id]?.status === "completed",
  ).length;
  const activeTopic =
    flatTopics.find((topic) => state.topics[topic.id]?.status === "in_progress") || flatTopics[0];
  const readiness = Math.round((completedCount / Math.max(flatTopics.length, 1)) * 100);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-[#0d1324]">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="h-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <div className="w-10 h-10 rounded-md bg-foreground text-background grid place-items-center">
                <RouteIcon className="w-5 h-5" />
              </div>
              <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Menu className="w-5 h-5" />
              </button>
              <button className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                Roadmaps <ChevronDown className="w-4 h-4" />
              </button>
              <button className="hidden sm:inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                AI Tutor <ChevronDown className="w-4 h-4" />
              </button>
              <div className="hidden lg:inline-flex items-center gap-2 text-sm font-semibold text-yellow-400">
                <Zap className="w-4 h-4 fill-yellow-400" />
                Upgrade to Pro
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-violet-300">
                <Zap className="w-4 h-4 fill-violet-400" />
                {Math.max(1, state.streak % 10)}
              </div>
              <button className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                Account / Teams
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm text-background">
              <span className="w-5 h-5 rounded-full bg-[var(--surface-2)]" />
              Personal
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Ask anything"
                className="w-56 rounded-md border border-border bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--in-progress)]"
              />
            </div>
          </div>
          <button className="rounded-md border border-dashed border-border px-4 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-[var(--surface-2)]">
            + Create Team
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            Your Bookmarks
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(LEARNING_PATHS).map((path) => {
              const selected = state.profile.path === path.id;
              const count = getFlatTopics(path.id).length;
              return (
                <button
                  key={path.id}
                  onClick={() => setActivePath(path.id)}
                  className={`group min-h-[58px] rounded-md border px-4 py-3 text-left transition-colors ${
                    selected
                      ? "border-[var(--in-progress)] bg-[var(--surface-2)]"
                      : "border-border bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm md:text-base text-blue-200">{path.title}</span>
                    <BookMarked
                      className={`w-4 h-4 shrink-0 ${selected ? "text-[var(--in-progress)] fill-[var(--in-progress)]" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                    {path.modules.length} modules / {count} topics
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <div className="inline-flex rounded-md border border-border bg-[var(--surface)] px-3 py-1 text-sm text-blue-200">
                Role Based Roadmaps
              </div>
              <h1 className="mt-3 text-xl md:text-2xl font-semibold tracking-tight">
                {activePath.title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{activePath.summary}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Topics" value={flatTopics.length.toString()} />
              <Metric label="Done" value={completedCount.toString()} />
              <Metric label="Ready" value={`${readiness}%`} />
            </div>
          </div>

          <VisualRoadmap
            path={state.profile.path}
            activeTopicId={activeTopic?.id}
            statuses={state.topics}
            onOpenTopic={setOpenTopic}
          />
        </section>
      </main>

      <TopicDrawer
        topic={openTopic}
        onClose={() => setOpenTopic(null)}
        onStartQuiz={() => setQuizOpen(true)}
      />
      <QuizDrawer
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        topicId={openTopic || undefined}
      />
    </div>
  );
}

function VisualRoadmap({
  path,
  activeTopicId,
  statuses,
  onOpenTopic,
}: {
  path: LearningPath;
  activeTopicId?: string;
  statuses: Record<string, { status: TopicStatus } | undefined>;
  onOpenTopic: (topicId: string) => void;
}) {
  const roadmap = LEARNING_PATHS[path];
  let cursorY = 210;
  const modules = roadmap.modules.map((module, moduleIndex) => {
    const rowHeight = Math.max(190, module.topics.length * 58 + 90);
    const y = cursorY;
    cursorY += rowHeight;
    return { ...module, moduleIndex, y, rowHeight };
  });
  const boardHeight = Math.max(780, cursorY + 120);
  const centerX = 560;
  const activeModuleIndex = Math.max(
    0,
    modules.findIndex((module) => module.topics.some((topic) => topic.id === activeTopicId)),
  );
  const runnerTop = modules[activeModuleIndex]?.y || 210;

  return (
    <div className="bg-[#f8f8f5] text-black">
      <div className="overflow-auto max-h-[calc(100vh-250px)] min-h-[560px] roadmap-scroll">
        <div className="relative min-w-[1120px]" style={{ height: boardHeight }}>
          <div className="absolute left-10 top-10 w-[340px] rounded-md border-2 border-black bg-white p-4 text-sm font-semibold">
            <LegendRow color="bg-violet-500" label="Personal recommendation / opinion" />
            <LegendRow color="bg-green-700" label="Alternative option / pick this or purple" />
            <LegendRow color="bg-gray-400" label="Order not strict / learn anytime" />
          </div>

          <button className="absolute left-10 top-[150px] w-[340px] rounded-md bg-[#232323] px-4 py-3 text-sm font-semibold text-white">
            Visit Beginner Friendly Version
          </button>

          <div className="absolute right-10 top-10 w-[350px] rounded-md border-2 border-black bg-white p-4 text-sm font-semibold">
            <p className="leading-relaxed">
              Find the detailed version of this roadmap along with other similar roadmaps
            </p>
            <button className="mt-4 w-full rounded-md bg-[#4b35dd] px-4 py-3 text-sm font-semibold text-white">
              roadmap.sh
            </button>
          </div>

          <div
            className="absolute top-[130px] text-center"
            style={{ left: centerX - 120, width: 240 }}
          >
            <div
              className="mx-auto w-px border-l-4 border-dotted border-[#2578ff]"
              style={{ height: 72 }}
            />
            <h2 className="mt-8 text-3xl font-semibold">{roadmap.shortTitle}</h2>
          </div>

          <svg
            className="absolute inset-0 pointer-events-none"
            width="1120"
            height={boardHeight}
            viewBox={`0 0 1120 ${boardHeight}`}
          >
            <path
              d={`M ${centerX} 250 L ${centerX} ${boardHeight - 110}`}
              fill="none"
              stroke="#2477f3"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              className="roadmap-flow"
              d={`M ${centerX} 250 L ${centerX} ${boardHeight - 110}`}
              fill="none"
              stroke="#7c3cff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {modules.map((module) => {
              const side = module.moduleIndex % 2 === 0 ? "right" : "left";
              const topicX = side === "right" ? 820 : 120;
              const moduleX = centerX - 120;
              const branchStartX = side === "right" ? centerX + 120 : centerX - 120;
              const topicEdgeX = side === "right" ? topicX : topicX + 230;
              const topicBaseY = module.y - (module.topics.length - 1) * 29;
              return (
                <g key={module.id}>
                  <path
                    d={`M ${centerX} ${module.y} C ${centerX} ${module.y - 40}, ${moduleX} ${module.y - 20}, ${moduleX} ${module.y}`}
                    fill="none"
                    stroke="#2477f3"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {module.topics.map((topic, topicIndex) => {
                    const y = topicBaseY + topicIndex * 58 + 2;
                    const curveX = side === "right" ? branchStartX + 70 : branchStartX - 70;
                    return (
                      <path
                        key={topic.id}
                        d={`M ${branchStartX} ${module.y} C ${curveX} ${module.y}, ${curveX} ${y}, ${topicEdgeX} ${y}`}
                        fill="none"
                        stroke="#2477f3"
                        strokeWidth="3"
                        strokeDasharray="2 9"
                        strokeLinecap="round"
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          <div
            className="roadmap-runner absolute z-20 h-4 w-4 rounded-full bg-violet-500 shadow-[0_0_0_6px_rgba(124,60,255,0.18)]"
            style={{ left: centerX - 8, top: runnerTop - 8 }}
          />

          {modules.map((module) => {
            const side = module.moduleIndex % 2 === 0 ? "right" : "left";
            const topicX = side === "right" ? 820 : 120;
            const moduleX = centerX - 120;
            const topicBaseY = module.y - (module.topics.length - 1) * 29;
            const moduleDone = module.topics.filter(
              (topic) => statuses[topic.id]?.status === "completed",
            ).length;

            return (
              <div key={module.id}>
                <button
                  className={`absolute z-10 w-[240px] rounded-md border-2 border-black px-4 py-3 text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5 ${
                    module.topics.some((topic) => topic.id === activeTopicId)
                      ? "bg-[#4b35dd] text-white"
                      : "bg-[#f1ff00] text-black"
                  }`}
                  style={{ left: moduleX, top: module.y - 24 }}
                  onClick={() => {
                    const firstOpenTopic =
                      module.topics.find((topic) => statuses[topic.id]?.status !== "locked") ||
                      module.topics[0];
                    if (firstOpenTopic && statuses[firstOpenTopic.id]?.status !== "locked")
                      onOpenTopic(firstOpenTopic.id);
                  }}
                >
                  <span>{module.title}</span>
                  <span className="ml-2 rounded border border-black/30 bg-white/30 px-1.5 py-0.5 text-[10px]">
                    {moduleDone}/{module.topics.length}
                  </span>
                </button>

                {module.topics.map((topic, topicIndex) => {
                  const status = statuses[topic.id]?.status || "locked";
                  const disabled = status === "locked";
                  const isActive = topic.id === activeTopicId;
                  const y = topicBaseY + topicIndex * 58 - 21;
                  return (
                    <button
                      key={topic.id}
                      disabled={disabled}
                      onClick={() => onOpenTopic(topic.id)}
                      className={`absolute z-10 flex min-h-[42px] w-[230px] items-center justify-center rounded-md border-2 border-black px-3 py-2 text-center text-sm font-semibold shadow-sm transition-transform ${
                        disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-0.5"
                      } ${isActive ? "bg-[#4b35dd] text-white" : "bg-[#ffe8a3] text-black"}`}
                      style={{ left: topicX, top: y }}
                    >
                      <span className="line-clamp-2">{topic.title}</span>
                      <RoadmapDot status={status} />
                    </button>
                  );
                })}
              </div>
            );
          })}

          <div className="absolute bottom-8 left-1/2 z-10 w-[330px] -translate-x-1/2 rounded-md bg-[#4b35dd] px-5 py-4 text-center text-sm font-semibold text-white">
            {activeTopicId ? statuses[activeTopicId]?.status?.replace("_", " ") : "Select a topic"}{" "}
            / moving along the roadmap
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 last:mb-0">
      <span
        className={`grid h-4 w-4 place-items-center rounded-full ${color} text-[10px] text-white`}
      >
        <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </div>
  );
}

function RoadmapDot({ status }: { status: TopicStatus }) {
  const color =
    status === "completed"
      ? "bg-green-700"
      : status === "in_progress"
        ? "bg-violet-500"
        : status === "available"
          ? "bg-violet-500"
          : "bg-gray-400";

  return (
    <span
      className={`absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full ${color} text-white`}
    >
      {status === "locked" ? (
        <Lock className="h-3 w-3" />
      ) : (
        <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
      )}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[76px] rounded-md border border-border bg-[var(--surface)] px-4 py-3">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
