import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  Flame,
  Route as RouteIcon,
  Target,
  TrendingUp,
} from "lucide-react";
import { Heatmap, QuizDrawer, StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getTodayMission } from "@/lib/mock/daily-mission";
import { getFlatTopics, LEARNING_PATHS } from "@/lib/roadmaps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · GrowthOS" },
      {
        name: "description",
        content: "Your daily mission, streak, and proof-based learning progress.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state, isHydrated, updateTopicCheck } = useGrowthState();
  const [quizOpen, setQuizOpen] = useState(false);

  const activePath = LEARNING_PATHS[state.profile.path];
  const pathTopics = useMemo(() => getFlatTopics(state.profile.path), [state.profile.path]);
  const activeTopic =
    pathTopics
      .map((topic) => state.topics[topic.id])
      .find((topic) => topic?.status === "in_progress") ||
    pathTopics
      .map((topic) => state.topics[topic.id])
      .find((topic) => topic?.status === "available") ||
    state.topics[pathTopics[0]?.id];
  const completedCount = pathTopics.filter(
    (topic) => state.topics[topic.id]?.status === "completed",
  ).length;
  const readiness = Math.round((completedCount / Math.max(pathTopics.length, 1)) * 100);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const checks = activeTopic?.checks || { video: false, notes: false, quiz: false, commit: false };
  const mission = getTodayMission(state);

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header>
        <div className="text-xs font-mono text-muted-foreground mb-2" suppressHydrationWarning>
          {isHydrated
            ? new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })
            : "Loading workspace…"}
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" suppressHydrationWarning>
          {isHydrated ? greeting : "Welcome"}, {state.profile.name}.{" "}
          <span className="text-muted-foreground">One mission. Real proof.</span>
        </h1>
      </header>

      {mission && (
        <section className="rounded-lg border border-[var(--in-progress)]/30 bg-card p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--in-progress)] mb-1">
                After roadmap selection · your direction
              </div>
              <h2 className="text-lg font-semibold">What to do next on {activePath.shortTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{mission.reason}</p>
            </div>
            <Link
              to="/mission"
              className="text-xs font-medium px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90"
            >
              Open today&apos;s mission
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-md border border-border bg-[var(--surface)] p-3">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Step 1</div>
              <div className="font-medium">Pick your path in Settings</div>
              <Link to="/settings" className="text-xs text-[var(--in-progress)] mt-1 inline-block">
                Manage paths →
              </Link>
            </div>
            <div className="rounded-md border border-border bg-[var(--surface)] p-3">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Step 2</div>
              <div className="font-medium">Study curated resources</div>
              <a
                href={mission.startResourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[var(--in-progress)] mt-1 inline-block line-clamp-1"
              >
                {mission.startResourceTitle} →
              </a>
            </div>
            <div className="rounded-md border border-border bg-[var(--surface)] p-3">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Step 3</div>
              <div className="font-medium">Complete proof & unlock</div>
              {activeTopic ? (
                <Link
                  to="/topic/$topicId"
                  params={{ topicId: activeTopic.id }}
                  className="text-xs text-[var(--in-progress)] mt-1 inline-block"
                >
                  Open topic workspace →
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-mono text-[var(--in-progress)] mb-1.5">
              Active Mission · {activePath.shortTitle}
            </div>
            <h2 className="text-lg md:text-xl font-semibold">
              {activeTopic?.title || "Select a learning path"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {activeTopic?.meta || activePath.summary}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/roadmap"
              className="text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] transition-colors inline-flex items-center gap-1.5"
            >
              <RouteIcon className="w-3.5 h-3.5" />
              Open roadmap
            </Link>
            <button
              onClick={() => setQuizOpen(true)}
              className="text-xs font-medium px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              Take quiz
            </button>
          </div>
        </div>

        {activeTopic && (
          <div className="mt-5 grid sm:grid-cols-2 gap-2">
            {[
              { id: "video", label: "Study the resource block" },
              { id: "notes", label: "Write notes in your own words" },
              { id: "quiz", label: "Pass checkpoint quiz" },
              { id: "commit", label: "Submit build or GitHub proof" },
            ].map((task) => {
              const key = task.id as keyof typeof checks;
              const done = checks[key];

              return (
                <button
                  key={task.id}
                  onClick={() => updateTopicCheck(activeTopic.id, key, !done)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-[var(--surface)] hover:bg-[var(--surface-2)] text-left transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded-[4px] border grid place-items-center shrink-0 ${
                      done ? "bg-[var(--completed)] border-[var(--completed)]" : "border-border"
                    }`}
                  >
                    {done && <CheckCircle2 className="w-3 h-3 text-background" strokeWidth={3} />}
                  </span>
                  <span
                    className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {task.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        <StatCard
          icon={Target}
          label="Topics done"
          value={`${completedCount} / ${pathTopics.length}`}
          progress={completedCount / Math.max(pathTopics.length, 1)}
          accent="var(--in-progress)"
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${state.streak} days`}
          sub={`Longest: ${state.longestStreak} days`}
          accent="var(--available)"
        />
        <StatCard
          icon={TrendingUp}
          label="Path readiness"
          value={`${readiness}%`}
          progress={readiness / 100}
          accent="var(--completed)"
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Consistency · last 24 weeks</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {state.activityDates.length} active days · {state.profile.paths.length} selected paths
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-sm heat-0" />
            <span className="w-2.5 h-2.5 rounded-sm heat-1" />
            <span className="w-2.5 h-2.5 rounded-sm heat-2" />
            <span className="w-2.5 h-2.5 rounded-sm heat-3" />
            <span className="w-2.5 h-2.5 rounded-sm heat-4" />
            <span>More</span>
          </div>
        </div>
        <Heatmap />
      </section>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={activeTopic?.id} />
    </div>
  );
}
