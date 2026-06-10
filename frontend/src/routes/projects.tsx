import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Github, Play, GitCommit, FileCode, CheckCircle, RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Project Builder · GrowthOS" },
      { name: "description", content: "Milestone projects to prove your skills." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { state, connectProjectRepo, disconnectProjectRepo, runProjectAIReview } = useGrowthState();
  const [connectModalProjectName, setConnectModalProjectName] = useState<string | null>(null);
  const [repoInput, setRepoInput] = useState("");
  const [loadingProjectName, setLoadingProjectName] = useState<string | null>(null);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectModalProjectName || !repoInput.trim()) return;
    connectProjectRepo(connectModalProjectName, repoInput.trim());
    setRepoInput("");
    setConnectModalProjectName(null);
  };

  const handleRunReview = (projectName: string) => {
    setLoadingProjectName(projectName);
    runProjectAIReview(projectName).finally(() => {
      setLoadingProjectName(null);
    });
  };

  const projectsList = Object.values(state.projects);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header className="mb-6">
        <div className="text-xs font-mono text-[var(--in-progress)] font-bold tracking-wider mb-2">
          PROJECT BUILDER
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Build to prove it</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Milestone projects unlocked by your roadmap progress. Connect your GitHub repository to
          trigger reviews.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {projectsList.map((p) => {
          const isConnected = !!p.repoUrl;
          const review = p.aiReview;
          const isReviewLoading = loadingProjectName === p.name;

          return (
            <div
              key={p.name}
              className="p-5 rounded-lg border border-border bg-card flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <h3 className="font-semibold text-base">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>

                {isConnected && (
                  <div className="bg-[var(--surface)] p-3 rounded-md border border-border space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Github className="w-3.5 h-3.5" />
                      <span className="text-foreground truncate">{p.repoUrl}</span>
                    </div>

                    {/* Commit Stream */}
                    <div className="border-t border-border/40 pt-2 space-y-1.5">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <GitCommit className="w-3 h-3 text-[var(--in-progress)] animate-pulse" />{" "}
                        Latest Commit
                      </div>
                      {p.commits && p.commits.length > 0 ? (
                        <>
                          <div className="text-xs font-mono truncate text-foreground/90">
                            {p.commits[0].message}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {p.commits[0].date} by {state.profile.name}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-mono truncate text-foreground/90">
                            feat: connected repo & configured workflow
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Just now by {state.profile.name}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Review Report Display */}
                {review && (
                  <div className="mt-3 bg-[var(--surface-2)] p-3 rounded-md border border-border text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                      <span className="font-semibold flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-[var(--in-progress)]" /> AI Review
                        Grade:
                      </span>
                      <span
                        className={`font-mono font-bold uppercase ${review.score >= 80 ? "text-[var(--completed)]" : "text-destructive"}`}
                      >
                        {review.score}%
                      </span>
                    </div>
                    <p className="text-muted-foreground text-[11px] leading-relaxed italic mb-2">
                      "{review.feedback}"
                    </p>
                    <div className="space-y-1 text-muted-foreground border-t border-border/40 pt-2">
                      {review.details.map((item, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 pb-1">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="text-foreground">{item.category}</span>
                            <span className="text-[var(--completed)]">{item.rating}/10</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                {!isConnected ? (
                  <button
                    disabled={p.status === "locked"}
                    onClick={() => setConnectModalProjectName(p.name)}
                    className="w-full text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Github className="w-3.5 h-3.5" /> Connect repo
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRunReview(p.name)}
                      disabled={isReviewLoading || p.status === "completed"}
                      className="flex-1 text-xs font-semibold px-3 py-2 rounded-md bg-foreground text-background hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isReviewLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin animate-duration-1000" />
                          Analyzing Code...
                        </>
                      ) : p.status === "completed" ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-background" />
                          Passed & Mastery Unlocked
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Run AI Code Review
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => disconnectProjectRepo(p.name)}
                      className="text-xs font-medium p-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-destructive hover:text-white text-muted-foreground transition-colors cursor-pointer"
                      title="Disconnect Repository"
                    >
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* GitHub Repo Connection Modal Overlay */}
      {connectModalProjectName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Github className="w-5 h-5 text-[var(--in-progress)]" />
                Connect Repository
              </h3>
              <button
                onClick={() => setConnectModalProjectName(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕ Close
              </button>
            </div>
            <form onSubmit={handleConnect} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-mono uppercase block">
                  Repository URL / Path
                </label>
                <input
                  required
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="e.g. https://github.com/animesh/url-shortener"
                  className="w-full bg-[var(--surface-2)] border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--in-progress)]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModalProjectName(null)}
                  className="px-4 py-2 text-xs border border-border rounded-md hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-foreground text-background font-semibold rounded-md hover:opacity-90"
                >
                  Save Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
