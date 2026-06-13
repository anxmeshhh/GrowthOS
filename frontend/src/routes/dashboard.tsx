import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Flame, Target, BookOpen, ClipboardCheck, Github, Zap, Award, Star } from "lucide-react";
import { PageShell, PageHeader, Card, StatCard, Progress, Badge, Btn, StepDot } from "@/components/growth-ui";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — GrowthOS" }, { name: "description", content: "Today's mission, streak, and proof checklist." }] }),
  component: DashboardPage,
});

function getLevelInfo(xp: number) {
  if (xp < 20) return { level: 1, title: "Novice", next: 20 };
  if (xp < 50) return { level: 2, title: "Explorer", next: 50 };
  if (xp < 100) return { level: 3, title: "Scholar", next: 100 };
  if (xp < 250) return { level: 4, title: "Adept", next: 250 };
  if (xp < 500) return { level: 5, title: "Master", next: 500 };
  return { level: 6, title: "Grandmaster", next: xp }; // Max level
}

function GithubHeatmap({ data, isLoading }: { data: any[], isLoading: boolean }) {
  const today = new Date().toISOString().split('T')[0];
  const displayData = data.length > 0 ? data : [{ date: today, count: 0, level: 0 }];

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

  // Fetch heatmap (for XP calculation)
  const { data: heatmapData = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: async () => {
      const res = await apiFetch("/heatmap/");
      if (!res.ok) return [];
      const json = await res.json();
      return json.map((d: any) => {
        let level = 0;
        if (d.count > 0 && d.count <= 2) level = 1;
        else if (d.count > 2 && d.count <= 4) level = 2;
        else if (d.count > 4 && d.count <= 6) level = 3;
        else if (d.count > 6) level = 4;
        return { date: d.date, count: d.count, level };
      });
    }
  });

  // Fetch recent activity
  const { data: activityData = [], isLoading: activityLoading } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => {
      const res = await apiFetch("/activity/");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const totalXP = heatmapData.reduce((sum: number, day: any) => sum + day.count, 0);
  const { level, title, next } = getLevelInfo(totalXP);
  const xpPct = Math.min(100, Math.round((totalXP / next) * 100));

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
    return <PageShell><div className="flex items-center justify-center p-12 text-[#666]">Loading dashboard...</div></PageShell>;
  }

  // Determine dynamic checklist based on 'today' progress if we had detailed progress, 
  // but we only have user_progress string from the API right now. We'll use a visual simulation 
  // based on whether it's 'in_progress' or 'available'.
  const isStarted = today?.user_progress === 'in_progress';
  const checklist = [
    { label: "Understand the core concepts", done: isStarted, icon: BookOpen },
    { label: "Prepare a proof of work (PDF/DOCX)", done: false, icon: ClipboardCheck },
    { label: "Submit to AI for Verification", done: false, icon: Target },
  ];

  return (
    <PageShell>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <PageHeader
            kicker="Dashboard"
            title="Command Center"
            subtitle={activePath ? `Active Path: ${activePath.title}` : "No active path selected"}
          />
        </div>
        
        {/* Premium Level Badge */}
        <div className="flex items-center gap-4 bg-[#0a0f1e] border border-[#1e3060] rounded-xl p-3 pr-5">
          <div className="w-12 h-12 rounded-full bg-[#1e3060] border-2 border-[#3b5bdb] flex items-center justify-center relative shadow-[0_0_15px_rgba(59,91,219,0.3)]">
            <Star className="text-[#60a5fa]" size={20} fill="currentColor" />
            <div className="absolute -bottom-2 bg-[#0a0f1e] px-1.5 rounded text-[9px] font-mono font-bold text-[#60a5fa] border border-[#1e3060]">
              LVL {level}
            </div>
          </div>
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-semibold text-[#f0f0f0] tracking-wide">{title}</span>
              <span className="text-[10px] font-mono text-[#60a5fa]">{totalXP} / {next} XP</span>
            </div>
            <Progress value={xpPct} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Mission & Stats */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Today's Mission - Premium Card */}
          {today ? (
            <div className="relative overflow-hidden rounded-xl border border-[#22c55e]/30 bg-gradient-to-br from-[#0d1a0d] to-[#050a05] p-6 shadow-[0_4px_20px_rgba(34,197,94,0.05)]">
              {/* Decorative accent */}
              <div className="absolute -right-16 -top-16 w-48 h-48 bg-[#22c55e]/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-start justify-between gap-4 mb-5 relative z-10">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#22c55e] fill-current" />
                  <div className="text-xs uppercase tracking-[0.2em] font-mono text-[#22c55e] font-bold">Priority Mission</div>
                </div>
                <Link to="/topic/$topicId" params={{ topicId: String(today.slug || today.id) }}>
                  <Btn size="md" className="shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    Engage <ArrowRight size={16} className="ml-1" />
                  </Btn>
                </Link>
              </div>
              
              <div className="relative z-10">
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">{today.title}</h2>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1a2e1a] text-[#4ade80] border border-[#22c55e]/30 mb-4">
                  {activePath.title}
                </div>
                <p className="text-[#a0a0a0] leading-relaxed max-w-2xl text-sm mb-6">
                  {today.summary || "Complete the study session and submit your proof of work to the AI for verification to earn XP and extend your streak."}
                </p>
              </div>

              {/* Action Steps for clear direction */}
              <div className="flex flex-col gap-3 relative z-10">
                {checklist.map((row, idx) => (
                  <div key={idx} className={`flex items-center gap-4 p-3.5 rounded-xl border ${row.done ? 'bg-[#122212] border-[#22c55e]/40' : 'bg-[#0f0f0f] border-[#222]'}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${row.done ? 'bg-[#22c55e] text-[#0a0f1e]' : 'bg-[#222] text-[#666]'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${row.done ? "text-[#f0f0f0]" : "text-[#ccc]"}`}>{row.label}</div>
                    </div>
                    <div className={`p-2 rounded-lg ${row.done ? 'bg-[#22c55e]/20 text-[#4ade80]' : 'bg-[#1a1a1a] text-[#666]'}`}>
                      <row.icon size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-8 text-center flex flex-col items-center justify-center">
                <Award size={48} className="text-[#4ade80] mb-4 opacity-80" />
                <h3 className="text-xl font-bold text-white mb-2">Path Completed!</h3>
                <p className="text-[#888] text-sm max-w-md">You've mastered all topics in the {activePath?.title} path. Great job!</p>
             </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Topics Mastered"
              value={<span className="font-mono">{completion.done} / {completion.total}</span>}
              sub={<Progress value={completion.pct} />}
            />
            <StatCard label="Current Streak" value={<span className="flex items-center gap-2"><Flame size={20} className="text-[#22c55e]" />{streak}d</span>} sub={<span className="text-[#666] font-mono text-[10px] uppercase tracking-wider">keep it alive</span>} />
            <StatCard label="Total XP" value={<span className="font-mono text-[#60a5fa]">{totalXP}</span>} sub={<Badge tone="blue">Level {level}</Badge>} />
            <StatCard label="Path Readiness" value={<span className="font-mono">{completion.pct}%</span>} sub={<Progress value={completion.pct} />} />
          </div>
        </div>

        {/* Right Column: Feed */}
        <div className="xl:col-span-1">
          <Card className="p-0 overflow-hidden h-full flex flex-col border-[#1a1a1a]">
            <div className="bg-[#0f0f0f] p-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
                <div className="text-[11px] uppercase tracking-[0.18em] font-mono text-[#f0f0f0] font-bold">Activity Feed</div>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {activityLoading ? (
                <div className="text-center text-sm text-[#666] py-8">Syncing feed...</div>
              ) : activityData.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#222]" />
                  <ul className="space-y-4">
                    {activityData.map((a: any, i: number) => (
                      <li key={a.id} className="relative flex items-start gap-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-[2px] border-[#0a0a0a] z-10 ${i === 0 ? 'bg-[#22c55e]' : 'bg-[#333]'}`}>
                          {a.label.includes('XP') ? <Star size={10} className={i === 0 ? 'text-[#0a0a0a]' : 'text-[#888]'} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <div className={`text-sm truncate ${i === 0 ? 'text-[#f0f0f0] font-medium' : 'text-[#ccc]'}`}>{a.label}</div>
                          <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider mt-0.5">{timeAgo(a.date)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center text-sm text-[#666] py-8">
                  <Target size={24} className="mx-auto mb-2 opacity-20" />
                  No contributions yet.<br/>Start a topic to earn XP!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Streak heatmap */}
      <Card className="p-5 border-[#1a1a1a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Github size={16} className="text-[#a0a0a0]" />
            <div className="text-[11px] uppercase tracking-[0.18em] font-mono text-[#a0a0a0] font-bold">Contribution Graph</div>
          </div>
          <div className="text-xs text-[#666] hidden sm:block">Total Contributions: <span className="text-[#f0f0f0] font-mono">{totalXP}</span></div>
        </div>
        <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#1a1a1a]">
          <GithubHeatmap data={heatmapData} isLoading={heatmapLoading} />
        </div>
      </Card>
    </PageShell>
  );
}