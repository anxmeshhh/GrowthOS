import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PageShell } from "@/components/growth-ui";
import {
  User, Calendar, Shield, Award, Flame, BookOpen,
  ClipboardCheck, Trophy, Star, TrendingUp, Zap,
} from "lucide-react";
import { ActivityCalendar } from "react-activity-calendar";

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
  return (
    <div className={`rounded-[3px] bg-[#0f0f0f] animate-pulse ${className}`} />
  );
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
      <div className="profile-grid">

        {/* ── [A] Identity card ─────────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "id" }}>

          {/* Avatar + name */}
          <div className="px-5 pt-6 pb-5 flex flex-col items-center text-center border-b border-[#111]">
            <div className="avatar-ring mb-4">
              <div className="avatar-inner">
                <User size={26} className="text-[#22c55e]" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-[16px] font-semibold tracking-tight text-[#f5f5f5] leading-none mb-1">
              {pLoading ? <Skel className="h-4 w-28 mx-auto" /> : profile?.username}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <PillBadge icon={<Calendar size={8} />} label={joined} />
              <PillBadge icon={<Shield size={8} className="text-[#22c55e]" />} label={`Level ${level}`} accent />
            </div>
          </div>

          {/* XP progress */}
          <div className="px-5 py-4 border-b border-[#111]">
            <div className="flex items-center justify-between mb-2">
              <span className="section-label">{lvl}</span>
              <span className="section-label">
                {pLoading ? "—" : `${xp} / ${next} XP`}
              </span>
            </div>
            <div className="xp-track">
              <div
                className="xp-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#eee] mt-1.5 text-right">{pct}% to next tier</p>
          </div>

          {/* Quick stats 2×2 */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#111] flex-1">
            <StatCell icon={<Flame size={12} className="text-[#22c55e]" />} label="Streak" value={pLoading ? "—" : `${profile.streak}d`} />
            <StatCell icon={<Trophy size={12} className="text-[#22c55e]" />} label="Points" value={pLoading ? "—" : String(xp)} />
            <StatCell icon={<BookOpen size={12} className="text-[#22c55e]" />} label="Notes" value={pLoading ? "—" : String(profile.notes_written)} />
            <StatCell icon={<ClipboardCheck size={12} className="text-[#22c55e]" />} label="Quizzes" value={pLoading ? "—" : String(profile.quizzes_passed)} />
          </div>
        </div>

        {/* ── [B] Badges ────────────────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "badges" }}>
          <CardHeader icon={<Award size={10} className="text-[#22c55e]" />} title="Achievements">
            {!pLoading && profile?.badges && (
              <span className="section-label">{profile.badges.length} earned</span>
            )}
          </CardHeader>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {pLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-14 w-full" />)}
              </div>
            ) : profile?.badges?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.badges.map((b: any) => (
                  <BadgeCard key={b.id} title={b.title} desc={b.desc} />
                ))}
              </div>
            ) : (
              <EmptyState label="No badges yet" />
            )}
          </div>
        </div>

        {/* ── [C] XP Breakdown ─────────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "breakdown" }}>
          <CardHeader icon={<TrendingUp size={10} className="text-[#22c55e]" />} title="XP Breakdown" />

          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {pLoading ? (
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-7 w-full" />)}
              </div>
            ) : profile?.xp_breakdown?.length > 0 ? (
              <div className="space-y-4">
                {profile.xp_breakdown.map((item: any, idx: number) => {
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
                })}
              </div>
            ) : (
              <EmptyState label="No data yet" />
            )}
          </div>
        </div>

        {/* ── [D] Heatmap ───────────────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "heat" }}>
          <CardHeader icon={<Zap size={10} className="text-[#22c55e]" />} title="Contribution Heatmap">
            <span className="section-label">{pLoading ? "—" : `${xp} total XP`}</span>
          </CardHeader>

          <div className="flex-1 flex items-center px-4 py-3 overflow-x-auto min-h-0">
            {hLoading ? (
              <Skel className="h-full w-full" />
            ) : (
              <ActivityCalendar
                data={hd}
                theme={{
                  light: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"],
                  dark: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"],
                }}
                colorScheme="dark"
                labels={{ totalCount: "{{count}} contributions this year" }}
                style={{ fontSize: "10px" }}
              />
            )}
          </div>
        </div>

        {/* ── [E] Recent Activity ───────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "activity" }}>
          <CardHeader icon={<Flame size={10} className="text-[#22c55e]" />} title="Recent Activity">
            {activity.length > 0 && (
              <span className="live-dot" />
            )}
          </CardHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
            {activity.length > 0 ? (
              <ul className="divide-y divide-[#0d0d0d]">
                {activity.slice(0, 10).map((a: any, i: number) => (
                  <li key={a.id} className="flex items-start gap-3 py-2.5">
                    <div className={`mt-[5px] w-[5px] h-[5px] rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e55]" : "bg-[#1f1f1f]"
                      }`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] leading-snug truncate ${i === 0 ? "text-[#c8c8c8]" : "text-[#eee]"
                        }`}>
                        {a.label}
                      </p>
                      <p className="text-[10px] font-mono text-[#eee] mt-0.5">{timeAgo(a.date)}</p>
                    </div>
                    {i === 0 && (
                      <span className="shrink-0 text-[9px] font-mono text-[#22c55e]/60 uppercase tracking-wider mt-0.5">new</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState label="No activity yet" />
            )}
          </div>
        </div>

        {/* ── [F] Completed Roadmaps ────────────────────────────────────── */}
        <div className="profile-card" style={{ gridArea: "paths" }}>
          <CardHeader icon={<Star size={10} className="text-[#22c55e]" />} title="Completed Roadmaps">
            {!pLoading && profile?.completed_paths?.length > 0 && (
              <span className="section-label">{profile.completed_paths.length} done</span>
            )}
          </CardHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3">
            {pLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-7 w-28" />)}
              </div>
            ) : profile?.completed_paths?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.completed_paths.map((p: any) => (
                  <span key={p.id} className="roadmap-chip">
                    <Award size={8} /> {p.title}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center h-full text-[12px] text-[#eee] font-mono">
                No roadmaps completed yet — keep building
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── styles ────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Layout ── */
        .profile-grid {
          display: grid;
          gap: 6px;
          height: calc(100vh - 64px);
          overflow: hidden;
          grid-template-columns: minmax(200px, 230px) minmax(0, 1fr) minmax(210px, 250px);
          grid-template-rows: 1fr 1fr auto;
          grid-template-areas:
            "id  badges    breakdown"
            "id  heat      activity"
            "paths paths   paths";
        }

        /* ── Card shell ── */
        .profile-card {
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        /* Hairline top accent */
        .profile-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }

        /* ── Card header ── */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px;
          border-bottom: 1px solid #0f0f0f;
          flex-shrink: 0;
          background: #080808;
        }

        .card-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* ── Section label ── */
        .section-label {
          font-size: 8px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #333;
        }

        /* ── Avatar ── */
        .avatar-ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          border: 1px solid #1a1a1a;
          padding: 3px;
          background: #080808;
        }

        .avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #0c140f;
          border: 1px solid #22c55e18;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Pills ── */
        .pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border-radius: 3px;
          border: 1px solid #161616;
          background: #0a0a0a;
          font-size: 8px;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.1em;
          color: #3a3a3a;
          text-transform: uppercase;
        }

        .pill-badge.accent {
          border-color: #22c55e18;
          color: #22c55e;
        }

        /* ── XP track ── */
        .xp-track {
          height: 2px;
          background: #111;
          border-radius: 9999px;
          overflow: hidden;
        }

        .xp-fill {
          height: 100%;
          background: #22c55e;
          border-radius: 9999px;
          transition: width 0.6s ease;
          box-shadow: 0 0 8px #22c55e40;
        }

        /* ── Stat cells ── */
        .stat-cell {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 12px;
        }

        .stat-cell-icon {
          width: 26px;
          height: 26px;
          border-radius: 5px;
          background: #0b0b0b;
          border: 1px solid #151515;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Badge card ── */
        .badge-card {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 5px;
          border: 1px solid #141414;
          background: #080808;
          transition: border-color 0.15s ease;
        }

        .badge-card:hover {
          border-color: #22c55e20;
        }

        .badge-icon {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          background: #0b140e;
          border: 1px solid #1a3020;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Roadmap chip ── */
        .roadmap-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 3px;
          border: 1px solid #162213;
          background: #0a120c;
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        /* ── Live dot ── */
        .live-dot {
          display: block;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e80;
        }

        /* ── Breakdown bar ── */
        .breakdown-bar-track {
          height: 2px;
          background: #111;
          border-radius: 9999px;
          overflow: hidden;
          margin-top: 5px;
        }

        .breakdown-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease;
        }

        /* ── Responsive ── */
        @media (max-width: 1180px) {
          .profile-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: auto auto auto auto;
            height: auto;
            overflow: visible;
            grid-template-areas:
              "id        id"
              "badges    breakdown"
              "heat      activity"
              "paths     paths";
          }
        }

        @media (max-width: 720px) {
          .profile-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
            height: auto;
            overflow: visible;
            grid-template-areas:
              "id"
              "badges"
              "breakdown"
              "heat"
              "activity"
              "paths";
          }
        }
      `}</style>
    </PageShell>
  );
}

/* ── sub-components ───────────────────────────────────────────────────── */

function CardHeader({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card-header">
      <div className="card-header-left">
        {icon}
        <span className="section-label">{title}</span>
      </div>
      {children}
    </div>
  );
}

function PillBadge({
  icon, label, accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <span className={`pill-badge ${accent ? "accent" : ""}`}>
      {icon}
      {label}
    </span>
  );
}

function StatCell({
  icon, label, value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="stat-cell">
      <div className="stat-cell-icon">{icon}</div>
      <div>
        <p className="section-label mb-0.5">{label}</p>
        <p className="text-[14px] font-semibold tabular-nums text-[#e0e0e0] leading-none">{value}</p>
      </div>
    </div>
  );
}

function BadgeCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="badge-card">
      <div className="badge-icon">
        <Award size={12} className="text-[#22c55e]" strokeWidth={1.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-[#eee] truncate leading-tight">{title}</p>
        <p className="text-[10px] text-[#383838] truncate mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function BreakdownRow({
  label, total, count, width, rank,
}: {
  label: string;
  total: number;
  count: number;
  width: number;
  rank: number;
}) {
  // Dimmer fill for lower ranks
  const opacity = rank === 0 ? 1 : rank === 1 ? 0.65 : rank === 2 ? 0.45 : 0.28;
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <span className="text-[12px] text-[#eee] truncate leading-none">{label}</span>
        <span className="font-mono text-[10px] text-[#eee] shrink-0 ml-2">
          {total} · {count}×
        </span>
      </div>
      <div className="breakdown-bar-track">
        <div
          className="breakdown-bar-fill"
          style={{
            width: `${width}%`,
            background: `rgba(34,197,94,${opacity})`,
            boxShadow: rank === 0 ? "0 0 6px #22c55e30" : "none",
          }}
        />
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full text-[12px] font-mono text-[#fff]">
      {label}
    </div>
  );
}