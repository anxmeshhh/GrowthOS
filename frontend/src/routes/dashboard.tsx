import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Target, BookOpen, ClipboardCheck,
  Zap, Award, CheckCircle2, Circle,
  Activity, ChevronRight, Github,
  RotateCcw, Flame, Star, ChevronDown,
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
      { title: "Dashboard — GrowthOS" },
      { name: "description", content: "Today's mission, streak, and proof checklist." },
    ],
  }),
  component: DashboardPage,
});

/* ── design tokens ───────────────────────────────────────────────────────
   bg          #050505 / surface #0a0a0a / border rgba(255,255,255,.06)
   text        primary #f2f2f2, secondary #8a8a8a, muted #454545
   accents     violet #a855f7 (XP), amber #f59e0b (streak), emerald #22c55e (progress/success)
   mono        ui-monospace — used for all numerals, labels, timestamps
──────────────────────────────────────────────────────────────────────── */

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

/* ── shared primitives ───────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-[0.22em] font-mono text-[#5a5a5a] flex items-center gap-1.5">
      {children}
    </p>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0a0a0a] border border-white/[0.06] rounded-2xl overflow-hidden transition-colors duration-300 hover:border-white/[0.09] ${className}`}>
      {children}
    </div>
  );
}

function PanelHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
      <div>{left}</div>
      {right && <div>{right}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="py-14 flex flex-col items-center justify-center text-center">
      <Icon size={22} className="text-[#333] mb-3" />
      <p className="text-[13px] font-medium text-[#999]">{title}</p>
      <p className="text-[11px] text-[#454545] mt-1 font-mono">{sub}</p>
    </div>
  );
}

/* ── main ────────────────────────────────────────────────────────────── */

