import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  Flame,
  Route as RouteIcon,
  Target,
  TrendingUp,
} from "lucide-react";
import { DirectionCard } from "@/components/growth/direction-card";
import { Heatmap, QuizDrawer, StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFocusTopic } from "@/lib/focus-topic";
import { getTodayMission } from "@/lib/mock/daily-mission";
import { rankForLevel, xpProgressInLevel, ACHIEVEMENTS } from "@/lib/gamification";
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
  const focusTopic = useMemo(
    () => getFocusTopic(state, state.profile.path),
    [state, state.profile.path],
  );
  const activeTopic = focusTopic
    ? state.topics[focusTopic.id]
    : pathTopics.map((t) => state.topics[t.id]).find(Boolean);
  const completedCount = pathTopics.filter(
    (topic) => state.topics[topic.id]?.status === "completed",
  ).length;
  const mission = getTodayMission(state);
  const { level } = xpProgressInLevel(state.gamification.xp);
  const rank = rankForLevel(level);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 5) return "Still up";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const checks = activeTopic?.checks || { video: false, notes: false, quiz: false, commit: false };
  const recentAchievements = state.gamification.achievements.slice(-3).reverse();

  return (
    <div className="growth-page space-y-8">
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
            <span className="mx-2">·</span>
            {activePath.shortTitle}
          </p>
        </div>
        {state.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-950/30">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-orange-200">{state.streak} day streak</span>
          </div>
        )}
      </header>

      <DirectionCard
        focusTopic={focusTopic}
        reason={mission?.reason}
        pathTitle={activePath.shortTitle}
        estimatedMinutes={mission?.estimatedMinutes}
        label="Your next move"
      />

      {recentAchievements.length > 0 && (
        <section className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground mr-1">
            Proof wins
          </span>
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
          accent="var(--completed)"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={`${state.streak} days`}
          sub={`Best: ${state.longestStreak}`}
          accent="var(--mission)"
        />
        <StatCard
          icon={TrendingUp}
          label="XP total"
          value={`${state.gamification.xp.toLocaleString()}`}
          sub={rank.title}
          accent="var(--in-progress)"
        />
      </section>

      {activeTopic && (
        <section className="section-card p-5 md:p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h3 className="text-sm font-semibold">Today&apos;s proof checklist</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tick these off on your desk — each one is evidence you actually learned it.
              </p>
            </div>
            <div className="flex gap-2">
              <Link to="/roadmap" className="btn-ghost">
                <RouteIcon className="w-3.5 h-3.5" />
                Roadmap
              </Link>
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="btn-mission btn-mission-sm"
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

      <section className="section-card p-5 md:p-6">
        <div className="flex items-baseline justify-between mb-4 gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-semibold">Consistency</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {state.activityDates.length} active days — showing up is half the battle
            </p>
          </div>
        </div>
        <Heatmap />
      </section>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={activeTopic?.id} />
    </div>
  );
}
