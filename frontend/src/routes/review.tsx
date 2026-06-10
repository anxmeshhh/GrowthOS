import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Calendar, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/growth/page-header";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getReviewQueue } from "@/lib/mock/review-queue";

const SOURCE_LABELS = {
  quiz_mistake: "Quiz mistake",
  weak_notes: "Weak notes",
  spaced_repetition: "Spaced repetition",
  skipped_proof: "Skipped proof",
};

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review Queue · GrowthOS" },
      { name: "description", content: "Weak areas and topics due for revision." },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  const { state } = useGrowthState();
  const items = getReviewQueue(state);
  const due = items.filter((item) => item.status === "due");
  const scheduled = items.filter((item) => item.status === "scheduled");

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <PageHeader
        label="REVIEW LOOP"
        title="Topics to revisit"
        description="GrowthOS remembers weak spots from quizzes, notes, and spaced repetition."
      />

      <section className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-2xl font-semibold">{due.length}</div>
          <div className="text-xs font-mono text-muted-foreground uppercase mt-1">Due today</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-2xl font-semibold">{scheduled.length}</div>
          <div className="text-xs font-mono text-muted-foreground uppercase mt-1">Scheduled</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--in-progress)]" />
          Due now
        </h2>
        {due.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 rounded-md border border-border bg-card">
            No reviews due. Keep completing missions with proof.
          </p>
        ) : (
          due.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))
        )}
      </section>

      {scheduled.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Coming up
          </h2>
          {scheduled.map((item) => (
            <ReviewCard key={item.id} item={item} />
          ))}
        </section>
      )}
    </div>
  );
}

function ReviewCard({
  item,
}: {
  item: ReturnType<typeof getReviewQueue>[number];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-md border border-border bg-card">
      <div className="min-w-0">
        <div className="font-medium text-sm">{item.topicTitle}</div>
        <div className="text-xs text-muted-foreground mt-1">{item.prompt}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-border text-muted-foreground">
            {SOURCE_LABELS[item.source]}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            due {item.dueDate} · every {item.intervalDays}d
          </span>
        </div>
      </div>
      <Link
        to="/topic/$topicId"
        params={{ topicId: item.topicId }}
        className="text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] inline-flex items-center gap-1.5 shrink-0"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Review topic
      </Link>
    </div>
  );
}
