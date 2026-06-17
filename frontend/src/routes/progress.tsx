import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Flame, Trophy, Zap, Star, ChevronRight, Loader2,
  Shield, Sword, Crown, Hexagon, Map, BarChart2, Tag, CalendarDays,
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";
import { TITLES, type TitleTag } from "@/lib/tags";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — GrowthOS" }] }),
  component: ProgressPage,
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function getLevelInfo(xp: number) {
  let l = 1;
  let n = 100;
  let temp = xp;
  while (temp >= n) { temp -= n; l++; n = Math.floor(n * 1.5); }
  return { level: l, currentXP: temp, next: n };
}

function computeStreak(activeDays: string[]) {
  if (!activeDays || activeDays.length === 0) return 0;
  const days = [...activeDays].sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let streak = 0;
  let cur: string | null = days.includes(today)
    ? today
    : days.includes(yesterday)
      ? yesterday
      : null;
  if (!cur) return 0;
  for (let i = 0; i < days.length; i++) {
    if (days[i] === cur) {
      streak++;
      cur = new Date(new Date(cur!).getTime() - 86400000).toISOString().split("T")[0];
    } else if (days[i] < cur!) {
      break;
    }
  }
  return streak;
}

const RARITY_CONFIG: Record<
  string,
  { color: string; bg: string; border: string; label: string; Icon: any }
