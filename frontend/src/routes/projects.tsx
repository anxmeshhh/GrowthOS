import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Github,
  ExternalLink,
  Star,
  Loader2,
  GitBranch,
  ShieldCheck,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — GrowthOS" },
      { name: "description", content: "Your GitHub repositories and project assessments." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data: repoData, isLoading: reposLoading } = useQuery({
    queryKey: ["github_repos"],
    queryFn: async () => {
      const res = await apiFetch("/github/repos/");
      if (!res.ok) return { repos: [], message: "Failed to fetch" };
      return res.json();
    },
  });

  const { data: portfolio = [], isLoading: portfolioLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const res = await apiFetch("/portfolio/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const repos = repoData?.repos || [];
  const message = repoData?.message;

  const qc = useQueryClient();
  const [showGuide, setShowGuide] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDesc, setRepoDesc] = useState("");
  const [repoPrivate, setRepoPrivate] = useState(false);

  const createRepoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/github/repo/create/", {
        method: "POST",
        body: JSON.stringify({ name: repoName, description: repoDesc, private: repoPrivate }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create repository");
      }
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["github_repos"] });
      setShowCreateModal(false);
      setRepoName("");
      setRepoDesc("");
      setRepoPrivate(false);
      alert(`Repository created successfully!\nClone URL: ${data.clone_url}`);
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  if (reposLoading || portfolioLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12 text-[#eee]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading portfolio...
        </div>
      </PageShell>
    );
  }

  // No GitHub connected and no portfolio
  if (repos.length === 0 && message && portfolio.length === 0) {
    return (
      <PageShell>
        <PageHeader
          kicker="Build Proof"
          title="Projects"
          subtitle="Connect your GitHub to showcase your work."
        />
        <Card className="p-8 text-center">
          <Github size={48} className="mx-auto mb-4 text-[#fff]" />
          <h3 className="text-lg font-semibold text-[#f0f0f0] mb-2">Connect Your GitHub</h3>
          <p className="text-lg text-[#eee] mb-6 max-w-md mx-auto">{message}</p>
          <Link to="/settings">
            <Btn>Go to Settings →</Btn>
          </Link>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-[#252525]">
            <h2 className="text-xl font-bold text-white mb-4">How GitHub Integration Works</h2>
            <div className="space-y-4 text-[#ccc] text-sm leading-relaxed">
              <p>
                GrowthOS acts as your personal command center. By securely connecting your GitHub,
                you unlock the ability to orchestrate your developer workflow directly from this
                interface.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#aaa]">
                <li>
                  <strong>Verified Projects:</strong> When you complete an AI assessment for a
                  repository, GrowthOS permanently records it here as "Build Proof."
                </li>
                <li>
                  <strong>Public Repositories:</strong> We pull your live public repositories so you
                  can monitor your stars, branches, and code footprint in one place.
                </li>
                <li>
                  <strong>Active Execution:</strong> With your upgraded permissions, you will soon
                  be able to create repositories and publish Gists instantly from the topics and
                  notes you create within GrowthOS!
                </li>
              </ul>
              <p className="italic text-[#888] pt-2">
                Your tokens are encrypted using military-grade security.
              </p>
            </div>
            <div className="mt-6 flex justify-end">
              <Btn onClick={() => setShowGuide(false)} variant="solid" tone="green">
                Understood
              </Btn>
            </div>
          </Card>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg p-6 bg-[#0a0a0a] border-[#252525]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Github className="text-[#eee]" size={20} /> Create Workspace
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#888] mb-1">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-[#111] border border-[#252525] rounded-md px-3 py-2 text-sm text-[#eee] focus:outline-none focus:border-[#22c55e]"
                  placeholder="e.g. awesome-project"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#888] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={repoDesc}
                  onChange={(e) => setRepoDesc(e.target.value)}
                  className="w-full bg-[#111] border border-[#252525] rounded-md px-3 py-2 text-sm text-[#eee] focus:outline-none focus:border-[#22c55e]"
                  placeholder="Short description..."
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="repoPrivate"
                  checked={repoPrivate}
                  onChange={(e) => setRepoPrivate(e.target.checked)}
                  className="accent-[#22c55e]"
                />
                <label htmlFor="repoPrivate" className="text-sm text-[#aaa] cursor-pointer">
                  Make this repository private
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Btn onClick={() => setShowCreateModal(false)} variant="outline">
                Cancel
              </Btn>
              <Btn
                onClick={() => createRepoMutation.mutate()}
                variant="solid"
                tone="green"
                disabled={!repoName || createRepoMutation.isPending}
              >
                {createRepoMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create & Init"
                )}
              </Btn>
            </div>
          </Card>
        </div>
      )}

      <PageHeader
        kicker="Build Proof"
        title="Your Portfolio"
        subtitle={`${portfolio.length} verified projects • ${repos.length} public repositories`}
        actions={
          <>
            <Btn variant="solid" tone="green" size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} className="mr-2" /> Create Workspace
            </Btn>
            <Btn variant="outline" size="sm" onClick={() => setShowGuide(true)}>
              <ShieldCheck size={14} className="mr-2" /> Integration Guide
            </Btn>
          </>
        }
      />

      {portfolio.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold tracking-wide uppercase text-[#a8c078] mb-4 flex items-center gap-2">
            <ShieldCheck size={16} /> AI-Verified Projects
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {portfolio.map((proj: any) => (
              <Card
                key={proj.id}
                className="p-5 border-[#22c55e33] bg-[#0f140f] hover:border-[#22c55e66] transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck size={16} className="text-[#22c55e] shrink-0" />
                    <h3 className="font-semibold tracking-tight text-[#4ade80] truncate">
                      {proj.repo_name}
                    </h3>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {proj.ai_score !== undefined && (
                      <Badge tone="amber">Score: {proj.ai_score}/100</Badge>
                    )}
                    <Badge tone="green">Verified for: {proj.topic_title}</Badge>
                  </div>
                </div>
                <p className="text-lg text-[#a8c078] mb-4 line-clamp-2 italic">
                  "{proj.ai_evaluation}"
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#4a6a2a]">
                    Verified on {new Date(proj.verified_at).toLocaleDateString()}
                  </span>
                  <a href={proj.repo_url} target="_blank" rel="noreferrer">
                    <Btn
                      variant="ghost"
                      size="sm"
                      className="text-[#22c55e] hover:text-[#4ade80] hover:bg-[#22c55e1a]"
                    >
                      <ExternalLink size={12} className="mr-2" /> View Repo
                    </Btn>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {repos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold tracking-wide uppercase text-[#eee] mb-4 flex items-center gap-2">
            <Github size={16} /> GitHub Repositories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {repos.map((repo: any) => (
              <Card key={repo.id} className="p-5 hover:border-[#333] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch size={14} className="text-[#eee] shrink-0" />
                    <h3 className="font-semibold tracking-tight text-[#f0f0f0] truncate">
                      {repo.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#f59e0b]">
                        <Star size={10} fill="currentColor" /> {repo.stargazers_count}
                      </span>
                    )}
                  </div>
                </div>

                {repo.description && (
                  <p className="text-lg text-[#eee] mb-3 line-clamp-2">{repo.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {repo.language && <Badge tone="blue">{repo.language}</Badge>}
                    {repo.updated_at && (
                      <span className="text-[11px] font-mono text-[#fff]">
                        {new Date(repo.updated_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={repo.html_url} target="_blank" rel="noreferrer">
                      <Btn variant="ghost" size="sm">
                        <ExternalLink size={12} />
                      </Btn>
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
