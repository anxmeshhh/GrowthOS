import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Lock, ExternalLink } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useGrowth } from "@/lib/growth-store";
import { PROJECTS, TOPICS } from "@/lib/growth-data";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — GrowthOS" }, { name: "description", content: "Build proof. Real shipped code, verified skills." }] }),
  component: ProjectsPage,
});

type Tab = "available" | "submissions" | "skills";

function ProjectsPage() {
  const { state, update } = useGrowth();
  const [tab, setTab] = useState<Tab>("available");

  const readiness = useMemo(() => {
    const total = PROJECTS.length;
    const verified = state.submissions.filter((s) => s.status === "Verified").length;
    return Math.round((verified / total) * 100);
  }, [state.submissions]);

  // verified skills come from completed topics
  const verifiedSkills = useMemo(() => {
    const set = new Set<string>();
    for (const t of TOPICS) {
      const p = state.progress[t.id];
      if (p && p.resourceDone && p.notesDone && p.quizDone && p.buildDone) {
        // crude: derive from title
        for (const w of t.title.split(/\W+/)) if (w.length > 2) set.add(w);
      }
    }
    return Array.from(set);
  }, [state.progress]);

  const ALL_SKILLS = ["HTTP", "REST", "Git", "GitHub", "DNS", "Python", "SQL", "Indexing", "Auth", "JWT", "Docker", "Redis", "WebSockets"];

  return (
    <PageShell>
      <PageHeader kicker="Build Proof" title="Projects" subtitle="Career evidence through real code." />

      {/* Readiness */}
      <Card className="p-5 mb-6 flex items-center gap-5">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#222" strokeWidth="2" />
            <circle
              cx="18" cy="18" r="15.9155" fill="none" stroke="#22c55e" strokeWidth="2"
              strokeDasharray={`${readiness} ${100 - readiness}`} strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold font-mono">{readiness}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">Portfolio Readiness</div>
          <div className="text-sm text-[#999] mt-1">Ship more verified projects to climb the score.</div>
        </div>
      </Card>

      <div className="flex border-b border-[#222] mb-4">
        {(["available", "submissions", "skills"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"px-4 py-2.5 text-sm capitalize border-b-2 transition-colors " + (tab === t ? "border-[#22c55e] text-[#f0f0f0]" : "border-transparent text-[#666] hover:text-[#f0f0f0]")}
          >
            {t === "available" ? "Available Projects" : t === "submissions" ? "My Submissions" : "Skills Verified"}
          </button>
        ))}
      </div>

      {tab === "available" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PROJECTS.map((p) => {
            const submitted = state.submissions.some((s) => s.projectId === p.id);
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold tracking-tight">{p.title}</h3>
                  <Badge tone={p.difficulty === "EASY" ? "green" : p.difficulty === "MEDIUM" ? "amber" : "red"}>{p.difficulty}</Badge>
                </div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-3">Backend Developer Path</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {p.skills.map((s) => <Badge key={s} tone="blue">{s}</Badge>)}
                </div>
                <p className="text-sm text-[#999] mb-4">{p.description}</p>
                <div className="flex justify-end">
                  <Btn
                    size="sm"
                    onClick={() => {
                      if (submitted) return;
                      const url = prompt("GitHub URL for this submission:");
                      if (!url) return;
                      update((s) => ({ ...s, submissions: [...s.submissions, { id: `sub-${Date.now()}`, projectId: p.id, githubUrl: url, status: "Submitted", submittedAt: new Date().toISOString() }] }));
                    }}
                  >
                    {submitted ? "Submitted ✓" : "Start →"}
                  </Btn>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "submissions" && (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0f0f0f] text-[10px] uppercase font-mono tracking-wider text-[#666]">
              <tr>
                <th className="text-left px-4 py-3">Project</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">GitHub</th>
                <th className="text-left px-4 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {state.submissions.map((s) => {
                const proj = PROJECTS.find((p) => p.id === s.projectId);
                return (
                  <tr key={s.id} className="border-t border-[#222]">
                    <td className="px-4 py-3">{proj?.title ?? s.projectId}</td>
                    <td className="px-4 py-3">
                      <Badge tone={s.status === "Verified" ? "green" : s.status === "Under Review" ? "amber" : "blue"}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <a href={s.githubUrl} target="_blank" rel="noreferrer" className="text-[#3b82f6] hover:underline inline-flex items-center gap-1">
                        Open <ExternalLink size={11} />
                      </a>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#999]">{new Date(s.submittedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {state.submissions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-[#666] text-sm">No submissions yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "skills" && (
        <Card className="p-5">
          <div className="flex flex-wrap gap-2">
            {ALL_SKILLS.map((s) => {
              const verified = verifiedSkills.some((v) => v.toLowerCase() === s.toLowerCase());
              return (
                <span
                  key={s}
                  className={
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono " +
                    (verified ? "border-[#22c55e]/40 bg-[#0d1a0d] text-[#22c55e]" : "border-[#222] bg-[#0f0f0f] text-[#666]")
                  }
                >
                  {verified ? <Check size={12} /> : <Lock size={11} />}
                  {s}
                </span>
              );
            })}
          </div>
        </Card>
      )}
    </PageShell>
  );
}