import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Github, ExternalLink, Star, Loader2, GitBranch, ShieldCheck } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — GrowthOS" }, { name: "description", content: "Your GitHub repositories and project assessments." }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: repoData, isLoading: reposLoading } = useQuery({
    queryKey: ['github_repos'],
    queryFn: async () => {
      const res = await apiFetch("/github/repos/");
      if (!res.ok) return { repos: [], message: "Failed to fetch" };
      return res.json();
    }
  });

  const { data: portfolio = [], isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const res = await apiFetch("/portfolio/");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const repos = repoData?.repos || [];
  const message = repoData?.message;

  if (reposLoading || portfolioLoading) {
    return <PageShell><div className="flex items-center justify-center p-12 text-[#666]"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading portfolio...</div></PageShell>;
  }

  // No GitHub connected and no portfolio
  if (repos.length === 0 && message && portfolio.length === 0) {
    return (
      <PageShell>
        <PageHeader kicker="Build Proof" title="Projects" subtitle="Connect your GitHub to showcase your work." />
        <Card className="p-8 text-center">
          <Github size={48} className="mx-auto mb-4 text-[#bbb]" />
          <h3 className="text-lg font-semibold text-[#f0f0f0] mb-2">Connect Your GitHub</h3>
          <p className="text-sm text-[#888] mb-6 max-w-md mx-auto">{message}</p>
          <Link to="/settings">
            <Btn>Go to Settings →</Btn>
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Build Proof"
        title="Your Portfolio"
        subtitle={`${portfolio.length} verified projects • ${repos.length} public repositories`}
      />

      {portfolio.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[#a8c078] mb-4 flex items-center gap-2">
            <ShieldCheck size={16} /> AI-Verified Projects
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {portfolio.map((proj: any) => (
              <Card key={proj.id} className="p-5 border-[#22c55e33] bg-[#0f140f] hover:border-[#22c55e66] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck size={16} className="text-[#22c55e] shrink-0" />
                    <h3 className="font-semibold tracking-tight text-[#4ade80] truncate">{proj.repo_name}</h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {proj.ai_score !== undefined && <Badge tone="amber">Score: {proj.ai_score}/100</Badge>}
                    <Badge tone="green">Verified for: {proj.topic_title}</Badge>
                  </div>
                </div>
                <p className="text-sm text-[#a8c078] mb-4 line-clamp-2 italic">"{proj.ai_evaluation}"</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a6a2a]">
                    Verified on {new Date(proj.verified_at).toLocaleDateString()}
                  </span>
                  <a href={proj.repo_url} target="_blank" rel="noreferrer">
                    <Btn variant="ghost" size="sm" className="text-[#22c55e] hover:text-[#4ade80] hover:bg-[#22c55e1a]"><ExternalLink size={12} className="mr-2"/> View Repo</Btn>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {repos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold tracking-wide uppercase text-[#666] mb-4 flex items-center gap-2">
            <Github size={16} /> GitHub Repositories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {repos.map((repo: any) => (
              <Card key={repo.id} className="p-5 hover:border-[#333] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch size={14} className="text-[#888] shrink-0" />
                    <h3 className="font-semibold tracking-tight text-[#f0f0f0] truncate">{repo.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[#f59e0b]">
                        <Star size={10} fill="currentColor" /> {repo.stargazers_count}
                      </span>
                    )}
                  </div>
                </div>
                
                {repo.description && (
                  <p className="text-xs text-[#888] mb-3 line-clamp-2">{repo.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {repo.language && <Badge tone="blue">{repo.language}</Badge>}
                    {repo.updated_at && (
                      <span className="text-[10px] font-mono text-[#bbb]">
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={repo.html_url} target="_blank" rel="noreferrer">
                      <Btn variant="ghost" size="sm"><ExternalLink size={12} /></Btn>
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}