> = {
  common: { color: "#888", bg: "#88888818", border: "#333", label: "Common", Icon: Star },
  uncommon: { color: "#22c55e", bg: "#22c55e18", border: "#14532d", label: "Uncommon", Icon: Shield },
  rare: { color: "#3b82f6", bg: "#3b82f618", border: "#1e3a8a", label: "Rare", Icon: Sword },
  epic: { color: "#a855f7", bg: "#a855f718", border: "#581c87", label: "Epic", Icon: Crown },
  legendary: { color: "#f59e0b", bg: "#f59e0b18", border: "#78350f", label: "Legendary", Icon: Flame },
  mythic: { color: "#ef4444", bg: "#ef444418", border: "#7f1d1d", label: "Mythic", Icon: Hexagon },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#555] flex items-center gap-1.5">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#131313]">
      <div>{left}</div>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function ProgressPage() {
  const qc = useQueryClient();
  const [savingTitle, setSavingTitle] = useState(false);

  /* ── queries ── */
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
        date: d.date,
        count: d.count,
        level: d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 4 ? 2 : d.count <= 6 ? 3 : 4,
      }));
    },
  });

  const { data: profile, isLoading: prl } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => { const r = await apiFetch("/profile/"); if (!r.ok) throw 0; return r.json(); },
  });

  const isLoading = pl || cl || hl || prl;

  /* ── derived ── */
  const allPaths = [
    ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
  ];

  const activePaths = useMemo(() => {
    return allPaths
      .filter((p) =>
        p.topics?.some(
          (t: any) => t.user_progress === "in_progress" || t.user_progress === "completed"
        )
      )
      .map((p) => {
        const total = p.topics?.length || 0;
        const done = p.topics?.filter((t: any) => t.user_progress === "completed").length || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return { ...p, total, done, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [allPaths]);

  const xp = profile?.total_xp ?? 0;
  const { level, next } = getLevelInfo(xp);
  const lvlTitle = profile?.selected_title || "Novice";
  const xpPct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const xpRemaining = next > 0 ? next - xp : 0;
  const streak = profile?.streak ?? computeStreak(profile?.heatmap?.map((h: any) => h.date) || []);

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  const unlockedCount = TITLES.filter((t) => level >= t.levelReq).length;

  const equipTitle = async (titleId: string) => {
    setSavingTitle(true);
    try {
      const res = await apiFetch("/profile/", {
        method: "PATCH",
        body: JSON.stringify({ selected_title: titleId }),
      });
      if (res.ok) qc.invalidateQueries({ queryKey: ["user_profile"] });
    } finally {
      setSavingTitle(false);
    }
  };

  /* ── loading ── */
  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-4 h-4 text-[#444] animate-spin" />
        </div>
      </PageShell>
    );
  }

  /* ── render ── */
  return (
    <PageShell>
      <div className="p-5 lg:p-6 space-y-4 max-w-screen-xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#444] mb-1.5">GrowthOS</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0] leading-none">
              Your Progress
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#555] uppercase tracking-wider">
            <Trophy size={12} className="text-[#a855f7]" />
            {lvlTitle} Status
          </div>
        </div>

        {/* ── Top Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Level + XP bar */}
          <div className="bg-[#0d0914] border border-[#1f1938] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#a855f7] opacity-[0.06] rounded-full blur-3xl pointer-events-none" />
            <SectionLabel>
              <Zap size={11} className="text-[#a855f7]" /> Current Level
            </SectionLabel>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-[#a855f7]">{level}</span>
              <span className="text-sm text-[#555] font-mono">— {lvlTitle}</span>
            </div>
            <div className="text-[11px] font-mono text-[#666] mt-0.5">{xp} XP total</div>

            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                <span className="text-[#666]">{xpPct}% to Level {level + 1}</span>
                <span className="text-[#a855f7]">{xpRemaining} XP needed</span>
              </div>
              <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a855f7] rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Streak */}
          <div className="bg-[#0d0b04] border border-[#221a05] rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#f59e0b] opacity-[0.07] rounded-full blur-2xl pointer-events-none" />
            <SectionLabel>
              <Flame size={11} className="text-[#f59e0b]" /> Day Streak
            </SectionLabel>
            <div className={`text-4xl font-mono font-semibold mt-3 ${streak > 0 ? "text-[#f59e0b]" : "text-[#333]"}`}>
              {streak}
            </div>
            <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mt-1">
              {streak > 0 ? "Keep it alive!" : "Start today"}
            </div>
          </div>

          {/* Total XP */}
          <div className="bg-[#040d07] border border-[#0d2214] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-[#22c55e] opacity-[0.06] rounded-full blur-2xl pointer-events-none" />
            <SectionLabel>
              <Star size={11} className="text-[#22c55e]" /> Total XP Earned
            </SectionLabel>
            <div className="text-3xl font-semibold tracking-tight text-[#f0f0f0] mt-3">
              {xp.toLocaleString()}
              <span className="text-base text-[#555] ml-1.5">XP</span>
            </div>
            <div className="text-[11px] font-mono text-[#22c55e] mt-1">
              +120 this week
            </div>
          </div>
        </div>

        {/* ── Middle Row: Missions + XP Sources ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Active Missions */}
          <Card>
            <CardHeader
              left={
                <SectionLabel>
                  <Map size={11} /> Active Missions
                </SectionLabel>
              }
              right={
                <span className="text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">
                  {activePaths.length} active
                </span>
              }
            />
            <div className="p-3 space-y-2">
              {activePaths.length === 0 ? (
                <div className="py-10 text-center text-[11px] text-[#444] font-mono uppercase tracking-widest">
                  No active paths — start a mission!
                </div>
              ) : (
                activePaths.map((p) => (
                  <Link
                    key={p.uniqueId}
                    to="/roadmap"
                    className="flex items-start gap-4 p-4 border border-[#161616] hover:border-[#252525] bg-[#0d0d0d] hover:bg-[#0f0f0f] rounded-lg transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-medium text-[#ccc] group-hover:text-[#f0f0f0] transition-colors truncate">
                            {p.title}
                          </h3>
                          <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mt-0.5">
                            {p.done} / {p.total} Topics
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[12px] font-mono text-[#22c55e]">{p.pct}%</span>
                          <ChevronRight size={13} className="text-[#444] group-hover:text-[#888] transition-colors" />
                        </div>
                      </div>
                      <div className="h-[3px] w-full bg-[#151515] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e] rounded-full transition-all duration-700"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

          {/* XP Sources */}
          <Card>
            <CardHeader
              left={
                <SectionLabel>
                  <BarChart2 size={11} className="text-[#f59e0b]" /> XP Sources
                </SectionLabel>
              }
            />
            <div className="p-5 space-y-5">
              {profile?.xp_breakdown && profile.xp_breakdown.length > 0 ? (
                profile.xp_breakdown.map((item: any, i: number) => {
                  const maxXp = profile.xp_breakdown[0].total;
                  const pct = Math.round((item.total / maxXp) * 100);
                  const label = item.action_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <div key={item.action_type}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[11px] uppercase font-mono tracking-wider text-[#666]">
                          {label}
                        </span>
                        <span className="text-[12px] font-mono text-[#bbb] tabular-nums">
                          {item.total.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-[3px] w-full bg-[#111] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${i === 0 ? "bg-[#f59e0b]" : "bg-[#2a2a2a]"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-[10px] text-[#444] font-mono uppercase tracking-widest">
                  No XP data yet
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Title Collection ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <Tag size={11} /> Title Collection
              </SectionLabel>
            }
            right={
              <span className="text-[10px] font-mono text-[#f59e0b] uppercase tracking-wider">
                {unlockedCount} / {TITLES.length} Unlocked
              </span>
            }
          />
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto custom-scrollbar">
            {TITLES.map((tag) => {
              const unlocked = level >= tag.levelReq;
              const isEquipped = profile?.selected_title === tag.name;
              const cfg = RARITY_CONFIG[tag.rarity] ?? RARITY_CONFIG.common;
              const { Icon } = cfg;

              return (
                <button
                  key={tag.id}
                  disabled={!unlocked || savingTitle || isEquipped}
                  onClick={() => equipTitle(tag.name)}
                  className={`
                    flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all
                    ${unlocked
                      ? isEquipped
                        ? "border-[#22c55e]/40 bg-[#22c55e]/[0.04]"
                        : "border-[#1a1a1a] hover:border-[#272727] hover:bg-[#0d0d0d] cursor-pointer"
                      : "border-[#111] bg-[#050505] opacity-40 cursor-not-allowed"
                    }
                  `}
                >
                  {/* Icon badge */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: unlocked ? cfg.bg : "#88888810" }}
                  >
                    <Icon
                      size={14}
                      style={{ color: unlocked ? cfg.color : "#555" }}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[13px] font-medium leading-none"
                        style={{ color: unlocked ? cfg.color : "#555" }}
                      >
                        {tag.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] leading-none">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#555] mt-1 leading-snug truncate">
                      {tag.desc}
                    </div>
                  </div>

                  {/* Rarity / lock pill */}
                  <div className="shrink-0">
                    {unlocked ? (
                      <span
                        className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded leading-none"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#111] text-[#444] leading-none">
                        Lvl {tag.levelReq}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* ── Activity Heatmap ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <CalendarDays size={11} /> Activity Heatmap
              </SectionLabel>
            }
            right={
              <span className="text-[10px] font-mono text-[#444] uppercase tracking-wider">
                Last 12 months
              </span>
            }
          />
          <div className="p-5 overflow-x-auto">
            <div className="min-w-[680px]">
              <ActivityCalendar
                data={hd}
                theme={{
                  light: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  dark: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                }}
                colorScheme="dark"
                blockSize={11}
                blockMargin={4}
                fontSize={10}
                labels={{ totalCount: "{{count}} contributions in the last year" }}
                style={{
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "#555",
                }}
              />
            </div>
          </div>
        </Card>

      </div>
    </PageShell>
  );
}