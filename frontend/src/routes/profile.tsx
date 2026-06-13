import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { PageShell, Card, Progress } from "@/components/growth-ui";
import { User, Calendar, Trophy, Star, Shield, Award, Flame, BookOpen, ClipboardCheck, Loader2 } from "lucide-react";
import { ActivityCalendar } from "react-activity-calendar";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Developer Profile — GrowthOS" }] }),
  component: ProfilePage,
});

function getLevelInfo(xp: number) {
  if (xp < 20) return { level: 1, title: "Novice", next: 20 };
  if (xp < 50) return { level: 2, title: "Explorer", next: 50 };
  if (xp < 100) return { level: 3, title: "Scholar", next: 100 };
  if (xp < 250) return { level: 4, title: "Adept", next: 250 };
  if (xp < 500) return { level: 5, title: "Master", next: 500 };
  return { level: 6, title: "Grandmaster", next: xp };
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ProfilePage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user_profile'],
    queryFn: async () => { const res = await apiFetch("/profile/"); if (!res.ok) throw new Error("Failed"); return res.json(); }
  });

  const { data: heatmapData = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ['heatmap'],
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
    }
  });

  const { data: activityData = [] } = useQuery({
    queryKey: ['recent_activity'],
    queryFn: async () => { const res = await apiFetch("/activity/"); return res.ok ? res.json() : []; }
  });

  if (profileLoading) {
    return <PageShell><div className="flex items-center justify-center py-20 text-[#666]"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Profile...</div></PageShell>;
  }

  const { level, title, next } = getLevelInfo(profile.total_xp);
  const xpPct = Math.round((profile.total_xp / next) * 100);
  const joinedDate = new Date(profile.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <PageShell>
      <div className="flex flex-col gap-6">
        
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1e3060] bg-gradient-to-br from-[#0a0f1e] to-[#05080f] p-8 shadow-2xl">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#3b5bdb]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#1e3060] border-4 border-[#3b5bdb] shadow-[0_0_30px_rgba(59,91,219,0.3)]">
              <User size={56} className="text-[#60a5fa]" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">{profile.username}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[#a0a0a0] mb-4">
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {joinedDate}</span>
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-[#22c55e]" /> Level {level} {title}</span>
              </div>
              
              {/* Level Progress */}
              <div className="max-w-xs mx-auto md:mx-0">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-mono text-[#60a5fa]">{title}</span>
                  <span className="text-[10px] font-mono text-[#60a5fa]">{profile.total_xp} / {next} XP</span>
                </div>
                <Progress value={xpPct} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatMini icon={<Flame size={18} className="text-[#f59e0b]" />} label="Streak" value={`${profile.streak}d`} />
          <StatMini icon={<Trophy size={18} className="text-[#22c55e]" />} label="Total XP" value={String(profile.total_xp)} />
          <StatMini icon={<BookOpen size={18} className="text-[#60a5fa]" />} label="Notes" value={String(profile.notes_written)} />
          <StatMini icon={<ClipboardCheck size={18} className="text-[#a78bfa]" />} label="Quizzes" value={String(profile.quizzes_passed)} />
        </div>

        {/* Badges */}
        {profile.badges && profile.badges.length > 0 && (
          <Card className="p-5">
            <h3 className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-4">Achievement Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {profile.badges.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#222] bg-[#0f0f0f]">
                  <div className="text-2xl">{b.icon}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#f0f0f0] truncate">{b.title}</div>
                    <div className="text-[10px] text-[#666] truncate">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Heatmap + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            <h3 className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-4">Contribution Heatmap</h3>
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[700px]">
                {heatmapLoading ? (
                  <div className="h-32 bg-[#111] animate-pulse rounded" />
                ) : (
                  <ActivityCalendar
                    data={heatmapData}
                    theme={{ light: ["#161616", "#0e4429", "#006d32", "#26a641", "#39d353"], dark: ["#161616", "#0e4429", "#006d32", "#26a641", "#39d353"] }}
                    colorScheme="dark"
                    blockSize={12}
                    blockMargin={4}
                    fontSize={12}
                    labels={{ legend: { less: "Less", more: "More" }, totalCount: "{{count}} contributions in the last year" }}
                  />
                )}
              </div>
            </div>
          </Card>
          
          <Card className="p-5">
            <h3 className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-4">Recent Activity</h3>
            {activityData.length === 0 ? (
              <div className="text-sm text-[#888] text-center py-6">No activity yet.</div>
            ) : (
              <div className="space-y-3">
                {activityData.slice(0, 8).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mt-2 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-[#ccc] truncate">{a.label}</div>
                      <div className="text-[10px] font-mono text-[#555]">{timeAgo(a.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Completed Paths + XP Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h3 className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-4">Completed Roadmaps</h3>
            {profile.completed_paths.length === 0 ? (
              <div className="text-sm text-[#888] text-center py-6">No roadmaps completed yet. Keep building!</div>
            ) : (
              <ul className="space-y-2">
                {profile.completed_paths.map((p: any) => (
                  <li key={p.id} className="flex items-center gap-3 bg-[#111] p-3 rounded-lg border border-[#222]">
                    <Award size={16} className="text-[#f59e0b]" />
                    <span className="text-sm font-medium text-[#e0e0e0]">{p.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          
          <Card className="p-5">
            <h3 className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-4">XP Breakdown</h3>
            {profile.xp_breakdown && profile.xp_breakdown.length > 0 ? (
              <div className="space-y-3">
                {profile.xp_breakdown.map((item: any) => {
                  const maxXp = profile.xp_breakdown[0].total;
                  const pct = Math.round((item.total / maxXp) * 100);
                  const label = item.action_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                  return (
                    <div key={item.action_type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#ccc]">{label}</span>
                        <span className="font-mono text-[#666]">{item.total} XP ({item.count}×)</span>
                      </div>
                      <div className="h-1.5 bg-[#222] rounded-full">
                        <div className="h-1.5 rounded-full bg-[#22c55e] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-[#888] text-center py-6">No XP earned yet.</div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

function StatMini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4 flex items-center gap-3">
      {icon}
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">{label}</div>
        <div className="text-xl font-bold text-[#f0f0f0]">{value}</div>
      </div>
    </Card>
  );
}
