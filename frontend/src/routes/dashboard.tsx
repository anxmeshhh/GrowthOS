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

/* ── shared primitives ───────────────────────────────────────────────────── */

/** Consistent card shell — matches profile-card / progress-card */
function Panel({
  children,
  className = "",
  accent = false,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`dash-panel ${accent ? "dash-panel--accent" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] font-mono text-[#fff] flex items-center gap-1.5">
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
        date: d.date,
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
    ap =
      fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "in_progress")) ||
      fallback.find((p: any) => p.topics?.some((t: any) => t.user_progress === "completed")) ||
      fallback.find((p: any) => p.is_bookmarked) ||
      fallback[0] ||
      null;
  }

  const rawTopics: any[] = ap?.topics || [];

  // Build structured groups: [ { milestone, topics[], allDone } ]
  const { groups, studyTopics } = useMemo(() => {
    const sorted = [...rawTopics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const grps: { milestone: any | null; topics: any[]; allDone: boolean }[] = [];
    let currentGroup: { milestone: any | null; topics: any[] } = { milestone: null, topics: [] };

    sorted.forEach((t) => {
      if (t.node_kind === "milestone") {
        // Push the previous group if it has topics
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
    // Push the last group
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
    topics.find((t: any) => t.user_progress !== "completed") ||
    topics[0] ||
    null;
  const done = topics.filter((t: any) => t.user_progress === "completed").length;
  const total = topics.length;
  const cpct = total > 0 ? Math.round((done / total) * 100) : 0;
  const railPct = total > 1 ? Math.round((done / (total - 1)) * 100) : done === 1 ? 100 : 0;

  const started = cur?.user_progress === "in_progress" || cur?.user_progress === "completed";
  const proof = cur?.has_submitted_work === true || cur?.user_progress === "completed";
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
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[5px] border border-[#1e1e1e] bg-[#060606] text-[#e0e0e0] text-sm font-mono tracking-wide shadow-xl flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] shadow-[0_0_6px_#22c55e]" />
          {toast}
        </div>
      )}

      <div className="p-5 lg:p-6 max-w-[1400px] mx-auto">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[#0e0e0e]">
          <div className="flex items-center gap-2.5">
            <Hexagon className="w-4 h-4 text-[#22c55e]" strokeWidth={1.5} />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-mono text-[#eee] leading-none mb-1">
                GrowthOS
              </p>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#efefef] leading-none">
                Command Center
              </h1>
            </div>
          </div>

          {ap && (
            <div className="relative">
              <select
                value={selectedPathId || "auto"}
                onChange={(e) =>
                  setSelectedPathId(e.target.value === "auto" ? null : e.target.value)
                }
                className="appearance-none bg-[#080808] border border-[#181818] text-[#eee] text-xs font-mono uppercase tracking-[0.18em] rounded-[4px] pl-4 pr-8 py-2 outline-none hover:border-[#222] hover:text-[#fff] transition-all cursor-pointer"
              >
                <option value="auto" className="bg-black font-sans normal-case">
                  Auto-track active
                </option>
                <optgroup label="Available Paths" className="bg-black text-[#fff] font-sans">
                  {allPaths.map((p: any) => (
                    <option
                      key={p.uniqueId}
                      value={p.uniqueId}
                      className="bg-black text-[#eee] font-sans normal-case text-lg"
                    >
                      {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
              {/* Custom chevron */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#22c55e]/40" />
            </div>
          )}
        </div>

        {/* ── Today's Briefing ── */}
        {briefing && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Focus Suggestion */}
            <Panel className="p-5 flex flex-col justify-between min-h-[140px] md:col-span-2 relative overflow-hidden bg-gradient-to-br from-[#0c1a0f] to-[#050505] border-[#162213]">
              <div
                className="pointer-events-none absolute rounded-full blur-3xl"
                style={{
                  width: 300,
                  height: 300,
                  background: "#22c55e",
                  opacity: 0.05,
                  top: -100,
                  right: -50,
                }}
              />
              <div className="relative z-10">
                <SectionLabel>
                  <Brain size={12} className="text-[#22c55e]" /> Today's Briefing
                </SectionLabel>
                <div className="mt-4">
                  {briefing.fading_topics?.length > 0 ? (
                    <div className="text-[17px] text-[#eee] font-medium leading-snug">
                      Knowledge is fading. You have <span className="text-[#ef4444]">{briefing.fading_topics.length}</span> topics decaying. Review them to restore your mastery score.
                    </div>
                  ) : briefing.due_cards > 0 ? (
                    <div className="text-[17px] text-[#eee] font-medium leading-snug">
                      You have <span className="text-[#22c55e]">{briefing.due_cards}</span> flashcards due across {briefing.due_topics?.length || 0} topics. Clear your review debt to maintain retention.
                    </div>
                  ) : briefing.last_session_topic ? (
                    <div className="text-[17px] text-[#eee] font-medium leading-snug">
                      Resume your mission on <span className="text-[#fff] font-bold">"{briefing.last_session_topic.title}"</span>. You're making good progress.
                    </div>
                  ) : briefing.next_topic ? (
                    <div className="text-[17px] text-[#eee] font-medium leading-snug">
                      Your next objective is <span className="text-[#fff] font-bold">"{briefing.next_topic.title}"</span>. Ready to begin?
                    </div>
                  ) : (
                    <div className="text-[17px] text-[#eee] font-medium leading-snug">
                      All clear! No due reviews. Start a new topic when you are ready.
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-3 relative z-10">
                {briefing.due_cards > 0 && (
                  <Link to="/review" className="engage-btn text-xs px-4 py-1.5">
                    Start Review Session <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                )}
                {briefing.last_session_topic && briefing.due_cards === 0 && (
                  <Link to="/topic/$topicId" params={{ topicId: String(briefing.last_session_topic.id) }} className="engage-btn text-xs px-4 py-1.5 bg-[#0e0e0e] border-[#1e1e1e] text-[#eee]">
                    Resume Topic <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                )}
              </div>
            </Panel>

            {/* Review Debt Indicator */}
            <Panel className="p-5 flex flex-col justify-center items-center text-center relative overflow-hidden bg-gradient-to-b from-[#1a0a0a] to-[#050505] border-[#2a1111]">
              <div
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{
                  width: 150,
                  height: 150,
                  background: "#ef4444",
                  opacity: 0.08,
                  bottom: -50,
                  right: -50,
                }}
              />
              <Clock size={24} className={briefing.due_cards > 0 ? "text-[#ef4444] mb-3" : "text-[#1e1e1e] mb-3"} />
              <div className="text-3xl font-mono tabular-nums leading-none text-[#efefef]">
                {briefing.due_cards}
              </div>
              <div className="text-xs font-mono text-[#ef4444] uppercase tracking-[0.1em] mt-2">
                Cards Due Today
              </div>
              {briefing.due_topics?.length > 0 && (
                <div className="text-[10px] text-[#777] uppercase tracking-widest mt-3">
                  Across {briefing.due_topics.length} topics
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-12 gap-3 auto-rows-[minmax(130px,auto)]">
          {/* ── 1. Hero Mission ── 8 cols ── */}
          <Panel
            accent
            className="col-span-12 lg:col-span-8 p-7 flex flex-col justify-between min-h-[220px]"
          >
            {cur ? (
              <>
                {/* Green radial bloom — same technique as progress stat cards */}
                <div
                  className="pointer-events-none absolute rounded-full blur-3xl"
                  style={{
                    width: 400,
                    height: 400,
                    background: "#22c55e",
                    opacity: 0.05,
                    top: -80,
                    right: -80,
                  }}
                />

                <div className="relative z-10">
                  <SectionLabel>
                    <Sparkles size={9} className="text-[#22c55e]" /> Active Protocol
                  </SectionLabel>
                  <p className="mt-3 text-xs font-mono text-[#fff] tracking-[0.2em] uppercase">
                    {ap?.title}
                  </p>
                  <h2 className="mt-1 text-[23px] md:text-[27px] font-semibold text-[#efefef] tracking-tight leading-tight max-w-2xl">
                    {cur.title}
                  </h2>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 relative z-10">
                  {/* Step pills */}
                  <div className="flex items-center gap-1.5 p-1 border border-[#141414] rounded-[5px] bg-[#080808]">
                    {steps.map((s, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-mono uppercase tracking-[0.15em] transition-colors ${
                          s.d
                            ? "bg-[#0c1a0f] border border-[#162213] text-[#22c55e]"
                            : "text-[#eee]"
                        }`}
                      >
                        {s.d ? (
                          <CheckCircle2 size={10} strokeWidth={2} />
                        ) : (
                          <Circle size={10} strokeWidth={1.5} />
                        )}
                        {s.l}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(cur.id) }}
                    className="engage-btn"
                  >
                    Engage Mission <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Target size={24} className="text-[#1e1e1e] mb-3" strokeWidth={1.5} />
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#fff]">
                  No active protocol detected
                </p>
              </div>
            )}
          </Panel>

          {/* ── 2. Metrics stack ── 4 cols ── */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-3 grid-rows-2">
            {/* Level */}
            <Panel className="col-span-1 flex flex-col justify-between p-4 relative overflow-hidden">
              <div
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{
                  width: 100,
                  height: 100,
                  background: "#a855f7",
                  opacity: 0.06,
                  bottom: -28,
                  right: -28,
                }}
              />
              <SectionLabel>Level</SectionLabel>
              <div>
                <div className="text-[33px] font-mono tabular-nums text-[#efefef] leading-none mt-2">
                  {level}
                </div>
                <div className="text-xs font-mono text-[#a855f7] uppercase tracking-[0.2em] mt-1.5">
                  {lvl}
                </div>
              </div>
            </Panel>

            {/* Streak */}
            <Panel className="col-span-1 flex flex-col justify-between p-4 relative overflow-hidden">
              <div
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{
                  width: 100,
                  height: 100,
                  background: "#f59e0b",
                  opacity: 0.05,
                  bottom: -28,
                  right: -28,
                }}
              />
              <div className="flex justify-between items-start">
                <SectionLabel>Streak</SectionLabel>
                {profile?.can_revive_streak && (
                  <button
                    onClick={() => revive.mutate()}
                    disabled={revive.isPending}
                    className="text-[#f59e0b]/60 hover:text-[#f59e0b] p-1 rounded-[3px] hover:bg-[#f59e0b]/10 transition-colors"
                    title="Revive Streak"
                  >
                    <RotateCcw size={10} />
                  </button>
                )}
              </div>
              <div>
                <div
                  className={`text-[33px] font-mono tabular-nums leading-none mt-2 ${streak > 0 ? "text-[#efefef]" : "text-[#1e1e1e]"}`}
                >
                  {streak}
                </div>
                <div className="text-xs font-mono text-[#f59e0b] uppercase tracking-[0.2em] mt-1.5">
                  days active
                </div>
              </div>
            </Panel>

            {/* XP bar — spans both cols */}
            <Panel className="col-span-2 flex flex-col justify-center p-4 relative">
              <div className="flex justify-between items-baseline mb-2">
                <SectionLabel>Experience</SectionLabel>
                <span className="text-xs font-mono text-[#a855f7]/70">{next - xp} XP to next</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-[19px] font-mono tabular-nums text-[#efefef] leading-none">
                  {xp}
                </span>
                <span className="text-xs font-mono text-[#eee]">/ {next}</span>
              </div>
              <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpPct}%`,
                    background: "#a855f7",
                    boxShadow: "0 0 8px #a855f740",
                  }}
                />
              </div>
            </Panel>
          </div>

          {/* ── 3. Path Trajectory ── 8 cols ── */}
          <Panel className="col-span-12 lg:col-span-8 p-5 flex flex-col" style={{ minHeight: 280 }}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <SectionLabel>
                <Award size={9} /> Path Trajectory
              </SectionLabel>
              <span className="text-xs font-mono text-[#eee] uppercase tracking-[0.15em]">
                {cpct}% completed
              </span>
            </div>

            {/* Overall progress bar */}
            <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden mb-4 shrink-0">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${cpct}%`,
                  background: "#22c55e",
                  boxShadow: cpct > 0 ? "0 0 8px #22c55e40" : "none",
                }}
              />
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <div className="flex items-stretch gap-4 min-w-max h-full py-1">
                {groups.map((g, gi) => {
                  const milestoneLabel = g.milestone?.title || `Section ${gi + 1}`;
                  const groupDone = g.topics.filter(
                    (t: any) => t.user_progress === "completed",
                  ).length;
                  const groupTotal = g.topics.length;
                  const groupPct = groupTotal > 0 ? Math.round((groupDone / groupTotal) * 100) : 0;

                  return (
                    <div key={g.milestone?.id || `grp-${gi}`} className="flex items-stretch gap-4">
                      {/* Group box */}
                      <div
                        className="flex flex-col rounded-[6px] overflow-hidden shrink-0 transition-all duration-300"
                        style={{
                          border: `1px solid ${g.allDone ? "#22c55e90" : "#3a3a3a"}`,
                          background: g.allDone ? "#051505" : "#0c0c0c",
                          minWidth: Math.max(160, groupTotal * 44 + 32),
                          maxWidth: 360,
                          boxShadow: g.allDone ? "0 0 18px #22c55e25" : "0 0 10px #00000060",
                        }}
                      >
                        {/* Milestone header */}
                        <div
                          className="flex items-center gap-2 px-3 py-2 shrink-0"
                          style={{
                            borderBottom: `1px solid ${g.allDone ? "#22c55e60" : "#2a2a2a"}`,
                            background: g.allDone ? "#072007" : "#121212",
                          }}
                        >
                          {g.allDone ? (
                            <CheckCircle2
                              size={12}
                              strokeWidth={2.5}
                              className="text-[#22c55e] shrink-0"
                            />
                          ) : (
                            <Circle size={12} strokeWidth={2} className="text-[#60a5fa] shrink-0" />
                          )}
                          <span
                            className="text-xs font-mono font-semibold uppercase tracking-[0.15em] truncate"
                            style={{ color: g.allDone ? "#4ade80" : "#93c5fd" }}
                          >
                            {milestoneLabel}
                          </span>
                          <span
                            className="ml-auto text-xs font-mono shrink-0 px-1.5 py-0.5 rounded-sm"
                            style={{
                              color: g.allDone ? "#22c55e" : "#888",
                              background: g.allDone ? "#22c55e15" : "#1a1a1a",
                            }}
                          >
                            {groupDone}/{groupTotal}
                          </span>
                        </div>

                        {/* Subtopics list */}
                        <div
                          className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5"
                          style={{ scrollbarWidth: "thin", scrollbarColor: "#1a1a1a #060606" }}
                        >
                          {g.topics.map((t: any, ti: number) => {
                            const d = t.user_progress === "completed";
                            const a = t.id === cur?.id;
                            const ip = t.user_progress === "in_progress";
                            return (
                              <Link
                                key={t.id}
                                to="/topic/$topicId"
                                params={{ topicId: String(t.id) }}
                                className="flex items-center gap-2 px-2 py-[5px] rounded-[3px] no-underline transition-all duration-150 group/item"
                                style={{
                                  background: a ? "#0c1a0f" : "transparent",
                                  border: a ? "1px solid #22c55e35" : "1px solid transparent",
                                }}
                                onMouseEnter={(e) => {
                                  if (!a)
                                    (e.currentTarget as HTMLElement).style.background = "#0a0a0a";
                                }}
                                onMouseLeave={(e) => {
                                  if (!a)
                                    (e.currentTarget as HTMLElement).style.background =
                                      "transparent";
                                }}
                              >
                                <span className="shrink-0 w-3 flex items-center justify-center">
                                  {d ? (
                                    <CheckCircle2
                                      size={11}
                                      strokeWidth={2.5}
                                      className="text-[#22c55e]"
                                    />
                                  ) : ip ? (
                                    <span className="w-[8px] h-[8px] rounded-full bg-[#f59e0b] animate-pulse" />
                                  ) : (
                                    <Circle size={10} strokeWidth={1.5} className="text-[#555]" />
                                  )}
                                </span>
                                <span
                                  className="text-sm font-mono leading-tight truncate flex-1"
                                  style={{
                                    color: d ? "#4ade80" : a ? "#ffffff" : "#b5b5b5",
                                  }}
                                >
                                  {t.title}
                                </span>
                                {a && (
                                  <span className="text-[7px] font-mono uppercase tracking-wider text-[#22c55e] shrink-0 opacity-90">
                                    active
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>

                        {/* Progress micro-bar at bottom */}
                        <div className="h-[2px] w-full shrink-0" style={{ background: "#161616" }}>
                          <div
                            className="h-full transition-all duration-700"
                            style={{
                              width: `${groupPct}%`,
                              background: g.allDone ? "#22c55e" : "#5b8def",
                              boxShadow:
                                groupPct > 0
                                  ? `0 0 8px ${g.allDone ? "#22c55e70" : "#5b8def70"}`
                                  : "none",
                            }}
                          />
                        </div>
                      </div>

                      {/* Connector arrow between groups — brighter, glowing, animated when active */}
                      {gi < groups.length - 1 && (
                        <div className="flex items-center shrink-0 connector-wrap">
                          <svg
                            width="44"
                            height="16"
                            viewBox="0 0 44 16"
                            className="connector-arrow"
                            style={{
                              filter: g.allDone
                                ? "drop-shadow(0 0 6px #22c55ecc) drop-shadow(0 0 12px #22c55e60)"
                                : "drop-shadow(0 0 3px #ffffff30)",
                            }}
                          >
                            <line
                              x1="2"
                              y1="8"
                              x2="34"
                              y2="8"
                              stroke={g.allDone ? "#4ade80" : "#9ca3af"}
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className={
                                g.allDone ? "connector-line-active" : "connector-line-idle"
                              }
                            />
                            <polygon
                              points="32,2.5 44,8 32,13.5"
                              fill={g.allDone ? "#4ade80" : "#9ca3af"}
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* ── 4. Activity Feed ── 4 cols ── */}
          <Panel className="col-span-12 lg:col-span-4 p-5 flex flex-col" style={{ height: 280 }}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <SectionLabel>
                <Activity size={9} /> Recent Activity
              </SectionLabel>
              {activity.length > 0 && <span className="live-dot" />}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activity.length > 0 ? (
                <ul className="divide-y divide-[#0d0d0d]">
                  {activity.slice(0, 12).map((a: any, i: number) => (
                    <li key={a.id} className="flex items-start gap-3 py-2.5">
                      <div
                        className={`mt-[5px] w-[5px] h-[5px] rounded-full shrink-0 ${
                          i === 0 ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e55]" : "bg-[#1a1a1a]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug truncate ${
                            i === 0 ? "text-[#c8c8c8]" : "text-[#eee]"
                          }`}
                        >
                          {a.label}
                        </p>
                        <p className="text-xs font-mono text-[#eee] mt-0.5">{timeAgo(a.date)}</p>
                      </div>
                      {i === 0 && (
                        <span className="shrink-0 text-xs font-mono text-[#22c55e]/60 uppercase tracking-wider mt-0.5">
                          new
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-xs font-mono text-[#fff] uppercase tracking-[0.2em]">
                  Awaiting input
                </div>
              )}
            </div>
          </Panel>

          {/* ── 5. Heatmap ── full width ── */}
          <Panel className="col-span-12 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center shrink-0">
              <SectionLabel>
                <Github size={9} /> Activity Matrix
              </SectionLabel>
              <span className="text-xs font-mono text-[#fff] uppercase tracking-[0.15em]">
                Annual trace
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[680px]">
                {hl ? (
                  <div className="h-[90px] bg-[#0a0a0a] rounded-[3px] animate-pulse" />
                ) : (
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
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      color: "#333",
                    }}
                  />
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* ── styles ────────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Panel shell ── matches profile-card / progress-card ── */
        .dash-panel {
          position: relative;
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          overflow: hidden;
        }

        /* Hairline top accent — same gradient as other pages */
        .dash-panel::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* Hero panel gets a slightly brighter top line */
        .dash-panel--accent::before {
          background: linear-gradient(90deg, transparent 0%, #22c55e18 40%, #22c55e18 60%, transparent 100%);
        }

        /* ── CTA button ── */
        .engage-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 4px;
          border: 1px solid #22c55e30;
          background: #0c1a0f;
          color: #22c55e;
          font-size: 11px;
          font-family: ui-monospace, monospace;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          text-decoration: none;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }

        .engage-btn:hover {
          border-color: #22c55e60;
          background: #0f2016;
          box-shadow: 0 0 16px #22c55e18;
        }

        /* ── Subway rail nodes ── */
        .node-circle {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          outline: 3px solid #060606;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .node-done {
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34,197,94,0.35);
        }

        .node-active {
          background: #efefef;
          box-shadow: 0 0 14px rgba(239,239,239,0.5);
          transform: scale(1.25);
        }

        .node-idle {
          background: #161616;
          border: 1px solid #222;
        }

        .node-idle:hover {
          background: #1e1e1e;
        }

        /* ── Connector arrows between trajectory groups ── brighter + animated ── */
        .connector-wrap {
          position: relative;
        }

        .connector-arrow {
          display: block;
        }

        @keyframes connector-flow {
          0%   { stroke-dashoffset: 12; }
          100% { stroke-dashoffset: 0; }
        }

        .connector-line-active {
          stroke-dasharray: 5 3;
          animation: connector-flow 0.9s linear infinite;
        }

        .connector-line-idle {
          opacity: 0.85;
        }

        /* ── Live dot ── same as profile / progress ── */
        .live-dot {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e80;
        }

        /* ── Scrollbar ── 3px, matches progress page ── */
        .custom-scrollbar::-webkit-scrollbar       { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>
    </PageShell>
  );
}
