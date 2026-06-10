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
  Layers,
  Github,
} from "lucide-react";
import { CaptureDesk } from "@/components/growth/capture-desk";
import { ExplainBackCard } from "@/components/growth/explain-back-card";
import { ProofChecklist } from "@/components/growth/proof-checklist";
import { ResourcePanel } from "@/components/growth/resource-panel";
import { FlashcardsSandbox } from "@/components/growth/flashcards-sandbox";
import { GitBuildProof } from "@/components/growth/git-build-proof";
import { SessionStepper } from "@/components/growth/session-stepper";
import { FlowStrip } from "@/components/growth/direction-card";
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

const MOTIVATIONAL_QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Focus is a muscle, and you build it by using it.", author: "Unknown" },
  { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
  { text: "Make it work, make it right, make it fast.", author: "Kent Beck" },
  { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
  { text: "Consistency beats intensity. Show up every day.", author: "Unknown" },
];

type PageMode = "write" | "sketch" | "capture" | "flashcards" | "build";

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
    incrementStudySessionsCount,
  } = useGrowthState();

  const [pageMode, setPageMode] = useState<PageMode>("write");
  const [quizOpen, setQuizOpen] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(0);
  const [focusRunning, setFocusRunning] = useState(false);
  const [guidesOpen, setGuidesOpen] = useState(true);
  const [resourcePanelOpen, setResourcePanelOpen] = useState(true);

  // Focus Mode & Quote States
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeQuote, setActiveQuote] = useState<{ text: string; author: string } | null>(null);
  const [showQuote, setShowQuote] = useState(false);

  const topic = state.topics[topicId];
  const direction = getTopicResourceDirection(state.profile.path, topicId);
  const title = topic?.title ?? "Topic";
  const resources = useMemo(
    () => getCuratedResources(state.profile.path, topicId, title),
    [state.profile.path, topicId, title],
  );
  const startResource = resources.length > 0 ? getBestStartResource(resources) : null;
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
    topic?.activeResourceUrl ?? (startResource ? startResource.url : null);
  const activeResource = activeResourceUrl
    ? (allResources.find((r) => r.url === activeResourceUrl) ?? allResources[0] ?? null)
    : (allResources[0] ?? null);

  const sessionPhase: SessionPhase =
    topic?.sessionPhase && topic.sessionPhase !== "done"
      ? topic.sessionPhase
      : topic
        ? inferSessionPhase(topic.checks)
        : "read";

  const triggerMotivationalQuote = () => {
    const randomIdx = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setActiveQuote(MOTIVATIONAL_QUOTES[randomIdx]);
    setShowQuote(true);
  };

  useEffect(() => {
    if (!focusRunning) return;
    const id = window.setInterval(() => setFocusSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [focusRunning]);

  useEffect(() => {
    if (topic && !topic.activeResourceUrl && startResource) {
      setActiveResource(topicId, startResource.url);
    }
  }, [topicId, startResource, topic, setActiveResource]);

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

  // Handle quote auto-dismiss
  useEffect(() => {
    if (!showQuote) return;
    const timer = window.setTimeout(() => {
      setShowQuote(false);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [showQuote]);

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

  const openResource = (url: string | null, markRead = false, preventPopup = false) => {
    setActiveResource(topicId, url);
    if (!url) return;
    setResourcePanelOpen(true);
    if (markRead) updateTopicCheck(topicId, "video", true);
    const embeddable = /youtube\.com|youtu\.be/.test(url);
    if (!embeddable && !preventPopup) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const startStudying = () => {
    incrementStudySessionsCount();
    setFocusRunning(true);
    setSessionPhase(topicId, "read");
    setIsFocusMode(true);
    triggerMotivationalQuote();
    openResource(activeResourceUrl, true, true);
  };

  const handlePhaseChange = (phase: SessionPhase) => {
    setSessionPhase(topicId, phase);
    if (phase === "check") setQuizOpen(true);
  };

  const handleProceed = () => {
    if (sessionPhase === "read") {
      updateTopicCheck(topicId, "video", true);
      setSessionPhase(topicId, "write");
    } else if (sessionPhase === "write") {
      updateTopicCheck(topicId, "notes", true);
      setSessionPhase(topicId, "check");
      setQuizOpen(true);
    } else if (sessionPhase === "check") {
      updateTopicCheck(topicId, "quiz", true);
      setSessionPhase(topicId, "build");
    } else if (sessionPhase === "build") {
      updateTopicCheck(topicId, "commit", true);
    }
  };

  const resourcePanelWidth = 38;

  return (
    <div className="desk-shell min-h-screen flex flex-col relative">
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
          <p className="text-[10px] uppercase tracking-widest desk-quiet">Map → Desk → Proof</p>
          <h1 className="text-sm md:text-base font-medium truncate text-[#f0ebe3]">
            {topic.title}
            {isFocusMode && <span className="ml-2 text-xs font-normal text-amber-400">(Focus Mode)</span>}
          </h1>
          {!isFocusMode && (
            <div className="hidden md:block mt-0.5 opacity-60 scale-[0.92] origin-left">
              <FlowStrip compact />
            </div>
          )}
        </div>
        
        {/* Study Sessions Count */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-amber-300/80 px-2 py-0.5 rounded bg-white/5 border border-white/5">
          <span>Sessions: {state.studySessionsCount ?? 0}</span>
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

        {/* Zen Focus Mode Button */}
        <button
          type="button"
          onClick={() => {
            setIsFocusMode((f) => !f);
            if (!isFocusMode) {
              triggerMotivationalQuote();
            }
          }}
          className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-wide font-medium transition-colors ${
            isFocusMode
              ? "bg-amber-700 text-amber-50 hover:bg-amber-600"
              : "border border-white/10 hover:bg-white/5 text-[#c4bdb3]"
          }`}
        >
          {isFocusMode ? "Exit Focus" : "Zen Focus"}
        </button>

        {!isFocusMode && (
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
        )}
      </header>

      {!isFocusMode && (
        <SessionStepper
          phase={sessionPhase}
          checks={checks}
          onPhaseChange={handlePhaseChange}
          onProceed={handleProceed}
        />
      )}

      <div className="flex-1 flex min-h-0">
        {!isFocusMode && (
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
                    Study references
                  </h2>
                  <div className="space-y-1.5">
                    {allResources.length === 0 ? (
                      <p className="text-[11px] desk-quiet italic px-2">No references added yet. Add a custom link above if needed.</p>
                    ) : (
                      allResources.map((resource, index) => {
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
                      })
                    )}
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
                  </div>
                )}
              </div>
            )}
          </aside>
        )}

        <main className="flex-1 flex min-w-0 min-h-0">
          {!isFocusMode && resourcePanelOpen && sessionPhase === "read" && activeResource && (
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
            <div className={`flex-1 flex flex-col min-h-0 ${isFocusMode ? "max-w-5xl" : "max-w-4xl"} mx-auto w-full`}>
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
                  <button
                    type="button"
                    onClick={() => setPageMode("flashcards")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                      pageMode === "flashcards"
                        ? "bg-[var(--paper-line)] text-[var(--paper-ink)]"
                        : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Flashcards
                  </button>
                  <button
                    type="button"
                    onClick={() => setPageMode("build")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                      pageMode === "build"
                        ? "bg-[var(--paper-line)] text-[var(--paper-ink)]"
                        : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                    }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    Build Proof
                  </button>

                  {!isFocusMode && activeResource && (
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
                      {(sessionPhase === "write" || sessionPhase === "read" || isFocusMode) && (
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
                  {pageMode === "flashcards" && (
                    <div className="p-5">
                      <FlashcardsSandbox topicId={topicId} topicTitle={title} />
                    </div>
                  )}
                  {pageMode === "build" && (
                    <div className="p-5">
                      <GitBuildProof topicId={topicId} topicTitle={title} />
                    </div>
                  )}
                </div>
              </div>

              {!isFocusMode && (
                <div className="shrink-0 mt-4">
                  <ProofChecklist
                    topicId={topicId}
                    variant="desk"
                    onStartQuiz={() => setQuizOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {!isFocusMode && (
        <div className="md:hidden border-t border-white/5 p-4 space-y-3">
          <UserResourceForm topicId={topicId} />
          <ProofChecklist topicId={topicId} variant="desk" onStartQuiz={() => setQuizOpen(true)} />
        </div>
      )}

      <QuizDrawer open={quizOpen} onClose={() => setQuizOpen(false)} topicId={topicId} />

      {/* Motivational Quote Toast (top right) */}
      {showQuote && activeQuote && (
        <div className="fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-white/10 bg-[#1c1916]/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Zen Motivation</span>
            <button
              type="button"
              onClick={() => setShowQuote(false)}
              className="text-white/40 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <p className="mt-1.5 text-xs text-[#e8e4dc] leading-relaxed italic font-serif">
            "{activeQuote.text}"
          </p>
          <p className="mt-1 text-[10px] text-right text-amber-300/60 font-mono">
            — {activeQuote.author}
          </p>
        </div>
      )}
    </div>
  );
}
