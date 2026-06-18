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
  common: { color: "#888", bg: "#88888812", border: "#222", label: "Common", Icon: Star },
  uncommon: { color: "#22c55e", bg: "#22c55e10", border: "#14532d", label: "Uncommon", Icon: Shield },
  rare: { color: "#3b82f6", bg: "#3b82f610", border: "#1e3a8a", label: "Rare", Icon: Sword },
  epic: { color: "#a855f7", bg: "#a855f710", border: "#581c87", label: "Epic", Icon: Crown },
  legendary: { color: "#f59e0b", bg: "#f59e0b10", border: "#78350f", label: "Legendary", Icon: Flame },
  mythic: { color: "#ef4444", bg: "#ef444410", border: "#7f1d1d", label: "Mythic", Icon: Hexagon },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shared primitives (mirrors profile.tsx vocabulary)                        */
/* ─────────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#fff] flex items-center gap-1.5">
      {children}
    </p>
  );
}

/** Shared card shell — hairline top accent via ::before handled in <style> */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`progress-card ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#0f0f0f] bg-[#080808] shrink-0">
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
  const activePaths = useMemo(() => {
    const all = [
      ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
      ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
    ];
    return all
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
  }, [paths, customPaths]);

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
          <Loader2 className="w-4 h-4 text-[#eee] animate-spin" />
        </div>
      </PageShell>
    );
  }

  /* ── render ── */
  return (
    <PageShell>
      <div className="p-5 lg:p-6 space-y-3 max-w-screen-xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex items-end justify-between pb-1 border-b border-[#0e0e0e]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#eee] mb-1.5">
              GrowthOS
            </p>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#efefef] leading-none">
              Your Progress
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#fff] uppercase tracking-[0.2em]">
            <Trophy size={10} className="text-[#a855f7]" />
            {lvlTitle}
          </div>
        </div>

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Level + XP bar */}
          <StatCard accent="#a855f7" accentBg="#0d0914" accentBorder="#1e1638">
            <SectionLabel>
              <Zap size={9} className="text-[#a855f7]" /> Current Level
            </SectionLabel>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[29px] font-semibold tracking-tight tabular-nums text-[#a855f7] leading-none">
                {level}
              </span>
              <span className="text-[12px] text-[#fff] font-mono">— {lvlTitle}</span>
            </div>
            <div className="text-[10px] font-mono text-[#eee] mt-1">{xp.toLocaleString()} XP total</div>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[9px] font-mono text-[#fff] uppercase tracking-wider">{xpPct}% to Lv{level + 1}</span>
                <span className="text-[9px] font-mono text-[#a855f7]/70">{xpRemaining} XP left</span>
              </div>
              <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%`, background: "#a855f7", boxShadow: "0 0 8px #a855f740" }}
                />
              </div>
            </div>
          </StatCard>

          {/* Streak */}
          <StatCard accent="#f59e0b" accentBg="#0d0b04" accentBorder="#201505" center>
            <SectionLabel>
              <Flame size={9} className="text-[#f59e0b]" /> Day Streak
            </SectionLabel>
            <div className={`text-[37px] font-mono font-semibold tabular-nums mt-3 leading-none ${streak > 0 ? "text-[#f59e0b]" : "text-[#eee]"
              }`}>
              {streak}
            </div>
            <div className="text-[9px] font-mono text-[#eee] uppercase tracking-[0.2em] mt-1.5">
              {streak > 0 ? "Keep it alive" : "Start today"}
            </div>
          </StatCard>

          {/* Total XP */}
          <StatCard accent="#22c55e" accentBg="#040d07" accentBorder="#0d1f0e">
            <SectionLabel>
              <Star size={9} className="text-[#22c55e]" /> Total XP Earned
            </SectionLabel>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[29px] font-semibold tracking-tight tabular-nums text-[#efefef] leading-none">
                {xp.toLocaleString()}
              </span>
              <span className="text-[12px] text-[#fff] font-mono">XP</span>
            </div>
            <div className="text-[10px] font-mono text-[#22c55e]/70 mt-1">+120 this week</div>
          </StatCard>
        </div>

        {/* ── Middle row: Missions + XP Sources ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Active Missions */}
          <Card>
            <CardHeader
              left={<SectionLabel><Map size={9} /> Active Missions</SectionLabel>}
              right={
                <span className="text-[9px] font-mono text-[#22c55e] uppercase tracking-[0.15em]">
                  {activePaths.length} active
                </span>
              }
            />
            <div className="p-2.5 space-y-1.5 max-h-[280px] overflow-y-auto custom-scrollbar">
              {activePaths.length === 0 ? (
                <div className="py-10 text-center text-[11px] text-[#fff] font-mono uppercase tracking-widest">
                  No active paths — start a mission
                </div>
              ) : (
                activePaths.map((p) => (
                  <Link
                    key={p.uniqueId}
                    to="/roadmap"
                    className="mission-row group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-medium text-[#eee] group-hover:text-[#e0e0e0] transition-colors truncate leading-tight">
                            {p.title}
                          </h3>
                          <div className="text-[9px] font-mono text-[#fff] uppercase tracking-[0.15em] mt-0.5">
                            {p.done} / {p.total} topics
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[12px] font-mono tabular-nums text-[#22c55e]">{p.pct}%</span>
                          <ChevronRight size={11} className="text-[#eee] group-hover:text-[#fff] transition-colors" />
                        </div>
                      </div>
                      <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#22c55e] rounded-full transition-all duration-700"
                          style={{ width: `${p.pct}%`, boxShadow: p.pct > 0 ? "0 0 6px #22c55e30" : "none" }}
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
              left={<SectionLabel><BarChart2 size={9} className="text-[#f59e0b]" /> XP Sources</SectionLabel>}
            />
            <div className="p-4 space-y-4 max-h-[280px] overflow-y-auto custom-scrollbar">
              {profile?.xp_breakdown && profile.xp_breakdown.length > 0 ? (
                profile.xp_breakdown.map((item: any, i: number) => {
                  const maxXp = profile.xp_breakdown[0].total;
                  const pct = Math.round((item.total / maxXp) * 100);
                  const label = item.action_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  // Dimming ranks the same way as profile breakdown
                  const opacity = i === 0 ? 1 : i === 1 ? 0.65 : i === 2 ? 0.45 : 0.28;
                  return (
                    <div key={item.action_type}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[11px] font-mono text-[#fff] uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-[#fff]">
                          {item.total.toLocaleString()} · {item.count}×
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: `rgba(245,158,11,${opacity})`,
                            boxShadow: i === 0 ? "0 0 6px #f59e0b30" : "none",
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-[11px] text-[#fff] font-mono uppercase tracking-widest">
                  No XP data yet
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Title Collection ── */}
        <Card>
          <CardHeader
            left={<SectionLabel><Tag size={9} /> Title Collection</SectionLabel>}
            right={
              <span className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-[0.15em]">
                {unlockedCount} / {TITLES.length} unlocked
              </span>
            }
          />
          <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
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
                  className="title-card"
                  data-unlocked={unlocked ? "true" : "false"}
                  data-equipped={isEquipped ? "true" : "false"}
                  style={{
                    borderColor: isEquipped
                      ? `${cfg.color}30`
                      : unlocked
                        ? "#141414"
                        : "#0e0e0e",
                    opacity: unlocked ? 1 : 0.35,
                  }}
                >
                  {/* Icon badge */}
                  <div
                    className="title-icon-ring"
                    style={{
                      background: unlocked ? cfg.bg : "#0a0a0a",
                      borderColor: unlocked ? `${cfg.color}20` : "#161616",
                    }}
                  >
                    <Icon size={13} style={{ color: unlocked ? cfg.color : "#2a2a2a" }} strokeWidth={1.5} />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[13px] font-medium leading-none"
                        style={{ color: unlocked ? cfg.color : "#2e2e2e" }}
                      >
                        {tag.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-[#22c55e]/15 text-[#22c55e] leading-none tracking-wider">
                          Equipped
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#eee] mt-1 leading-snug truncate font-mono">
                      {tag.desc}
                    </div>
                  </div>

                  {/* Rarity / lock pill */}
                  <div className="shrink-0">
                    {unlocked ? (
                      <span
                        className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] leading-none tracking-wider"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] bg-[#0f0f0f] text-[#eee] leading-none tracking-wider">
                        Lv {tag.levelReq}
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
            left={<SectionLabel><CalendarDays size={9} /> Activity Heatmap</SectionLabel>}
            right={<span className="text-[9px] font-mono text-[#fff] uppercase tracking-[0.15em]">Last 12 months</span>}
          />
          <div className="p-4 overflow-x-auto">
            <div className="min-w-[680px]">
              <ActivityCalendar
                data={hd}
                theme={{
                  light: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  dark: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"],
                }}
                colorScheme="dark"
                blockSize={11}
                blockMargin={4}
                fontSize={10}
                labels={{ totalCount: "{{count}} contributions in the last year" }}
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                  color: "#333",
                }}
              />
            </div>
          </div>
        </Card>

      </div>

      {/* ── styles ────────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Card shell ── */
        .progress-card {
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Hairline top accent — same as profile cards */
        .progress-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }

        /* ── Stat card shell (top-row) ── */
        .stat-card {
          border-radius: 6px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          border: 1px solid;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }

        .stat-card.center {
          align-items: center;
          text-align: center;
        }

        /* ── Mission row ── */
        .mission-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 1px solid #111;
          border-radius: 5px;
          background: #080808;
          transition: border-color 0.15s ease, background 0.15s ease;
          cursor: pointer;
          text-decoration: none;
        }

        .mission-row:hover {
          border-color: #1e1e1e;
          background: #0a0a0a;
        }

        /* ── Title card ── */
        .title-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          border-radius: 5px;
          border: 1px solid;
          background: #080808;
          transition: border-color 0.15s ease, background 0.15s ease;
          cursor: pointer;
        }

        .title-card[data-unlocked="true"]:not([data-equipped="true"]):not(:disabled):hover {
          background: #0a0a0a;
          border-color: #1e1e1e !important;
        }

        .title-card:disabled {
          cursor: not-allowed;
        }

        .title-icon-ring {
          width: 30px;
          height: 30px;
          border-radius: 4px;
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Custom scrollbar ── */
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>
    </PageShell>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  StatCard — top-row colored stat panels                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

function StatCard({
  children,
  accent,
  accentBg,
  accentBorder,
  center = false,
}: {
  children: React.ReactNode;
  accent: string;
  accentBg: string;
  accentBorder: string;
  center?: boolean;
}) {
  return (
    <div
      className={`stat-card ${center ? "center" : ""}`}
      style={{ background: accentBg, borderColor: accentBorder }}
    >
      {/* Ambient glow blob */}
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 120,
          height: 120,
          background: accent,
          opacity: 0.05,
          top: center ? "50%" : -32,
          left: center ? "50%" : "auto",
          right: center ? "auto" : -32,
          transform: center ? "translate(-50%, -50%)" : "none",
        }}
      />
      {children}
    </div>
  );
}