import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/growth/page-header";
import { StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getTodayMission } from "@/lib/mock/daily-mission";
import { inferSessionPhase } from "@/lib/session-phase";

export const Route = createFileRoute("/mission")({
  head: () => ({
    meta: [
      { title: "Today's Mission · GrowthOS" },
      { name: "description", content: "Your single focused mission for today." },
    ],
  }),
  component: MissionPage,
});

function MissionPage() {
  const { state, updateTopicCheck } = useGrowthState();
  const mission = getTodayMission(state);

  if (!mission) {
    return (
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8">
        <PageHeader
          label="TODAY'S MISSION"
          title="No active mission"
          description="Select a path in Settings and unlock a topic from the roadmap."
        />
        <Link
          to="/roadmap"
          className="inline-flex mt-6 items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-foreground text-background"
        >
          Open roadmap <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const { topic } = mission;
  const phase = inferSessionPhase(topic.checks);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <PageHeader
        label="TODAY'S MISSION"
        title={topic.title}
        description={mission.reason}
        action={
          <Link
            to="/topic/$topicId"
            params={{ topicId: topic.id }}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 inline-flex items-center gap-2 shadow-lg shadow-amber-900/20"
          >
            <Sparkles className="w-4 h-4" />
            Continue · {phase}
            <ArrowRight className="w-4 h-4" />
          </Link>
        }
      />

      <section className="grid sm:grid-cols-3 gap-3">
        <StatCard
          icon={Target}
          label="Path"
          value={mission.pathTitle}
          accent="var(--in-progress)"
        />
        <StatCard
          icon={Clock}
          label="Time budget"
          value={`~${mission.estimatedMinutes} min`}
          accent="var(--available)"
        />
        <StatCard
          icon={CheckCircle2}
          label="Proof steps"
          value={`${mission.steps.filter((s) => s.done).length}/${mission.steps.length}`}
          progress={mission.steps.filter((s) => s.done).length / mission.steps.length}
          accent="var(--completed)"
        />
      </section>

      <section className="rounded-lg border border-[var(--in-progress)]/40 bg-card p-5 md:p-6 space-y-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--in-progress)] mb-1">
            Start here
          </div>
          <a
            href={mission.startResourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-lg font-semibold hover:text-[var(--in-progress)] transition-colors"
          >
            {mission.startResourceTitle}
          </a>
        </div>

        <div className="space-y-2">
          {mission.steps.map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() =>
                updateTopicCheck(
                  topic.id,
                  step.id as "video" | "notes" | "quiz" | "commit",
                  !step.done,
                )
              }
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md border border-border bg-[var(--surface)] hover:bg-[var(--surface-2)] text-left"
            >
              <span
                className={`w-4 h-4 rounded-[4px] border grid place-items-center shrink-0 ${
                  step.done ? "bg-[var(--completed)] border-[var(--completed)]" : "border-border"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-3 h-3 text-background" strokeWidth={3} />
                ) : null}
              </span>
              <span className={`text-sm ${step.done ? "line-through text-muted-foreground" : ""}`}>
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-3">Expected proof outcomes</h2>
        <ul className="space-y-2">
          {mission.proofOutcomes.map((outcome) => (
            <li key={outcome} className="text-sm text-muted-foreground flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[var(--completed)] shrink-0 mt-0.5" />
              {outcome}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
