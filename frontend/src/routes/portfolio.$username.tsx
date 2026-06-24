import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, Card, Badge } from "@/components/growth-ui";
import { Loader2, ExternalLink, Github, Trophy, ShieldCheck, User } from "lucide-react";

export const Route = createFileRoute("/portfolio/$username")({
  component: PortfolioPage,
});

// F3: Use the env-driven base URL so this works in production
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

function PortfolioPage() {
  const { username } = Route.useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["public_portfolio", username],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/portfolio/public/${username}/`);
      if (!res.ok) throw new Error("Portfolio not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#fff] animate-spin" />
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <div className="text-xl text-[#ef4444] font-bold mb-2">Portfolio Not Found</div>
          <div className="text-[#888]">
            The user "{username}" does not exist or has no public profile.
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 mb-12 bg-[#0a0a0a]/80 border border-[#1a1a1a] p-8 rounded-2xl backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3b82f6]/20 to-[#8b5cf6]/20 border-2 border-[#1a1a1a] flex items-center justify-center flex-shrink-0">
              <User size={40} className="text-[#888]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#fff] tracking-tight mb-2">
                {data.username}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                {data.selected_title && (
                  <Badge className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20 font-medium">
                    {data.selected_title}
                  </Badge>
                )}
                {data.github_username && (
                  <a
                    href={`https://github.com/${data.github_username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#fff] transition-colors"
                  >
                    <Github size={16} />
                    {data.github_username}
                  </a>
                )}
                <div className="text-sm text-[#666]">
                  Joined {new Date(data.date_joined).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col items-center p-4 bg-[#050505] rounded-xl border border-[#141414] min-w-[100px]">
              <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Level</div>
              <div className="text-3xl font-black text-[#fff]">{data.level}</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-[#050505] rounded-xl border border-[#141414] min-w-[100px]">
              <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Total XP</div>
              <div className="text-3xl font-black text-[#f59e0b]">{data.total_xp}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-[#22c55e]" size={24} />
              <h2 className="text-2xl font-semibold text-[#fff]">Verified Projects</h2>
            </div>

            {data.projects.length === 0 ? (
              <Card className="p-8 text-center text-[#888]">No verified projects yet.</Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {data.projects.map((proj: any) => (
                  <Card
                    key={proj.id}
                    className="p-6 bg-[#0a0a0a]/50 hover:bg-[#0a0a0a] transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-[#3b82f6] font-medium tracking-wide uppercase mb-2">
                          {proj.path_title || "Custom Topic"}
                        </div>
                        <h3 className="text-xl font-bold text-[#eee] mb-1">{proj.topic_title}</h3>
                        <a
                          href={proj.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[#888] group-hover:text-[#fff] transition-colors"
                        >
                          <Github size={14} />
                          {proj.repo_name}
                          <ExternalLink size={12} className="opacity-50" />
                        </a>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm text-[#666] mb-1">
                          {new Date(proj.verified_at).toLocaleDateString()}
                        </div>
                        <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 font-bold px-3 py-1 text-sm">
                          {proj.ai_score}/100 Score
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Badges */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="text-[#eab308]" size={24} />
              <h2 className="text-2xl font-semibold text-[#fff]">Achievements</h2>
            </div>

            {data.badges.length === 0 ? (
              <Card className="p-6 text-center text-[#888]">No achievements unlocked yet.</Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {data.badges.map((b: any) => (
                  <Card key={b.id} className="p-4 flex items-center gap-4 bg-[#0a0a0a]/50">
                    <div className="text-3xl">{b.icon}</div>
                    <div>
                      <div className="font-semibold text-[#eee]">{b.title}</div>
                      <div className="text-xs text-[#888] leading-tight mt-0.5">{b.desc}</div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
