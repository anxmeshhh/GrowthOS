import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  Flame,
  Route as RouteIcon,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Heatmap, QuizDrawer, StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getTodayMission } from "@/lib/mock/daily-mission";
import { rankForLevel, xpProgressInLevel, ACHIEVEMENTS } from "@/lib/gamification";
import { inferSessionPhase } from "@/lib/session-phase";
import { getFlatTopics, LEARNING_PATHS } from "@/lib/roadmaps";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · GrowthOS" },
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
  const mission = getTodayMission(state);
  const { level } = xpProgressInLevel(state.gamification.xp);
  const rank = rankForLevel(level);
  const phase = activeTopic ? inferSessionPhase(activeTopic.checks) : "read";

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const checks = activeTopic?.checks || { video: false, notes: false, quiz: false, commit: false };
  const proofDone = Object.values(checks).filter(Boolean).length;
  const recentAchievements = state.gamification.achievements.slice(-3).reverse();

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-muted-foreground mb-2" suppressHydrationWarning>
            {isHydrated
              ? new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Loading…"}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" suppressHydrationWarning>
            {isHydrated ? greeting : "Welcome"}, {state.profile.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-amber-400/90 font-medium">{rank.title}</span>
            <span className="mx-2">·</span>
            Level {level}
          </p>
        </div>
        {state.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-950/30">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-200">{state.streak} day streak</span>
          </div>
        )}
      </header>

      {mission && activeTopic && (
        <section className="relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-card to-zinc-950 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="relative flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-amber-400/90">
                <Zap className="w-3 h-3" />
                Continue where you left off
              </div>
              <h2 className="text-xl md:text-2xl font-bold">{activeTopic.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{mission.reason}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-md bg-[var(--surface-2)] border border-border capitalize">
                  Phase: {phase}
                </span>
                <span>{proofDone}/4 proof</span>
                <span>~{mission.estimatedMinutes} min</span>
              </div>
            </div>
            <Link
              to="/topic/$topicId"
              params={{ topicId: activeTopic.id }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-900/30 hover:opacity-95 transition-opacity shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Continue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative mt-5 flex gap-1">
            {(["video", "notes", "quiz", "commit"] as const).map((key, i) => (
              <div
                key={key}
                className={`h-1.5 flex-1 rounded-full ${checks[key] ? "bg-emerald-500" : i === proofDone ? "bg-amber-500/60" : "bg-[var(--muted)]"}`}
              />
            ))}
          </div>
        </section>
      )}

      {recentAchievements.length > 0 && (
        <section className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground mr-1">Recent wins</span>
          {recentAchievements.map((id) => {
            const ach = ACHIEVEMENTS[id];
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-emerald-500/25 bg-emerald-950/20 text-emerald-300"
              >
                {ach.icon} {ach.title}
              </span>
            );
          })}
        </section>
      )}

      <section className="grid sm:grid-cols-3 gap-3">
        <StatCard
          icon={Target}
          label="Topics cleared"
          value={`${completedCount} / ${pathTopics.length}`}
          progress={completedCount / Math.max(pathTopics.length, 1)}
          accent="var(--in-progress)"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${state.streak} days`}
          sub={`Best: ${state.longestStreak}`}
          accent="var(--available)"
        />
        <StatCard
          icon={TrendingUp}
          label="XP total"
          value={`${state.gamification.xp.toLocaleString()}`}
          sub={rank.title}
          accent="var(--completed)"
        />
      </section>

      {activeTopic && (
        <section className="rounded-xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h3 className="text-sm font-semibold">Today&apos;s proof checklist</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{activePath.shortTitle}</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/roadmap"
                className="text-xs font-medium px-3 py-2 rounded-lg border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] inline-flex items-center gap-1.5"
              >
                <RouteIcon className="w-3.5 h-3.5" />
                Roadmap
              </Link>
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="text-xs font-medium px-3 py-2 rounded-lg bg-foreground text-background inline-flex items-center gap-1.5"
              >
                <BookOpenCheck className="w-3.5 h-3.5" />
                Quiz
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              { id: "video", label: "Study resource" },
              { id: "notes", label: "Explain-back notes" },
              { id: "quiz", label: "Pass quick check" },
              { id: "commit", label: "Build or capture proof" },
            ].map((task) => {
              const key = task.id as keyof typeof checks;
              const done = checks[key];
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => updateTopicCheck(activeTopic.id, key, !done)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-[var(--surface)] hover:bg-[var(--surface-2)] text-left transition-colors"
                >
                  <span
                    className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${
                      done ? "bg-emerald-500 border-emerald-500" : "border-border"
                    }`}
                  >
                    {done && <span className="text-[10px] text-white">✓</span>}
                  </span>
                  <span className={`text-sm ${done ? "text-muted-foreground line-through" : ""}`}>
                    {task.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Consistency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {state.activityDates.length} active days
            </p>
          </div>
        </div>
        <Heatmap />
      </section>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={activeTopic?.id} />
    </div>
  );
}
