import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Target, BookOpen, ClipboardCheck,
  Zap, Award, CheckCircle2, Circle,
  Activity, ChevronRight, Github,
  RotateCcw, Flame, Star, Sparkles, Hexagon
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";
import { useState, useEffect, useMemo } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — GrowthOS" },
      { name: "description", content: "Your high-fidelity intelligence and mission control." },
    ],
  }),
  component: DashboardPage,
});

/* ── helpers ─────────────────────────────────────────────────────────────── */

function getLevelInfo(xp: number) {
  const tiers = [
    { level: 1, title: "Novice", next: 20 },
    { level: 2, title: "Explorer", next: 50 },
    { level: 3, title: "Scholar", next: 100 },
    { level: 4, title: "Adept", next: 250 },
    { level: 5, title: "Master", next: 500 },
  ];
  return tiers.find((t) => xp < t.next) ?? { level: 6, title: "Grandmaster", next: xp };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ── premium primitives ─────────────────────────────────────────────────── */

function GlassPanel({ children, className = "", glowing = false }: { children: React.ReactNode; className?: string, glowing?: boolean }) {
  return (
    <div className={`relative rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent backdrop-blur-3xl overflow-hidden ${className}`}>
      {glowing && (
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent opacity-50" />
      )}
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.25em] font-mono text-white/40 flex items-center gap-2">
      {children}
    </p>
  );
}

/* ── main ────────────────────────────────────────────────────────────────── */

