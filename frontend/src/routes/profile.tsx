import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { PageShell, PageHeader, Card } from "@/components/growth-ui";
import {
  User,
  Calendar,
  Shield,
  Award,
  Flame,
  BookOpen,
  ClipboardCheck,
  Trophy,
  Star,
  TrendingUp,
  Zap,
  Play,
  Share2,
  Check,
  MessageSquare,
  Layers,
} from "lucide-react";
import { ActivityCalendar } from "react-activity-calendar";
import { useAppTutorial } from "@/components/tutorial-overlay";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — GrowthOS" }] }),
  component: ProfilePage,
});

/* ── helpers ──────────────────────────────────────────────────────────── */

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

function Skel({ className = "" }: { className?: string }) {
  return <div className={`rounded-md bg-[#161616] animate-pulse ${className}`} />;
}

/* ── page ─────────────────────────────────────────────────────────────── */

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
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (profile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/portfolio/${profile.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { data: heatmap = [], isLoading: hLoading } = useQuery({
    queryKey: ["heatmap"],
    queryFn: async () => {
      const r = await apiFetch("/heatmap/");
      if (!r.ok) return [];
      return (await r.json()).map((d: any) => ({
        date: d.date,
        count: d.count,
        level: d.count === 0 ? 0 : d.count <= 2 ? 1 : d.count <= 4 ? 2 : d.count <= 6 ? 3 : 4,
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
  const joined = profile
    ? new Date(profile.date_joined).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";
  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  return (
    <PageShell>
      <PageHeader
        kicker="Your Identity"
        title="Developer Profile"
        subtitle="Track your progress, achievements, and contributions across the GrowthOS ecosystem."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* ── [A] Identity card (Left Column, Span 4) ─────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="flex flex-col overflow-hidden shadow-2xl shadow-green-900/5 ring-1 ring-white/5">
            {/* Avatar + name */}
            <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center border-b border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-[#22c55e]/10 to-transparent opacity-50" />

              <div className="relative mb-6">
                <div className="absolute -inset-1 bg-gradient-to-tr from-[#22c55e] to-transparent rounded-full blur opacity-30 animate-pulse" />
                <div className="relative h-24 w-24 rounded-full border-2 border-[#22c55e]/30 bg-[#0a0a0a] flex items-center justify-center shadow-xl shadow-green-900/20">
                  <User size={40} className="text-[#22c55e]" strokeWidth={1.5} />
                </div>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-[#f5f5f5] mb-2 relative z-10">
                {pLoading ? <Skel className="h-8 w-40 mx-auto" /> : profile?.username}
              </h1>

              <div className="flex flex-wrap justify-center items-center gap-2 mt-3 relative z-10">
                <PillBadge icon={<Calendar size={12} />} label={joined} />
                <PillBadge
                icon={<Shield size={12} className="text-[#22c55e]" />}
                  label={`Level ${level}`}
                  accent
                />
              </div>
              
              <div className="flex items-center gap-3 mt-6 relative z-10">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 border border-[#3b82f6]/20 text-sm font-medium text-[#3b82f6] transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                  {copied ? "Copied!" : "Share Portfolio"}
                </button>
                <button
                  onClick={startTutorial}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111] hover:bg-[#1a1a1a] border border-white/10 text-sm font-medium text-gray-300 transition-all cursor-pointer"
                >
                  <Play size={14} className="text-[#22c55e]" />
                  Replay Tutorial
                </button>
              </div>
            </div>

            {/* XP progress */}
            <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-400">{lvl}</span>
                <span className="text-sm font-mono text-gray-300">
                  {pLoading ? "—" : `${xp} / ${next} XP`}
                </span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden ring-1 ring-white/5 inset-ring">
                <div
                  className="h-full bg-gradient-to-r from-[#16a34a] to-[#22c55e] rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs font-mono text-gray-500 mt-2 text-right">{pct}% to next tier</p>
            </div>

            {/* Quick stats 2×2 */}
            <div className="grid grid-cols-2 divide-x divide-y divide-white/5 bg-white/[0.02]">
              <StatCell
                icon={<Flame size={16} className="text-orange-500" />}
                label="Streak"
                value={pLoading ? "—" : `${profile.streak} Days`}
              />
              <StatCell
                icon={<Trophy size={16} className="text-yellow-500" />}
                label="Points"
                value={pLoading ? "—" : String(xp)}
              />
              <StatCell
                icon={<BookOpen size={16} className="text-blue-500" />}
                label="Notes"
                value={pLoading ? "—" : String(profile.notes_written)}
              />
              <StatCell
                icon={<ClipboardCheck size={16} className="text-[#22c55e]" />}
                label="Quizzes"
                value={pLoading ? "—" : String(profile.quizzes_passed)}
              />
              <StatCell
                icon={<MessageSquare size={16} className="text-[#a855f7]" />}
                label="Concepts"
                value={pLoading ? "—" : String(profile.feynman_mastered || 0)}
              />
              <StatCell
                icon={<Layers size={16} className="text-[#60a5fa]" />}
                label="Cards"
                value={pLoading ? "—" : String(profile.flashcards_mastered || 0)}
              />
            </div>
          </Card>

          {/* ── [C] XP Breakdown ─────────────────────────────────────────── */}
          <Card className="flex flex-col min-h-[300px]">
            <CardHeader
              icon={<TrendingUp size={14} className="text-[#22c55e]" />}
              title="XP Breakdown"
            />
            <div className="flex-1 p-6 space-y-5">
              {pLoading ? (
                <div className="flex flex-col gap-5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skel key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : profile?.xp_breakdown?.length > 0 ? (
                profile.xp_breakdown.map((item: any, idx: number) => {
                  const max = profile.xp_breakdown[0].total;
                  const w = Math.round((item.total / max) * 100);
                  const label = item.action_type
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <BreakdownRow
                      key={item.action_type}
                      label={label}
                      total={item.total}
                      count={item.count}
                      width={w}
                      rank={idx}
                    />
                  );
                })
              ) : (
                <EmptyState label="No data yet" />
              )}
            </div>
          </Card>
        </div>

        {/* ── Right Column (Span 8) ────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* ── [D] Heatmap ───────────────────────────────────────────────── */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader
              icon={<Zap size={14} className="text-[#22c55e]" />}
              title="Contribution Heatmap"
            >
              <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                {pLoading ? "—" : `${xp} total XP`}
              </span>
            </CardHeader>
            <div className="p-6 overflow-x-auto custom-scrollbar flex items-center justify-center">
              {hLoading ? (
                <Skel className="h-[140px] w-full" />
              ) : (
                <ActivityCalendar
                  data={hd}
                  theme={{
                    light: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                    dark: ["#111", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  }}
                  colorScheme="dark"
                  labels={{ totalCount: "{{count}} contributions this year" }}
                  style={{ fontSize: "12px", margin: "0 auto" }}
                />
              )}
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* ── [E] Recent Activity ───────────────────────────────────────── */}
            <Card className="flex flex-col">
              <CardHeader
                icon={<Flame size={14} className="text-[#22c55e]" />}
                title="Recent Activity"
              >
                {activity.length > 0 && (
                  <span className="block w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse" />
                )}
              </CardHeader>
              <div className="flex-1 p-4">
                {activity.length > 0 ? (
                  <ul className="space-y-2">
                    {activity.slice(0, 8).map((a: any, i: number) => (
                      <li
                        key={a.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                      >
                        <div
                          className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                            i === 0
                              ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.6)]"
                              : "bg-gray-700"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm font-medium leading-snug truncate ${
                              i === 0 ? "text-gray-200" : "text-gray-400"
                            }`}
                          >
                            {a.label}
                          </p>
                          <p className="text-xs font-mono text-gray-500 mt-1">{timeAgo(a.date)}</p>
                        </div>
                        {i === 0 && (
                          <span className="shrink-0 text-[10px] font-mono text-[#22c55e] uppercase tracking-wider px-2 py-1 bg-green-900/20 rounded border border-green-900/30">
                            new
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState label="No activity yet" />
                )}
              </div>
            </Card>

            {/* ── [B] Badges ────────────────────────────────────────────────── */}
            <Card className="flex flex-col">
              <CardHeader
                icon={<Award size={14} className="text-[#22c55e]" />}
                title="Achievements"
              >
                {!pLoading && profile?.badges && (
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                    {profile.badges.length} earned
                  </span>
                )}
              </CardHeader>
              <div className="flex-1 p-4">
                {pLoading ? (
                  <div className="grid grid-cols-1 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skel key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : profile?.badges?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {profile.badges.map((b: any) => (
                      <BadgeCard key={b.id} title={b.title} desc={b.desc} />
                    ))}
                  </div>
                ) : (
                  <EmptyState label="No badges yet" />
                )}
              </div>
            </Card>
          </div>

          {/* ── [F] Completed Roadmaps ────────────────────────────────────── */}
          <Card className="flex flex-col">
            <CardHeader
              icon={<Star size={14} className="text-[#22c55e]" />}
              title="Completed Roadmaps"
            >
              {!pLoading && profile?.completed_paths?.length > 0 && (
                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
                  {profile.completed_paths.length} done
                </span>
              )}
            </CardHeader>

            <div className="p-6">
              {pLoading ? (
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skel key={i} className="h-10 w-32" />
                  ))}
                </div>
              ) : profile?.completed_paths?.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {profile.completed_paths.map((p: any) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-green-900/30 bg-green-950/20 text-sm font-medium text-[#22c55e] shadow-sm hover:bg-green-950/40 transition-colors cursor-default"
                    >
                      <Award size={14} /> {p.title}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-6 text-sm text-gray-500 font-mono">
                  No roadmaps completed yet — keep building
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

/* ── sub-components ───────────────────────────────────────────────────── */

function CardHeader({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-semibold tracking-wide text-gray-200 uppercase">{title}</span>
      </div>
      {children}
    </div>
  );
}

function PillBadge({
  icon,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono uppercase tracking-wider ${accent ? "border-[#22c55e]/20 text-[#22c55e] bg-green-950/20" : "border-white/10 text-gray-400 bg-white/5"}`}
    >
      {icon}
      {label}
    </span>
  );
}

function StatCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 text-center hover:bg-white/[0.02] transition-colors">
      <div className="w-10 h-10 rounded-full bg-black/50 border border-white/5 flex items-center justify-center mb-3 shadow-inner">
        {icon}
      </div>
      <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums text-gray-100 leading-none">{value}</p>
    </div>
  );
}

function BadgeCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-black/40 hover:bg-white/[0.02] hover:border-white/10 transition-all group">
      <div className="w-12 h-12 rounded-lg bg-green-950/30 border border-green-900/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
        <Award size={20} className="text-[#22c55e]" strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-200 truncate">{title}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  total,
  count,
  width,
  rank,
}: {
  label: string;
  total: number;
  count: number;
  width: number;
  rank: number;
}) {
  const opacity = rank === 0 ? 1 : rank === 1 ? 0.75 : rank === 2 ? 0.5 : 0.3;
  return (
    <div className="group">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
          {label}
        </span>
        <span className="font-mono text-xs text-gray-500">
          {total} XP <span className="opacity-50 mx-1">·</span> {count}×
        </span>
      </div>
      <div className="h-2 bg-black/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${width}%`,
            background: `rgba(34,197,94,${opacity})`,
            boxShadow: rank === 0 ? "0 0 10px rgba(34,197,94,0.4)" : "none",
          }}
        />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center space-y-3">
      <div className="w-12 h-12 rounded-full border border-dashed border-white/10 flex items-center justify-center text-gray-600">
        <TrendingUp size={20} />
      </div>
      <span className="text-sm font-mono text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
