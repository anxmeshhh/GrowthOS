import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Flame, Loader2, Trophy, Target, Map } from "lucide-react";
import { PageShell, PageHeader, Card, Progress } from "@/components/growth-ui";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — GrowthOS" }, { name: "description", content: "Heatmap, streaks, and per-path completion." }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const res = await apiFetch("/paths/"); return res.ok ? res.json() : []; },
  });

  const { data: heatmapData = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ["heatmap"],
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
    },
  });

  const { data: profile } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => { const res = await apiFetch("/profile/"); return res.ok ? res.json() : null; },
  });

  const isLoading = pathsLoading || heatmapLoading;

  const pathStats = useMemo(() => {
    return paths.map((p: any) => {
      const topics = p.topics || [];
      const total = topics.length;
      const done = topics.filter((t: any) => t.user_progress === "completed").length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      return { title: p.title, slug: p.slug, total, done, pct };
    });
  }, [paths]);

  const allTopics = paths.flatMap((p: any) => p.topics || []);
  const totalDone = allTopics.filter((t: any) => t.user_progress === "completed").length;
  const totalAll = allTopics.length;
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0;

  const streak = profile?.streak || 0;
  const totalXp = profile?.total_xp || 0;
  const level = profile?.level || 1;

  if (isLoading) {
    return <PageShell><div className="flex items-center justify-center p-12 text-[#666]"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading progress...</div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader kicker="Your Progress" title="Learning Analytics" subtitle="Streaks, heatmap, and per-path completion — all from your real data." />

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Current Streak</div>
          <div className="flex items-center gap-3">
            <Flame size={28} className="text-[#f59e0b]" />
            <div className="text-3xl font-semibold font-mono tracking-tight text-[#f59e0b]">{streak}</div>
            <div className="text-xs text-[#999] font-mono uppercase">days</div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Level</div>
          <div className="text-3xl font-semibold font-mono">
            <span className="text-[#60a5fa]">{level}</span>
          </div>
          <div className="text-xs text-[#555] font-mono">{totalXp} XP</div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Topics Completed</div>
          <div className="text-3xl font-semibold font-mono">{totalDone}<span className="text-[#333] text-xl">/{totalAll}</span></div>
        </Card>
        <Card className="p-5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Overall Mastery</div>
          <div className="text-3xl font-semibold font-mono mb-1">{overallPct}%</div>
          <Progress value={overallPct} />
        </Card>
      </div>

      {/* Heatmap — unified with react-activity-calendar */}
      <Card className="p-5 mb-6">
        <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-4">Activity Heatmap</div>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[700px]">
            {heatmapLoading ? (
              <div className="h-32 bg-[#111] animate-pulse rounded" />
            ) : (
              <ActivityCalendar
                data={heatmapData}
                theme={{ light: ["#161616", "#0e4429", "#006d32", "#26a641", "#39d353"], dark: ["#161616", "#0e4429", "#006d32", "#26a641", "#39d353"] }}
                colorScheme="dark"
                blockSize={12}
                blockMargin={4}
                fontSize={12}
                labels={{ legend: { less: "Less", more: "More" }, totalCount: "{{count}} contributions in the last year" }}
              />
            )}
          </div>
        </div>
      </Card>

      {/* XP Breakdown + Per-path progress side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* XP Breakdown */}
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-4">XP Sources</div>
          {profile?.xp_breakdown && profile.xp_breakdown.length > 0 ? (
            <div className="space-y-3">
              {profile.xp_breakdown.map((item: any) => {
                const maxXp = profile.xp_breakdown[0].total;
                const pct = Math.round((item.total / maxXp) * 100);
                const label = item.action_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <div key={item.action_type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#ccc]">{label}</span>
                      <span className="font-mono text-[#666]">{item.total} XP</span>
                    </div>
                    <div className="h-1.5 bg-[#222] rounded-full">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-[#22c55e] to-[#4ade80] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-[#888] text-center py-6">No XP earned yet. Start studying!</div>
          )}
        </Card>

        {/* Per-path progress */}
        <Card className="p-5">
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-4">By Learning Path</div>
          {pathStats.length === 0 ? (
            <div className="text-sm text-[#888] text-center py-6">No paths bookmarked yet.</div>
          ) : (
            <ul className="space-y-3">
              {pathStats.map((p: any) => (
                <li key={p.slug} className="flex items-center gap-3 text-sm">
                  <div className="w-48 truncate font-medium text-[#ccc]">{p.title}</div>
                  <div className="flex-1"><Progress value={p.pct} /></div>
                  <div className="font-mono text-xs text-[#999] w-24 text-right">
                    {p.pct}% · {p.done}/{p.total}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageShell>
  );
}