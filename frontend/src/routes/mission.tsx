import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Clock, Target } from "lucide-react";
import { DirectionCard, MissionButton } from "@/components/growth/direction-card";
import { PageHeader } from "@/components/growth/page-header";
import { StatCard } from "@/components/growth/shared";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFocusTopic } from "@/lib/focus-topic";
import { getTodayMission } from "@/lib/mock/daily-mission";

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
  const focusTopic = getFocusTopic(state, state.profile.path);

  if (!mission || !focusTopic) {
    return (
      <div className="growth-page space-y-8">
        <PageHeader
          label="TODAY'S MISSION"
          title="No active mission yet"
          description="Choose a path, then pick your first topic on the roadmap. One clear step builds more confidence than browsing ten courses."
        />
        <MissionButton to="/roadmap">
          Open roadmap
          <ArrowRight className="w-4 h-4" />
        </MissionButton>
      </div>
    );
  }

  const { topic } = mission;

  return (
    <div className="growth-page space-y-8">
      <PageHeader
        label="TODAY'S MISSION"
        title="Focused work for today"
        description="One topic, one session, four proof checks. That's how self-taught developers actually level up."
      />

      <DirectionCard
        focusTopic={focusTopic}
        reason={mission.reason}
        pathTitle={mission.pathTitle}
        estimatedMinutes={mission.estimatedMinutes}
        label="Today's focus"
      />

      <section className="grid sm:grid-cols-3 gap-3">
        <StatCard
          icon={Target}
          label="Path"
          value={mission.pathTitle}
          accent="var(--mission)"
        />
        <StatCard
          icon={Clock}
          label="Time budget"
          value={`~${mission.estimatedMinutes} min`}
          accent="var(--in-progress)"
        />
        <StatCard
          icon={CheckCircle2}
          label="Proof steps"
          value={`${mission.steps.filter((s) => s.done).length}/${mission.steps.length}`}
          progress={mission.steps.filter((s) => s.done).length / mission.steps.length}
          accent="var(--completed)"
        />
      </section>

      <section className="section-card p-5 md:p-6 space-y-4">
        <div>
          <div className="mission-label mb-1">Start here</div>
          <a
            href={mission.startResourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-lg font-semibold hover:text-amber-400/90 transition-colors"
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
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-[var(--surface)] hover:bg-[var(--surface-2)] text-left"
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

        <Link
          to="/topic/$topicId"
          params={{ topicId: topic.id }}
          search={{ from: "/mission" }}
          className="btn-mission btn-mission-sm inline-flex"
        >
          Open full desk
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      <section className="section-card p-5 md:p-6">
        <h2 className="text-sm font-semibold mb-3">What &quot;done&quot; looks like</h2>
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
