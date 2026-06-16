import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight, Flame, Target, BookOpen, ClipboardCheck,
  Github, Zap, Award, TrendingUp, CheckCircle2, Circle,
  Activity, BarChart3, ChevronRight, Layers, Loader2
} from "lucide-react";
import { PageShell, Progress, Btn } from "@/components/growth-ui";
import { useGrowth, computeStreak } from "@/lib/growth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GrowthOS" },
      { name: "description", content: "Today's mission, streak, and proof checklist." },
    ],
  }),
  component: DashboardPage,
});

// ── Level system ──────────────────────────────────────────────────────────────
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

// ── Heatmap ───────────────────────────────────────────────────────────────────
function ContributionGraph({ data, isLoading }: { data: any[]; isLoading: boolean }) {
  const today = new Date().toISOString().split("T")[0];
  const displayData = data.length > 0 ? data : [{ date: today, count: 0, level: 0 }];
  return (
    <div className="overflow-x-auto w-full">
      {isLoading ? (
        <div className="h-28 flex items-center justify-center text-[#444] text-xs font-mono tracking-widest uppercase">
          Loading…
        </div>
      ) : (
        <ActivityCalendar
          data={displayData}
          theme={{
            light: ["#111111", "#0f2318", "#155e36", "#16a34a", "#22c55e"],
            dark:  ["#111111", "#0f2318", "#155e36", "#16a34a", "#22c55e"],
          }}
          colorScheme="dark"
          labels={{ totalCount: "{{count}} sessions this year" }}
          style={{ fontSize: "11px" }}
        />
      )}
    </div>
  );
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Thin horizontal rule ──────────────────────────────────────────────────────
function Rule() {
  return <div className="h-px bg-[#1c1c1c] w-full" />;
}

// ── Pill badge ────────────────────────────────────────────────────────────────
function Pill({
  children,
  color = "green",
}: {
  children: React.ReactNode;
  color?: "green" | "blue" | "amber" | "red" | "neutral";
}) {
  const map = {
    green:   "bg-[#0d2015] text-[#22c55e] border-[#1a3d28]",
    blue:    "bg-[#0d1929] text-[#60a5fa] border-[#1a3060]",
    amber:   "bg-[#1e1505] text-[#f59e0b] border-[#3a2a0a]",
    red:     "bg-[#1e0d0d] text-[#ef4444] border-[#3a1a1a]",
    neutral: "bg-[#141414] text-[#888] border-[#242424]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider uppercase border ${map[color]}`}
    >
      {children}
    </span>
  );
}

// ── Stat block ────────────────────────────────────────────────────────────────
function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 py-4 px-5">
      <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#4a4a4a]">{label}</div>
      <div className={`text-2xl font-semibold tabular-nums tracking-tight ${accent ? "text-[#22c55e]" : "text-[#e8e8e8]"}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#555]">{sub}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { state } = useGrowth();
  const queryClient = useQueryClient();

  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: heatmapData = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const res = await apiFetch("/heatmap/");
      if (!res.ok) return [];
      const json = await res.json();
      return json.map((d: any) => {
        let level = 0;
        if (d.count > 0 && d.count <= 2) level = 1;
        else if (d.count > 2 && d.count <= 4) level = 2;
        else if (d.count > 4 && d.count <= 6) level = 3;
        else if (d.count > 6) level = 4;
        return { date: d.date, count: d.count, level };
      });
    },
  });

  const { data: activityData = [], isLoading: activityLoading } = useQuery({
    queryKey: ["recent_activity"],
    queryFn: async () => {
      const res = await apiFetch("/activity/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => {
      const res = await apiFetch("/profile/");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const reviveStreakMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/activity/revive-streak/", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to revive streak");
      }
      return res.json();
    },
    onSuccess: () => {
      alert("🔥 Streak Revived! (-10 XP)");
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      queryClient.invalidateQueries({ queryKey: ['heatmap'] });
    },
    onError: (err: Error) => {
      alert(err.message);
    }
  });

  const totalXP = profile ? profile.total_xp : heatmapData.reduce((s: number, d: any) => s + d.count, 0);
  const { level, title: lvlTitle, next } = getLevelInfo(totalXP);
  const xpPct = Math.min(100, Math.round((totalXP / next) * 100));


  const activePath = paths.find((p: any) => p.is_bookmarked) || paths[0] || null;
  const topics = activePath?.topics || [];
  const nextTopic = topics.find((t: any) => t.user_progress !== "completed") || topics[0] || null;
  const completedCount = topics.filter((t: any) => t.user_progress === "completed").length;
  const completion = {
    done: completedCount,
    total: topics.length,
    pct: topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0,
  };
  const streak = profile ? profile.streak : computeStreak(state.activeDays);

  const isStarted = nextTopic?.user_progress === "in_progress";
  const steps = [
    { label: "Study the core concepts",          done: isStarted, icon: BookOpen },
    { label: "Prepare a proof of work",           done: false,     icon: ClipboardCheck },
    { label: "Submit for AI verification",        done: false,     icon: Target },
  ];

  if (pathsLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-16 text-[#444] text-xs font-mono tracking-widest uppercase">
          Loading…
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.22em] font-mono text-[#3a3a3a] mb-1">GrowthOS</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-[#f0f0f0]">Dashboard</h1>
        {activePath && (
          <p className="text-sm text-[#555] mt-0.5">
            Active path:{" "}
            <span className="text-[#888]">{activePath.title}</span>
          </p>
        )}
      </div>

      {/* ── Three-col stat bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#1c1c1c] rounded-xl overflow-hidden mb-6 divide-x divide-[#1c1c1c]">
        <Stat
          label="Total XP"
          value={totalXP}
          sub={`Level ${level} · ${lvlTitle}`}
          accent
        />
        <Stat
          label="Streak"
          value={
            <span className="flex items-center gap-2">
              {streak}
              <span className="text-sm font-normal text-[#555]">days</span>
            </span>
          }
          sub={
            profile?.can_revive_streak ? (
              <div className="mt-1">
                <Btn 
                  variant="outline" 
                  size="sm" 
                  onClick={() => reviveStreakMutation.mutate()}
                  disabled={reviveStreakMutation.isPending}
                  className="h-6 text-[10px] px-2 text-[#f59e0b] border-[#f59e0b]/30 hover:bg-[#f59e0b]/10"
                >
                  {reviveStreakMutation.isPending ? "Reviving..." : "Revive Streak (-10 XP)"}
                </Btn>
              </div>
            ) : streak > 0 ? "Keep going" : "Start today"
          }
        />
        <Stat
          label="Topics done"
          value={`${completion.done} / ${completion.total}`}
          sub={
            <div className="mt-1">
              <Progress value={completion.pct} />
            </div>
          }
        />
        <Stat
          label="Path progress"
          value={`${completion.pct}%`}
          sub={activePath?.title ?? "—"}
        />
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

        {/* LEFT — Mission card + level bar */}
        <div className="xl:col-span-2 flex flex-col gap-5">

          {/* Mission card */}
          {nextTopic ? (
            <div className="border border-[#1c1c1c] rounded-xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#0d0d0d] border-b border-[#1c1c1c]">
                <div className="flex items-center gap-2">
                  <Zap size={13} className="text-[#22c55e]" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-[#444]">
                    Priority Mission
                  </span>
                </div>
                <Pill color="green">Active</Pill>
              </div>

              {/* Card body */}
              <div className="px-5 py-5 bg-[#080808]">
                <div className="mb-1">
                  <Pill color="neutral">{activePath?.title}</Pill>
                </div>
                <h2 className="text-[22px] font-semibold tracking-tight text-[#f0f0f0] mt-2 mb-2">
                  {nextTopic.title}
                </h2>
                <p className="text-sm text-[#555] leading-relaxed max-w-xl mb-5">
                  {nextTopic.summary ||
                    "Complete the study session and submit your proof of work to the AI for verification to earn XP and extend your streak."}
                </p>

                {/* Steps */}
                <div className="space-y-2 mb-5">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-colors ${
                        step.done
                          ? "border-[#1a3028] bg-[#0a1a12]"
                          : "border-[#181818] bg-[#0d0d0d]"
                      }`}
                    >
                      {step.done ? (
                        <CheckCircle2 size={15} className="text-[#22c55e] shrink-0" />
                      ) : (
                        <Circle size={15} className="text-[#2a2a2a] shrink-0" />
                      )}
                      <span
                        className={`text-sm flex-1 ${
                          step.done ? "text-[#c0c0c0]" : "text-[#666]"
                        }`}
                      >
                        {step.label}
                      </span>
                      <step.icon
                        size={13}
                        className={step.done ? "text-[#22c55e]" : "text-[#333]"}
                      />
                    </div>
                  ))}
                </div>

                <Link
                  to="/topic/$topicId"
                  params={{ topicId: String(nextTopic.slug || nextTopic.id) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22c55e] text-[#030f07] text-sm font-semibold tracking-tight hover:bg-[#16a34a] transition-colors"
                >
                  Open Workspace
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="border border-[#1c1c1c] rounded-xl px-6 py-10 text-center bg-[#080808]">
              <Award size={36} className="text-[#22c55e] mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-[#e0e0e0] mb-1">Path complete</h3>
              <p className="text-sm text-[#555]">
                You've mastered all topics in <span className="text-[#888]">{activePath?.title}</span>.
              </p>
            </div>
          )}

          {/* XP level strip */}
          <div className="border border-[#1c1c1c] rounded-xl px-5 py-4 bg-[#080808] flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Level indicator */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-10 h-10 rounded-lg bg-[#0d2015] border border-[#1a3028] flex items-center justify-center">
                <span className="text-sm font-mono font-bold text-[#22c55e]">{level}</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-[#e0e0e0]">{lvlTitle}</div>
                <div className="text-[10px] font-mono text-[#444] uppercase tracking-wider">
                  {totalXP} XP
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-mono text-[#444] mb-2 uppercase tracking-wider">
                <span>Progress to next level</span>
                <span>{xpPct}%</span>
              </div>
              {/* Custom progress track */}
              <div className="h-1.5 bg-[#151515] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#22c55e] rounded-full transition-all duration-700"
                  style={{ width: `${xpPct}%` }}
                />
              </div>
            </div>

            <div className="text-[10px] font-mono text-[#333] hidden sm:block tracking-wider">
              {next - totalXP} XP to go
            </div>
          </div>

          {/* Topic list — compact */}
          {topics.length > 0 && (
            <div className="border border-[#1c1c1c] rounded-xl overflow-hidden bg-[#080808]">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c1c]">
                <div className="flex items-center gap-2">
                  <Layers size={13} className="text-[#444]" />
                  <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#444]">
                    Path topics
                  </span>
                </div>
                <Pill color="neutral">{completion.done}/{topics.length} done</Pill>
              </div>
              <div className="divide-y divide-[#111]">
                {topics.slice(0, 6).map((t: any, i: number) => {
                  const done = t.user_progress === "completed";
                  const active = t.id === nextTopic?.id;
                  return (
                    <Link
                      key={t.id}
                      to="/topic/$topicId"
                      params={{ topicId: String(t.slug || t.id) }}
                      className={`flex items-center gap-3 px-5 py-3 hover:bg-[#0d0d0d] transition-colors ${
                        active ? "bg-[#0a1410]" : ""
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                          done
                            ? "bg-[#0d2015] border-[#1a3028]"
                            : active
                            ? "bg-[#0a1a12] border-[#22c55e]/30"
                            : "bg-[#111] border-[#222]"
                        }`}
                      >
                        {done && <CheckCircle2 size={11} className="text-[#22c55e]" />}
                        {!done && active && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
                      </div>
                      <span
                        className={`text-sm flex-1 truncate ${
                          done ? "text-[#444] line-through" : active ? "text-[#e0e0e0]" : "text-[#888]"
                        }`}
                      >
                        {t.title}
                      </span>
                      {active && (
                        <ChevronRight size={13} className="text-[#22c55e] shrink-0" />
                      )}
                    </Link>
                  );
                })}
                {topics.length > 6 && (
                  <div className="px-5 py-2.5 text-[10px] font-mono text-[#3a3a3a] tracking-wider uppercase">
                    +{topics.length - 6} more topics
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Activity feed */}
        <div className="xl:col-span-1">
          <div className="border border-[#1c1c1c] rounded-xl overflow-hidden bg-[#080808] h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c1c]">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-[#444]" />
                <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#444]">
                  Activity
                </span>
              </div>
              {activityData.length > 0 && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {activityLoading ? (
                <div className="text-center py-8 text-[#333] text-xs font-mono tracking-widest uppercase">
                  Syncing…
                </div>
              ) : activityData.length > 0 ? (
                <ul className="space-y-1">
                  {activityData.map((a: any, i: number) => (
                    <li key={a.id} className="flex items-start gap-3 py-2.5 border-b border-[#101010] last:border-0">
                      <div
                        className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          i === 0 ? "bg-[#22c55e]" : "bg-[#2a2a2a]"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug truncate ${
                            i === 0 ? "text-[#d0d0d0]" : "text-[#666]"
                          }`}
                        >
                          {a.label}
                        </p>
                        <p className="text-[10px] font-mono text-[#333] mt-0.5 tracking-wider">
                          {timeAgo(a.date)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <BarChart3 size={24} className="text-[#222] mx-auto mb-3" />
                  <p className="text-xs text-[#444] leading-relaxed">
                    No activity yet.
                    <br />
                    Complete a topic to earn XP.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contribution graph ────────────────────────────────────────────────── */}
      <div className="border border-[#1c1c1c] rounded-xl overflow-hidden bg-[#080808]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1c1c1c]">
          <div className="flex items-center gap-2">
            <Github size={13} className="text-[#444]" />
            <span className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#444]">
              Contribution graph
            </span>
          </div>
          <span className="text-[10px] font-mono text-[#333]">
            {totalXP} total sessions
          </span>
        </div>
        <div className="px-5 py-4">
          <ContributionGraph data={heatmapData} isLoading={heatmapLoading} />
        </div>
      </div>
    </PageShell>
  );
}