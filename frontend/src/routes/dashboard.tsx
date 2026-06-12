import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Target, BookOpen, ClipboardCheck, Github } from "lucide-react";
import { PageShell, PageHeader, Card, StatCard, Progress, Badge, Btn, StepDot } from "@/components/growth-ui";
import { useGrowth, computeStreak, pathCompletion } from "@/lib/growth-store";
import { TOPICS, PATHS } from "@/lib/growth-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GrowthOS" }, { name: "description", content: "Today's mission, streak, and proof checklist." }] }),
  component: DashboardPage,
});

function pickTodayTopic(state: ReturnType<typeof useGrowth>["state"]) {
  // first in-progress, else first available, else first topic of path
  const pathTopics = TOPICS.filter((t) => t.pathId === state.settings.pathId);
  for (const t of pathTopics) {
    const p = state.progress[t.id];
    if (p && !(p.resourceDone && p.notesDone && p.quizDone && p.buildDone)) return t;
  }
  for (const t of pathTopics) {
    if (!state.progress[t.id]) return t;
  }
  return pathTopics[0];
}

function StreakGrid({ activeDays }: { activeDays: string[] }) {
  const set = new Set(activeDays);
  const days: { date: string; level: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const active = set.has(key);
    days.push({ date: key, level: active ? 2 + Math.floor(Math.random() * 2) : 0 });
  }
  const color = (lvl: number) =>
    lvl === 0 ? "bg-[#1a1a1a]" : lvl === 1 ? "bg-[#14532d]" : lvl === 2 ? "bg-[#16a34a]" : "bg-[#22c55e]";
  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d) => (
        <div key={d.date} title={d.date} className={`h-3 w-3 rounded-sm ${color(d.level)}`} />
      ))}
    </div>
  );
}

function DashboardPage() {
  const { state } = useGrowth();
  const path = PATHS.find((p) => p.id === state.settings.pathId)!;
  const today = pickTodayTopic(state);
  const todayProgress = today ? state.progress[today.id] ?? { resourceDone: false, notesDone: false, quizDone: false, buildDone: false } : null;
  const completion = pathCompletion(state, state.settings.pathId);
  const streak = computeStreak(state.activeDays);

  return (
    <PageShell>
      <PageHeader
        kicker="Today"
        title={`Welcome back, ${state.settings.displayName}.`}
        subtitle={`${path.name} · ${state.settings.dailyMinutes} min daily budget`}
      />

      {/* Today's Mission */}
      {today ? (
        <div className="border border-[#22c55e]/30 bg-[#0d1a0d] rounded-lg p-5 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#22c55e]">Today's Mission</div>
            <Link to="/topic/$topicId" params={{ topicId: today.id }}>
              <Btn size="sm">
                Start Session <ArrowRight size={14} />
              </Btn>
            </Link>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{today.title}</h2>
          <div className="text-xs text-[#999] mt-1 font-mono">
            Est. {today.estMinutes} min · {path.name} Path
          </div>
          <ol className="mt-5 space-y-2 text-sm">
            <li className="flex items-center gap-3 text-[#ccc]">
              <span className="font-mono text-[#666] text-xs w-5">①</span>
              <span>Watch: {today.resources[0]?.title ?? "Pick a resource"}{today.resources[0]?.duration ? ` (${today.resources[0].duration} min)` : ""}</span>
            </li>
            <li className="flex items-center gap-3 text-[#ccc]">
              <span className="font-mono text-[#666] text-xs w-5">②</span>
              <span>Write notes on the core concepts</span>
            </li>
            <li className="flex items-center gap-3 text-[#ccc]">
              <span className="font-mono text-[#666] text-xs w-5">③</span>
              <span>Pass the quiz: score ≥ 70%</span>
            </li>
            <li className="flex items-center gap-3 text-[#ccc]">
              <span className="font-mono text-[#666] text-xs w-5">④</span>
              <span>Commit: {today.buildChallenge}</span>
            </li>
          </ol>
        </div>
      ) : null}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Topics Cleared"
          value={<span className="font-mono">{completion.done} / {completion.total}</span>}
          sub={<Progress value={completion.pct} />}
        />
        <StatCard label="Current Streak" value={<span className="flex items-center gap-2"><Flame size={20} className="text-[#22c55e]" />{streak}d</span>} sub={<span className="text-[#666] font-mono text-[10px] uppercase tracking-wider">keep it alive</span>} />
        <StatCard label="Today's Focus" value={<span className="text-base">{today?.title ?? "—"}</span>} sub={<Badge tone={todayProgress && (todayProgress.resourceDone || todayProgress.notesDone) ? "amber" : "green"}>{todayProgress && (todayProgress.resourceDone || todayProgress.notesDone) ? "In Progress" : "Ready"}</Badge>} />
        <StatCard label="Path Readiness" value={<span className="font-mono">{completion.pct}%</span>} sub={<Progress value={completion.pct} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Proof Checklist */}
        {today ? (
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">Proof Checklist</div>
                <div className="text-sm text-[#f0f0f0] mt-1">{today.title}</div>
              </div>
              <Link to="/topic/$topicId" params={{ topicId: today.id }} className="text-xs text-[#22c55e] hover:underline">Open workspace →</Link>
            </div>
            <ul className="space-y-2.5">
              {[
                { label: "Resource watched", done: !!todayProgress?.resourceDone, icon: BookOpen },
                { label: "Notes written", done: !!todayProgress?.notesDone, icon: BookOpen },
                { label: "Quiz passed", done: !!todayProgress?.quizDone, icon: ClipboardCheck },
                { label: "Build committed", done: !!todayProgress?.buildDone, icon: Github },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-3 text-sm py-2 px-3 border border-[#222] rounded">
                  <row.icon size={14} className="text-[#666]" />
                  <span className={row.done ? "text-[#f0f0f0]" : "text-[#999]"}>{row.label}</span>
                  <StepDot done={row.done} />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {/* Recent Activity */}
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-3">Recent Activity</div>
          <ul className="space-y-2 text-sm">
            {state.activity.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start gap-2 text-[#ccc]">
                <span className="text-[#22c55e] mt-1.5">•</span>
                <div className="min-w-0">
                  <div className="truncate">{a.label}</div>
                  <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider">{timeAgo(a.date)}</div>
                </div>
              </li>
            ))}
            {state.activity.length === 0 ? <li className="text-[#666] text-sm">No activity yet.</li> : null}
          </ul>
        </Card>
      </div>

      {/* Streak heatmap */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-[#666]" />
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">Last 30 Days</div>
        </div>
        <StreakGrid activeDays={state.activeDays} />
      </Card>
    </PageShell>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}