function DashboardPage() {
  const { state } = useGrowth();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── queries ── */
  const { data: paths = [] } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const r = await apiFetch("/paths/"); return r.ok ? r.json() : []; },
  });

  const { data: customPaths = [] } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => { const r = await apiFetch("/custom-paths/"); return r.ok ? r.json() : []; },
  });

  const allPaths = useMemo(() => [
    ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
  ], [paths, customPaths]);

  const [selectedPathId, setSelectedPathId] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("dashboard_selected_path");
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedPathId) localStorage.setItem("dashboard_selected_path", selectedPathId);
      else localStorage.removeItem("dashboard_selected_path");
    }
  }, [selectedPathId]);

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

  const { data: activity = [] } = useQuery({
    queryKey: ["recent_activity"],
    queryFn: async () => { const r = await apiFetch("/activity/"); return r.ok ? r.json() : []; },
  });

  const { data: profile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => { const r = await apiFetch("/profile/"); if (!r.ok) throw 0; return r.json(); },
  });

  const revive = useMutation({
    mutationFn: async () => {
      const r = await apiFetch("/activity/revive-streak/", { method: "POST" });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Failed"); }
      return r.json();
    },
    onSuccess: () => {
      flash("🔥 Streak revived");
      qc.invalidateQueries({ queryKey: ["user_profile"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
    },
    onError: (e: Error) => flash(e.message),
  });

  /* ── derived ── */
  const xp = profile?.total_xp ?? 0;
  const { level, title: lvl, next } = getLevelInfo(xp);
  const xpPct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const streak = profile?.streak ?? computeStreak(state.activeDays);

  let ap = selectedPathId ? allPaths.find((p: any) => p.uniqueId === selectedPathId) : null;
  if (!ap) {
    const fallback = [
      ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
      ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ];
    ap = fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "in_progress"))
      || fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "completed"))
      || fallback.find((p: any) => p.is_bookmarked)
      || fallback[0] || null;
  }

  const topics: any[] = ap?.topics || [];
  const cur = topics.find((t: any) => t.user_progress === "in_progress")
    || topics.find((t: any) => t.user_progress !== "completed")
    || topics[0] || null;
  const done = topics.filter((t: any) => t.user_progress === "completed").length;
  const total = topics.length;
  const cpct = total > 0 ? Math.round((done / total) * 100) : 0;

  const started = cur?.user_progress === "in_progress" || cur?.user_progress === "completed";
  const proof = cur?.has_submitted_work === true;
  const verified = cur?.verified_project != null || cur?.user_progress === "completed";

  const steps = [
    { l: "Study", d: started || proof || verified, I: BookOpen },
    { l: "Submit", d: proof || verified, I: ClipboardCheck },
    { l: "Verify", d: verified, I: Target },
  ];

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  /* ── render ── */
  return (
    <PageShell>
      {/* Dynamic Background Noise */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-50 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC42NSIgbnVtT2N0YXZlcz0iMyIgc3RpdGNoVGlsZXM9InN0aXRjaCIvPgogIDwvZmlsdGVyPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZUZpbHRlcikiLz4KPC9zdmc+')]"/>
      
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl text-white text-[13px] tracking-wide shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_10px_#22c55e]" /> {toast}
        </div>
      )}

      <div className="p-6 lg:p-8 max-w-[1400px] mx-auto min-h-screen">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
              <Hexagon className="w-6 h-6 text-[#22c55e]" strokeWidth={1.5} />
              Command Center
            </h1>
          </div>
          {ap && (
            <div className="relative group">
              <select
                value={selectedPathId || "auto"}
                onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                className="appearance-none bg-white/[0.03] border border-white/10 text-white/70 text-[11px] font-mono uppercase tracking-widest rounded-full pl-5 pr-10 py-2.5 outline-none hover:bg-white/[0.06] hover:text-white transition-all cursor-pointer backdrop-blur-md"
              >
                <option value="auto" className="bg-black font-sans normal-case">✦ Auto-Track Active</option>
                <optgroup label="Available Paths" className="bg-black text-white/50 font-sans">
                  {allPaths.map((p: any) => (
                    <option key={p.uniqueId} value={p.uniqueId} className="bg-black text-white font-sans normal-case text-xs">
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#22c55e]/50 group-hover:bg-[#22c55e] transition-colors shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
          )}
        </div>

        {/* ── BENTO GRID ── */}
        <div className="grid grid-cols-12 gap-5 auto-rows-[minmax(140px,auto)]">

          {/* 1. Hero Mission (Spans 8 cols) */}
          <GlassPanel className="col-span-12 lg:col-span-8 p-8 flex flex-col justify-between group" glowing>
            {cur ? (
              <>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.15),transparent_60%)] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                
                <div className="relative z-10">
                  <Label><Sparkles size={12} className="text-[#22c55e]" /> Active Protocol</Label>
                  <p className="mt-4 text-[13px] font-mono text-white/50 tracking-widest uppercase">{ap?.title}</p>
                  <h2 className="mt-1 text-3xl md:text-4xl font-semibold text-white tracking-tight leading-tight max-w-2xl">
                    {cur.title}
                  </h2>
                </div>

                <div className="mt-8 flex flex-wrap items-end justify-between gap-6 relative z-10">
                  <div className="flex items-center gap-3 bg-black/40 rounded-full p-1.5 border border-white/5 backdrop-blur-md">
                    {steps.map((s, i) => (
                      <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-widest transition-colors ${s.d ? "bg-[#22c55e]/10 text-[#22c55e]" : "text-white/30"}`}>
                        {s.d ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {s.l}
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(cur.slug || cur.id) }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white text-black text-[13px] font-bold tracking-wide hover:scale-105 hover:bg-[#22c55e] hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  >
                    Engage Mission <ArrowRight size={15} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-50">
                <Target size={32} className="mb-4" />
                <p className="font-mono text-xs uppercase tracking-widest">No active protocol detected</p>
              </div>
            )}
          </GlassPanel>

          {/* 2. Metrics Stack (Spans 4 cols, nested grid) */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-5 grid-rows-2">
            
            {/* Level Square */}
            <GlassPanel className="col-span-1 flex flex-col justify-between p-5 relative overflow-hidden group">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[radial-gradient(circle,rgba(168,85,247,0.2),transparent_70%)] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <Label>Level</Label>
              <div>
                <div className="text-4xl font-mono text-white mt-2">{level}</div>
                <div className="text-[11px] font-mono text-[#a855f7] uppercase tracking-widest mt-1">{lvl}</div>
              </div>
            </GlassPanel>

            {/* Streak Square */}
            <GlassPanel className="col-span-1 flex flex-col justify-between p-5 relative overflow-hidden group">
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-[radial-gradient(circle,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
              <div className="flex justify-between items-start">
                <Label>Streak</Label>
                {profile?.can_revive_streak && (
                  <button onClick={() => revive.mutate()} disabled={revive.isPending} className="text-[#f59e0b] hover:bg-[#f59e0b]/20 p-1.5 rounded-md transition-colors" title="Revive Streak">
                    <RotateCcw size={12} />
                  </button>
                )}
              </div>
              <div>
                <div className={`text-4xl font-mono mt-2 ${streak > 0 ? "text-white" : "text-white/20"}`}>{streak}</div>
                <div className="text-[11px] font-mono text-[#f59e0b] uppercase tracking-widest mt-1">Days Active</div>
              </div>
            </GlassPanel>

            {/* XP Bar Rectangle */}
            <GlassPanel className="col-span-2 flex flex-col justify-center p-6 relative">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <Label>Experience</Label>
                  <div className="text-xl font-mono text-white mt-1">{xp} <span className="text-xs text-white/30">/ {next}</span></div>
                </div>
                <div className="text-[10px] font-mono text-[#a855f7]">{next - xp} to next</div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#a855f7] to-[#d8b4fe] rounded-full transition-all duration-1000 ease-out" style={{ width: `${xpPct}%` }} />
              </div>
            </GlassPanel>
          </div>

          {/* 3. Subway Map Timeline (Spans 8 cols) */}
          <GlassPanel className="col-span-12 lg:col-span-8 p-6 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-6">
              <Label><Award size={12} /> Path Trajectory</Label>
              <div className="text-[11px] font-mono text-white/40 tracking-widest">{cpct}% Completed</div>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
              <div className="flex items-center h-full min-w-max px-4 relative">
                {/* The Rail */}
                <div className="absolute left-8 right-8 h-0.5 bg-white/10 top-1/2 -translate-y-1/2" />
                <div 
                  className="absolute left-8 h-0.5 bg-[#22c55e] top-1/2 -translate-y-1/2 transition-all duration-1000 shadow-[0_0_10px_#22c55e]" 
                  style={{ width: `calc(${cpct}% - 3rem)` }} 
                />

                {/* Nodes */}
                {topics.map((t: any, i: number) => {
                  const d = t.user_progress === "completed";
                  const a = t.id === cur?.id;
                  return (
                    <div key={t.id} className="relative z-10 flex flex-col items-center justify-center w-28 group">
                      {/* Top Label */}
                      <div className={`absolute bottom-full mb-4 text-center transition-all ${a ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"}`}>
                        <div className="text-[10px] font-mono text-white/50 tracking-wider mb-1">NODE {i + 1}</div>
                      </div>

                      {/* Node Circle */}
                      <Link
                        to="/topic/$topicId"
                        params={{ topicId: String(t.slug || t.id) }}
                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all outline outline-4 outline-[#0a0a0a] ${
                          d ? "bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]" : 
                          a ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.6)] scale-125" : 
                          "bg-[#222] hover:bg-[#333]"
                        }`}
                      >
                        {a && <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />}
                      </Link>

                      {/* Bottom Label */}
                      <div className="absolute top-full mt-4 text-center w-32 px-2">
                        <div className={`text-[11px] truncate transition-colors ${d ? "text-white/40" : a ? "text-white font-medium" : "text-white/30"}`}>
                          {t.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>

          {/* 4. Live Terminal / Activity (Spans 4 cols) */}
          <GlassPanel className="col-span-12 lg:col-span-4 p-6 flex flex-col h-[320px]">
            <div className="flex justify-between items-center mb-6">
              <Label><Activity size={12} /> System Logs</Label>
              <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {activity.length > 0 ? (
                activity.map((a: any, i: number) => (
                  <div key={a.id} className="flex gap-4 group">
                    <div className="flex flex-col items-center mt-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]" : "bg-white/20"}`} />
                      {i !== activity.length - 1 && <div className="w-px h-full bg-white/5 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className={`text-[13px] leading-tight ${i === 0 ? "text-white" : "text-white/60 group-hover:text-white/80"} transition-colors`}>
                        {a.label}
                      </div>
                      <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1.5">
                        {timeAgo(a.date)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                  <span className="font-mono text-[10px] uppercase tracking-widest">Awaiting input...</span>
                </div>
              )}
            </div>
          </GlassPanel>

          {/* 5. GitHub Heatmap Span (12 cols) */}
          <GlassPanel className="col-span-12 p-6 flex items-center justify-between flex-wrap gap-6">
            <div>
              <Label><Github size={12} /> Matrix</Label>
              <p className="text-[11px] font-mono text-white/30 tracking-widest uppercase mt-2">Annual Trace</p>
            </div>
            <div className="overflow-x-auto min-w-[480px]">
              {hl ? (
                <div className="h-[90px] bg-white/[0.02] rounded-lg animate-pulse" />
              ) : (
                <ActivityCalendar
                  data={hd}
                  theme={{
                    light: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                    dark: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  }}
                  colorScheme="dark"
                  blockSize={12}
                  blockMargin={4}
                  fontSize={10}
                  labels={{ totalCount: "{{count}} interactions" }}
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    color: "rgba(255,255,255,0.3)",
                  }}
                />
              )}
            </div>
          </GlassPanel>

        </div>
      </div>
      
      {/* Custom Scrollbar Styles for this page only */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </PageShell>
  );
}