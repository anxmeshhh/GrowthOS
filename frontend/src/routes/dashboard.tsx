import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Target,
  BookOpen,
  ClipboardCheck,
  Award,
  CheckCircle2,
  Circle,
  Activity,
  Github,
  RotateCcw,
  Sparkles,
  Hexagon,
  Brain,
  Clock,
  AlertTriangle,
  Flame,
  Zap,
} from "lucide-react";
import { GlassPanel, SectionLabel } from "@/components/growth-ui";
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
    { level: 1, title: "Novice",      next: 20  },
    { level: 2, title: "Explorer",    next: 50  },
    { level: 3, title: "Scholar",     next: 100 },
    { level: 4, title: "Adept",       next: 250 },
    { level: 5, title: "Master",      next: 500 },
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

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── queries ── */
  const { data: paths = [] } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const r = await apiFetch("/paths/");
      return r.ok ? r.json() : [];
    },
  });

  const { data: customPaths = [] } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => {
      const r = await apiFetch("/custom-paths/");
      return r.ok ? r.json() : [];
    },
  });

  const allPaths = useMemo(
    () => [
      ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
      ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
    ],
    [paths, customPaths],
  );

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
        date:  d.date,
        count: d.count,
        level: d.count === 0 ? 0 : d.count < 25 ? 1 : d.count < 75 ? 2 : d.count < 150 ? 3 : 4,
      }));
    },
  });

  const { data: activity = [] } = useQuery({
    queryKey: ["recent_activity"],
    queryFn: async () => {
      const r = await apiFetch("/activity/");
      return r.ok ? r.json() : [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const r = await apiFetch("/profile/");
      if (!r.ok) throw 0;
      return r.json();
    },
  });

  const { data: briefing } = useQuery({
    queryKey: ["today"],
    queryFn: async () => {
      const r = await apiFetch("/today/");
      if (!r.ok) return null;
      return r.json();
    },
  });

  const revive = useMutation({
    mutationFn: async () => {
      const r = await apiFetch("/activity/revive-streak/", { method: "POST" });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Failed");
      }
      return r.json();
    },
    onSuccess: () => {
      flash("Streak revived");
      qc.invalidateQueries({ queryKey: ["user_profile"] });
      qc.invalidateQueries({ queryKey: ["heatmap"] });
    },
    onError: (e: Error) => flash(e.message),
  });

  /* ── derived ── */
  const xp   = profile?.total_xp ?? 0;
  const { level, title: lvl, next } = getLevelInfo(xp);
  const xpPct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const streak = profile?.streak ?? computeStreak(state.activeDays);

  let ap = selectedPathId ? allPaths.find((p: any) => p.uniqueId === selectedPathId) : null;
  if (!ap) {
    const fallback = [
      ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
      ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ];
    ap =
      fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "in_progress")) ||
      fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "completed"))  ||
      fallback.find((p: any) => p.is_bookmarked) ||
      fallback[0] || null;
  }

  const rawTopics: any[] = ap?.topics || [];

  const { groups, studyTopics } = useMemo(() => {
    const sorted = [...rawTopics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const grps: { milestone: any | null; topics: any[]; allDone: boolean }[] = [];
    let currentGroup: { milestone: any | null; topics: any[] } = { milestone: null, topics: [] };

    sorted.forEach((t) => {
      if (t.node_kind === "milestone") {
        if (currentGroup.topics.length > 0 || currentGroup.milestone) {
          grps.push({
            ...currentGroup,
            allDone:
              currentGroup.topics.length > 0 &&
              currentGroup.topics.every((st) => st.user_progress === "completed"),
          });
        }
        currentGroup = { milestone: t, topics: [] };
      } else {
        currentGroup.topics.push(t);
      }
    });
    if (currentGroup.topics.length > 0 || currentGroup.milestone) {
      grps.push({
        ...currentGroup,
        allDone:
          currentGroup.topics.length > 0 &&
          currentGroup.topics.every((st) => st.user_progress === "completed"),
      });
    }
    const allStudy = grps.flatMap((g) => g.topics);
    return { groups: grps, studyTopics: allStudy };
  }, [rawTopics]);

  const topics = studyTopics;
  const cur =
    topics.find((t: any) => t.user_progress === "in_progress") ||
    topics.find((t: any) => t.user_progress !== "completed")   ||
    topics[0] || null;
  const done  = topics.filter((t: any) => t.user_progress === "completed").length;
  const total = topics.length;
  const cpct  = total > 0 ? Math.round((done / total) * 100) : 0;

  const started  = cur?.user_progress === "in_progress" || cur?.user_progress === "completed";
  const proof    = cur?.has_submitted_work === true      || cur?.user_progress === "completed";
  const verified = cur?.verified_project != null         || cur?.user_progress === "completed";

  const steps = [
    { l: "Study",  d: started || proof || verified, I: BookOpen      },
    { l: "Submit", d: proof || verified,             I: ClipboardCheck },
    { l: "Verify", d: verified,                      I: Target         },
  ];

  const today = new Date().toISOString().split("T")[0];
  const hd    = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  /* ── render ── */
  return (
    <div style={{ background: "#070c12", minHeight: "100vh" }}>
      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed bottom-6 right-4 sm:right-6 z-50 px-4 py-2.5 rounded-lg text-sm font-mono tracking-wide flex items-center gap-2.5 animate-fade-in"
          style={{
            background: "rgba(12,19,25,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(63,185,80,0.25)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(63,185,80,0.1)",
            color: "#dde6ef",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "#3fb950", boxShadow: "0 0 8px #3fb950" }}
          />
          {toast}
        </div>
      )}

      <div className="px-4 sm:px-5 lg:px-7 pt-5 pb-8 max-w-[1440px] mx-auto">

        {/* ── Page header ── */}
        <div
          className="flex items-center justify-between mb-6 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(63,185,80,0.12)",
                border: "1px solid rgba(63,185,80,0.25)",
              }}
            >
              <Hexagon className="w-4 h-4 text-[#3fb950]" strokeWidth={1.5} />
            </div>
            <div>
              <p
                className="text-[10px] uppercase tracking-[0.25em] font-mono leading-none mb-1"
                style={{ color: "#3fb950" }}
              >
                GrowthOS
              </p>
              <h1
                className="text-[17px] font-semibold tracking-[-0.02em] leading-none"
                style={{ color: "#dde6ef" }}
              >
                Command Center
              </h1>
            </div>
          </div>

          {ap && (
            <div className="relative">
              <select
                value={selectedPathId || "auto"}
                onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                className="appearance-none text-xs font-mono uppercase tracking-[0.15em] rounded-lg pl-3 pr-8 py-2 outline-none cursor-pointer transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#9ba8b4",
                }}
              >
                <option value="auto" className="bg-[#0c1319] font-sans normal-case">Auto-track active</option>
                <optgroup label="Available Paths" className="bg-[#0c1319] font-sans">
                  {allPaths.map((p: any) => (
                    <option key={p.uniqueId} value={p.uniqueId} className="bg-[#0c1319] font-sans normal-case">
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                style={{ background: "rgba(63,185,80,0.5)" }}
              />
            </div>
          )}
        </div>

        {/* ── Today's Briefing ── */}
        {briefing && (
          <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Focus Suggestion */}
            <GlassPanel
              accent="green"
              className="sm:col-span-2 p-5 sm:p-6 flex flex-col justify-between min-h-[130px] animate-fade-in-up"
            >
              {/* Radial bloom */}
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full blur-3xl"
                style={{ width: 280, height: 280, background: "#3fb950", opacity: 0.06, top: -100, right: -60 }}
              />
              <div className="relative z-10">
                <SectionLabel>
                  <Brain size={11} style={{ color: "#3fb950" }} />
                  Today's Briefing
                </SectionLabel>
                <div className="mt-3">
                  {briefing.fading_topics?.length > 0 ? (
                    <p className="text-base sm:text-[17px] font-medium leading-snug" style={{ color: "#dde6ef" }}>
                      Knowledge is fading. You have{" "}
                      <span style={{ color: "#f85149" }}>{briefing.fading_topics.length}</span> topics decaying.
                      Review them to restore mastery.
                    </p>
                  ) : briefing.due_cards > 0 ? (
                    <p className="text-base sm:text-[17px] font-medium leading-snug" style={{ color: "#dde6ef" }}>
                      You have <span style={{ color: "#3fb950" }}>{briefing.due_cards}</span> flashcards due
                      across {briefing.due_topics?.length || 0} topics.
                    </p>
                  ) : briefing.last_session_topic ? (
                    <p className="text-base sm:text-[17px] font-medium leading-snug" style={{ color: "#dde6ef" }}>
                      Resume{" "}
                      <span style={{ color: "#fff", fontWeight: 700 }}>
                        "{briefing.last_session_topic.title}"
                      </span>
                      . You're making good progress.
                    </p>
                  ) : briefing.next_topic ? (
                    <p className="text-base sm:text-[17px] font-medium leading-snug" style={{ color: "#dde6ef" }}>
                      Your next objective:{" "}
                      <span style={{ color: "#fff", fontWeight: 700 }}>"{briefing.next_topic.title}"</span>.
                    </p>
                  ) : (
                    <p className="text-base sm:text-[17px] font-medium leading-snug" style={{ color: "#dde6ef" }}>
                      All clear — no due reviews. Start a new topic when ready.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5 relative z-10">
                {briefing.due_cards > 0 && (
                  <Link to="/review" className="dash-cta-btn">
                    Start Review <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                )}
                {briefing.last_session_topic && briefing.due_cards === 0 && (
                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(briefing.last_session_topic.id) }}
                    className="dash-cta-btn dash-cta-btn--ghost"
                  >
                    Resume Topic <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                )}
              </div>
            </GlassPanel>

            {/* Review Debt */}
            <GlassPanel
              accent={briefing.due_cards > 0 ? "red" as any : undefined}
              className="p-5 flex flex-col items-center justify-center text-center animate-fade-in-up delay-100"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{ width: 120, height: 120, background: "#f85149", opacity: 0.07, bottom: -40, right: -30 }}
              />
              <Clock
                size={22}
                className="mb-3"
                style={{ color: briefing.due_cards > 0 ? "#f85149" : "rgba(255,255,255,0.15)" }}
              />
              <div
                className="text-[36px] font-mono tabular-nums leading-none font-semibold"
                style={{ color: briefing.due_cards > 0 ? "#f85149" : "rgba(255,255,255,0.2)" }}
              >
                {briefing.due_cards}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-[0.18em] mt-2"
                style={{ color: briefing.due_cards > 0 ? "#f85149" : "#6b7785" }}
              >
                Cards Due Today
              </div>
              {briefing.due_topics?.length > 0 && (
                <div className="text-[10px] font-mono uppercase tracking-widest mt-2" style={{ color: "#6b7785" }}>
                  Across {briefing.due_topics.length} topics
                </div>
              )}
            </GlassPanel>
          </div>
        )}

        {/* ── Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

          {/* ── 1. Hero Mission ── */}
          <GlassPanel
            accent="green"
            className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-between min-h-[200px] sm:min-h-[220px] animate-fade-in-up delay-100"
          >
            {/* Large bloom */}
            <div
              aria-hidden
              className="pointer-events-none absolute rounded-full blur-3xl"
              style={{ width: 440, height: 440, background: "#3fb950", opacity: 0.045, top: -120, right: -100 }}
            />

            {cur ? (
              <>
                <div className="relative z-10">
                  <SectionLabel>
                    <Sparkles size={10} style={{ color: "#3fb950" }} />
                    Active Protocol
                  </SectionLabel>
                  <p
                    className="mt-3 text-[10px] font-mono uppercase tracking-[0.22em]"
                    style={{ color: "#3fb950" }}
                  >
                    {ap?.title}
                  </p>
                  <h2
                    className="mt-1.5 text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-tight max-w-xl"
                    style={{ color: "#dde6ef" }}
                  >
                    {cur.title}
                  </h2>
                </div>

                <div className="mt-5 sm:mt-7 flex flex-wrap items-center justify-between gap-3 relative z-10">
                  {/* Step pills */}
                  <div
                    className="flex items-center gap-1 p-1 rounded-lg"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {steps.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.15em] transition-all"
                        style={
                          s.d
                            ? {
                                background: "rgba(63,185,80,0.12)",
                                border: "1px solid rgba(63,185,80,0.25)",
                                color: "#3fb950",
                              }
                            : { color: "rgba(255,255,255,0.35)", border: "1px solid transparent" }
                        }
                      >
                        {s.d ? (
                          <CheckCircle2 size={10} strokeWidth={2.5} />
                        ) : (
                          <Circle size={10} strokeWidth={1.5} />
                        )}
                        {s.l}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link to="/topic/$topicId" params={{ topicId: String(cur.id) }} className="dash-engage-btn">
                    Engage Mission <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <Target size={28} style={{ color: "rgba(255,255,255,0.1)" }} strokeWidth={1.5} />
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] mt-3" style={{ color: "#6b7785" }}>
                  No active protocol detected
                </p>
              </div>
            )}
          </GlassPanel>

          {/* ── 2. Metrics Stack ── */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            {/* Level */}
            <GlassPanel
              accent="purple"
              className="flex flex-col justify-between p-4 sm:p-5 min-h-[110px] animate-fade-in-up delay-150"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{ width: 90, height: 90, background: "#bc8cff", opacity: 0.08, bottom: -20, right: -20 }}
              />
              <SectionLabel>Level</SectionLabel>
              <div className="relative z-10 mt-2">
                <div
                  className="text-[40px] sm:text-[44px] font-mono font-semibold leading-none tracking-[-0.02em]"
                  style={{ color: "#dde6ef" }}
                >
                  {level}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] mt-1.5" style={{ color: "#bc8cff" }}>
                  {lvl}
                </div>
              </div>
            </GlassPanel>

            {/* Streak */}
            <GlassPanel
              accent="amber"
              className="flex flex-col justify-between p-4 sm:p-5 min-h-[110px] animate-fade-in-up delay-200"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{ width: 90, height: 90, background: "#e3a726", opacity: 0.07, bottom: -20, right: -20 }}
              />
              <div className="flex justify-between items-start">
                <SectionLabel>Streak</SectionLabel>
                {profile?.can_revive_streak && (
                  <button
                    onClick={() => revive.mutate()}
                    disabled={revive.isPending}
                    className="p-1 rounded-md transition-colors"
                    title="Revive Streak"
                    style={{ color: "rgba(227,167,38,0.5)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#e3a726")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(227,167,38,0.5)")}
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </div>
              <div className="relative z-10 mt-2">
                <div
                  className="text-[40px] sm:text-[44px] font-mono font-semibold leading-none tracking-[-0.02em]"
                  style={{ color: streak > 0 ? "#dde6ef" : "rgba(255,255,255,0.12)" }}
                >
                  {streak}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Flame size={11} style={{ color: "#e3a726" }} />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "#e3a726" }}>
                    days active
                  </span>
                </div>
              </div>
            </GlassPanel>

            {/* XP Bar — spans both cols */}
            <GlassPanel className="col-span-2 flex flex-col justify-center p-4 sm:p-5 animate-fade-in-up delay-250">
              <div className="flex justify-between items-baseline mb-2">
                <SectionLabel>
                  <Zap size={10} style={{ color: "#bc8cff" }} />
                  Experience
                </SectionLabel>
                <span className="text-[10px] font-mono" style={{ color: "rgba(188,140,255,0.6)" }}>
                  {next - xp} XP to next
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-lg font-mono tabular-nums font-semibold" style={{ color: "#dde6ef" }}>
                  {xp}
                </span>
                <span className="text-xs font-mono" style={{ color: "#6b7785" }}>/ {next}</span>
              </div>
              {/* Gradient shimmer bar */}
              <div
                className="h-[5px] w-full rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full shimmer-bar"
                  style={{ width: `${xpPct}%`, transition: "width 1s cubic-bezier(0.2,0,0,1)" }}
                />
              </div>
            </GlassPanel>
          </div>

          {/* ── 3. Path Trajectory ── */}
          <GlassPanel
            className="lg:col-span-8 p-5 sm:p-6 flex flex-col animate-fade-in-up delay-200"
            style={{ minHeight: 260 }}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <SectionLabel>
                <Award size={10} /> Path Trajectory
              </SectionLabel>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "#6b7785" }}>
                {cpct}% completed
              </span>
            </div>

            {/* Overall progress bar */}
            <div
              className="h-[3px] w-full rounded-full overflow-hidden mb-4 shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-full rounded-full shimmer-bar-green transition-all duration-1000"
                style={{ width: `${cpct}%` }}
              />
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <div className="flex items-stretch gap-3 min-w-max h-full py-1">
                {groups.map((g, gi) => {
                  const milestoneLabel = g.milestone?.title || `Section ${gi + 1}`;
                  const groupDone  = g.topics.filter((t: any) => t.user_progress === "completed").length;
                  const groupTotal = g.topics.length;
                  const groupPct   = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;

                  return (
                    <div key={g.milestone?.id || `grp-${gi}`} className="flex items-stretch gap-3">
                      {/* Group card */}
                      <div
                        className="flex flex-col rounded-xl overflow-hidden shrink-0 transition-all duration-300"
                        style={{
                          border: `1px solid ${g.allDone ? "rgba(63,185,80,0.35)" : "rgba(255,255,255,0.07)"}`,
                          background: g.allDone
                            ? "rgba(63,185,80,0.05)"
                            : "rgba(255,255,255,0.025)",
                          minWidth: Math.max(150, groupTotal * 42 + 32),
                          maxWidth: 340,
                          boxShadow: g.allDone
                            ? "0 0 24px rgba(63,185,80,0.12)"
                            : "0 2px 12px rgba(0,0,0,0.3)",
                        }}
                      >
                        {/* Milestone header */}
                        <div
                          className="flex items-center gap-2 px-3 py-2 shrink-0"
                          style={{
                            borderBottom: `1px solid ${g.allDone ? "rgba(63,185,80,0.2)" : "rgba(255,255,255,0.06)"}`,
                            background: g.allDone ? "rgba(63,185,80,0.08)" : "rgba(255,255,255,0.03)",
                          }}
                        >
                          {g.allDone ? (
                            <CheckCircle2 size={11} strokeWidth={2.5} style={{ color: "#3fb950", flexShrink: 0 }} />
                          ) : (
                            <Circle size={11} strokeWidth={2} style={{ color: "#4d9de0", flexShrink: 0 }} />
                          )}
                          <span
                            className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] truncate"
                            style={{ color: g.allDone ? "#52d68a" : "#7db4d8" }}
                          >
                            {milestoneLabel}
                          </span>
                          <span
                            className="ml-auto text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md"
                            style={{
                              color: g.allDone ? "#3fb950" : "#6b7785",
                              background: g.allDone ? "rgba(63,185,80,0.12)" : "rgba(255,255,255,0.05)",
                            }}
                          >
                            {groupDone}/{groupTotal}
                          </span>
                        </div>

                        {/* Subtopics */}
                        <div
                          className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 custom-scrollbar"
                        >
                          {g.topics.map((t: any) => {
                            const d  = t.user_progress === "completed";
                            const a  = t.id === cur?.id;
                            const ip = t.user_progress === "in_progress";
                            return (
                              <Link
                                key={t.id}
                                to="/topic/$topicId"
                                params={{ topicId: String(t.id) }}
                                className="flex items-center gap-2 px-2 py-[5px] rounded-lg no-underline transition-all duration-150 group"
                                style={{
                                  background: a ? "rgba(63,185,80,0.1)" : "transparent",
                                  border: a ? "1px solid rgba(63,185,80,0.2)" : "1px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (!a) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                                }}
                                onMouseLeave={(e) => {
                                  if (!a) (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                              >
                                <span className="shrink-0 w-3 flex items-center justify-center">
                                  {d ? (
                                    <CheckCircle2 size={11} strokeWidth={2.5} style={{ color: "#3fb950" }} />
                                  ) : ip ? (
                                    <span
                                      className="w-2 h-2 rounded-full"
                                      style={{ background: "#e3a726", boxShadow: "0 0 6px #e3a72660", animation: "live-pulse 2s infinite" }}
                                    />
                                  ) : (
                                    <Circle size={10} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.2)" }} />
                                  )}
                                </span>
                                <span
                                  className="text-[13px] font-mono leading-tight truncate flex-1"
                                  style={{ color: d ? "#52d68a" : a ? "#fff" : "#9ba8b4" }}
                                >
                                  {t.title}
                                </span>
                                {a && (
                                  <span
                                    className="text-[8px] font-mono uppercase tracking-wider shrink-0"
                                    style={{ color: "#3fb950" }}
                                  >
                                    active
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Micro progress bar */}
                        <div className="h-[3px] w-full shrink-0" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div
                            className="h-full transition-all duration-700 rounded-full"
                            style={{
                              width:  `${groupPct}%`,
                              background: g.allDone ? "#3fb950" : "#4d9de0",
                              boxShadow:  groupPct > 0 ? `0 0 8px ${g.allDone ? "#3fb95070" : "#4d9de070"}` : "none",
                            }}
                          />
                        </div>
                      </div>

                      {/* Connector arrow */}
                      {gi < groups.length - 1 && (
                        <div className="flex items-center shrink-0">
                          <svg
                            width="44" height="16" viewBox="0 0 44 16"
                            style={{
                              filter: g.allDone
                                ? "drop-shadow(0 0 5px #3fb950cc)"
                                : "drop-shadow(0 0 3px rgba(255,255,255,0.2))",
                            }}
                          >
                            <line
                              x1="2" y1="8" x2="34" y2="8"
                              stroke={g.allDone ? "#52d68a" : "rgba(255,255,255,0.25)"}
                              strokeWidth="2" strokeLinecap="round"
                              className={g.allDone ? "conn-active" : "conn-idle"}
                            />
                            <polygon
                              points="32,2.5 44,8 32,13.5"
                              fill={g.allDone ? "#52d68a" : "rgba(255,255,255,0.25)"}
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}

                {groups.length === 0 && (
                  <div
                    className="flex items-center justify-center w-full min-w-[200px] py-8 text-[11px] font-mono uppercase tracking-[0.2em]"
                    style={{ color: "#6b7785" }}
                  >
                    Select a path to track
                  </div>
                )}
              </div>
            </div>
          </GlassPanel>

          {/* ── 4. Activity Feed ── */}
          <GlassPanel
            className="lg:col-span-4 p-5 flex flex-col animate-fade-in-up delay-250"
            style={{ height: 260 }}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <SectionLabel>
                <Activity size={10} /> Recent Activity
              </SectionLabel>
              {activity.length > 0 && <span className="live-dot" />}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activity.length > 0 ? (
                <ul className="space-y-0">
                  {activity.slice(0, 12).map((a: any, i: number) => (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 py-2.5"
                      style={{ borderBottom: i < 11 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                    >
                      <div
                        className="mt-[5px] w-[5px] h-[5px] rounded-full shrink-0"
                        style={
                          i === 0
                            ? { background: "#3fb950", boxShadow: "0 0 6px rgba(63,185,80,0.5)" }
                            : { background: "rgba(255,255,255,0.1)" }
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-sm leading-snug truncate"
                          style={{ color: i === 0 ? "#dde6ef" : "#9ba8b4" }}
                        >
                          {a.label}
                        </p>
                        <p className="text-[11px] font-mono mt-0.5" style={{ color: "#6b7785" }}>
                          {timeAgo(a.date)}
                        </p>
                      </div>
                      {i === 0 && (
                        <span
                          className="shrink-0 text-[9px] font-mono uppercase tracking-wider mt-0.5"
                          style={{ color: "rgba(63,185,80,0.6)" }}
                        >
                          new
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div
                  className="flex items-center justify-center h-full text-[10px] font-mono uppercase tracking-[0.22em]"
                  style={{ color: "#6b7785" }}
                >
                  Awaiting input
                </div>
              )}
            </div>
          </GlassPanel>

          {/* ── 5. Activity Matrix (heatmap) ── */}
          <GlassPanel className="lg:col-span-12 p-5 sm:p-6 flex flex-col gap-4 animate-fade-in-up delay-300">
            <div className="flex justify-between items-center shrink-0">
              <SectionLabel>
                <Github size={10} /> Activity Matrix
              </SectionLabel>
              <span className="text-[10px] font-mono uppercase tracking-[0.15em]" style={{ color: "#6b7785" }}>
                Annual trace
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar pb-1">
              <div className="min-w-[660px]">
                {hl ? (
                  <div
                    className="h-[88px] rounded-lg animate-pulse"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  />
                ) : (
                  <ActivityCalendar
                    data={hd}
                    theme={{
                      light: ["#0c1319", "#0c3320", "#0f5a36", "#19834d", "#3fb950"],
                      dark:  ["#0c1319", "#0c3320", "#0f5a36", "#19834d", "#3fb950"],
                    }}
                    colorScheme="dark"
                    blockSize={12}
                    blockMargin={4}
                    fontSize={10}
                    labels={{ totalCount: "{{count}} contributions in the last year" }}
                    style={{
                      fontFamily: "JetBrains Mono, ui-monospace, monospace",
                      color: "#6b7785",
                    }}
                  />
                )}
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* ── Inline styles ── */}
      <style>{`
        /* ── Engage button ── */
        .dash-engage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 20px;
          border-radius: 8px;
          border: 1px solid rgba(63,185,80,0.3);
          background: rgba(63,185,80,0.1);
          color: #3fb950;
          font-size: 11px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.15s ease;
        }
        .dash-engage-btn:hover {
          border-color: rgba(63,185,80,0.55);
          background: rgba(63,185,80,0.15);
          box-shadow: 0 0 20px rgba(63,185,80,0.18);
          transform: translateY(-1px);
        }
        .dash-engage-btn:active { transform: translateY(0); }

        /* ── Briefing CTA ── */
        .dash-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid rgba(63,185,80,0.3);
          background: rgba(63,185,80,0.1);
          color: #3fb950;
          font-size: 11px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.18s ease;
        }
        .dash-cta-btn:hover {
          background: rgba(63,185,80,0.18);
          box-shadow: 0 0 16px rgba(63,185,80,0.15);
        }
        .dash-cta-btn--ghost {
          border-color: rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #9ba8b4;
        }
        .dash-cta-btn--ghost:hover {
          background: rgba(255,255,255,0.08);
          color: #dde6ef;
          box-shadow: none;
        }

        /* ── Connector animations ── */
        .conn-active {
          stroke-dasharray: 5 3;
          animation: connector-flow 0.85s linear infinite;
        }
        .conn-idle { opacity: 0.6; }

        /* ── Live pulse (overrides global for dashboard) ── */
        .live-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3fb950;
          animation: live-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
