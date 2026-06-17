import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Flame, Shield, Sword, Crown, Hexagon, Star, 
  Target, BarChart2, Zap, Layers, Activity, Unlock, Lock
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { TITLES, type TitleTag } from "@/lib/tags";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "The Vault — GrowthOS" }] }),
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
  { color: string; bg: string; border: string; glow: string; label: string; Icon: any }
> = {
  common: { color: "#8a8a8a", bg: "#141414", border: "#2a2a2a", glow: "rgba(138,138,138,0.1)", label: "Common", Icon: Star },
  uncommon: { color: "#22c55e", bg: "#0d2015", border: "#14532d", glow: "rgba(34,197,94,0.15)", label: "Uncommon", Icon: Shield },
  rare: { color: "#3b82f6", bg: "#0e1a30", border: "#1e3a8a", glow: "rgba(59,130,246,0.15)", label: "Rare", Icon: Sword },
  epic: { color: "#a855f7", bg: "#1f0f2e", border: "#581c87", glow: "rgba(168,85,247,0.2)", label: "Epic", Icon: Crown },
  legendary: { color: "#f59e0b", bg: "#261a08", border: "#78350f", glow: "rgba(245,158,11,0.2)", label: "Legendary", Icon: Flame },
  mythic: { color: "#ef4444", bg: "#2b0f0f", border: "#7f1d1d", glow: "rgba(239,68,68,0.25)", label: "Mythic", Icon: Hexagon },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Cyber-Industrial Primitives                                                */
/* ─────────────────────────────────────────────────────────────────────────── */

function VaultPlate({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#050505] border-2 border-[#151515] shadow-[inset_0_2px_4px_rgba(255,255,255,0.02),0_8px_20px_rgba(0,0,0,0.8)] relative overflow-hidden ${className}`}>
      {/* Industrial noise overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC45IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlRmlsdGVyKSIvPgo8L3N2Zz4=')]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function TermLabel({ children, color = "#555" }: { children: React.ReactNode; color?: string }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] font-mono flex items-center gap-2" style={{ color }}>
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
          <div className="w-8 h-8 border-2 border-[#333] border-t-[#22c55e] rounded-full animate-spin" />
        </div>
      </PageShell>
    );
  }

  /* ── segmented energy bar calculation ── */
  const BLOCKS = 20;
  const filledBlocks = Math.floor((currentXP / next) * BLOCKS);

  /* ── render ── */
  return (
    <PageShell>
      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen">

        <div className="mb-8 flex items-center gap-3 border-b border-[#111] pb-4">
          <Hexagon className="w-6 h-6 text-[#444]" />
          <h1 className="text-xl font-bold tracking-[0.1em] text-[#cfcfcf] uppercase">The Vault</h1>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* ── 1. The Core (Hero Stats) - Spans 12 cols ── */}
          <VaultPlate className="col-span-12 p-8 md:p-12 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-10">
            <div className="flex flex-col items-center md:items-start flex-1 min-w-0">
              <TermLabel color="#a855f7"><Zap size={12} /> Combat Rating</TermLabel>
              <div className="mt-4 flex items-baseline gap-4">
                <span className="text-6xl md:text-8xl font-black tracking-tighter text-[#e0e0e0] drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{level}</span>
                <div className="flex flex-col">
                  <span className="text-xl md:text-2xl font-bold text-[#a855f7] tracking-widest uppercase">{lvlTitle}</span>
                  <span className="text-[12px] font-mono text-[#555] uppercase tracking-[0.2em] mt-1">Global Rank</span>
                </div>
              </div>
              
              {/* Segmented Energy Bar */}
              <div className="mt-8 w-full max-w-2xl">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest">Experience Buffer</span>
                  <span className="text-[13px] font-mono text-[#a855f7] font-bold">{currentXP} <span className="text-[#444]">/ {next}</span></span>
                </div>
                <div className="flex gap-1 h-3 w-full p-1 bg-[#050505] border border-[#1a1a1a]">
                  {Array.from({ length: BLOCKS }).map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 ${i < filledBlocks ? "bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.6)]" : "bg-[#111]"}`} 
                      style={{ transitionDelay: `${i * 20}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-[#222] to-transparent self-stretch" />

            <div className="flex flex-col items-center justify-center min-w-[200px]">
              <TermLabel color="#f59e0b"><Flame size={12} /> Active Streak</TermLabel>
              <div className="mt-4 text-7xl font-black font-mono text-[#f59e0b] drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                {streak}
              </div>
              <p className="text-[10px] font-mono text-[#555] tracking-[0.25em] uppercase mt-2">Consecutive Days</p>
            </div>
          </VaultPlate>

          {/* ── 2. Mastery Matrix (Path Progress) - Spans 4 cols ── */}
          <VaultPlate className="col-span-12 lg:col-span-4 p-6 flex flex-col">
            <div className="border-b border-[#1a1a1a] pb-4 mb-5">
              <TermLabel><Target size={12} /> Sector Mastery</TermLabel>
            </div>
            
            <div className="flex-1 space-y-6">
              {activePaths.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 opacity-30">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">No sectors activated</span>
                </div>
              ) : (
                activePaths.map((p) => {
                  const blocks = 10;
                  const filled = Math.floor((p.pct / 100) * blocks);
                  return (
                    <div key={p.uniqueId} className="group">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-[13px] font-bold text-[#cfcfcf] tracking-wide uppercase truncate mr-4">{p.title}</span>
                        <span className="text-[11px] font-mono text-[#22c55e]">{p.pct}%</span>
                      </div>
                      <div className="flex gap-1 h-2 w-full">
                        {Array.from({ length: blocks }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 rounded-sm ${i < filled ? "bg-[#22c55e] shadow-[0_0_5px_rgba(34,197,94,0.4)]" : "bg-[#111]"}`} 
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex justify-end">
                         <span className="text-[9px] font-mono text-[#444] uppercase tracking-widest">{p.done} / {p.total} Nodes</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </VaultPlate>

          {/* ── 3. Tokens (Titles) - Spans 8 cols ── */}
          <VaultPlate className="col-span-12 lg:col-span-8 p-6 flex flex-col">
            <div className="border-b border-[#1a1a1a] pb-4 mb-5 flex justify-between items-center">
              <TermLabel><Crown size={12} /> Artifact Tokens</TermLabel>
              <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest">{unlockedCount} / {TITLES.length} Acquired</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TITLES.map((t: TitleTag) => {
                const isUnlocked = level >= t.levelReq;
                const isEquipped = lvlTitle === t.id;
                const r = RARITY_CONFIG[t.rarity] || RARITY_CONFIG.common;
                const Icon = r.Icon;

                if (!isUnlocked) {
                  return (
                    <div key={t.id} className="relative p-4 rounded-lg border-2 border-[#111] bg-[#080808] opacity-50 flex flex-col items-center justify-center text-center h-28">
                      <Lock size={16} className="text-[#333] mb-2" />
                      <span className="text-[10px] font-mono text-[#444] tracking-widest uppercase">Lv {t.levelReq} Required</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={t.id}
                    onClick={() => equipTitle(t.id)}
                    disabled={savingTitle || isEquipped}
                    className="relative p-4 rounded-lg border-2 flex flex-col items-center justify-center text-center h-28 transition-all group overflow-hidden"
                    style={{
                      borderColor: isEquipped ? r.color : r.border,
                      backgroundColor: r.bg,
                      boxShadow: isEquipped ? `inset 0 0 20px ${r.glow}, 0 0 15px ${r.glow}` : 'none'
                    }}
                  >
                    <Icon size={20} className="mb-2" style={{ color: r.color }} />
                    <span className="text-[12px] font-bold uppercase tracking-wider text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{t.label}</span>
                    <span className="text-[9px] font-mono tracking-widest uppercase mt-1 opacity-70" style={{ color: r.color }}>{r.label}</span>
                    
                    {/* Hover glare */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent translate-x-[-100%] group-hover:animate-[glare_1.5s_ease-in-out_infinite]" />
                    
                    {isEquipped && (
                      <div className="absolute top-2 right-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_#fff]" style={{ backgroundColor: r.color }} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </VaultPlate>

          {/* ── 4. Raw Stats Terminal - Spans 12 cols ── */}
          <VaultPlate className="col-span-12 p-6 md:p-8">
            <TermLabel><BarChart2 size={12} /> System Telemetry</TermLabel>
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mb-1">Topics Mastered</span>
                <span className="text-3xl md:text-4xl font-mono text-[#e0e0e0] font-black">{profile?.stats?.topics_completed || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mb-1">Documents Uploaded</span>
                <span className="text-3xl md:text-4xl font-mono text-[#e0e0e0] font-black">{profile?.stats?.notes_written || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mb-1">Quizzes Passed</span>
                <span className="text-3xl md:text-4xl font-mono text-[#e0e0e0] font-black">{profile?.stats?.quizzes_passed || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest mb-1">Total Experience</span>
                <span className="text-3xl md:text-4xl font-mono text-[#a855f7] font-black">{xp}</span>
              </div>
            </div>
          </VaultPlate>

        </div>
      </div>

      <style>{`
        @keyframes glare {
          0% { transform: translateX(-100%) skewX(-15deg); }
          50%, 100% { transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
    </PageShell>
  );
}