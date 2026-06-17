import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Flame, Trophy, Target, Sparkles, Star, ChevronRight, Loader2, Zap } from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — GrowthOS" }] }),
  component: ProgressPage,
});

function getLevelInfo(xp: number) {
  if (xp < 50) return { level: 1, title: "Novice", next: 50 };
  if (xp < 150) return { level: 2, title: "Apprentice", next: 150 };
  if (xp < 350) return { level: 3, title: "Scholar", next: 350 };
  if (xp < 750) return { level: 4, title: "Adept", next: 750 };
  if (xp < 1500) return { level: 5, title: "Expert", next: 1500 };
  if (xp < 3000) return { level: 6, title: "Master", next: 3000 };
  if (xp < 5000) return { level: 7, title: "Grandmaster", next: 5000 };
  return { level: 8, title: "Legend", next: 0 };
}

function computeStreak(activeDays: string[]) {
  if (!activeDays || activeDays.length === 0) return 0;
  const days = [...activeDays].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  
  let currentStreak = 0;
  let currentDate = days.includes(today) ? today : (days.includes(yesterday) ? yesterday : null);
  
  if (!currentDate) return 0;
  
  for (let i = 0; i < days.length; i++) {
    if (days[i] === currentDate) {
      currentStreak++;
      const prevDate: string = new Date(new Date(currentDate!).getTime() - 86400000).toISOString().split("T")[0];
      currentDate = prevDate;
    } else if (days[i] < currentDate!) {
      break;
    }
  }
  return currentStreak;
}