function DashboardPage() {
  const { state } = useGrowth();
  const qc = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

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
      flash("Streak revived");
      qc.invalidateQueries({ queryKey: ["user_profile"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
    },
    onError: (e: Error) => flash(e.message),
  });

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
    { l: "Study concepts", d: started || proof || verified, I: BookOpen },
    { l: "Submit proof", d: proof || verified, I: ClipboardCheck },
    { l: "AI verify", d: verified, I: Target },
  ];

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  return (
    <PageShell>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl border border-[#1a3d28] bg-[#0a1a12]/95 backdrop-blur text-[#4ade80] text-xs font-mono shadow-2xl shadow-black/50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      <div className="p-5 lg:p-8 space-y-5 max-w-screen-xl mx-auto">

        {/* ── Header ── */}
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#a855f7]/15 to-[#a855f7]/[0.02] border border-[#a855f7]/25 flex items-center justify-center">
              <span className="text-[15px] font-mono font-semibold text-[#c084fc]">{level}</span>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
                <Star size={8} className="text-[#a855f7]" fill="currentColor" />
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.28em] font-mono text-[#454545]">GrowthOS</p>
              <h1 className="text-[22px] font-semibold tracking-tight text-[#f2f2f2] leading-none mt-1">Dashboard</h1>
            </div>
          </div>

          {ap && (
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#22c55e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" /> Live
                </span>
              )}
              <div className="relative">
                <select
                  value={selectedPathId || "auto"}
                  onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                  className="appearance-none bg-[#0c0c0c] border border-white/10 text-[#cfcfcf] text-[11px] font-mono tracking-wide rounded-xl pl-3.5 pr-8 py-2 outline-none hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#22c55e]/40 transition-all cursor-pointer"
                >
                  <option value="auto" className="bg-[#0a0a0a]">✨ Auto-track</option>
                  <optgroup label="Available paths" className="bg-[#0a0a0a] text-[#666]">
                    {allPaths.map((p: any) => (
                      <option key={p.uniqueId} value={p.uniqueId} className="bg-[#0a0a0a] text-[#999]">
                        {p.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* ── Stats rail ── */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#070707] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#a855f7]/[0.05] via-transparent to-[#22c55e]/[0.05] pointer-events-none" />
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06] relative">

            {/* XP */}
            <div className="p-6">
              <Eyebrow><Zap size={11} className="text-[#a855f7]" /> Level &amp; XP</Eyebrow>
              <div className="mt-3.5 flex items-baseline gap-2">
                <span className="text-[34px] font-semibold tracking-tight text-[#c084fc] leading-none">{level}</span>
                <span className="text-[13px] text-[#5a5a5a] font-mono">{lvl}</span>
              </div>
              <div className="text-[11px] font-mono text-[#5a5a5a] mt-1">{xp} XP total</div>
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-[#5a5a5a]">
                  <span>{xpPct}% to Lv{level + 1}</span>
                  <span className="text-[#a855f7]">{next - xp} XP left</span>
                </div>
                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#a855f7]/70 to-[#a855f7] rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="p-6 flex flex-col">
              <Eyebrow><Flame size={11} className="text-[#f59e0b]" /> Day streak</Eyebrow>
              <div className="flex-1 flex items-center gap-4 mt-2">
                <span className={`text-[34px] font-mono font-semibold leading-none ${streak > 0 ? "text-[#f59e0b]" : "text-[#333]"}`}>
                  {streak}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-mono text-[#5a5a5a] uppercase tracking-wide">
                    {streak > 0 ? "Keep it alive" : "Start today"}
                  </span>
                  {profile?.can_revive_streak && (
                    <button
                      onClick={() => revive.mutate()}
                      disabled={revive.isPending}
                      className="flex items-center gap-1 text-[9px] font-mono text-[#f59e0b] border border-[#f59e0b]/25 rounded-lg px-2 py-1 hover:bg-[#f59e0b]/10 transition-colors w-fit disabled:opacity-50"
                    >
                      <RotateCcw size={9} /> Revive
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Path progress */}
            <div className="p-6">
              <Eyebrow><Target size={11} className="text-[#22c55e]" /> Path progress</Eyebrow>
              <div className="mt-3.5 flex items-baseline gap-1">
                <span className="text-[34px] font-semibold tracking-tight text-[#f2f2f2] leading-none">{cpct}</span>
                <span className="text-[15px] text-[#5a5a5a]">%</span>
              </div>
              <div className="text-[11px] font-mono text-[#22c55e] mt-1">{done} / {total} topics done</div>
              <div className="mt-4 h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#22c55e]/70 to-[#22c55e] rounded-full transition-all duration-700" style={{ width: `${cpct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Mission + Topics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <Panel>
            <PanelHeader
              left={<Eyebrow><Zap size={11} className="text-[#22c55e]" /> Today's mission</Eyebrow>}
              right={cur && (
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Active
                </span>
              )}
            />
            <div className="p-6">
              {cur ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[9px] font-mono text-[#454545] uppercase tracking-wider mb-1.5">{ap?.title}</p>
                    <h2 className="text-[16px] font-semibold text-[#f2f2f2] leading-snug">{cur.title}</h2>
                    <p className="text-[12.5px] text-[#666] leading-relaxed mt-2 line-clamp-2">
                      {cur.summary || "Complete the session and submit proof of work."}
                    </p>
                  </div>

                  <div className="relative space-y-2.5">
                    {steps.map((s, i) => (
                      <div key={i} className="relative flex items-center gap-3.5">
                        {i < steps.length - 1 && (
                          <div className={`absolute left-[15px] top-[28px] w-px h-[18px] ${s.d ? "bg-[#22c55e]/30" : "bg-white/[0.06]"}`} />
                        )}
                        <div className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 border transition-colors ${s.d ? "bg-[#0d2015] border-[#22c55e]/30" : "bg-[#0d0d0d] border-white/[0.08]"}`}>
                          {s.d ? <CheckCircle2 size={13} className="text-[#22c55e]" /> : <Circle size={11} className="text-[#3a3a3a]" />}
                        </div>
                        <span className={`flex-1 text-[12.5px] ${s.d ? "text-[#999]" : "text-[#555]"}`}>{s.l}</span>
                        <s.I size={12} className={s.d ? "text-[#22c55e]" : "text-[#333]"} />
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(cur.slug || cur.id) }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#22c55e] text-[#031007] text-[13px] font-semibold hover:bg-[#16a34a] active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-[#22c55e]/50"
                  >
                    Continue <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <EmptyState icon={Award} title="Path complete" sub="ALL TOPICS MASTERED" />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              left={<Eyebrow>Path topics</Eyebrow>}
              right={<span className="text-[10px] font-mono text-[#454545]">{done}/{total}</span>}
            />
            <div className="overflow-y-auto max-h-[336px]">
              {topics.length === 0 ? (
                <EmptyState icon={BookOpen} title="No topics yet" sub="SELECT A PATH TO BEGIN" />
              ) : (
                topics.map((t: any) => {
                  const d = t.user_progress === "completed";
                  const a = t.id === cur?.id;
                  return (
                    <Link
                      key={t.id}
                      to="/topic/$topicId"
                      params={{ topicId: String(t.slug || t.id) }}
                      className={`flex items-center gap-3 px-6 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${a ? "bg-[#22c55e]/[0.04]" : ""}`}
                    >
                      <div className={`w-[18px] h-[18px] rounded-md flex items-center justify-center shrink-0 border ${d ? "bg-[#0d2015] border-[#22c55e]/25" : a ? "bg-[#0a1a12] border-[#22c55e]/50" : "bg-[#0d0d0d] border-white/[0.08]"}`}>
                        {d && <CheckCircle2 size={10} className="text-[#22c55e]" />}
                        {!d && a && <div className="w-[6px] h-[6px] rounded-full bg-[#22c55e]" />}
                      </div>
                      <span className={`text-[12.5px] flex-1 truncate ${d ? "text-[#3a3a3a] line-through" : a ? "text-[#e0e0e0] font-medium" : "text-[#777]"}`}>
                        {t.title}
                      </span>
                      {a && <ChevronRight size={12} className="text-[#22c55e] shrink-0" />}
                    </Link>
                  );
                })
              )}
            </div>
            {total > 0 && (
              <div className="px-6 py-3.5 border-t border-white/[0.05]">
                <div className="h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${cpct}%` }} />
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ── Activity + Heatmap ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <Panel>
            <PanelHeader
              left={<Eyebrow><Activity size={11} /> Recent activity</Eyebrow>}
              right={activity.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />}
            />
            <div className="overflow-y-auto max-h-[280px] px-6 py-2">
              {activity.length > 0 ? (
                <ul>
                  {activity.map((a: any, i: number) => (
                    <li key={a.id} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
                      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e]" : "bg-[#2a2a2a]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12.5px] leading-snug truncate ${i === 0 ? "text-[#c4c4c4]" : "text-[#555]"}`}>{a.label}</p>
                        <p className="text-[10px] font-mono text-[#3a3a3a] mt-0.5">{timeAgo(a.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState icon={Activity} title="No activity yet" sub="YOUR MOVES SHOW UP HERE" />
              )}
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHeader
              left={<Eyebrow><Github size={11} /> Contributions</Eyebrow>}
              right={<span className="text-[10px] font-mono text-[#454545] uppercase tracking-wider">Last 12 months</span>}
            />
            <div className="p-6 overflow-x-auto">
              <div className="min-w-[480px]">
                {hl ? (
                  <div className="h-24 rounded-xl bg-white/[0.02] animate-pulse" />
                ) : (
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
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      color: "#5a5a5a",
                    }}
                  />
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}