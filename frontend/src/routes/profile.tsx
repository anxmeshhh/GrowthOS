import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PageShell } from "@/components/growth-ui";
import {
  User, Calendar, Shield, Award, Flame, BookOpen,
  ClipboardCheck, Trophy, Star, TrendingUp,
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
  return <div className={`rounded-md bg-[#141414] animate-pulse ${className}`} />;
}

/* ── page ─────────────────────────────────────────────────────────────── */

function ProfilePage() {
  const { data: profile, isLoading: pLoading } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => { const r = await apiFetch("/profile/"); if (!r.ok) throw 0; return r.json(); },
  });

  const { data: heatmap = [], isLoading: hLoading } = useQuery({
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

  const xp = profile?.total_xp ?? 0;
  const { level, title: lvl, next } = getLevelInfo(xp);
  const pct = next > 0 ? Math.min(100, Math.round((xp / next) * 100)) : 100;
  const joined = profile ? new Date(profile.date_joined).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—";
  const today = new Date().toISOString().split("T")[0];
  const hd = heatmap.length > 0 ? heatmap : [{ date: today, count: 0, level: 0 }];

  return (
    <PageShell>
      <div className="profile-grid">

        {/* ── [A] Identity card — left col, spans full height ──────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "id" }}>
          <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center border-b border-[#111]">
            <div className="w-16 h-16 rounded-full bg-[#0c140f] border border-[#22c55e]/30 flex items-center justify-center mb-3">
              <User size={30} className="text-[#22c55e]" />
            </div>
            <h1 className="text-lg font-semibold text-[#f0f0f0] tracking-tight leading-none mb-1">
              {pLoading ? <Skel className="h-5 w-28 mx-auto" /> : profile?.username}
            </h1>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[#444] uppercase tracking-wider">
              <span className="flex items-center gap-1"><Calendar size={9} /> {joined}</span>
              <span className="flex items-center gap-1"><Shield size={9} className="text-[#22c55e]" /> Lv{level}</span>
            </div>
          </div>

          {/* Level progress */}
          <div className="px-5 py-4 border-b border-[#111] shrink-0">
            <div className="flex items-center justify-between text-[9px] font-mono text-[#444] mb-1.5 uppercase tracking-wider">
              <span>{lvl}</span>
              <span>{pLoading ? "—" : `${xp}/${next}`}</span>
            </div>
            <div className="h-1 bg-[#141414] rounded-full overflow-hidden">
              <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#111] flex-1">
            <MiniStat icon={<Flame size={13} className="text-[#22c55e]" />} label="Streak" value={pLoading ? "—" : `${profile.streak}d`} />
            <MiniStat icon={<Trophy size={13} className="text-[#22c55e]" />} label="Points" value={pLoading ? "—" : String(xp)} />
            <MiniStat icon={<BookOpen size={13} className="text-[#22c55e]" />} label="Notes" value={pLoading ? "—" : String(profile.notes_written)} />
            <MiniStat icon={<ClipboardCheck size={13} className="text-[#22c55e]" />} label="Quizzes" value={pLoading ? "—" : String(profile.quizzes_passed)} />
          </div>
        </div>

        {/* ── [B] Badges — top center ───────────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "badges" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <Award size={10} className="text-[#22c55e]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">Achievements</span>
            </div>
            {!pLoading && profile?.badges && (
              <span className="text-[8px] font-mono text-[#333]">{profile.badges.length} earned</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {pLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-12 w-full" />)}
              </div>
            ) : profile?.badges?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {profile.badges.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md border border-[#181818] bg-[#0b0b0b] hover:border-[#22c55e]/25 transition-colors">
                    <div className="shrink-0 w-7 h-7 rounded-md bg-[#0c140f] border border-[#22c55e]/20 flex items-center justify-center">
                      <Award size={13} className="text-[#22c55e]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-[#ddd] truncate">{b.title}</p>
                      <p className="text-[9px] text-[#555] truncate">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] text-[#444]">No badges yet</div>
            )}
          </div>
        </div>

        {/* ── [C] Contribution breakdown — top right ────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "breakdown" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={10} className="text-[#22c55e]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">Breakdown</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-3.5">
            {pLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-6 w-full" />)}
              </div>
            ) : profile?.xp_breakdown?.length > 0 ? (
              <div className="space-y-3">
                {profile.xp_breakdown.map((item: any) => {
                  const max = profile.xp_breakdown[0].total;
                  const w = Math.round((item.total / max) * 100);
                  const label = item.action_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <div key={item.action_type}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#888] truncate">{label}</span>
                        <span className="font-mono text-[#444] shrink-0 ml-2">{item.total} · {item.count}×</span>
                      </div>
                      <div className="h-[3px] bg-[#141414] rounded-full overflow-hidden">
                        <div className="h-full bg-[#22c55e] rounded-full transition-all duration-500" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] text-[#444]">No data yet</div>
            )}
          </div>
        </div>

        {/* ── [D] Heatmap — bottom center ───────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "heat" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">Contribution heatmap</span>
            <span className="text-[8px] font-mono text-[#333]">{pLoading ? "—" : `${xp} total`}</span>
          </div>
          <div className="flex-1 flex items-center px-3.5 py-2 overflow-x-auto min-h-0">
            {hLoading ? (
              <Skel className="h-full w-full" />
            ) : (
              <ActivityCalendar
                data={hd}
                theme={{ light: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"], dark: ["#0e0e0e", "#0e4429", "#006d32", "#26a641", "#39d353"] }}
                colorScheme="dark"
                labels={{ totalCount: "{{count}} contributions this year" }}
                style={{ fontSize: "10px" }}
              />
            )}
          </div>
        </div>

        {/* ── [E] Activity — bottom right ───────────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "activity" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">Recent activity</span>
            {activity.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-3 py-2">
            {activity.length > 0 ? (
              <ul className="space-y-px">
                {activity.slice(0, 10).map((a: any, i: number) => (
                  <li key={a.id} className="flex items-start gap-2 py-1.5 border-b border-[#0d0d0d] last:border-0">
                    <div className={`mt-1 w-1 h-1 rounded-full shrink-0 ${i === 0 ? "bg-[#22c55e]" : "bg-[#1e1e1e]"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] leading-snug truncate ${i === 0 ? "text-[#bbb]" : "text-[#555]"}`}>{a.label}</p>
                      <p className="text-[9px] font-mono text-[#333]">{timeAgo(a.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-[11px] text-[#444]">No activity yet</div>
            )}
          </div>
        </div>

        {/* ── [F] Completed paths — very bottom ────────────────────────── */}
        <div className="border border-[#1a1a1a] rounded-lg bg-[#080808] flex flex-col overflow-hidden" style={{ gridArea: "paths" }}>
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#131313] shrink-0">
            <div className="flex items-center gap-1.5">
              <Star size={10} className="text-[#22c55e]" />
              <span className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">Completed roadmaps</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 px-3.5 py-2">
            {pLoading ? (
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => <Skel key={i} className="h-7 w-28" />)}
              </div>
            ) : profile?.completed_paths?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profile.completed_paths.map((p: any) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#1a3028] bg-[#0a1a12] text-[10px] font-mono text-[#22c55e] uppercase tracking-wider">
                    <Award size={9} /> {p.title}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center h-full text-[11px] text-[#444]">No roadmaps completed yet — keep building</div>
            )}
          </div>
        </div>
      </div>

      {/* ── grid definition ─────────────────────────────────────────────── */}
      <style>{`
        .profile-grid {
          display: grid;
          gap: 8px;
          height: calc(100vh - 64px);
          overflow: hidden;
          grid-template-columns: minmax(200px, 240px) minmax(0, 1fr) minmax(220px, 260px);
          grid-template-rows: 1fr 1fr auto;
          grid-template-areas:
            "id     badges    breakdown"
            "id     heat      activity"
            "paths  paths     paths";
        }
        @media (max-width: 1180px) {
          .profile-grid {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            grid-template-rows: auto auto auto auto;
            grid-template-areas:
              "id        id"
              "badges    breakdown"
              "heat      activity"
              "paths     paths";
          }
        }
        @media (max-width: 720px) {
          .profile-grid {
            height: auto;
            overflow: visible;
            grid-template-columns: 1fr;
            grid-template-rows: auto;
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

/* ── mini stat cell ───────────────────────────────────────────────────── */
function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      {icon}
      <div>
        <p className="text-[8px] uppercase tracking-[0.2em] font-mono text-[#444]">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-[#e8e8e8] leading-tight">{value}</p>
      </div>
    </div>
  );
}