function ProgressPage() {
  const qc = useQueryClient();

  /* ── queries ─────────────────────────────────────────────────────────── */

  const { data: paths = [], isLoading: pl } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const r = await apiFetch("/paths/"); return r.ok ? r.json() : []; },
  });

  const { data: customPaths = [], isLoading: cl } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => { const r = await apiFetch("/custom-paths/"); return r.ok ? r.json() : []; },
  });

  const { data: heatmap = [], isLoading: hl } = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const r = await apiFetch("/heatmap/");
      if (!r.ok) return [];
      return (await r.json()).map((d: any) => ({
        date: d.date, count: d.count,
        level: d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 4 ? 2 : d.count <= 6 ? 3 : 4,
      }));
    },
  });

  const { data: profile, isLoading: prl } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => { const r = await apiFetch("/profile/"); if (!r.ok) throw 0; return r.json(); },
  });

  /* ── derived ─────────────────────────────────────────────────────────── */
  const isLoading = pl || cl || hl || prl;

  const allPathsMap = new Map();
  paths.forEach((p: any) => allPathsMap.set(p.id, p));
  customPaths.forEach((p: any) => allPathsMap.set(p.id, p));
  const allPaths = Array.from(allPathsMap.values());

  const activePaths = useMemo(() => {
    return allPaths.filter(p => p.topics?.some((t: any) => t.user_progress === "in_progress" || t.user_progress === "completed"))
      .map(p => {
        const total = p.topics?.length || 0;
        const done = p.topics?.filter((t: any) => t.user_progress === "completed").length || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...p, total, done, pct };
      })
      .sort((a, b) => b.pct - a.pct); // Highest progress first
  }, [allPaths]);

  const xp = profile?.total_xp ?? 0;
  const { level, title: lvlTitle, next } = getLevelInfo(xp);
  const xpPct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const xpRemaining = next > 0 ? next - xp : 0;

  const streak = profile?.streak ?? computeStreak(profile?.heatmap?.map((h: any) => h.date) || []);

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  // Hardcoded achievements for visual gamification
  const achievements = [
    { id: 1, icon: Star, color: "#eab308", label: "First Blood", desc: "Completed your first topic" },
    { id: 2, icon: Target, color: "#3b82f6", label: "Focused", desc: "Maintained a 3-day streak" },
    { id: 3, icon: Sparkles, color: "#a855f7", label: "Fast Learner", desc: "Finished a module in 1 day" },
  ];

  /* ── render ──────────────────────────────────────────────────────────── */

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 text-[#444] animate-spin" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <style>{`
        .pg-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }
        @media (min-width: 1024px) {
          .pg-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.2fr);
            grid-template-rows: auto 160px minmax(0, 1fr) 180px;
            grid-template-areas:
              "hdr    hdr    hdr"
              "lvl    streak badges"
              "paths  paths  xp"
              "heatmap heatmap heatmap";
            height: calc(100vh - 64px);
            overflow: hidden;
          }
        }
      `}</style>

      <div className="pg-grid">
        
        {/* ── [HDR] ──────────────────────────────────────────────────────── */}
        <div className="col-span-full flex flex-col md:flex-row md:items-end justify-between pb-1 gap-2 shrink-0" style={{ gridArea: "hdr" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#444] mb-1">GrowthOS</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0] leading-none">Your Progress</h1>
          </div>
          <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider flex items-center gap-2">
            <Trophy size={12} className="text-[#a855f7]" /> {lvlTitle} Status
          </div>
        </div>

        {/* ── [LVL] ──────────────────────────────────────────────────────── */}
        <div className="border border-[#1f1938] bg-[#0d0914] rounded-lg p-5 flex flex-col justify-between relative overflow-hidden" style={{ gridArea: "lvl" }}>
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#a855f7] opacity-5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#a855f7] font-semibold">Level {level}</span>
              <span className="text-[10px] font-mono text-[#555] uppercase tracking-wider">— {lvlTitle}</span>
            </div>
            <div className="text-3xl font-semibold tracking-tight text-[#f0f0f0] mt-1">
              {xp} <span className="text-lg text-[#555]">XP</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase tracking-wider">
              <span className="text-[#888]">{xpPct}% Progress</span>
              <span className="text-[#a855f7] font-semibold">{xpRemaining} XP to Level {level + 1}</span>
            </div>
            <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7e22ce] to-[#c084fc] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── [STREAK] ───────────────────────────────────────────────────── */}
        <div className="border border-[#2a1a08] bg-[#140c04] rounded-lg p-5 flex flex-col items-center justify-center text-center relative" style={{ gridArea: "streak" }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#f59e0b] opacity-10 rounded-full blur-2xl pointer-events-none" />
          <Flame size={32} className={`mb-2 ${streak > 0 ? "text-[#f59e0b]" : "text-[#333]"}`} strokeWidth={2} />
          <div className={`text-3xl font-mono font-semibold tracking-tight ${streak > 0 ? "text-[#f59e0b]" : "text-[#444]"}`}>
            {streak}
          </div>
          <div className="text-[9px] uppercase font-mono tracking-wider text-[#666] mt-1">Day Streak</div>
        </div>

        {/* ── [BADGES] ───────────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg p-4 flex flex-col" style={{ gridArea: "badges" }}>
          <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#444] mb-4 shrink-0 flex items-center justify-between">
            Recent Unlocks
          </div>
          <div className="flex-1 flex items-center justify-center gap-3">
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={a.id} className="relative group cursor-help">
                  <div className="w-12 h-12 rounded-full border border-[#222] bg-[#111] flex items-center justify-center hover:scale-110 transition-transform">
                    <Icon size={20} color={a.color} opacity={0.9} />
                  </div>
                  {/* Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#222] text-[#eee] text-[10px] whitespace-nowrap px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                    {a.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── [PATHS] ────────────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg flex flex-col overflow-hidden" style={{ gridArea: "paths" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#131313] shrink-0">
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#555]">Active Missions</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2 custom-scrollbar">
            {activePaths.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[11px] text-[#444] uppercase font-mono tracking-wider">
                No active paths. Start a mission!
              </div>
            ) : (
              activePaths.map((p) => (
                <Link key={p.id} to="/roadmap" className="block border border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#0d0d0d] rounded-md p-4 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-medium text-[#ccc] group-hover:text-[#fff] transition-colors">{p.title}</h3>
                      <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mt-1">{p.done} / {p.total} Topics Completed</div>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[#222] flex items-center justify-center group-hover:border-[#444] transition-colors">
                      <ChevronRight size={14} className="text-[#555] group-hover:text-[#eee]" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#151515] rounded-full overflow-hidden">
                      <div className="h-full bg-[#22c55e] transition-all duration-1000" style={{ width: `${p.pct}%` }} />
                    </div>
                    <div className="text-[10px] font-mono text-[#22c55e] tabular-nums w-8 text-right">{p.pct}%</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ── [XP BREAKDOWN] ─────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg flex flex-col overflow-hidden" style={{ gridArea: "xp" }}>
          <div className="px-4 py-3 border-b border-[#131313] shrink-0 flex items-center gap-2">
            <Zap size={12} className="text-[#eab308]" />
            <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#555]">XP Sources</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 custom-scrollbar">
            {profile?.xp_breakdown && profile.xp_breakdown.length > 0 ? (
              profile.xp_breakdown.map((item: any, i: number) => {
                const maxXp = profile.xp_breakdown[0].total;
                const pct = Math.round((item.total / maxXp) * 100);
                const label = item.action_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                return (
                  <div key={item.action_type}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#777]">{label}</span>
                      <span className="text-[11px] font-mono text-[#ccc] tabular-nums">{item.total}</span>
                    </div>
                    <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-[#eab308]" : "bg-[#444]"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-[10px] text-[#444] font-mono uppercase tracking-wider text-center pt-8">No XP Data</div>
            )}
          </div>
        </div>

        {/* ── [HEATMAP] ──────────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg p-4 flex flex-col justify-center overflow-hidden" style={{ gridArea: "heatmap" }}>
          <div className="w-full overflow-x-auto custom-scrollbar pb-1">
            <div className="min-w-[700px]">
              <ActivityCalendar
                data={hd}
                theme={{ light: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"], dark: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"] }}
                colorScheme="dark"
                blockSize={11}
                blockMargin={4}
                fontSize={10}
                labels={{ totalCount: "{{count}} contributions in the last year" }}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
              />
            </div>
          </div>
        </div>

      </div>
    </PageShell>
  );
}