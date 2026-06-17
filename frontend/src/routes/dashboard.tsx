import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Target, BookOpen, ClipboardCheck,
  Zap, Award, CheckCircle2, Circle,
  Activity, ChevronRight, Github,
  RotateCcw, Flame, Trophy, Star,
} from "lucide-react";
import { PageShell } from "@/components/growth-ui";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";
import { useState, useEffect } from "react";

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

/* ── sub-components (matching Progress page) ─────────────────────────────── */

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

function CardHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#131313]">
      <div>{left}</div>
      {right && <div>{right}</div>}
    </div>
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

  const allPaths = [
    ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
  ];

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
    { l: "Study concepts", d: started || proof || verified, I: BookOpen },
    { l: "Submit proof", d: proof || verified, I: ClipboardCheck },
    { l: "AI verify", d: verified, I: Target },
  ];

  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  /* ── render ── */
  return (
    <PageShell>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 px-4 py-2.5 rounded-lg border border-[#1a3d28] bg-[#0a1a12] text-[#22c55e] text-xs font-mono shadow-xl flex items-center gap-2">
          <CheckCircle2 size={13} /> {toast}
        </div>
      )}

      <div className="p-5 lg:p-6 space-y-4 max-w-screen-xl mx-auto">

        {/* ── Page Header ── */}
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#444] mb-1.5">GrowthOS</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0] leading-none">Dashboard</h1>
          </div>
          {ap && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#22c55e] hidden sm:block animate-pulse">
                Live Status
              </span>
              <select
                value={selectedPathId || "auto"}
                onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                className="bg-[#0a1a12] border border-[#22c55e]/40 text-[#22c55e] text-[10px] font-mono uppercase tracking-wider rounded-lg px-3 py-1.5 outline-none hover:border-[#22c55e]/70 transition-all cursor-pointer"
              >
                <option value="auto" className="bg-[#0a0a0a] font-sans normal-case">✨ Auto-Track Active</option>
                <optgroup label="Available Paths" className="bg-[#0a0a0a] text-[#555] font-sans">
                  {allPaths.map((p: any) => (
                    <option key={p.uniqueId} value={p.uniqueId} className="bg-[#0a0a0a] text-[#888] font-sans normal-case text-xs">
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          )}
        </div>

        {/* ── Stats Row (matching Progress top cards) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* XP + Level — purple tint */}
          <div className="bg-[#0d0914] border border-[#1f1938] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#a855f7] opacity-[0.06] rounded-full blur-3xl pointer-events-none" />
            <SectionLabel><Zap size={11} className="text-[#a855f7]" /> Level & XP</SectionLabel>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight text-[#a855f7]">{level}</span>
              <span className="text-sm text-[#555] font-mono">— {lvl}</span>
            </div>
            <div className="text-[11px] font-mono text-[#666] mt-0.5">{xp} XP total</div>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#666]">{xpPct}% to Lv{level + 1}</span>
                <span className="text-[#a855f7]">{next - xp} XP left</span>
              </div>
              <div className="h-1 w-full bg-[#111] rounded-full overflow-hidden">
                <div className="h-full bg-[#a855f7] rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
            </div>
          </div>

          {/* Streak — amber tint */}
          <div className="bg-[#0d0b04] border border-[#221a05] rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#f59e0b] opacity-[0.07] rounded-full blur-2xl pointer-events-none" />
            <SectionLabel><Flame size={11} className="text-[#f59e0b]" /> Day Streak</SectionLabel>
            <div className={`text-4xl font-mono font-semibold mt-3 ${streak > 0 ? "text-[#f59e0b]" : "text-[#333]"}`}>
              {streak}
            </div>
            <div className="text-[10px] font-mono text-[#555] uppercase tracking-wider mt-1">
              {streak > 0 ? "Keep it alive!" : "Start today"}
            </div>
            {profile?.can_revive_streak && (
              <button
                onClick={() => revive.mutate()}
                disabled={revive.isPending}
                className="mt-3 flex items-center gap-1 text-[9px] font-mono text-[#f59e0b] border border-[#f59e0b]/25 rounded px-2 py-1 hover:bg-[#f59e0b]/10 transition-colors"
              >
                <RotateCcw size={9} /> Revive Streak
              </button>
            )}
          </div>

          {/* Path Progress — green tint */}
          <div className="bg-[#040d07] border border-[#0d2214] rounded-xl p-5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-[#22c55e] opacity-[0.06] rounded-full blur-2xl pointer-events-none" />
            <SectionLabel><Star size={11} className="text-[#22c55e]" /> Path Progress</SectionLabel>
            <div className="text-3xl font-semibold tracking-tight text-[#f0f0f0] mt-3">
              {cpct}<span className="text-base text-[#555] ml-1">%</span>
            </div>
            <div className="text-[11px] font-mono text-[#22c55e] mt-0.5">{done} / {total} topics done</div>
            <div className="mt-4 h-1 w-full bg-[#111] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full transition-all duration-700" style={{ width: `${cpct}%` }} />
            </div>
          </div>
        </div>

        {/* ── Middle Row: Mission + Topics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

          {/* Mission Card */}
          <Card>
            <CardHeader
              left={<SectionLabel><Zap size={11} className="text-[#22c55e]" /> Today's Mission</SectionLabel>}
              right={cur && <span className="text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">Active</span>}
            />
            <div className="p-5">
              {cur ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-mono text-[#444] uppercase tracking-wider mb-1">{ap?.title}</p>
                    <h2 className="text-[15px] font-semibold text-[#f0f0f0] leading-snug">{cur.title}</h2>
                    <p className="text-[12px] text-[#555] leading-relaxed mt-1.5 line-clamp-2">
                      {cur.summary || "Complete the session and submit proof of work."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {steps.map((s, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-[12px] transition-colors ${s.d ? "border-[#1a3028] bg-[#0a1a12] text-[#888]" : "border-[#151515] bg-[#0d0d0d] text-[#444]"}`}>
                        {s.d
                          ? <CheckCircle2 size={12} className="text-[#22c55e] shrink-0" />
                          : <Circle size={12} className="text-[#2a2a2a] shrink-0" />}
                        <span className="flex-1">{s.l}</span>
                        <s.I size={11} className={s.d ? "text-[#22c55e]" : "text-[#252525]"} />
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(cur.slug || cur.id) }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22c55e] text-[#030f07] text-[13px] font-semibold hover:bg-[#16a34a] transition-colors"
                  >
                    Continue <ArrowRight size={13} />
                  </Link>
                </div>
              ) : (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <Award size={28} className="text-[#22c55e] mb-3 opacity-30" />
                  <p className="text-[14px] font-semibold text-[#ddd]">Path complete</p>
                  <p className="text-[12px] text-[#444] mt-1">All topics mastered.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Topic List */}
          <Card>
            <CardHeader
              left={<SectionLabel>Path Topics</SectionLabel>}
              right={<span className="text-[10px] font-mono text-[#333]">{done}/{total}</span>}
            />
            <div className="overflow-y-auto max-h-[320px]">
              {topics.length === 0 ? (
                <div className="py-10 text-center text-[11px] text-[#444] font-mono uppercase tracking-widest">No topics</div>
              ) : (
                topics.map((t: any) => {
                  const d = t.user_progress === "completed";
                  const a = t.id === cur?.id;
                  return (
                    <Link
                      key={t.id}
                      to="/topic/$topicId"
                      params={{ topicId: String(t.slug || t.id) }}
                      className={`flex items-center gap-3 px-5 py-3 border-b border-[#0e0e0e] hover:bg-[#0d0d0d] transition-colors ${a ? "bg-[#0a1310]" : ""}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${d ? "bg-[#0d2015] border-[#1a3028]" : a ? "bg-[#0a1a12] border-[#22c55e]/40" : "bg-[#0e0e0e] border-[#1a1a1a]"}`}>
                        {d && <CheckCircle2 size={9} className="text-[#22c55e]" />}
                        {!d && a && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
                      </div>
                      <span className={`text-[12px] flex-1 truncate ${d ? "text-[#2e2e2e] line-through" : a ? "text-[#ddd]" : "text-[#666]"}`}>
                        {t.title}
                      </span>
                      {a && <ChevronRight size={11} className="text-[#22c55e] shrink-0" />}
                    </Link>
                  );
                })
              )}
            </div>
            {total > 0 && (
              <div className="px-5 py-3 border-t border-[#111]">
                <div className="h-[2px] bg-[#111] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${cpct}%` }} />
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Bottom Row: Activity Feed + Heatmap ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

          {/* Activity Feed */}
          <Card>
            <CardHeader
              left={<SectionLabel><Activity size={11} /> Recent Activity</SectionLabel>}
              right={activity.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
            />
            <div className="overflow-y-auto max-h-[260px] px-4 py-3">
              {activity.length > 0 ? (
                <ul className="space-y-px">
                  {activity.map((a: any, i: number) => (
                    <li key={a.id} className="flex items-start gap-3 py-2 border-b border-[#0d0d0d] last:border-0">
                      <div className={`mt-1.5 w-1 h-1 rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e]" : "bg-[#222]"}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] leading-snug truncate ${i === 0 ? "text-[#bbb]" : "text-[#444]"}`}>{a.label}</p>
                        <p className="text-[10px] font-mono text-[#2a2a2a] mt-0.5">{timeAgo(a.date)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-10 text-center text-[11px] text-[#444] font-mono uppercase tracking-widest">No activity yet</div>
              )}
            </div>
          </Card>

          {/* Heatmap — spans 2 cols */}
          <Card className="lg:col-span-2">
            <CardHeader
              left={<SectionLabel><Github size={11} /> Contributions</SectionLabel>}
              right={<span className="text-[10px] font-mono text-[#444] uppercase tracking-wider">Last 12 months</span>}
            />
            <div className="p-5 overflow-x-auto">
              <div className="min-w-[480px]">
                {hl ? (
                  <div className="h-24 rounded bg-[#0c0c0c] animate-pulse" />
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
                      color: "#555",
                    }}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}