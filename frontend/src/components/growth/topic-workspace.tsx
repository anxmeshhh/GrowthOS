import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  ExternalLink,
  PlayCircle,
  Video,
  FileText,
} from "lucide-react";
import {
  CanvasPad,
  NotesEditor,
  QuizDrawer,
  StatusBadge,
} from "@/components/growth/shared";
import { ProofChecklist } from "@/components/growth/proof-checklist";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getCuratedResources } from "@/lib/mock/topic-resources";
import { getTopicResourceDirection } from "@/lib/roadmaps";

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function TopicWorkspace({
  topicId,
  backTo = "/roadmap",
}: {
  topicId: string;
  backTo?: string;
}) {
  const { state } = useGrowthState();
  const [tab, setTab] = useState<"notes" | "canvas">("notes");
  const [quizOpen, setQuizOpen] = useState(false);

  const topic = state.topics[topicId];
  const direction = getTopicResourceDirection(state.profile.path, topicId);
  const resources = useMemo(
    () => getCuratedResources(state.profile.path, topicId, topic?.title ?? "Topic"),
    [state.profile.path, topicId, topic?.title],
  );

  if (!topic) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Topic not found in your current path.</p>
        <Link to={backTo} className="text-sm text-[var(--in-progress)] mt-4 inline-block">
          ← Back to roadmap
        </Link>
      </div>
    );
  }

  const status = topic.status;

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <StatusBadge status={status} />
      </div>

      <header>
        <div className="text-xs font-mono text-[var(--in-progress)] font-bold tracking-wider mb-2">
          TOPIC WORKSPACE
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{topic.title}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          {direction?.moduleSummary || topic.meta}
        </p>
      </header>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-4">
          <ProofChecklist topicId={topicId} onStartQuiz={() => setQuizOpen(true)} />

          <div className="rounded-md border border-border bg-card p-4 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Best direction · curated resources
            </h3>
            <div className="space-y-2">
              {resources.map((resource) => (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 p-3 rounded-md border border-border bg-[var(--surface)] hover:bg-[var(--surface-2)] transition-colors group"
                >
                  <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--surface-2)] border border-border grid place-items-center shrink-0">
                    {resource.type === "video" ? (
                      <Video className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium group-hover:text-[var(--in-progress)] transition-colors">
                      {resource.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      {resource.why}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border">
                        {resource.source}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {resource.minutes} min
                      </span>
                      {resource.priority === "start-here" && (
                        <span className="text-[10px] font-mono text-[var(--available)]">
                          start here
                        </span>
                      )}
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {direction && (
            <div className="rounded-md border border-border bg-[var(--surface-2)] p-4 space-y-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                Study steps
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                {direction.studySteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="text-xs text-[var(--completed)] font-mono pt-1">
                Proof goal: {direction.proof}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setQuizOpen(true)}
            disabled={status === "locked"}
            className="w-full px-3 py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Take assessment quiz →
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden min-h-[520px] flex flex-col">
          <div className="aspect-video border-b border-border bg-[var(--surface-2)] grid place-items-center">
            <div className="text-center">
              <PlayCircle className="w-10 h-10 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground font-mono mt-2">
                Open a resource above — player placeholder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-4 pt-3 border-b border-border">
            <TabBtn active={tab === "notes"} onClick={() => setTab("notes")}>
              Notes
            </TabBtn>
            <TabBtn active={tab === "canvas"} onClick={() => setTab("canvas")}>
              Draw Canvas
            </TabBtn>
          </div>
          <div className="flex-1 min-h-[320px] flex flex-col">
            {tab === "notes" ? <NotesEditor topicId={topicId} /> : <CanvasPad topicId={topicId} />}
          </div>
        </div>
      </div>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={topicId} />
    </div>
  );
}
