import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Pencil,
  PenLine,
  Play,
  Video,
} from "lucide-react";
import {
  CanvasPad,
  NotesEditor,
  QuizDrawer,
} from "@/components/growth/shared";
import { ProofChecklist } from "@/components/growth/proof-checklist";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getBuildChallenge } from "@/lib/mock/build-challenges";
import { getBestStartResource, getCuratedResources } from "@/lib/mock/topic-resources";
import { getTopicResourceDirection } from "@/lib/roadmaps";

type PageMode = "write" | "sketch";

export function TopicWorkspace({
  topicId,
  backTo = "/roadmap",
}: {
  topicId: string;
  backTo?: string;
}) {
  const { state, updateTopicCheck } = useGrowthState();
  const [pageMode, setPageMode] = useState<PageMode>("write");
  const [quizOpen, setQuizOpen] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(true);
  const [activeResourceUrl, setActiveResourceUrl] = useState<string | null>(null);

  const topic = state.topics[topicId];
  const direction = getTopicResourceDirection(state.profile.path, topicId);
  const title = topic?.title ?? "Topic";
  const resources = useMemo(
    () => getCuratedResources(state.profile.path, topicId, title),
    [state.profile.path, topicId, title],
  );
  const startResource = getBestStartResource(resources);
  const buildChallenge = useMemo(() => getBuildChallenge(title), [title]);

  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => setFocusSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [focusRunning]);

  useEffect(() => {
    setActiveResourceUrl(startResource.url);
  }, [startResource.url]);

  if (!topic) {
    return (
      <div className="desk-shell min-h-screen grid place-items-center px-6">
        <div className="text-center max-w-md">
          <p className="desk-quiet">This topic could not be loaded.</p>
          <Link to={backTo} className="text-sm text-amber-400/90 mt-4 inline-block">
            ← Back to roadmap
          </Link>
        </div>
      </div>
    );
  }

  const checks = topic.checks;
  const focusMinutes = Math.floor(focusSeconds / 60);
  const focusSecs = focusSeconds % 60;

  const openResource = (url: string, markRead = false) => {
    setActiveResourceUrl(url);
    if (markRead) updateTopicCheck(topicId, "video", true);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const startStudying = () => {
    setFocusRunning(true);
    openResource(startResource.url, true);
  };

  return (
    <div className="desk-shell min-h-screen flex flex-col">
      {/* Quiet top bar — like a desk lamp, not a dashboard */}
      <header className="shrink-0 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-white/5">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-xs desk-quiet hover:text-[#e8e4dc] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>

        <div className="h-4 w-px bg-white/10 hidden sm:block" />

        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest desk-quiet">Your desk</p>
          <h1 className="text-sm md:text-base font-medium truncate text-[#f0ebe3]">
            {topic.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs desk-quiet">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">
            {String(focusMinutes).padStart(2, "0")}:{String(focusSecs).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => setFocusRunning((r) => !r)}
            className="px-2 py-0.5 rounded border border-white/10 hover:bg-white/5 text-[10px] uppercase tracking-wide"
          >
            {focusRunning ? "Pause" : "Focus"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setQuizOpen(true)}
          disabled={topic.status === "locked"}
          className="text-xs px-3 py-1.5 rounded-md bg-[#f0ebe3] text-[#1c1916] hover:bg-white disabled:opacity-40 font-medium"
        >
          Quick check
        </button>
      </header>

      {/* Main desk area */}
      <div className="flex-1 flex min-h-0">
        {/* Left guides — bookmarks on the desk edge */}
        <aside
          className={`shrink-0 border-r border-white/5 transition-all duration-200 overflow-hidden hidden md:flex flex-col ${
            guidesOpen ? "w-64" : "w-10"
          }`}
        >
          <button
            type="button"
            onClick={() => setGuidesOpen((o) => !o)}
            className="shrink-0 flex items-center justify-center h-10 border-b border-white/5 desk-quiet hover:text-[#e8e4dc] hover:bg-white/5"
            title={guidesOpen ? "Hide guides" : "Show guides"}
          >
            {guidesOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {guidesOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div>
                <button
                  type="button"
                  onClick={startStudying}
                  className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-md bg-amber-700/80 text-amber-50 hover:bg-amber-700"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start with {startResource.title.split(" ").slice(0, 3).join(" ")}…
                </button>
              </div>

              <div>
                <h2 className="text-[10px] uppercase tracking-wider desk-quiet mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Read & watch
                </h2>
                <div className="space-y-1.5">
                  {resources.map((resource, index) => {
                    const isActive = activeResourceUrl === resource.url;
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => openResource(resource.url, index === 0)}
                        className={`w-full text-left px-2.5 py-2 rounded text-xs transition-colors ${
                          isActive
                            ? "bg-amber-900/30 text-amber-100 border border-amber-700/40"
                            : "text-[#c4bdb3] hover:bg-white/5 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {resource.type === "video" ? (
                            <Video className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                          ) : (
                            <FileText className="w-3 h-3 shrink-0 mt-0.5 opacity-60" />
                          )}
                          <span className="leading-snug line-clamp-2">{resource.title}</span>
                        </div>
                        {resource.priority === "start-here" && (
                          <span className="text-[9px] text-amber-400/80 mt-1 block pl-5">
                            Start here
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {direction && (
                <div>
                  <h2 className="text-[10px] uppercase tracking-wider desk-quiet mb-2">
                    How to study this
                  </h2>
                  <ol className="text-[11px] desk-quiet space-y-1.5 list-decimal list-inside leading-relaxed">
                    {direction.studySteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="rounded-md border border-white/8 p-2.5 bg-white/[0.02]">
                <h2 className="text-[10px] uppercase tracking-wider desk-quiet mb-1.5">
                  Build something small
                </h2>
                <p className="text-xs text-[#d4cdc4]">{buildChallenge.title}</p>
                <p className="text-[10px] desk-quiet mt-1 leading-relaxed">
                  {buildChallenge.description}
                </p>
                <button
                  type="button"
                  onClick={() => updateTopicCheck(topicId, "commit", !checks.commit)}
                  className="mt-2 w-full text-[10px] py-1.5 rounded border border-white/10 hover:bg-white/5 text-[#c4bdb3]"
                >
                  {checks.commit ? "Done ✓" : "Mark as done"}
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Center: the paper */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 p-4 md:p-6 lg:p-8">
          <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
            {/* Paper sheet */}
            <div className="paper-sheet flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Pen / pencil toggle on the page margin */}
              <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-1 border-b border-[var(--paper-line)]">
                <button
                  type="button"
                  onClick={() => setPageMode("write")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    pageMode === "write"
                      ? "bg-[var(--paper-line)] text-[var(--paper-ink)]"
                      : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                  }`}
                >
                  <PenLine className="w-3.5 h-3.5" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setPageMode("sketch")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                    pageMode === "sketch"
                      ? "bg-[var(--paper-line)] text-[var(--paper-ink)]"
                      : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Sketch
                </button>

                {activeResourceUrl && (
                  <a
                    href={activeResourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--paper-muted)] hover:text-[var(--paper-ink)] max-w-[45%] truncate"
                  >
                    <span className="truncate">
                      Reading: {resources.find((r) => r.url === activeResourceUrl)?.title ?? "Resource"}
                    </span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}
              </div>

              <div className="flex-1 min-h-[420px] flex flex-col">
                {pageMode === "write" ? (
                  <NotesEditor topicId={topicId} variant="paper" autoFocus />
                ) : (
                  <CanvasPad topicId={topicId} variant="paper" />
                )}
              </div>
            </div>

            {/* Progress strip below the page */}
            <div className="shrink-0 mt-4 space-y-2">
              <ProofChecklist
                topicId={topicId}
                variant="desk"
                onStartQuiz={() => setQuizOpen(true)}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile guides */}
      <div className="md:hidden border-t border-white/5 p-4 space-y-3">
        <button
          type="button"
          onClick={startStudying}
          className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-md bg-amber-700/80 text-amber-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Start studying
        </button>
        <ProofChecklist topicId={topicId} variant="desk" onStartQuiz={() => setQuizOpen(true)} />
      </div>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={topicId} />
    </div>
  );
}
