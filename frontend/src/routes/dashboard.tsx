import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Target, BookOpen, ClipboardCheck,
  Zap, Award, CheckCircle2, Circle,
  Activity, ChevronRight, Github,
  RotateCcw, Sparkles, Flame,
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GrowthOS" },
      { name: "description", content: "Today's mission, streak, and proof checklist." },
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

/* ── main ────────────────────────────────────────────────────────────────── */

function DashboardPage() {
  const { state } = useGrowth();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  /* ── queries ─────────────────────────────────────────────────────────── */

  const { data: paths = [], isLoading: pl } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const r = await apiFetch("/paths/"); return r.ok ? r.json() : []; },
  });

  const { data: customPaths = [], isLoading: cl } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => { const r = await apiFetch("/custom-paths/"); return r.ok ? r.json() : []; },
  });

  // Deduplicate paths since /paths/ and /custom-paths/ might both return the user's custom paths
  const allPathsMap = new Map();
  paths.forEach((p: any) => allPathsMap.set(p.id, p));
  customPaths.forEach((p: any) => allPathsMap.set(p.id, p));
  const allPaths = Array.from(allPathsMap.values());

  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);

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

  const { data: activity = [], isLoading: al } = useQuery({
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
    onSuccess: () => { flash("🔥 Streak revived"); qc.invalidateQueries({ queryKey: ["user_profile"] }); qc.invalidateQueries({ queryKey: ["heatmap"] }); },
    onError: (e: Error) => flash(e.message),
  });

  /* ── derived ─────────────────────────────────────────────────────────── */

  const xp = profile?.total_xp ?? 0;
  const { level, title: lvl, next } = getLevelInfo(xp);
  const pct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;

  const ap = selectedPathId 
    ? allPaths.find((p: any) => p.id === selectedPathId)
    : allPaths.find((p: any) => p.topics?.some((t: any) => t.user_progress === "in_progress")) ||
      allPaths.find((p: any) => p.topics?.some((t: any) => t.user_progress === "completed")) ||
      allPaths.find((p: any) => p.is_bookmarked) ||
      allPaths[0] || null;

  const topics: any[] = ap?.topics || [];
  const cur = topics.find((t: any) => t.user_progress !== "completed") || topics[0] || null;
  const done = topics.filter((t: any) => t.user_progress === "completed").length;
  const total = topics.length;
  const cpct = total > 0 ? Math.round((done / total) * 100) : 0;
  const streak = profile?.streak ?? computeStreak(state.activeDays);

  const started = cur?.user_progress === "in_progress" || cur?.user_progress === "completed";
  const proof = cur?.has_submitted_work === true;
  const verified = cur?.verified_project != null || cur?.user_progress === "completed";

  const steps = [
    { l: "Study concepts", d: started || proof || verified, I: BookOpen },
    { l: "Submit proof", d: proof || verified, I: ClipboardCheck },
    { l: "AI verify", d: verified, I: Target },
  ];

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  /* ── render ──────────────────────────────────────────────────────────── */

  return (
    <PageShell>
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg border border-[#1a3d28] bg-[#0a1a12] text-[#22c55e] text-xs font-mono shadow-xl flex items-center gap-2">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      <div className="dashboard-grid" style={{ height: "calc(100vh - 64px)", overflow: "hidden" }}>

        {/* ─── ROW 1 : header ──────────────────────────────────────────── */}
        <div className="col-span-full flex items-end justify-between pb-1" style={{ gridArea: "hdr" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#333] mb-0.5">GrowthOS</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0] leading-none">Dashboard</h1>
          </div>
          {ap && (
            <select
              value={ap.id}
              onChange={(e) => setSelectedPathId(Number(e.target.value))}
              className="bg-[#0a0a0a] border border-[#222] text-[#888] text-[10px] font-mono uppercase tracking-wider rounded px-2 py-1 outline-none hover:border-[#444] cursor-pointer"
            >
              {allPaths.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}
        </div>

        {/* ─── ROW 2 : stats strip ─────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] grid grid-cols-5 divide-x divide-[#141414] overflow-hidden" style={{ gridArea: "stats" }}>
          {/* XP */}
          <div className="px-3 py-2.5 flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">XP</span>
            <span className="text-lg font-semibold tabular-nums text-[#22c55e] leading-tight">{xp}</span>
            <span className="text-[9px] font-mono text-[#2e2e2e]">Lv{level} {lvl}</span>
          </div>
          {/* Streak */}
          <div className="px-3 py-2.5 flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Streak</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold tabular-nums text-[#e8e8e8] leading-tight">{streak}</span>
              <span className="text-[9px] font-mono text-[#2e2e2e]">days</span>
              {profile?.can_revive_streak && (
                <button onClick={() => revive.mutate()} disabled={revive.isPending}
                  className="ml-auto text-[8px] font-mono text-[#f59e0b] border border-[#f59e0b]/25 rounded px-1 py-px hover:bg-[#f59e0b]/10 transition-colors">
                  <RotateCcw size={7} className="inline mr-0.5" />revive
                </button>
              )}
            </div>
          </div>
          {/* Topics */}
          <div className="px-3 py-2.5 flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Topics</span>
            <span className="text-lg font-semibold tabular-nums text-[#e8e8e8] leading-tight">{done}<span className="text-[#2a2a2a]">/{total}</span></span>
          </div>
          {/* Progress */}
          <div className="px-3 py-2.5 flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Progress</span>
            <span className="text-lg font-semibold tabular-nums text-[#22c55e] leading-tight">{cpct}%</span>
            <div className="h-[3px] bg-[#141414] rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${cpct}%` }} />
            </div>
          </div>
          {/* Level */}
          <div className="px-3 py-2.5 flex flex-col justify-center">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Level</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-6 h-6 rounded bg-[#0d2015] border border-[#1a3028] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono font-bold text-[#22c55e]">{level}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-[3px] bg-[#141414] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[8px] font-mono text-[#2a2a2a] mt-0.5 block">{next - xp} to next</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ROW 3 LEFT : mission ────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "mission" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <Zap size={11} className="text-[#22c55e]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Mission</span>
            </div>
            {cur && <span className="text-[8px] font-mono text-[#22c55e] uppercase tracking-wider">Active</span>}
          </div>

          <div className="flex-1 px-3.5 py-3 flex flex-col min-h-0">
            {cur ? (
              <>
                <span className="text-[9px] font-mono text-[#333] uppercase tracking-wider mb-1">{ap?.title}</span>
                <h2 className="text-base font-semibold text-[#f0f0f0] leading-snug mb-1.5 truncate">{cur.title}</h2>
                <p className="text-[11px] text-[#444] leading-relaxed mb-3 line-clamp-2 flex-shrink-0">
                  {cur.summary || "Complete the session and submit proof of work."}
                </p>

                <div className="space-y-1 mb-3 flex-shrink-0">
                  {steps.map((s, i) => (
                    <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded border text-[11px] ${s.d ? "border-[#1a3028] bg-[#0a1a12] text-[#a0a0a0]" : "border-[#151515] bg-[#0b0b0b] text-[#444]"}`}>
                      {s.d ? <CheckCircle2 size={10} className="text-[#22c55e] shrink-0" /> : <Circle size={10} className="text-[#222] shrink-0" />}
                      <span className="flex-1">{s.l}</span>
                      <s.I size={9} className={s.d ? "text-[#22c55e]" : "text-[#222]"} />
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <Link to="/topic/$topicId" params={{ topicId: String(cur.slug || cur.id) }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#22c55e] text-[#030f07] text-xs font-semibold hover:bg-[#16a34a] transition-colors">
                    Continue <ArrowRight size={12} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <Award size={24} className="text-[#22c55e] mb-2 opacity-40" />
                <p className="text-sm font-semibold text-[#ddd]">Path complete</p>
                <p className="text-[11px] text-[#444]">All topics mastered.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── ROW 3 CENTER : topic list ────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "topics" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Path Topics</span>
            <span className="text-[9px] font-mono text-[#2e2e2e]">{done}/{total}</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {topics.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[11px] text-[#333]">No topics</div>
            ) : (
              topics.map((t: any) => {
                const d = t.user_progress === "completed";
                const a = t.id === cur?.id;
                return (
                  <Link key={t.id} to="/topic/$topicId" params={{ topicId: String(t.slug || t.id) }}
                    className={`flex items-center gap-2.5 px-3.5 py-[7px] border-b border-[#0e0e0e] hover:bg-[#0c0c0c] transition-colors ${a ? "bg-[#0a1310]" : ""}`}>
                    <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0 border ${d ? "bg-[#0d2015] border-[#1a3028]" : a ? "bg-[#0a1a12] border-[#22c55e]/40" : "bg-[#0e0e0e] border-[#1a1a1a]"}`}>
                      {d && <CheckCircle2 size={8} className="text-[#22c55e]" />}
                      {!d && a && <div className="w-1 h-1 rounded-full bg-[#22c55e]" />}
                    </div>
                    <span className={`text-[11px] flex-1 truncate ${d ? "text-[#2e2e2e] line-through" : a ? "text-[#ddd]" : "text-[#666]"}`}>{t.title}</span>
                    {a && <ChevronRight size={10} className="text-[#22c55e] shrink-0" />}
                  </Link>
                );
              })
            )}
          </div>
          {total > 0 && (
            <div className="px-3.5 py-2 border-t border-[#111] shrink-0">
              <div className="h-[2px] bg-[#111] rounded-full overflow-hidden">
                <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${cpct}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* ─── ROW 3–4 RIGHT : activity ────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "feed" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <Activity size={10} className="text-[#333]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Activity</span>
            </div>
            {activity.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
            {activity.length > 0 ? (
              <ul className="space-y-px">
                {activity.map((a: any, i: number) => (
                  <li key={a.id} className="flex items-start gap-2 py-1.5 border-b border-[#0d0d0d] last:border-0">
                    <div className={`mt-1 w-1 h-1 rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e]" : "bg-[#1e1e1e]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] leading-snug truncate ${i === 0 ? "text-[#bbb]" : "text-[#484848]"}`}>{a.label}</p>
                      <p className="text-[9px] font-mono text-[#252525]">{timeAgo(a.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] text-[#333]">No activity yet</div>
            )}
          </div>
        </div>

        {/* ─── ROW 4 : heatmap ─────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "heat" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <Github size={10} className="text-[#333]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#333]">Contributions</span>
            </div>
            <span className="text-[8px] font-mono text-[#252525]">{xp} total</span>
          </div>
          <div className="flex-1 flex items-center px-3.5 py-2 overflow-x-auto min-h-0">
            {hl ? (
              <div className="w-full h-full rounded bg-[#0c0c0c] animate-pulse" />
            ) : (
              <ActivityCalendar
                data={hd}
                theme={{ light: ["#0e0e0e", "#0f2318", "#155e36", "#16a34a", "#22c55e"], dark: ["#0e0e0e", "#0f2318", "#155e36", "#16a34a", "#22c55e"] }}
                colorScheme="dark"
                labels={{ totalCount: "{{count}} sessions this year" }}
                style={{ fontSize: "10px" }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── grid definition ────────────────────────────────────────────── */}
      <style>{`
        .dashboard-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: 1fr 1fr 240px;
          grid-template-rows: 36px 64px 1fr auto;
          grid-template-areas:
            "hdr     hdr     hdr"
            "stats   stats   stats"
            "mission topics  feed"
            "heat    heat    feed";
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            height: auto !important;
            overflow: auto !important;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            grid-template-areas:
              "hdr"
              "stats"
              "mission"
              "topics"
              "heat"
              "feed";
          }
          .dashboard-grid > * { min-height: unset !important; }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>
    </PageShell>
  );
}