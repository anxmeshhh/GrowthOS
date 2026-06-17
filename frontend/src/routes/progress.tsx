import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Flame, Shield, Sword, Crown, Hexagon, Star, 
  Target, BarChart2, Zap, Lock
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { TITLES, type TitleTag } from "@/lib/tags";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Holo Core — GrowthOS" }] }),
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
  { color: string; border: string; glow: string; label: string; Icon: any }
> = {
  common: { color: "#a0aab5", border: "#1f2330", glow: "rgba(160,170,181,0.15)", label: "Common", Icon: Star },
  uncommon: { color: "#00e5ff", border: "#005566", glow: "rgba(0,229,255,0.25)", label: "Uncommon", Icon: Shield },
  rare: { color: "#4d79ff", border: "#1a2c66", glow: "rgba(77,121,255,0.25)", label: "Rare", Icon: Sword },
  epic: { color: "#ccff00", border: "#4d6600", glow: "rgba(204,255,0,0.2)", label: "Epic", Icon: Crown },
  legendary: { color: "#ff4d4d", border: "#661a1a", glow: "rgba(255,77,77,0.3)", label: "Legendary", Icon: Flame },
  mythic: { color: "#ff00aa", border: "#660044", glow: "rgba(255,0,170,0.3)", label: "Mythic", Icon: Hexagon },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Holographic Primitives                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

function HoloCard({ children, className = "", animateBorder = true }: { children: React.ReactNode; className?: string, animateBorder?: boolean }) {
  return (
    <div className={`relative rounded-2xl p-[1px] overflow-hidden group ${className}`}>
      {/* Base border */}
      <div className="absolute inset-0 bg-[#1f2330]" />
      
      {/* Animated spinning gradient border */}
      {animateBorder && (
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,rgba(0,229,255,0.4)_25%,transparent_50%,rgba(255,77,77,0.4)_75%,transparent_100%)] animate-[spin_6s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
      )}
      
      {/* Card Content Surface */}
      <div className="relative h-full bg-[#10121a] rounded-[15px] z-10 overflow-hidden">
        {/* Subtle mesh background inside card */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children, color = "#00e5ff" }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] font-mono flex items-center gap-2 drop-shadow-[0_0_5px_currentColor]" style={{ color }}>
      {children}
    </p>
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
  const { level, currentXP, next } = getLevelInfo(xp);
  const lvlTitle = profile?.selected_title || "Novice";
  const xpPct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const streak = profile?.streak ?? computeStreak(profile?.heatmap?.map((h: any) => h.date) || []);

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
        <div className="flex items-center justify-center h-[80vh]">
          <div className="w-10 h-10 border-2 border-transparent border-t-[#00e5ff] border-r-[#ff4d4d] rounded-full animate-spin shadow-[0_0_15px_#00e5ff]" />
        </div>
      </PageShell>
    );
  }

  /* ── render ── */
  return (
    <PageShell>
      {/* Base page tint to separate from Dashboard */}
      <div className="fixed inset-0 bg-[#0a0b10] z-[-2]" />
      
      <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-screen">

        <div className="grid grid-cols-12 gap-8">

          {/* ── 1. The ID Card (Hero Stats) - Spans 12 cols ── */}
          <HoloCard className="col-span-12 p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-center gap-10">
              
              {/* Profile Avatar / Rank Ring */}
              <div className="relative flex items-center justify-center w-36 h-36 shrink-0">
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg] drop-shadow-[0_0_10px_#00e5ff]">
                  <circle cx="72" cy="72" r="66" fill="none" stroke="#1f2330" strokeWidth="6" />
                  <circle 
                    cx="72" cy="72" r="66" fill="none" stroke="#00e5ff" strokeWidth="6" 
                    strokeLinecap="round" strokeDasharray="414" strokeDashoffset={414 - (414 * xpPct) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="flex flex-col items-center justify-center bg-[#0a0b10] w-28 h-28 rounded-full border border-[#1f2330] z-10 shadow-[inset_0_0_20px_rgba(0,229,255,0.1)]">
                  <span className="text-4xl font-bold font-mono text-white tracking-tighter">{level}</span>
                  <span className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#00e5ff]">Level</span>
                </div>
              </div>

              {/* Identity & Core Metrics */}
              <div className="flex-1 min-w-0 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                
                {/* Title */}
                <div className="flex flex-col">
                  <SectionLabel color="#ccff00"><Zap size={12} /> Active Class</SectionLabel>
                  <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-[#a0aab5] mt-2 uppercase tracking-tight">
                    {lvlTitle}
                  </h1>
                  <div className="mt-4 flex items-center gap-6">
                    <div>
                      <span className="text-[10px] font-mono text-[#7a8599] uppercase tracking-widest block mb-1">Total XP</span>
                      <span className="text-xl font-mono text-[#00e5ff] font-bold">{xp} <span className="text-sm text-[#4d5a73] font-normal">/ {next}</span></span>
                    </div>
                    <div className="w-px h-8 bg-[#1f2330]" />
                    <div>
                      <span className="text-[10px] font-mono text-[#7a8599] uppercase tracking-widest block mb-1">Network Streak</span>
                      <div className="flex items-center gap-2">
                        <Flame size={16} className={streak > 0 ? "text-[#ff4d4d]" : "text-[#4d5a73]"} />
                        <span className={`text-xl font-mono font-bold ${streak > 0 ? "text-[#ff4d4d]" : "text-white"}`}>{streak}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </HoloCard>

          {/* ── 2. Telemetry Matrix (Stats) - Spans 4 cols ── */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
            <HoloCard animateBorder={false} className="flex-1 p-8">
              <SectionLabel color="#ff4d4d"><BarChart2 size={12} /> Live Telemetry</SectionLabel>
              <div className="mt-8 flex flex-col gap-6">
                <div className="flex justify-between items-end border-b border-[#1f2330] pb-3">
                  <span className="text-xs font-mono text-[#7a8599] uppercase tracking-wider">Nodes Conquered</span>
                  <span className="text-3xl font-mono text-white font-black">{profile?.stats?.topics_completed || 0}</span>
                </div>
                <div className="flex justify-between items-end border-b border-[#1f2330] pb-3">
                  <span className="text-xs font-mono text-[#7a8599] uppercase tracking-wider">Data Synced</span>
                  <span className="text-3xl font-mono text-white font-black">{profile?.stats?.notes_written || 0}</span>
                </div>
                <div className="flex justify-between items-end border-b border-[#1f2330] pb-3">
                  <span className="text-xs font-mono text-[#7a8599] uppercase tracking-wider">Trials Passed</span>
                  <span className="text-3xl font-mono text-white font-black">{profile?.stats?.quizzes_passed || 0}</span>
                </div>
              </div>
            </HoloCard>

            <HoloCard animateBorder={false} className="flex-1 p-8">
              <SectionLabel color="#ccff00"><Target size={12} /> Sector Progression</SectionLabel>
              <div className="mt-8 space-y-6">
                {activePaths.length === 0 ? (
                  <div className="text-xs font-mono text-[#4d5a73] uppercase tracking-widest text-center mt-10">No sectors active</div>
                ) : (
                  activePaths.map((p) => (
                    <div key={p.uniqueId} className="group">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs font-bold text-white tracking-wide uppercase truncate mr-4">{p.title}</span>
                        <span className="text-[10px] font-mono text-[#ccff00]">{p.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#1f2330] rounded-full overflow-hidden relative">
                        <div 
                          className="absolute inset-y-0 left-0 bg-[#ccff00] rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(204,255,0,0.6)] relative overflow-hidden" 
                          style={{ width: `${p.pct}%` }} 
                        >
                          {/* Glare sweep animation */}
                          <div className="absolute inset-0 w-[20px] bg-white/50 -skew-x-12 animate-[sweep_2s_linear_infinite]" />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </HoloCard>
          </div>

          {/* ── 3. Tokens (Titles) - Spans 8 cols ── */}
          <HoloCard className="col-span-12 lg:col-span-8 p-8 flex flex-col h-[700px]">
            <div className="flex justify-between items-center mb-6">
              <SectionLabel color="#00e5ff"><Crown size={12} /> Artifact Collection</SectionLabel>
              <span className="text-[10px] font-mono text-[#7a8599] uppercase tracking-widest bg-[#1f2330] px-3 py-1 rounded-full">{unlockedCount} / {TITLES.length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 overflow-y-auto pr-2 custom-scrollbar pb-6">
              {TITLES.map((t: TitleTag, i: number) => {
                const isUnlocked = level >= t.levelReq;
                const isEquipped = lvlTitle === t.id;
                const r = RARITY_CONFIG[t.rarity] || RARITY_CONFIG.common;
                const Icon = r.Icon;

                if (!isUnlocked) {
                  return (
                    <div key={t.id} className="relative p-5 rounded-xl border border-[#1f2330] bg-[#151821] flex flex-col items-center justify-center text-center h-[140px] opacity-40">
                      <Lock size={20} className="text-[#4d5a73] mb-3" />
                      <span className="text-[10px] font-mono text-[#7a8599] tracking-widest uppercase">Lv {t.levelReq}</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => equipTitle(t.id)}
                    disabled={savingTitle || isEquipped}
                    className={`relative p-5 rounded-xl border flex flex-col items-center justify-center text-center h-[140px] transition-all duration-300 group ${isEquipped ? 'scale-105' : 'hover:scale-105 hover:-translate-y-2'} animate-float`}
                    style={{
                      borderColor: isEquipped ? r.color : r.border,
                      backgroundColor: isEquipped ? r.glow : '#151821',
                      boxShadow: isEquipped ? `0 0 20px ${r.glow}, inset 0 0 10px ${r.glow}` : '0 10px 30px rgba(0,0,0,0.5)',
                      animationDelay: `${i * 0.1}s` // Stagger the floating animation
                    }}
                  >
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />
                    <Icon size={24} className="mb-3 drop-shadow-[0_0_8px_currentColor]" style={{ color: r.color }} />
                    <span className="text-[13px] font-black uppercase tracking-wider text-white drop-shadow-md">{t.label}</span>
                    <span className="text-[9px] font-mono tracking-[0.2em] uppercase mt-2" style={{ color: r.color }}>{r.label}</span>
                    
                    {isEquipped && (
                      <div className="absolute top-3 right-3 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: r.color }}></span>
                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: r.color }}></span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </HoloCard>

        </div>
      </div>

      <style>{`
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(500%) skewX(-12deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f2330; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4d5a73; }
      `}</style>
    </PageShell>
  );
}