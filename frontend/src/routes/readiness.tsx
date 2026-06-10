import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Briefcase, MessageSquare, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/growth/page-header";
import { StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getReadinessSnapshot } from "@/lib/mock/readiness";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "Career Readiness · GrowthOS" },
      { name: "description", content: "Evidence-based readiness from your proof loop." },
    ],
  }),
  component: ReadinessPage,
});

function ReadinessPage() {
  const { state } = useGrowthState();
  const snapshot = getReadinessSnapshot(state);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <PageHeader
        label="CAREER PROOF"
        title="Readiness dashboard"
        description="Progress becomes defensible evidence — skills, projects, and interview prep."
        action={
          <Link
            to="/projects"
            className="text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)]"
          >
            View projects
          </Link>
        }
      />

      <section className="grid sm:grid-cols-4 gap-3">
        <StatCard
          icon={TrendingUp}
          label="Readiness"
          value={`${snapshot.overall}%`}
          progress={snapshot.overall / 100}
          accent="var(--completed)"
        />
        <StatCard
          icon={Award}
          label="Topics done"
          value={`${snapshot.completedTopics}/${snapshot.totalTopics}`}
          accent="var(--in-progress)"
        />
        <StatCard
          icon={Briefcase}
          label="Projects linked"
          value={snapshot.projectsSubmitted.toString()}
          accent="var(--available)"
        />
        <StatCard
          icon={TrendingUp}
          label="Streak"
          value={`${snapshot.streak} days`}
          accent="var(--in-progress)"
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-4">
        <h2 className="text-sm font-semibold">Skill radar · {snapshot.pathTitle}</h2>
        <div className="space-y-3">
          {snapshot.skills.map((skill) => (
            <div key={skill.skill}>
              <div className="flex justify-between text-sm mb-1">
                <span>{skill.skill}</span>
                <span className="font-mono text-muted-foreground">{skill.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--in-progress)] transition-all"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-1">{skill.evidence}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[var(--completed)]" />
            Resume bullets (draft)
          </h2>
          {snapshot.resumeBullets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete topics with proof to generate bullets.</p>
          ) : (
            <ul className="space-y-2">
              {snapshot.resumeBullets.map((bullet) => (
                <li key={bullet} className="text-sm text-muted-foreground leading-relaxed">
                  • {bullet}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5 md:p-6 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--in-progress)]" />
            Interview prep topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {snapshot.interviewTopics.map((topic) => (
              <span
                key={topic}
                className="text-xs px-2.5 py-1 rounded-md border border-border bg-[var(--surface-2)]"
              >
                {topic}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
