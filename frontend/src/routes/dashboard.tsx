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

import { useQuery } from "@tanstack/react-query";
import { ActivityCalendar } from "react-activity-calendar";

function GithubHeatmap() {
  const { data: heatmapData = [], isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/heatmap/");
        if (!res.ok) throw new Error("Network response was not ok");
        const json = await res.json();
        return json.map((d: any) => {
          let level = 0;
          if (d.count > 0 && d.count <= 2) level = 1;
          else if (d.count > 2 && d.count <= 4) level = 2;
          else if (d.count > 4 && d.count <= 6) level = 3;
          else if (d.count > 6) level = 4;
          return { date: d.date, count: d.count, level };
        });
      } catch (err) {
        console.error("Failed to fetch heatmap", err);
        return [];
      }
    }
  });

  // react-activity-calendar requires at least one year's worth of data or the year boundaries
  // If data is empty or too small, we just pad it with today's date so it renders nicely
  const today = new Date().toISOString().split('T')[0];
  const displayData = heatmapData.length > 0 ? heatmapData : [{ date: today, count: 0, level: 0 }];

  return (
    <div className="text-xs overflow-x-auto w-full py-2">
      {isLoading ? (
        <div className="h-[120px] flex items-center justify-center text-[#666]">Loading heatmap...</div>
      ) : (
        <ActivityCalendar
          data={displayData}
          theme={{
            light: ['#1a1a1a', '#14532d', '#16a34a', '#22c55e', '#4ade80'],
            dark: ['#1a1a1a', '#14532d', '#16a34a', '#22c55e', '#4ade80'],
          }}
          colorScheme="dark"
          labels={{
            totalCount: "{{count}} contributions in the last year",
          }}
        />
      )}
    </div>
  );
}

import { apiFetch } from "@/lib/api-client";

function DashboardPage() {
  const { state } = useGrowth();
  
  // Fetch paths
  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ['paths'],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const activePath = paths.find((p: any) => p.is_bookmarked) || paths[0] || null;
  const topics = activePath?.topics || [];
  const nextTopic = topics.find((t: any) => t.user_progress !== 'completed') || topics[0] || null;
  const today = nextTopic; 
  
  // Calculate completion
  let completedCount = 0;
  topics.forEach((t: any) => {
    if (t.user_progress === 'completed') completedCount++;
  });
  const completion = { 
    done: completedCount, 
    total: topics.length, 
    pct: topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0 
  };
  const streak = computeStreak(state.activeDays);

  if (pathsLoading) {
    return <PageShell><div className="p-8 text-[#999]">Loading dashboard...</div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Today"
        title={`Welcome back.`}
        subtitle={activePath ? `${activePath.title} Path` : "No active path selected"}
      />

      {/* Today's Mission */}
      {today ? (
        <div className="border border-[#22c55e]/30 bg-[#0d1a0d] rounded-lg p-5 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#22c55e]">Today's Mission</div>
            <Link to="/topic/$topicId" params={{ topicId: String(today.id) }}>
              <Btn size="sm">
                Start Session <ArrowRight size={14} />
              </Btn>
            </Link>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">{today.title}</h2>
          <div className="text-xs text-[#999] mt-1 font-mono">
            {activePath.title} Path
          </div>
          <p className="mt-4 text-sm text-[#ccc] leading-relaxed">
            {today.summary || "Upload a proof of work to complete this topic and gain your daily contribution."}
          </p>
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
        <StatCard label="Today's Focus" value={<span className="text-base truncate block">{today?.title ?? "—"}</span>} sub={<Badge tone="green">Ready</Badge>} />
        <StatCard label="Path Readiness" value={<span className="font-mono">{completion.pct}%</span>} sub={<Progress value={completion.pct} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Proof Checklist */}
        {today ? (
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">Proof Checklist</div>
                <div className="text-sm text-[#f0f0f0] mt-1 truncate">{today.title}</div>
              </div>
              <Link to="/topic/$topicId" params={{ topicId: String(today.id) }} className="text-xs text-[#22c55e] hover:underline">Open workspace →</Link>
            </div>
            <ul className="space-y-2.5">
              {[
                { label: "Understand the core concepts", done: false, icon: BookOpen },
                { label: "Prepare a proof of work (PDF/DOCX)", done: false, icon: ClipboardCheck },
                { label: "Submit to AI for Verification", done: false, icon: Target },
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
          <Github size={16} className="text-[#666]" />
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">Contribution Graph</div>
        </div>
        <GithubHeatmap />
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