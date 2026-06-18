import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Target, BookOpen, ClipboardCheck,
  Award, CheckCircle2, Circle,
  Activity, Github,
  RotateCcw, Sparkles, Hexagon
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
    <p className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#fff] flex items-center gap-1.5">
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
  const railPct = total > 1 ? Math.round((done / (total - 1)) * 100) : (done === 1 ? 100 : 0);

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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-[5px] border border-[#1e1e1e] bg-[#060606] text-[#e0e0e0] text-[12px] font-mono tracking-wide shadow-xl flex items-center gap-2.5">
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
              <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#eee] leading-none mb-1">GrowthOS</p>
              <h1 className="text-[18px] font-semibold tracking-tight text-[#efefef] leading-none">
                Command Center
              </h1>
            </div>
          </div>

          {ap && (
            <div className="relative">
              <select
                value={selectedPathId || "auto"}
                onChange={(e) => setSelectedPathId(e.target.value === "auto" ? null : e.target.value)}
                className="appearance-none bg-[#080808] border border-[#181818] text-[#eee] text-[10px] font-mono uppercase tracking-[0.18em] rounded-[4px] pl-4 pr-8 py-2 outline-none hover:border-[#222] hover:text-[#fff] transition-all cursor-pointer"
              >
                <option value="auto" className="bg-black font-sans normal-case">Auto-track active</option>
                <optgroup label="Available Paths" className="bg-black text-[#fff] font-sans">
                  {allPaths.map((p: any) => (
                    <option key={p.uniqueId} value={p.uniqueId} className="bg-black text-[#eee] font-sans normal-case text-lg">
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

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-12 gap-3 auto-rows-[minmax(130px,auto)]">

          {/* ── 1. Hero Mission ── 8 cols ── */}
          <Panel accent className="col-span-12 lg:col-span-8 p-7 flex flex-col justify-between min-h-[220px]">
            {cur ? (
              <>
                {/* Green radial bloom — same technique as progress stat cards */}
                <div
                  className="pointer-events-none absolute rounded-full blur-3xl"
                  style={{ width: 400, height: 400, background: "#22c55e", opacity: 0.05, top: -80, right: -80 }}
                />

                <div className="relative z-10">
                  <SectionLabel>
                    <Sparkles size={9} className="text-[#22c55e]" /> Active Protocol
                  </SectionLabel>
                  <p className="mt-3 text-[10px] font-mono text-[#fff] tracking-[0.2em] uppercase">{ap?.title}</p>
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
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[10px] font-mono uppercase tracking-[0.15em] transition-colors ${s.d
                            ? "bg-[#0c1a0f] border border-[#162213] text-[#22c55e]"
                            : "text-[#eee]"
                          }`}
                      >
                        {s.d
                          ? <CheckCircle2 size={10} strokeWidth={2} />
                          : <Circle size={10} strokeWidth={1.5} />
                        }
                        {s.l}
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: String(cur.slug || cur.id) }}
                    className="engage-btn"
                  >
                    Engage Mission <ArrowRight size={13} strokeWidth={2} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <Target size={24} className="text-[#1e1e1e] mb-3" strokeWidth={1.5} />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#fff]">
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
                style={{ width: 100, height: 100, background: "#a855f7", opacity: 0.06, bottom: -28, right: -28 }}
              />
              <SectionLabel>Level</SectionLabel>
              <div>
                <div className="text-[33px] font-mono tabular-nums text-[#efefef] leading-none mt-2">{level}</div>
                <div className="text-[9px] font-mono text-[#a855f7] uppercase tracking-[0.2em] mt-1.5">{lvl}</div>
              </div>
            </Panel>

            {/* Streak */}
            <Panel className="col-span-1 flex flex-col justify-between p-4 relative overflow-hidden">
              <div
                className="pointer-events-none absolute rounded-full blur-2xl"
                style={{ width: 100, height: 100, background: "#f59e0b", opacity: 0.05, bottom: -28, right: -28 }}
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
                <div className={`text-[33px] font-mono tabular-nums leading-none mt-2 ${streak > 0 ? "text-[#efefef]" : "text-[#1e1e1e]"}`}>
                  {streak}
                </div>
                <div className="text-[9px] font-mono text-[#f59e0b] uppercase tracking-[0.2em] mt-1.5">days active</div>
              </div>
            </Panel>

            {/* XP bar — spans both cols */}
            <Panel className="col-span-2 flex flex-col justify-center p-4 relative">
              <div className="flex justify-between items-baseline mb-2">
                <SectionLabel>Experience</SectionLabel>
                <span className="text-[9px] font-mono text-[#a855f7]/70">{next - xp} XP to next</span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-3">
                <span className="text-[19px] font-mono tabular-nums text-[#efefef] leading-none">{xp}</span>
                <span className="text-[10px] font-mono text-[#eee]">/ {next}</span>
              </div>
              <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%`, background: "#a855f7", boxShadow: "0 0 8px #a855f740" }}
                />
              </div>
            </Panel>
          </div>

          {/* ── 3. Subway Map / Path Trajectory ── 8 cols ── */}
          <Panel className="col-span-12 lg:col-span-8 p-5 flex flex-col" style={{ height: 280 }}>
            <div className="flex justify-between items-center mb-5 shrink-0">
              <SectionLabel><Award size={9} /> Path Trajectory</SectionLabel>
              <span className="text-[9px] font-mono text-[#eee] uppercase tracking-[0.15em]">{cpct}% completed</span>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
              <div className="flex items-center h-full min-w-max px-4 relative">
                {/* Rail background */}
                <div className="absolute left-8 right-8 h-px bg-[#141414] top-1/2 -translate-y-1/2" />
                {/* Rail progress */}
                <div
                  className="absolute left-8 h-px bg-[#22c55e] top-1/2 -translate-y-1/2 transition-all duration-1000"
                  style={{
                    width: `calc((100% - 4rem) * ${railPct / 100})`,
                    boxShadow: railPct > 0 ? "0 0 8px #22c55e50" : "none",
                  }}
                />

                {/* Nodes */}
                {topics.map((t: any, i: number) => {
                  const d = t.user_progress === "completed";
                  const a = t.id === cur?.id;
                  return (
                    <div key={t.id} className="relative z-10 flex flex-col items-center justify-center w-28 group">
                      {/* Top label — node index */}
                      <div className={`absolute bottom-full mb-3 text-center transition-all duration-200 ${a ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}>
                        <div className="text-[9px] font-mono text-[#eee] tracking-[0.15em] uppercase">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      </div>

                      {/* Node circle */}
                      <Link
                        to="/topic/$topicId"
                        params={{ topicId: String(t.slug || t.id) }}
                        className={`node-circle ${d ? "node-done" : a ? "node-active" : "node-idle"}`}
                      >
                        {a && <div className="w-1 h-1 bg-black rounded-full animate-pulse" />}
                      </Link>

                      {/* Bottom label — topic title */}
                      <div className="absolute top-full mt-3 text-center w-28 px-2">
                        <div className={`text-[11px] truncate transition-colors ${d ? "text-[#eee]" : a ? "text-[#fff] font-medium" : "text-[#fff]"
                          }`}>
                          {t.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          {/* ── 4. Activity Feed ── 4 cols ── */}
          <Panel className="col-span-12 lg:col-span-4 p-5 flex flex-col" style={{ height: 280 }}>
            <div className="flex justify-between items-center mb-4 shrink-0">
              <SectionLabel><Activity size={9} /> Recent Activity</SectionLabel>
              {activity.length > 0 && (
                <span className="live-dot" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activity.length > 0 ? (
                <ul className="divide-y divide-[#0d0d0d]">
                  {activity.slice(0, 12).map((a: any, i: number) => (
                    <li key={a.id} className="flex items-start gap-3 py-2.5">
                      <div className={`mt-[5px] w-[5px] h-[5px] rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e55]" : "bg-[#1a1a1a]"
                        }`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[12px] leading-snug truncate ${i === 0 ? "text-[#c8c8c8]" : "text-[#eee]"
                          }`}>
                          {a.label}
                        </p>
                        <p className="text-[10px] font-mono text-[#eee] mt-0.5">{timeAgo(a.date)}</p>
                      </div>
                      {i === 0 && (
                        <span className="shrink-0 text-[8px] font-mono text-[#22c55e]/60 uppercase tracking-wider mt-0.5">new</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-[10px] font-mono text-[#fff] uppercase tracking-[0.2em]">
                  Awaiting input
                </div>
              )}
            </div>
          </Panel>

          {/* ── 5. Heatmap ── full width ── */}
          <Panel className="col-span-12 p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center shrink-0">
              <SectionLabel><Github size={9} /> Activity Matrix</SectionLabel>
              <span className="text-[9px] font-mono text-[#fff] uppercase tracking-[0.15em]">Annual trace</span>
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
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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