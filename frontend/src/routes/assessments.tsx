import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, PageHeader, Card, StatCard, Btn, Badge } from "@/components/growth-ui";
import { useGrowth } from "@/lib/growth-store";
import { TOPICS } from "@/lib/growth-data";

export const Route = createFileRoute("/assessments")({
  head: () => ({ meta: [{ title: "Assessments — GrowthOS" }, { name: "description", content: "Quizzes, attempts and review queue." }] }),
  component: AssessmentsPage,
});

type Tab = "available" | "attempted" | "review";

function AssessmentsPage() {
  const { state } = useGrowth();
  const [tab, setTab] = useState<Tab>("available");

  const stats = useMemo(() => {
    const attempts = Object.values(state.progress).filter((p) => p.quizScore != null);
    const avg = attempts.length ? Math.round(attempts.reduce((a, p) => a + (p.quizScore ?? 0), 0) / attempts.length) : 0;
    const review = attempts.filter((p) => (p.quizScore ?? 0) < 80).length;
    return { taken: attempts.length, avg, review };
  }, [state.progress]);

  const quizTopics = TOPICS.filter((t) => t.quiz.length > 0);
  const available = quizTopics.filter((t) => state.progress[t.id]?.quizScore == null);
  const attempted = quizTopics
    .map((t) => ({ t, p: state.progress[t.id] }))
    .filter((r) => r.p?.quizScore != null);
  const review = attempted.filter((r) => (r.p.quizScore ?? 0) < 80);

  return (
    <PageShell>
      <PageHeader kicker="Assessments" title="Quizzes & Reviews" subtitle="Prove what you've learned. Re-review where you wobbled." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Quizzes Taken" value={<span className="font-mono">{stats.taken}</span>} />
        <StatCard label="Average Score" value={<span className="font-mono">{stats.avg}%</span>} accent={stats.avg >= 70} />
        <StatCard label="Topics Needing Review" value={<span className="font-mono">{stats.review}</span>} />
      </div>

      <div className="flex border-b border-[#222] mb-4">
        {(["available", "attempted", "review"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={"px-4 py-2.5 text-sm capitalize border-b-2 transition-colors " + (tab === t ? "border-[#22c55e] text-[#f0f0f0]" : "border-transparent text-[#666] hover:text-[#f0f0f0]")}
          >
            {t === "review" ? "Review Queue" : t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {tab === "available" && available.map((t) => (
          <Card key={t.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{t.title}</div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mt-0.5 flex items-center gap-2">
                <Badge>{t.quiz.length} questions</Badge>
                <Badge tone={t.quiz.length > 3 ? "amber" : "blue"}>{t.quiz.length > 3 ? "Medium" : "Easy"}</Badge>
              </div>
            </div>
            <Link to="/topic/$topicId" params={{ topicId: t.id }}><Btn size="sm">Start quiz →</Btn></Link>
          </Card>
        ))}

        {tab === "attempted" && attempted.map(({ t, p }) => {
          const score = p.quizScore ?? 0;
          const passed = score >= 70;
          return (
            <Card key={t.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.title}</div>
                <div className="mt-0.5 text-xs font-mono">
                  <span className={passed ? "text-[#22c55e]" : "text-[#ef4444]"}>{Math.round(score / 100 * t.quiz.length)} / {t.quiz.length} · {score}%</span>
                  <span className="text-[#666] mx-2">·</span>
                  <Badge tone={passed ? "green" : "red"}>{passed ? "Pass" : "Fail"}</Badge>
                </div>
              </div>
              <Link to="/topic/$topicId" params={{ topicId: t.id }}><Btn variant="outline" size="sm">Retake</Btn></Link>
            </Card>
          );
        })}

        {tab === "review" && review.map(({ t, p }) => (
          <Card key={t.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{t.title}</div>
              <div className="text-xs text-[#999] mt-0.5">Low score on last attempt — re-read the basics, then retake.</div>
            </div>
            <Link to="/topic/$topicId" params={{ topicId: t.id }}><Btn size="sm">Review now →</Btn></Link>
          </Card>
        ))}

        {((tab === "available" && available.length === 0) ||
          (tab === "attempted" && attempted.length === 0) ||
          (tab === "review" && review.length === 0)) && (
          <div className="text-sm text-[#666] py-6 text-center">Nothing here yet.</div>
        )}
      </div>
    </PageShell>
  );
}