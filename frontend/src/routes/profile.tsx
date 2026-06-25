import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PageShell } from "@/components/growth-ui";
import {
  User,
  Trophy,
  Star,
  Flame,
  Zap,
  Award,
  TrendingUp,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  Layers,
  CalendarDays,
  Play,
  Activity,
  BarChart2,
} from "lucide-react";
import { ActivityCalendar } from "react-activity-calendar";
import { useAppTutorial } from "@/components/tutorial-overlay";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — GrowthOS" }] }),
  component: ProfilePage,
});

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helpers                                                                    */
/* ─────────────────────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Shared primitives (identical vocabulary to progress.tsx)                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] font-mono text-[#fff] flex items-center gap-1.5">
      {children}
    </p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`progress-card ${className}`}>{children}</div>;
}

function CardHeader({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#0f0f0f] bg-[#080808] shrink-0">
      <div>{left}</div>
      {right && <div>{right}</div>}
    </div>
  );
}

function StatCard({
  children,
  accent,
  accentBg,
  accentBorder,
  center = false,
}: {
  children: React.ReactNode;
  accent: string;
  accentBg: string;
  accentBorder: string;
  center?: boolean;
}) {
  return (
    <div
      className={`stat-card ${center ? "center" : ""}`}
      style={{ background: accentBg, borderColor: accentBorder }}
    >
      <div
        className="pointer-events-none absolute rounded-full blur-3xl"
        style={{
          width: 120,
          height: 120,
          background: accent,
          opacity: 0.05,
          top: center ? "50%" : -32,
          left: center ? "50%" : "auto",
          right: center ? "auto" : -32,
          transform: center ? "translate(-50%, -50%)" : "none",
        }}
      />
      {children}
    </div>
  );
}

function Skel({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-[#111] animate-pulse ${className}`} />;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

function ProfilePage() {
  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const r = await apiFetch("/profile/");
      if (!r.ok) throw 0;
      return r.json();
    },
  });

  const { startTutorial } = useAppTutorial();

  const { data: heatmap = [], isLoading: hLoading } = useQuery({
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

  const xp = profile?.total_xp ?? 0;
  const { level, title: lvl, next } = getLevelInfo(xp);
  const pct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const username = profile?.username || "—";
  const initials = username.slice(0, 2).toUpperCase();
  const lvlTitle = profile?.selected_title || lvl;
  const joined = profile
    ? new Date(profile.date_joined).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";
  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  const quickStats = [
    { icon: <Flame size={14} className="text-[#f59e0b]" />, label: "Streak", value: profile?.streak ?? 0 },
    { icon: <BookOpen size={14} className="text-[#3b82f6]" />, label: "Notes", value: profile?.notes_written ?? 0 },
    { icon: <ClipboardCheck size={14} className="text-[#00FF66]" />, label: "Quizzes", value: profile?.quizzes_passed ?? 0 },
    { icon: <MessageSquare size={14} className="text-[#a855f7]" />, label: "Concepts", value: profile?.feynman_mastered ?? 0 },
    { icon: <Layers size={14} className="text-[#60a5fa]" />, label: "Cards", value: profile?.flashcards_mastered ?? 0 },
  ];

  return (
    <PageShell>
      <div className="p-5 lg:p-6 space-y-3 max-w-screen-xl mx-auto">
        {/* ── Page header ── */}
        <div className="flex flex-wrap items-end justify-between gap-3 pb-1 border-b border-[#0e0e0e]">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-mono text-[#eee] mb-1.5">
              Developer Profile
            </p>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#efefef] leading-none">
              {pLoading ? "…" : username}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-mono text-[#fff] uppercase tracking-[0.2em]">
              <Trophy size={10} className="text-[#a855f7]" />
              {lvlTitle}
            </span>
            <button
              onClick={startTutorial}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] border border-[#141414] bg-[#080808] hover:bg-[#0c0c0c] hover:border-[#1e1e1e] text-xs font-mono uppercase tracking-wider text-[#eee] transition-colors"
            >
              <Play size={11} className="text-[#00FF66]" />
              Replay Tutorial
            </button>
          </div>
        </div>

        {/* ── Top stats row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Identity / Level */}
          <StatCard accent="#00FF66" accentBg="#040d07" accentBorder="#0d1f0e">
            <SectionLabel>
              <Zap size={9} className="text-[#00FF66]" /> Identity
            </SectionLabel>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-[6px] border border-[#0d1f0e] bg-[#00FF66]/10 flex items-center justify-center shrink-0 font-mono text-sm font-bold text-[#00FF66] tracking-wider"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-[#efefef] truncate leading-tight">
                  {pLoading ? "…" : username}
                </div>
                <div className="text-xs font-mono text-[#eee] mt-0.5">
                  Level {level} — {lvl}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-xs font-mono text-[#fff] uppercase tracking-wider">
                  {pct}% to next tier
                </span>
                <span className="text-xs font-mono text-[#00FF66]/70">{xp} XP</span>
              </div>
              <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#00FF66] transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </StatCard>

          {/* Streak */}
          <StatCard accent="#f59e0b" accentBg="#0d0b04" accentBorder="#201505" center>
            <SectionLabel>
              <Flame size={9} className="text-[#f59e0b]" /> Day Streak
            </SectionLabel>
            <div
              className={`text-[37px] font-mono font-semibold tabular-nums mt-3 leading-none ${
                (profile?.streak ?? 0) > 0 ? "text-[#f59e0b]" : "text-[#eee]"
              }`}
            >
              {pLoading ? "—" : (profile?.streak ?? 0)}
            </div>
            <div className="text-xs font-mono text-[#eee] uppercase tracking-[0.2em] mt-1.5">
              Member since {joined}
            </div>
          </StatCard>

          {/* Total XP */}
          <StatCard accent="#a855f7" accentBg="#0d0914" accentBorder="#1e1638">
            <SectionLabel>
              <Star size={9} className="text-[#a855f7]" /> Total XP Earned
            </SectionLabel>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-[29px] font-semibold tracking-tight tabular-nums text-[#a855f7] leading-none">
                {pLoading ? "—" : xp.toLocaleString()}
              </span>
              <span className="text-sm text-[#fff] font-mono">XP</span>
            </div>
            <div className="text-xs font-mono text-[#eee] mt-1">Lifetime contribution points</div>
          </StatCard>
        </div>

        {/* ── Quick stats strip ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <BarChart2 size={9} className="text-[#00FF66]" /> Stats
              </SectionLabel>
            }
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-[#0f0f0f]">
            {quickStats.map((s) => (
              <div key={s.label} className="flex flex-col items-center justify-center p-4 text-center">
                <div className="w-9 h-9 rounded-[6px] bg-[#080808] border border-[#141414] flex items-center justify-center mb-2.5">
                  {s.icon}
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-[#888] mb-1">{s.label}</p>
                <p className="text-lg font-semibold tabular-nums text-[#efefef] leading-none">
                  {pLoading ? "—" : s.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── XP Breakdown + Recent Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* XP Breakdown */}
          <Card>
            <CardHeader
              left={
                <SectionLabel>
                  <TrendingUp size={9} className="text-[#00FF66]" /> XP Breakdown
                </SectionLabel>
              }
            />
            <div className="p-4 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {pLoading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skel key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : profile?.xp_breakdown?.length > 0 ? (
                profile.xp_breakdown.map((item: any, i: number) => {
                  const maxXp = profile.xp_breakdown[0].total;
                  const w = Math.round((item.total / maxXp) * 100);
                  const label = item.action_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  const opacity = i === 0 ? 1 : i === 1 ? 0.65 : i === 2 ? 0.45 : 0.28;
                  return (
                    <div key={item.action_type}>
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-sm font-mono text-[#fff] uppercase tracking-wider">
                          {label}
                        </span>
                        <span className="text-sm font-mono tabular-nums text-[#fff]">
                          {item.total.toLocaleString()} · {item.count}×
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-[#111] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${w}%`, background: `rgba(0,255,102,${opacity})` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center text-sm text-[#fff] font-mono uppercase tracking-widest">
                  No XP data yet
                </div>
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader
              left={
                <SectionLabel>
                  <Activity size={9} className="text-[#00FF66]" /> Recent Activity
                </SectionLabel>
              }
              right={
                activity.length > 0 ? (
                  <span className="text-xs font-mono text-[#00FF66] uppercase tracking-[0.15em]">
                    {activity.length} events
                  </span>
                ) : undefined
              }
            />
            <div className="p-2.5 space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {activity.length > 0 ? (
                activity.slice(0, 10).map((a: any, i: number) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 p-2.5 rounded-[5px] border border-[#111] bg-[#080808]"
                  >
                    <div
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        i === 0 ? "bg-[#00FF66]" : "bg-[#333]"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[13px] leading-snug truncate ${
                          i === 0 ? "text-[#eee]" : "text-[#999]"
                        }`}
                      >
                        {a.label}
                      </p>
                      <p className="text-xs font-mono text-[#888] mt-0.5">{timeAgo(a.date)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-sm text-[#fff] font-mono uppercase tracking-widest">
                  No activity yet
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Achievements ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <Award size={9} className="text-[#00FF66]" /> Achievements
              </SectionLabel>
            }
            right={
              !pLoading && profile?.badges ? (
                <span className="text-xs font-mono text-[#f59e0b] uppercase tracking-[0.15em]">
                  {profile.badges.length} earned
                </span>
              ) : undefined
            }
          />
          <div className="p-2.5">
            {pLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skel key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : profile?.badges?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                {profile.badges.map((b: any) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-3 rounded-[5px] border border-[#141414] bg-[#080808]"
                  >
                    <div className="w-9 h-9 rounded-[6px] bg-[#00FF66]/10 border border-[#0d1f0e] flex items-center justify-center shrink-0">
                      <Award size={16} className="text-[#00FF66]" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-[#eee] truncate">{b.title}</p>
                      <p className="text-xs font-mono text-[#888] line-clamp-1 mt-0.5">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-[#fff] font-mono uppercase tracking-widest">
                No badges yet
              </div>
            )}
          </div>
        </Card>

        {/* ── Activity Heatmap ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <CalendarDays size={9} className="text-[#00FF66]" /> Contribution Heatmap
              </SectionLabel>
            }
            right={
              <span className="text-xs font-mono text-[#fff] uppercase tracking-[0.15em]">
                {pLoading ? "—" : `${xp.toLocaleString()} XP`}
              </span>
            }
          />
          <div className="p-4 overflow-x-auto custom-scrollbar">
            <div className="min-w-[720px]">
              {hLoading ? (
                <Skel className="h-[130px] w-full" />
              ) : (
                <ActivityCalendar
                  data={hd}
                  theme={{
                    light: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
                    dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  }}
                  colorScheme="dark"
                  blockSize={11}
                  blockRadius={2}
                  blockMargin={2}
                  fontSize={11}
                  weekStart={0}
                  showWeekdayLabels
                  showColorLegend={false}
                  showTotalCount={false}
                  labels={{ totalCount: "{{count}} contributions this year" }}
                  style={{
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    color: "#7d8590",
                  }}
                />
              )}
            </div>
          </div>
        </Card>

        {/* ── Completed Roadmaps ── */}
        <Card>
          <CardHeader
            left={
              <SectionLabel>
                <Star size={9} className="text-[#00FF66]" /> Completed Roadmaps
              </SectionLabel>
            }
            right={
              !pLoading && profile?.completed_paths?.length > 0 ? (
                <span className="text-xs font-mono text-[#00FF66] uppercase tracking-[0.15em]">
                  {profile.completed_paths.length} done
                </span>
              ) : undefined
            }
          />
          <div className="p-4">
            {pLoading ? (
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skel key={i} className="h-9 w-32" />
                ))}
              </div>
            ) : profile?.completed_paths?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.completed_paths.map((p: any) => (
                  <Link
                    key={p.id}
                    to="/roadmap"
                    search={{ pathSlug: p.slug }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[5px] border border-[#0d1f0e] bg-[#00FF66]/10 text-[13px] font-medium text-[#00FF66] hover:bg-[#00FF66]/15 transition-colors"
                  >
                    <Award size={13} /> {p.title}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-[#fff] font-mono uppercase tracking-widest">
                No roadmaps completed yet — keep building
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── styles (identical to progress.tsx) ─────────────────────────────── */}
      <style>{`
        .progress-card {
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .progress-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }
        .stat-card {
          border-radius: 6px;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          border: 1px solid;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }
        .stat-card.center {
          align-items: center;
          text-align: center;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>
    </PageShell>
  );
}
