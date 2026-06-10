import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Camera,
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
import { CaptureDesk } from "@/components/growth/capture-desk";
import { ExplainBackCard } from "@/components/growth/explain-back-card";
import { ProofChecklist } from "@/components/growth/proof-checklist";
import { ResourcePanel } from "@/components/growth/resource-panel";
import { SessionStepper } from "@/components/growth/session-stepper";
import { inferSessionPhase } from "@/lib/session-phase";
import {
  CanvasPad,
  NotesEditor,
  QuizDrawer,
} from "@/components/growth/shared";
import { UserResourceForm } from "@/components/growth/user-resource-form";
import { useGrowthState, type SessionPhase } from "@/hooks/use-growth-state";
import { getBuildChallenge } from "@/lib/mock/build-challenges";
import { getBestStartResource, getCuratedResources } from "@/lib/mock/topic-resources";
import { getTopicResourceDirection } from "@/lib/roadmaps";

type PageMode = "write" | "sketch" | "capture";

export function TopicWorkspace({
  topicId,
  backTo = "/roadmap",
  roadmapNodeId,
}: {
  topicId: string;
  backTo?: string;
  roadmapNodeId?: string;
}) {
  const {
    state,
    updateTopicCheck,
    setActiveResource,
    setSessionPhase,
    saveCaptureWorkflow,
  } = useGrowthState();

  const [pageMode, setPageMode] = useState<PageMode>("write");
  const [quizOpen, setQuizOpen] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(true);
  const [resourcePanelOpen, setResourcePanelOpen] = useState(true);

  const topic = state.topics[topicId];
  const direction = getTopicResourceDirection(state.profile.path, topicId);
  const title = topic?.title ?? "Topic";
  const resources = useMemo(
    () => getCuratedResources(state.profile.path, topicId, title),
    [state.profile.path, topicId, title],
  );
  const startResource = getBestStartResource(resources);
  const buildChallenge = useMemo(() => getBuildChallenge(title), [title]);
  const userResources = topic?.userResources ?? [];
  const allResources = useMemo(
    () => [
      ...userResources.map((r) => ({
        id: r.id,
        title: r.title,
        url: r.url,
        type: r.type as "video" | "article" | "docs" | "course" | "official",
        isUser: true,
      })),
      ...resources.map((r) => ({ ...r, isUser: false })),
    ],
    [userResources, resources],
  );

  const activeResourceUrl =
    topic?.activeResourceUrl ?? startResource.url;
  const activeResource =
    allResources.find((r) => r.url === activeResourceUrl) ?? allResources[0];

  const sessionPhase: SessionPhase =
    topic?.sessionPhase && topic.sessionPhase !== "done"
      ? topic.sessionPhase
      : topic
        ? inferSessionPhase(topic.checks)
        : "read";

  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => setFocusSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [focusRunning]);

  useEffect(() => {
    if (topic && !topic.activeResourceUrl) {
      setActiveResource(topicId, startResource.url);
    }
  }, [topicId, startResource.url, topic, setActiveResource]);

  useEffect(() => {
    if (roadmapNodeId && topic && !topic.roadmapNodeId) {
      /* node id stored on navigate via openTopicFromNodeId */
    }
  }, [roadmapNodeId, topic]);

  useEffect(() => {
    if (!topic) return;
    const inferred = inferSessionPhase(topic.checks);
    if (topic.sessionPhase === "read" && inferred !== "read") {
      setSessionPhase(topicId, inferred);
    }
  }, [topic?.checks, topicId, topic, setSessionPhase]);

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
    setActiveResource(topicId, url);
    setResourcePanelOpen(true);
    if (markRead) updateTopicCheck(topicId, "video", true);
    const embeddable = /youtube\.com|youtu\.be/.test(url);
    if (!embeddable) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const startStudying = () => {
    setFocusRunning(true);
    setSessionPhase(topicId, "read");
    openResource(activeResourceUrl, true);
  };

  const handlePhaseChange = (phase: SessionPhase) => {
    setSessionPhase(topicId, phase);
    if (phase === "check") setQuizOpen(true);
  };

  const resourcePanelWidth = 38;

  return (
    <div className="desk-shell min-h-screen flex flex-col">
      <header className="shrink-0 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 border-b border-white/5">
        <Link
          to={backTo}
          search={topic.roadmapNodeId ? { highlight: topic.roadmapNodeId } : undefined}
          className="inline-flex items-center gap-1.5 text-xs desk-quiet hover:text-[#e8e4dc] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10 hidden sm:block" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-widest desk-quiet">Your desk</p>
          <h1 className="text-sm md:text-base font-medium truncate text-[#f0ebe3]">{topic.title}</h1>
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
          onClick={() => {
            setSessionPhase(topicId, "check");
            setQuizOpen(true);
          }}
          disabled={topic.status === "locked"}
          className="text-xs px-3 py-1.5 rounded-md bg-[#f0ebe3] text-[#1c1916] hover:bg-white disabled:opacity-40 font-medium"
        >
          Quick check
        </button>
      </header>

      <SessionStepper phase={sessionPhase} checks={checks} onPhaseChange={handlePhaseChange} />

      <div className="flex-1 flex min-h-0">
        <aside
          className={`shrink-0 border-r border-white/5 transition-all duration-200 overflow-hidden hidden md:flex flex-col ${
            guidesOpen ? "w-64" : "w-10"
          }`}
        >
          <button
            type="button"
            onClick={() => setGuidesOpen((o) => !o)}
            className="shrink-0 flex items-center justify-center h-10 border-b border-white/5 desk-quiet hover:text-[#e8e4dc] hover:bg-white/5"
          >
            {guidesOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {guidesOpen && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <UserResourceForm topicId={topicId} />
              <button
                type="button"
                onClick={startStudying}
                className="w-full flex items-center justify-center gap-2 text-xs font-medium px-3 py-2.5 rounded-md bg-amber-700/80 text-amber-50 hover:bg-amber-700"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start studying
              </button>

              <div>
                <h2 className="text-[10px] uppercase tracking-wider desk-quiet mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  Read & watch
                </h2>
                <div className="space-y-1.5">
                  {allResources.map((resource, index) => {
                    const isActive = activeResourceUrl === resource.url;
                    return (
                      <button
                        key={resource.id}
                        type="button"
                        onClick={() => openResource(resource.url, index === 0 && !resource.isUser)}
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
                          <span className="leading-snug line-clamp-2">
                            {resource.isUser && "★ "}
                            {resource.title}
                          </span>
                        </div>
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

              {sessionPhase === "build" && (
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
              )}
            </div>
          )}
        </aside>

        <main className="flex-1 flex min-w-0 min-h-0">
          {resourcePanelOpen && sessionPhase === "read" && activeResource && (
            <div
              className="shrink-0 hidden lg:flex flex-col min-h-0 border-r border-white/5"
              style={{ width: `${resourcePanelWidth}%`, maxWidth: "480px", minWidth: "240px" }}
            >
              <ResourcePanel
                url={activeResource.url}
                title={activeResource.title}
                onClose={() => setResourcePanelOpen(false)}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 min-h-0 p-4 md:p-6 overflow-hidden">
            <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full">
              <div className="paper-sheet flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-1 border-b border-[var(--paper-line)] flex-wrap">
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
                  <button
                    type="button"
                    onClick={() => setPageMode("capture")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                      pageMode === "capture"
                        ? "bg-[var(--paper-line)] text-[var(--paper-ink)]"
                        : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Capture
                  </button>

                  {activeResource && (
                    <button
                      type="button"
                      onClick={() => setResourcePanelOpen((o) => !o)}
                      className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--paper-muted)] hover:text-[var(--paper-ink)] max-w-[45%] truncate lg:hidden"
                    >
                      <span className="truncate">Reading: {activeResource.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-[320px] flex flex-col overflow-y-auto">
                  {pageMode === "write" && (
                    <>
                      <NotesEditor topicId={topicId} variant="paper" autoFocus />
                      {(sessionPhase === "write" || sessionPhase === "read") && (
                        <div className="p-4 border-t border-[var(--paper-line)]">
                          <ExplainBackCard topicId={topicId} topicTitle={title} />
                        </div>
                      )}
                    </>
                  )}
                  {pageMode === "sketch" && <CanvasPad topicId={topicId} variant="paper" />}
                  {pageMode === "capture" && (
                    <CaptureDesk
                      topicId={topicId}
                      workflow={topic.captureWorkflow}
                      onSave={(wf) => saveCaptureWorkflow(topicId, wf)}
                    />
                  )}
                </div>
              </div>

              <div className="shrink-0 mt-4">
                <ProofChecklist
                  topicId={topicId}
                  variant="desk"
                  onStartQuiz={() => setQuizOpen(true)}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden border-t border-white/5 p-4 space-y-3">
        <UserResourceForm topicId={topicId} />
        <ProofChecklist topicId={topicId} variant="desk" onStartQuiz={() => setQuizOpen(true)} />
      </div>

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={topicId} />
    </div>
  );
}
