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

const TONE = {
  violet: { fg: "#a855f7", rail: "from-[#a855f7]/60 via-[#a855f7]/10 to-transparent", soft: "bg-[#a855f7]/10", ring: "ring-[#a855f7]/30" },
  amber: { fg: "#f59e0b", rail: "from-[#f59e0b]/60 via-[#f59e0b]/10 to-transparent", soft: "bg-[#f59e0b]/10", ring: "ring-[#f59e0b]/30" },
  emerald: { fg: "#22c55e", rail: "from-[#22c55e]/60 via-[#22c55e]/10 to-transparent", soft: "bg-[#22c55e]/10", ring: "ring-[#22c55e]/30" },
  neutral: { fg: "#8a8a8a", rail: "from-white/15 via-white/5 to-transparent", soft: "bg-white/5", ring: "ring-white/10" },
} as const;
type Tone = keyof typeof TONE;

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

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

/* ── shared primitives ───────────────────────────────────────────────── */

function Eyebrow({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <p
      className="text-[10px] uppercase tracking-[0.24em] font-mono flex items-center gap-1.5"
      style={{ color: TONE[tone].fg, opacity: tone === "neutral" ? 0.55 : 0.9 }}
    >
      {children}
    </p>
  );
}

function Panel({
  children,
  className = "",
  tone = "neutral",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: Tone;
  padded?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_0_rgba(0,0,0,0.6)] ${className}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b ${TONE[tone].rail}`}
      />
      <div className={padded ? "px-5 py-4" : ""}>{children}</div>
    </section>
  );
}

function PanelHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 mb-4">
      <div className="min-w-0">{left}</div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: any; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-3">
        <Icon className="w-4 h-4 text-[#5a5a5a]" />
      </div>
      <p className="text-[13px] text-[#cfcfcf]">{title}</p>
      <p className="text-[11px] text-[#5a5a5a] mt-1 font-mono">{sub}</p>
    </div>
  );
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const t = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase px-2 py-1 rounded-full ${t.soft} ring-1 ${t.ring}`}
      style={{ color: t.fg }}
    >
      {children}
    </span>
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
      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a0a0a] border border-[#22c55e]/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] font-mono tracking-wide text-[#cfcfcf]">{toast}</span>
          </div>
        </div>
      )}

      <div className="space-y-6">

        {/* ── HERO BAND ─────────────────────────────────────────────── */}
        <Panel tone="violet" padded={false}>
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.18), transparent 70%)" }}
          />
          <div className="relative px-6 py-7">
            <div className="flex items-start gap-6">
              {/* Level badge */}
              <div className="shrink-0">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#a855f7]/20 to-[#a855f7]/5 border border-[#a855f7]/30 flex flex-col items-center justify-center">
                  <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#a855f7]/70">Lv</span>
                  <span className="text-2xl font-mono font-semibold text-[#f2f2f2] leading-none">{level}</span>
                </div>
                <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-[0.22em] text-[#8a8a8a]">{lvl}</p>
              </div>

              {/* Greeting + selector */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <Eyebrow tone="violet"><Zap className="w-3 h-3" /> GrowthOS · Dashboard</Eyebrow>
                    <h1 className="mt-2 text-[26px] leading-tight font-semibold text-[#f2f2f2] tracking-tight">
                      {todayLabel()}
                    </h1>
                    <p className="mt-1 text-[13px] text-[#8a8a8a]">
                      {cur ? <>Pick up where you left off — <span className="text-[#cfcfcf]">{cur.title}</span></> : "Choose a path to start your day."}
                    </p>
                  </div>

                  {ap && (
                    <div className="flex items-center gap-2">
                      {streak > 0 && <Pill tone="amber"><Flame className="w-3 h-3" /> {streak}d live</Pill>}
                      <div className="relative">
                        <select
                          value={selectedPathId || "auto"}
                          onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                          className="appearance-none bg-[#0c0c0c] border border-white/10 text-[#cfcfcf] text-[11px] font-mono tracking-wide rounded-xl pl-3.5 pr-9 py-2 outline-none hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#a855f7]/40 transition-all cursor-pointer"
                        >
                          <option value="auto">✨ Auto-track</option>
                          {allPaths.map((p: any) => (
                            <option key={p.uniqueId} value={p.uniqueId}>{p.title}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-[#8a8a8a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>

                {/* XP bar */}
                <div className="mt-5">
                  <div className="flex items-end justify-between mb-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#5a5a5a]">XP</span>
                      <span className="text-[15px] font-mono text-[#f2f2f2]">{xp}</span>
                      <span className="text-[11px] font-mono text-[#5a5a5a]">/ {next}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-[#8a8a8a]">
                      <span>{xpPct}% to Lv{level + 1}</span>
                      <span className="text-[#454545]">·</span>
                      <span>{Math.max(0, next - xp)} left</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#a855f7] to-[#7c3aed] transition-[width] duration-700"
                      style={{ width: `${xpPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* ── MISSION + STREAK ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Panel tone="emerald" className="lg:col-span-2">
            <PanelHeader
              left={<Eyebrow tone="emerald"><Target className="w-3 h-3" /> Today's mission</Eyebrow>}
              right={cur && <Pill tone="emerald"><span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" /> Active</Pill>}
            />
            {cur ? (
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-stretch">
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#5a5a5a]">{ap?.title}</p>
                  <h2 className="mt-2 text-[20px] leading-snug text-[#f2f2f2] font-semibold tracking-tight">{cur.title}</h2>
                  <p className="mt-2 text-[13px] text-[#8a8a8a] leading-relaxed max-w-prose">
                    {cur.summary || "Complete the session and submit proof of work."}
                  </p>

                  <Link
                    to={"/path/$pathId" as any}
                    params={{ pathId: ap?.id } as any}
                    className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e] text-[#052e16] text-[12px] font-mono font-semibold tracking-wide hover:bg-[#16a34a] transition-colors"
                  >
                    Continue <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Vertical step rail */}
                <ol className="md:w-56 flex flex-col gap-2.5 md:border-l md:border-white/[0.06] md:pl-5">
                  {steps.map((s, i) => {
                    const Icon = s.I;
                    return (
                      <li key={i} className="flex items-center gap-3">
                        <span
                          className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[10px] font-mono ${s.d
                              ? "bg-[#22c55e]/15 border-[#22c55e]/40 text-[#22c55e]"
                              : "bg-white/[0.02] border-white/10 text-[#5a5a5a]"
                            }`}
                        >
                          {s.d ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                        </span>
                        <p className={`flex-1 text-[12px] ${s.d ? "text-[#cfcfcf]" : "text-[#8a8a8a]"}`}>{s.l}</p>
                        <Icon className={`w-3.5 h-3.5 ${s.d ? "text-[#22c55e]" : "text-[#3a3a3a]"}`} />
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : (
              <EmptyState icon={BookOpen} title="No active path" sub="Pick or create a path to begin." />
            )}
          </Panel>

          {/* Streak card */}
          <Panel tone="amber">
            <PanelHeader left={<Eyebrow tone="amber"><Flame className="w-3 h-3" /> Day streak</Eyebrow>} />
            <div className="flex flex-col items-center text-center py-2">
              <div className="relative">
                <div
                  className={`text-[64px] leading-none font-mono font-semibold ${streak > 0 ? "text-[#f59e0b]" : "text-[#333]"}`}
                  style={streak > 0 ? { textShadow: "0 0 40px rgba(245,158,11,0.35)" } : undefined}
                >
                  {streak}
                </div>
                <Flame className={`absolute -right-6 top-1 w-5 h-5 ${streak > 0 ? "text-[#f59e0b]" : "text-[#2a2a2a]"}`} />
              </div>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#8a8a8a]">
                {streak > 0 ? "Keep it alive" : "Start today"}
              </p>

              {profile?.can_revive_streak && (
                <button
                  onClick={() => revive.mutate()}
                  disabled={revive.isPending}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-mono text-[#f59e0b] border border-[#f59e0b]/30 bg-[#f59e0b]/5 rounded-lg px-3 py-1.5 hover:bg-[#f59e0b]/10 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" /> Revive streak
                </button>
              )}
            </div>
          </Panel>
        </div>

        {/* ── PATH PROGRESS STRIP ──────────────────────────────────── */}
        {total > 0 && (
          <Panel tone="emerald">
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <div className="flex items-center gap-3">
                <Eyebrow tone="emerald"><Award className="w-3 h-3" /> Path progress</Eyebrow>
                <span className="text-[11px] font-mono text-[#8a8a8a]">{ap?.title}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-[20px] font-mono text-[#f2f2f2]">{cpct}<span className="text-[#5a5a5a]">%</span></span>
                <span className="text-[11px] font-mono text-[#8a8a8a]">{done}/{total} topics</span>
              </div>
            </div>
            <div className="flex gap-1">
              {topics.map((t: any, i: number) => {
                const d = t.user_progress === "completed";
                const a = t.id === cur?.id;
                return (
                  <div
                    key={t.id ?? i}
                    title={t.title}
                    className={`flex-1 h-2 rounded-sm transition-colors ${d ? "bg-[#22c55e]" : a ? "bg-[#22c55e]/40" : "bg-white/[0.06]"
                      }`}
                  />
                );
              })}
            </div>
          </Panel>
        )}

        {/* ── TOPICS + ACTIVITY ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel tone="neutral">
            <PanelHeader
              left={<Eyebrow><BookOpen className="w-3 h-3" /> Path topics</Eyebrow>}
              right={<span className="text-[11px] font-mono text-[#8a8a8a]">{done}/{total}</span>}
            />
            {topics.length === 0 ? (
              <EmptyState icon={Circle} title="No topics yet" sub="Topics will appear here once a path is selected." />
            ) : (
              <ul className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
                {topics.map((t: any) => {
                  const d = t.user_progress === "completed";
                  const a = t.id === cur?.id;
                  return (
                    <li
                      key={t.id}
                      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${a
                          ? "border-[#22c55e]/30 bg-[#22c55e]/5"
                          : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]"
                        }`}
                    >
                      <span className="shrink-0">
                        {d ? (
                          <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                        ) : a ? (
                          <span className="block w-3.5 h-3.5 rounded-full border-2 border-[#22c55e]" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#3a3a3a]" />
                        )}
                      </span>
                      <span className={`flex-1 truncate text-[13px] ${d ? "text-[#5a5a5a] line-through" : a ? "text-[#f2f2f2]" : "text-[#cfcfcf]"}`}>
                        {t.title}
                      </span>
                      {a && <ChevronRight className="w-3.5 h-3.5 text-[#22c55e]" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel tone="neutral">
            <PanelHeader
              left={<Eyebrow><Activity className="w-3 h-3" /> Recent activity</Eyebrow>}
              right={activity.length > 0 && <span className="text-[11px] font-mono text-[#8a8a8a]">{activity.length}</span>}
            />
            {activity.length > 0 ? (
              <ol className="relative pl-4 space-y-3">
                <span aria-hidden className="absolute left-1.5 top-1 bottom-1 w-px bg-white/[0.06]" />
                {activity.slice(0, 8).map((a: any, i: number) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[14px] top-1.5 w-2 h-2 rounded-full bg-[#a855f7] ring-4 ring-[#0a0a0a]" />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] text-[#cfcfcf] truncate">{a.label}</p>
                      <p className="text-[10px] font-mono text-[#5a5a5a] shrink-0">{timeAgo(a.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState icon={Activity} title="No recent activity" sub="Complete a topic to start your log." />
            )}
          </Panel>
        </div>

        {/* ── CONTRIBUTIONS ────────────────────────────────────────── */}
        <Panel tone="violet">
          <PanelHeader
            left={<Eyebrow tone="violet"><Github className="w-3 h-3" /> Contributions</Eyebrow>}
            right={<span className="text-[11px] font-mono text-[#8a8a8a]">Last 12 months</span>}
          />
          <div className="overflow-x-auto -mx-1 px-1">
            {hl ? (
              <div className="h-[120px] w-full rounded-lg bg-white/[0.02] animate-pulse" />
            ) : (
              <ActivityCalendar
                data={hd}
                blockSize={11}
                blockMargin={3}
                fontSize={10}
                theme={{
                  light: ["#111", "#2a1245", "#5b21b6", "#7c3aed", "#a855f7"],
                  dark: ["#111", "#2a1245", "#5b21b6", "#7c3aed", "#a855f7"],
                }}
                colorScheme="dark"
                labels={{ totalCount: "{{count}} contributions in the last year" }}
              />
            )}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
