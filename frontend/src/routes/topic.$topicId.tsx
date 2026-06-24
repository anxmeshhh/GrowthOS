import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Pause,
  Play,
  ExternalLink,
  FileText,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  Clipboard,
  X,
  Trash2,
  Maximize2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Github,
  Zap,
  BookOpen,
  Layers,
  Hammer,
  Plus,
  RotateCcw,
  GitBranch,
  Sparkles,
  Headphones,
  MessageSquare,
  Circle,
  Info,
} from "lucide-react";
import { PageShell, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast-context";
import { useGrowth } from "@/lib/growth-store";

export const Route = createFileRoute("/topic/$topicId")({
  head: () => ({ meta: [{ title: `Workspace — GrowthOS` }] }),
  component: TopicWorkspace,
});

type Tab = "notes" | "flash" | "quiz" | "build" | "feynman";

/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */
function stripGeneratedAttachmentMarkdown(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => {
      const match = block.match(/^!?\[[^\]]*\]\(([^)]+)\)$/);
      if (!match) return true;
      return !/\/media\/(note_documents|screenshots)\//.test(match[1]);
    })
    .join("\n\n");
}

/* ─────────────────────────────────────────────
   Mastery Checklist Component
───────────────────────────────────────────── */
function MasteryChecklist({ topic, checklist, onMarkComplete, isCompleted, isPending }: any) {
  const criteria = [
    { label: "Notes written", done: checklist?.notes },
    { label: "Flashcards generated", done: checklist?.flashcards },
    { label: "Quiz passed (≥70%)", done: checklist?.quiz },
    { label: "Feynman completed", done: checklist?.feynman },
    { label: "Project built", done: checklist?.project, optional: true },
  ];

  const metCount = criteria.filter((c) => !c.optional && c.done).length;
  const reqCount = criteria.filter((c) => !c.optional).length;
  const isReady = metCount >= 3;

  return (
    <div
      className="shrink-0 border-b px-4 py-2.5 sm:px-5"
      style={{
        background: "rgba(12,19,25,0.90)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em] font-mono flex items-center gap-2 mb-2"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            <CheckCircle2 size={11} style={{ color: "#3fb950" }} />
            Mastery Progress
            <span
              className="px-1.5 py-0.5 rounded-md text-[9px] font-mono"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#dde6ef",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {metCount}/{reqCount} Core
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {criteria.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs font-mono animate-criteria-pop"
                style={{
                  color: c.done ? "#3fb950" : "rgba(255,255,255,0.25)",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {c.done ? (
                  <CheckCircle2 size={11} style={{ filter: "drop-shadow(0 0 4px rgba(63,185,80,0.5))" }} />
                ) : (
                  <Circle size={11} />
                )}
                {c.label}
                {c.optional && (
                  <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>(opt)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onMarkComplete}
          disabled={isCompleted || isPending}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-[0.12em] transition-all"
          style={
            isCompleted
              ? { background: "rgba(63,185,80,0.08)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.2)", cursor: "default" }
              : isReady
              ? { background: "rgba(63,185,80,0.1)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.3)", boxShadow: "0 0 14px rgba(63,185,80,0.1)" }
              : { background: "rgba(227,167,38,0.08)", color: "#e3a726", border: "1px solid rgba(227,167,38,0.2)" }
          }
        >
          {isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
          <span>{isCompleted ? "Completed" : isReady ? "Mark Complete" : "Mark Anyway"}</span>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Workspace
───────────────────────────────────────────── */
function TopicWorkspace() {
  const { topicId } = useParams({ from: "/topic/$topicId" });
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/`);
      if (!res.ok) {
        const titleFromSlug = topicId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        return {
          topic: { id: topicId, title: titleFromSlug, slug: topicId, summary: "" },
          progress: { status: "available" },
          materials: [],
          _stub: true,
        };
      }
      return res.json();
    },
  });

  const { state } = useGrowth();

  const [tab, setTab] = useState<Tab>("notes");
  const [focusRadioEnabled, setFocusRadioEnabled] = useState(false);

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  const [showCommitModal, setShowCommitModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);

  const { data: githubRepos = [] } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      const res = await apiFetch(`/github/repos/`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.repos || [];
    },
    enabled: showCommitModal, // Only fetch when modal is opened
  });

  useEffect(() => {
    if (data?.topic?.path_github_repo_name) {
      setRepoName(data.topic.path_github_repo_name);
    }
  }, [data?.topic?.path_github_repo_name]);

  const { data: screenshots = [], refetch: refetchScreenshots } = useQuery({
    queryKey: ["screenshots", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/screenshots/`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const uploadScreenshotMutation = useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      const formData = new FormData();
      formData.append("image", file);
      if (caption) formData.append("caption", caption);
      const res = await apiFetch(`/topics/${topicId}/screenshots/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: (data) => {
      refetchScreenshots();
      window.dispatchEvent(new CustomEvent("screenshot_uploaded", { detail: data }));
    },
  });

  const deleteScreenshotMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/topics/${topicId}/screenshots/?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => refetchScreenshots(),
  });

  const markDoneMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/progress/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to mark as done");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["custom-paths"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
    },
  });

  const commitGitHubMutation = useMutation({
    mutationFn: async (customRepoName?: string) => {
      const res = await apiFetch(`/github/workspace/commit/`, {
        method: "POST",
        body: JSON.stringify({
          topic_slug: topicId,
          ...(customRepoName ? { repo_name: customRepoName } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to commit to GitHub");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setShowCommitModal(false);
      showToast("Successfully committed to GitHub Workspace!", "success");
      // Open the exact folder in GitHub where the notes/images landed
      window.open(data.repo_url, "_blank");
    },
    onError: (err: any) => {
      showToast(err.message, "error");
    },
  });

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) uploadScreenshotMutation.mutate({ file, caption: "" });
          break;
        }
      }
    },
    [topicId],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  if (isLoading)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#070c12" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.2)" }}
          >
            <Loader2 size={20} className="animate-spin" style={{ color: "#3fb950" }} />
          </div>
          <span
            className="font-mono uppercase tracking-[0.25em] text-xs"
            style={{ color: "#6b7785" }}
          >
            Loading workspace
          </span>
        </div>
      </div>
    );

  if (!data)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#070c12" }}
      >
        <div className="text-sm font-mono" style={{ color: "#f85149" }}>Error loading topic.</div>
      </div>
    );

  const { topic, progress, materials } = data;
  const isCompleted = progress?.status === "completed";

  const handleScreenshotFiles = (files: FileList | File[]) => {
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        uploadScreenshotMutation.mutate({ file, caption: "" });
      }
    }
  };

  const checklist = data.mastery_checklist || {};
  const isFlashUnlocked = checklist.notes;
  const isQuizUnlocked = isFlashUnlocked && checklist.flashcards;
  const isFeynmanUnlocked = isQuizUnlocked && checklist.quiz;
  const isBuildUnlocked = isFeynmanUnlocked && checklist.feynman;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; done: boolean; locked: boolean }[] = [
    { id: "notes", label: "Notes", icon: <BookOpen size={16} />, done: checklist.notes, locked: false },
    { id: "flash", label: "Flashcards", icon: <Layers size={16} />, done: checklist.flashcards, locked: !isFlashUnlocked },
    { id: "quiz", label: "Quiz", icon: <Zap size={16} />, done: checklist.quiz, locked: !isQuizUnlocked },
    { id: "feynman", label: "Feynman", icon: <MessageSquare size={16} />, done: checklist.feynman, locked: !isFeynmanUnlocked },
    { id: "build", label: "Build", icon: <Hammer size={16} />, done: checklist.project, locked: !isBuildUnlocked },
  ];

  return (
    <main
      className="flex flex-col h-[calc(100dvh-3rem)] lg:h-screen overflow-hidden"
      style={{ background: "#070c12" }}
    >
      {/* ── Header ── */}
      <header
        className="shrink-0 z-20"
        style={{
          background: "rgba(12,19,25,0.95)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Nav row */}
        <div className="h-14 px-4 sm:px-5 flex items-center gap-3.5">
          <Link
            to="/roadmap"
            className="flex items-center gap-1.5 transition-colors shrink-0"
            style={{ color: "#6b7785" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#dde6ef")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7785")}
          >
            <ArrowLeft size={14} />
            <span className="text-xs font-mono tracking-[0.15em] uppercase hidden sm:block">Back</span>
          </Link>

          <div
            className="w-px h-4 shrink-0"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />

          <div className="min-w-0 flex-1 flex items-center gap-3">
            <div>
              <div
                className="text-[15px] font-semibold tracking-[-0.01em] truncate flex items-center gap-2"
                style={{ color: "#dde6ef" }}
              >
                {topic.title}
                <button
                  onClick={() => setShowWorkflowModal(true)}
                  className="transition-colors shrink-0"
                  title="How this workspace works"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#3fb950")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}
                >
                  <Info size={15} />
                </button>
              </div>
              {topic.mastery_score !== undefined && (
                <div className="text-[10px] font-mono" style={{ color: "#6b7785" }}>
                  Mastery score: {topic.mastery_score}/100
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFocusRadioEnabled(!focusRadioEnabled)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-[0.12em] transition-all"
              style={
                focusRadioEnabled
                  ? { background: "rgba(188,140,255,0.1)", color: "#bc8cff", border: "1px solid rgba(188,140,255,0.25)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#6b7785", border: "1px solid rgba(255,255,255,0.08)" }
              }
            >
              <Headphones size={11} className={focusRadioEnabled ? "animate-pulse" : ""} />
              <span className="hidden sm:inline">Radio</span>
            </button>

            {focusRadioEnabled && (
              <iframe width="0" height="0"
                src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0"
                frameBorder="0" allow="autoplay" className="hidden"
              />
            )}

            <button
              onClick={() => setShowCommitModal(true)}
              disabled={commitGitHubMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-[0.12em] transition-all"
              style={{ background: "rgba(255,255,255,0.04)", color: "#6b7785", border: "1px solid rgba(255,255,255,0.08)" }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = "#4d9de0";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,157,224,0.25)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = "#6b7785";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {commitGitHubMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <GitBranch size={11} />}
              <span className="hidden sm:inline">Commit</span>
            </button>

            <button
              onClick={() => markDoneMutation.mutate()}
              disabled={isCompleted || markDoneMutation.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-[0.12em] transition-all"
              style={
                isCompleted
                  ? { background: "rgba(63,185,80,0.08)", color: "#3fb950", border: "1px solid rgba(63,185,80,0.2)", cursor: "default", boxShadow: "0 0 12px rgba(63,185,80,0.1)" }
                  : { background: "rgba(255,255,255,0.04)", color: "#6b7785", border: "1px solid rgba(255,255,255,0.08)" }
              }
              onMouseEnter={e => {
                if (!isCompleted) {
                  (e.currentTarget as HTMLElement).style.color = "#3fb950";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(63,185,80,0.25)";
                }
              }}
              onMouseLeave={e => {
                if (!isCompleted) {
                  (e.currentTarget as HTMLElement).style.color = "#6b7785";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                }
              }}
            >
              {markDoneMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
              <span className="hidden sm:inline">{isCompleted ? "Completed" : "Done"}</span>
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div
          className="px-3 sm:px-4 flex items-center gap-0.5 overflow-x-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {TABS.map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (!t.locked) {
                    setTab(t.id);
                    queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
                    if (t.id === "flash") {
                      queryClient.invalidateQueries({ queryKey: ["flashcards", topicId] });
                    }
                    if (t.id === "quiz") {
                      queryClient.invalidateQueries({ queryKey: ["quiz", topicId] });
                    }
                  }
                }}
                disabled={t.locked}
                className="relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono uppercase tracking-[0.12em] transition-all border-b-2 shrink-0"
                style={
                  t.locked
                    ? { opacity: 0.25, cursor: "not-allowed", borderColor: "transparent", color: "#6b7785" }
                    : isActive
                    ? { borderColor: "#3fb950", color: "#3fb950", textShadow: "0 0 12px rgba(63,185,80,0.4)" }
                    : { borderColor: "transparent", color: "#6b7785" }
                }
                onMouseEnter={e => {
                  if (!t.locked && !isActive) (e.currentTarget as HTMLElement).style.color = "#dde6ef";
                }}
                onMouseLeave={e => {
                  if (!t.locked && !isActive) (e.currentTarget as HTMLElement).style.color = "#6b7785";
                }}
              >
                {t.icon}
                <span>{t.label}</span>
                {t.done && (
                  <span
                    className="w-1.5 h-1.5 rounded-full ml-0.5"
                    style={{ background: "#3fb950", boxShadow: "0 0 5px rgba(63,185,80,0.6)" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>


      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* ════ LEFT: Screenshots ════ */}
        <section
          ref={pasteZoneRef}
          className={`flex flex-col lg:w-[42%] xl:w-[38%] max-h-[38vh] lg:max-h-none lg:h-full overflow-hidden transition-colors`}
          style={{
            borderBottom: isDragging ? "1px solid rgba(63,185,80,0.3)" : "1px solid rgba(255,255,255,0.06)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            background: isDragging ? "rgba(63,185,80,0.02)" : "#070c12",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) handleScreenshotFiles(e.dataTransfer.files);
          }}
        >
          {/* Left panel header */}
          <div
            className="shrink-0 px-4 pt-3.5 pb-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(63,185,80,0.08)", border: "1px solid rgba(63,185,80,0.18)" }}
                >
                  <ImageIcon size={11} style={{ color: "#3fb950" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-none" style={{ color: "#dde6ef" }}>
                    Screenshots
                  </div>
                  <div
                    className="text-[10px] font-mono mt-0.5"
                    style={{ color: "#6b7785" }}
                  >
                    {screenshots.length} saved
                  </div>
                </div>
              </div>
              {uploadScreenshotMutation.isPending && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono" style={{ color: "#3fb950" }}>
                  <Loader2 size={10} className="animate-spin" />
                  Uploading…
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              className="cursor-pointer rounded-lg flex items-center gap-2.5 py-2 px-3 transition-all"
              style={{
                border: `1px dashed ${isDragging ? "rgba(63,185,80,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: isDragging ? "rgba(63,185,80,0.04)" : "rgba(255,255,255,0.02)",
              }}
              onClick={() => document.getElementById("screenshotUpload")?.click()}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.035)";
              }}
              onMouseLeave={e => {
                if (!isDragging) {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)";
                }
              }}
            >
              <input
                type="file"
                id="screenshotUpload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) handleScreenshotFiles(e.target.files);
                  e.target.value = "";
                }}
              />
              <Clipboard size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />
              <span className="text-xs" style={{ color: "#6b7785" }}>
                <kbd
                  className="px-1.5 py-0.5 rounded text-[11px] font-mono"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ba8b4" }}
                >
                  Ctrl+V
                </kbd>
                <span className="mx-1.5 opacity-40">·</span>
                drag or click to upload
              </span>
            </div>
          </div>

          {/* Gallery */}
          <div className="flex-1 overflow-y-auto p-3 min-h-0 custom-scrollbar">
            {screenshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <ImageIcon size={16} style={{ color: "rgba(255,255,255,0.12)" }} />
                </div>
                <div className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: "#6b7785" }}>
                  No screenshots yet
                </div>
                <div className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Paste or drag an image above
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {screenshots.map((ss: any) => (
                  <div
                    key={ss.id}
                    className="group relative rounded-lg overflow-hidden cursor-pointer transition-all"
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "#0c1319",
                    }}
                    onClick={() => setLightboxImg(ss.image_url || ss.image)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.14)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"}
                  >
                    <img
                      src={ss.image_url || ss.image}
                      alt={ss.caption || "Screenshot"}
                      className="w-full aspect-video object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                      >
                        <Maximize2 size={12} style={{ color: "rgba(255,255,255,0.8)" }} />
                      </div>
                    </div>
                    <button
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ background: "rgba(0,0,0,0.7)", color: "#9ba8b4" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScreenshotMutation.mutate(ss.id);
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#f85149")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#9ba8b4")}
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {new Date(ss.uploaded_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topic.summary && (
              <div
                className="rounded-lg p-3 mt-3"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="text-[10px] font-mono uppercase tracking-[0.22em] mb-1.5"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                >
                  Summary
                </div>
                <div className="text-sm leading-relaxed" style={{ color: "#9ba8b4" }}>{topic.summary}</div>
              </div>
            )}
          </div>
        </section>

        {/* Lightbox */}
        {lightboxImg && (
          <div
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-8"
            onClick={() => setLightboxImg(null)}
          >
            <button
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center justify-center"
              onClick={() => setLightboxImg(null)}
            >
              <X size={16} />
            </button>
            <img
              src={lightboxImg}
              alt="Screenshot preview"
              className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {/* ════ RIGHT: Workspace ════ */}
        <section className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: "#080f16" }}>
          <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-8 custom-scrollbar">
            {tab === "notes" && <StudyNotesTab topicId={topic.id} />}
            {tab === "flash" && <FlashcardsTab topicId={topic.id} />}
            {tab === "quiz" && <QuizTab topicId={topic.id} />}
            {tab === "feynman" && <FeynmanTab topicId={topic.id} />}
            {tab === "build" && (
              <BuildTab topic={topic} materials={materials} progress={progress} />
            )}
          </div>
        </section>
      </div>

      {showWorkflowModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,12,18,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowWorkflowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl overflow-hidden animate-fade-in-up"
            style={{
              background: "rgba(12,19,25,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Shine line */}
            <div
              aria-hidden
              className="h-px w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }}
            />
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "#dde6ef" }}>
                <Info size={15} style={{ color: "#3fb950" }} />
                Mastery Workflow
              </h3>
              <button
                onClick={() => setShowWorkflowModal(false)}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#dde6ef")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "#9ba8b4" }}>
                This workspace uses a strict{" "}
                <strong style={{ color: "#dde6ef" }}>Spaced Repetition engine</strong>. Complete phases sequentially to ensure deep understanding before advancing.
              </p>

              {[
                { step: "1", label: "Notes",          icon: <BookOpen size={13} />,    color: "#3fb950",  desc: "Distill the topic using markdown. Attach reference files and screenshots. This unlocks AI flashcard generation." },
                { step: "2", label: "Flashcards",     icon: <Layers size={13} />,      color: "#4d9de0",  desc: "AI generates cards from your notes. Verify each card for quality before they enter your daily review queue." },
                { step: "3", label: "Quiz",           icon: <Zap size={13} />,         color: "#e3a726",  desc: "Prove your retention. Score ≥70% on a dynamically generated quiz to unlock Feynman and Build." },
                { step: "4", label: "Feynman & Build",icon: <Hammer size={13} />,      color: "#bc8cff",  desc: "Submit a GitHub repo demonstrating your application of the knowledge for AI evaluation and final mastery." },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${s.color} 25%, transparent)`,
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium" style={{ color: "#dde6ef" }}>
                      {s.step}. {s.label}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6b7785" }}>{s.desc}</p>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setShowWorkflowModal(false)}
                className="w-full py-2.5 rounded-xl text-sm font-mono uppercase tracking-[0.12em] transition-all"
                style={{ background: "rgba(255,255,255,0.04)", color: "#9ba8b4", border: "1px solid rgba(255,255,255,0.08)" }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLElement).style.color = "#dde6ef";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.color = "#9ba8b4";
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,12,18,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowCommitModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden animate-fade-in-up"
            style={{
              background: "rgba(12,19,25,0.98)",
              border: "1px solid rgba(77,157,224,0.2)",
              boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,157,224,0.08)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="h-px w-full"
              style={{ background: "linear-gradient(90deg, transparent, rgba(77,157,224,0.3), transparent)" }}
            />
            <div
              className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h3 className="text-base font-semibold flex items-center gap-2" style={{ color: "#dde6ef" }}>
                <GitBranch size={15} style={{ color: "#4d9de0" }} />
                Commit Workspace
              </h3>
              <button
                onClick={() => setShowCommitModal(false)}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.3)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#dde6ef")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Repo input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Target Repository
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => { setRepoName(e.target.value); setRepoDropdownOpen(true); }}
                    onFocus={() => setRepoDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setRepoDropdownOpen(false), 200)}
                    placeholder="e.g. growthos-my-path"
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-mono outline-none transition-all pr-9"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "#dde6ef",
                    }}
                    onFocusCapture={e => (e.currentTarget.style.borderColor = "rgba(77,157,224,0.35)")}
                    onBlurCapture={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
                  </div>

                  {repoDropdownOpen && githubRepos.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl max-h-48 overflow-y-auto z-10 custom-scrollbar"
                      style={{
                        background: "rgba(12,19,25,0.98)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "0 16px 32px rgba(0,0,0,0.5)",
                      }}
                    >
                      {githubRepos
                        .filter((r: any) => r.name.toLowerCase().includes(repoName.toLowerCase()))
                        .map((r: any) => (
                          <div
                            key={r.id}
                            onClick={() => { setRepoName(r.name); setRepoDropdownOpen(false); }}
                            className="px-3 py-2.5 cursor-pointer text-sm font-mono flex items-center justify-between transition-colors"
                            style={{ color: "#9ba8b4", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                              (e.currentTarget as HTMLElement).style.color = "#dde6ef";
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = "transparent";
                              (e.currentTarget as HTMLElement).style.color = "#9ba8b4";
                            }}
                          >
                            <span>{r.name}</span>
                            {r.private && (
                              <span
                                className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                                style={{ background: "rgba(255,255,255,0.05)", color: "#6b7785" }}
                              >
                                Private
                              </span>
                            )}
                          </div>
                        ))}
                      {githubRepos.filter((r: any) => r.name.toLowerCase().includes(repoName.toLowerCase())).length === 0 && (
                        <div className="px-3 py-4 text-xs font-mono text-center" style={{ color: "#6b7785" }}>
                          No matching repositories
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs" style={{ color: "#6b7785" }}>
                  Files push to <span style={{ color: "#9ba8b4", fontFamily: "monospace" }}>/{topic.slug}/</span> inside this repo.
                </p>
              </div>

              {/* Assets list */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Assets to Commit
                </label>
                <div
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {["Markdown Notes", "Screenshots & Images", "Flashcard JSON", "Quizzes JSON", "Uploaded Documents"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs font-mono" style={{ color: "#9ba8b4" }}>
                      <CheckCircle2 size={12} style={{ color: "#3fb950", flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => commitGitHubMutation.mutate(repoName)}
                disabled={commitGitHubMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-mono uppercase tracking-[0.12em] transition-all disabled:opacity-40"
                style={{
                  background: "rgba(77,157,224,0.1)",
                  border: "1px solid rgba(77,157,224,0.3)",
                  color: "#4d9de0",
                }}
                onMouseEnter={e => {
                  if (!commitGitHubMutation.isPending) {
                    (e.currentTarget as HTMLElement).style.background = "rgba(77,157,224,0.16)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(77,157,224,0.15)";
                  }
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(77,157,224,0.1)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {commitGitHubMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <GitBranch size={14} />
                )}
                Push to GitHub
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────
   Notes Tab
───────────────────────────────────────────── */
function StudyNotesTab({ topicId }: { topicId: number | string }) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const contentRef = useRef("");

  const { isLoading } = useQuery({
    queryKey: ["notes", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/notes/`);
      if (!res.ok) return { content: "", documents: [] };
      const json = await res.json();
      const rawContent = stripGeneratedAttachmentMarkdown(json.content || "");
      contentRef.current = rawContent;
      setContent(rawContent);
      if (rawContent !== (json.content || "")) {
        await apiFetch(`/topics/${topicId}/notes/`, {
          method: "POST",
          body: JSON.stringify({ content: rawContent }),
        });
      }
      return json;
    },
  });

  const { data: noteDocuments = [], refetch: refetchDocs } = useQuery({
    queryKey: ["note-documents", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/note-documents/`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const saveNote = useCallback(
    async (val: string) => {
      setSaving(true);
      await apiFetch(`/topics/${topicId}/notes/`, {
        method: "POST",
        body: JSON.stringify({ content: val }),
      });
      queryClient.invalidateQueries({ queryKey: ["topic", String(topicId)] });
      setSaving(false);
    },
    [topicId, queryClient],
  );

  // Debounced auto-save: saves 2 seconds after user stops typing
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      contentRef.current = content;
      saveNote(content);
    }, 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [content, saveNote]);

  const uploadDocMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch(`/topics/${topicId}/note-documents/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      setNoteFile(null);
      refetchDocs();
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#fff]" />
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Text area */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs uppercase tracking-[0.2em] font-mono text-[#666] font-medium">
            Markdown Notes
          </label>
          <span
            className={`text-xs uppercase tracking-widest font-mono transition-colors ${saving ? "text-[#f59e0b]" : "text-[#22c55e]/60"}`}
          >
            {saving ? "Saving…" : "Saved"}
          </span>
        </div>
        <textarea
          className="w-full min-h-[400px] bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 text-base sm:text-lg text-[#e8e8e8] leading-relaxed
                     focus:outline-none focus:border-[#333] resize-y placeholder-[#333] font-mono transition-colors shadow-inner"
          placeholder="Start typing your notes…"
          value={content}
          onChange={(e) => {
            contentRef.current = e.target.value;
            setContent(e.target.value);
          }}
          onBlur={() => saveNote(content)}
        />
      </div>

      {/* Document upload */}
      <div className="mt-4">
        <div className="text-xs uppercase tracking-[0.2em] font-mono text-[#666] font-medium mb-3 flex items-center gap-1.5">
          <FileText size={12} />
          Reference Documents
        </div>
        <div
          className="border border-dashed border-[#1a1a1a] rounded-lg p-4 flex items-center gap-3 cursor-pointer
                     hover:border-[#252525] hover:bg-[#0a0a0a] transition-all"
          onClick={() => document.getElementById("noteFileUpload")?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.length) setNoteFile(e.dataTransfer.files[0]);
          }}
        >
          <input
            type="file"
            id="noteFileUpload"
            className="hidden"
            accept=".pdf,.docx,.pptx"
            onChange={(e) => {
              if (e.target.files?.length) setNoteFile(e.target.files[0]);
            }}
          />
          <div className="w-10 h-10 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e] flex items-center justify-center shrink-0">
            <UploadCloud size={16} className="text-[#888]" />
          </div>
          <div>
            <div className="text-base font-medium text-[#e8e8e8]">
              {noteFile ? noteFile.name : "Upload reference document"}
            </div>
            <div className="text-sm text-[#666] mt-0.5">Drag & drop or click to browse (PDF, DOCX, images)</div>
          </div>
          {noteFile && (
            <button
              className="ml-auto px-3 py-1.5 rounded-md bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-lg font-medium hover:bg-[#22c55e]/15 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                uploadDocMutation.mutate(noteFile);
              }}
              disabled={uploadDocMutation.isPending}
            >
              {uploadDocMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                "Upload"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Saved docs */}
      {noteDocuments.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest font-mono text-[#fff] mb-2">
            Saved ({noteDocuments.length})
          </div>
          <ul className="space-y-1.5">
            {noteDocuments.map((doc: any) => (
              <li
                key={doc.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#141414] bg-[#0a0a0a] hover:border-[#1e1e1e] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={13} className="shrink-0 text-[#22c55e]/60" />
                  <span className="text-lg text-[#eee] truncate">
                    {doc.filename || doc.file?.split("/").pop() || `Document #${doc.id}`}
                  </span>
                </div>
                <a
                  href={doc.file_url || doc.file}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#fff] hover:text-[#eee] ml-2 shrink-0 transition-colors"
                >
                  <ExternalLink size={13} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Quiz Tab
───────────────────────────────────────────── */
function QuizTab({ topicId }: { topicId: number }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["quiz", topicId, difficulty],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/quiz/?difficulty=${difficulty}&count=5`);
      if (!res.ok) throw new Error("Failed to generate quiz");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleDifficultyChange = (d: "easy" | "medium" | "hard") => {
    setDifficulty(d);
    setAnswers({});
    setSubmitted(false);
  };

  const questions = data?.questions || [];

  let score = 0;
  if (submitted) {
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.answer) score++;
    });
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let currentScore = 0;
    questions.forEach((q: any, i: number) => {
      if (answers[i] === q.answer) currentScore++;
    });
    try {
      const res = await apiFetch(`/topics/${topicId}/submit-quiz/`, {
        method: "POST",
        body: JSON.stringify({ score: currentScore, total: questions.length }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === "passed") {
          showToast(`✨ +${result.xp_earned} XP — Quiz Mastered!`, "xp");
          queryClient.invalidateQueries({ queryKey: ["topic", String(topicId)] });
          queryClient.invalidateQueries({ queryKey: ["heatmap"] });
          queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
          queryClient.invalidateQueries({ queryKey: ["user_profile"] });
          queryClient.invalidateQueries({ queryKey: ["paths"] });
          queryClient.invalidateQueries({ queryKey: ["custom-paths"] });
        }
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const DIFF_STYLES = {
    easy: { active: "border-[#22c55e]/40 bg-[#22c55e]/8 text-[#22c55e]", dot: "bg-[#22c55e]" },
    medium: { active: "border-[#f59e0b]/40 bg-[#f59e0b]/8 text-[#f59e0b]", dot: "bg-[#f59e0b]" },
    hard: { active: "border-[#ef4444]/40 bg-[#ef4444]/8 text-[#ef4444]", dot: "bg-[#ef4444]" },
  };

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 size={20} className="animate-spin text-[#fff]" />
        <span className="text-sm font-mono tracking-widest text-[#fff] uppercase">
          Generating {difficulty} questions
        </span>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-12">
        <div className="text-lg text-[#ef4444] mb-4">Failed to generate quiz</div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-md border border-[#222] text-lg text-[#eee] hover:text-[#f0f0f0] transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Difficulty */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-widest font-mono text-[#fff]">Level</span>
        <div className="flex gap-1.5 ml-1">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const s = DIFF_STYLES[d];
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-mono uppercase tracking-wider border transition-all ${
                  active
                    ? s.active
                    : "border-[#181818] text-[#eee] hover:border-[#2a2a2a] hover:text-[#eee]"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? s.dot : "bg-[#666]"}`} />
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score card */}
      {submitted && (
        <div
          className={`rounded-xl border p-4 flex items-center justify-between ${
            score === questions.length
              ? "border-[#22c55e]/20 bg-[#22c55e]/5"
              : "border-[#f59e0b]/20 bg-[#f59e0b]/5"
          }`}
        >
          <div>
            <div className="text-3xl font-bold text-[#e8e8e8] tabular-nums">
              {score}
              <span className="text-xl text-[#888] font-normal">/{questions.length}</span>
            </div>
            <div
              className={`text-lg mt-1 font-medium ${score === questions.length ? "text-[#22c55e]" : "text-[#f59e0b]"}`}
            >
              {score === questions.length ? "Perfect score!" : "Review your notes and try again"}
            </div>
          </div>
          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#222] text-lg text-[#eee] hover:text-[#f0f0f0] hover:border-[#666] transition-colors"
          >
            <RotateCcw size={11} /> Retake
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: any, i: number) => (
          <div key={i} className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-start gap-3">
              <span className="text-sm font-mono text-[#666] mt-0.5 shrink-0">Q{i + 1}</span>
              <span className="text-[17px] font-medium text-[#e8e8e8] leading-relaxed">{q.question}</span>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {q.options.map((opt: string, j: number) => {
                const isSelected = answers[i] === opt;
                const isCorrect = submitted && opt === q.answer;
                const isWrong = submitted && isSelected && !isCorrect;
                return (
                  <button
                    key={j}
                    className={`w-full text-left px-4 py-3.5 rounded-xl text-[16px] transition-all border leading-relaxed ${
                      isCorrect
                        ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]"
                        : isWrong
                          ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]"
                          : isSelected
                            ? "border-[#666] bg-[#1a1a1a] text-[#e8e8e8]"
                            : "border-[#1a1a1a] hover:border-[#333] hover:bg-[#0f0f0f] text-[#d4d4d4] hover:text-[#eee]"
                    }`}
                    onClick={() => !submitted && setAnswers({ ...answers, [i]: opt })}
                    disabled={submitted}
                  >
                    <span className="font-mono text-xs mr-2 opacity-50">
                      {String.fromCharCode(65 + j)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!submitted && questions.length > 0 && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(answers).length < questions.length}
          className="w-full py-2.5 rounded-xl bg-[#22c55e] text-[#030f05] text-lg font-semibold
                     hover:bg-[#16a34a] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting
            ? "Submitting…"
            : `Submit — ${Object.keys(answers).length}/${questions.length} answered`}
        </button>
      )}
    </div>
  );
}

function FlashcardsTab({ topicId }: { topicId: number }) {
  const queryClient = useQueryClient();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [draftCards, setDraftCards] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"pending" | "active">("active");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["flashcards", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/flashcards/`);
      if (!res.ok) throw new Error("Failed to load flashcards");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, payload }: { action: string, payload: any }) => {
      const res = await apiFetch(`/topics/${topicId}/flashcards/`, {
        method: "POST",
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", String(topicId)] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", topicId] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/generate-flashcards/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate flashcards");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic", String(topicId)] });
      queryClient.invalidateQueries({ queryKey: ["flashcards", topicId] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      setViewMode("pending");
    },
  });

  const pendingCards = data?.pending || [];
  const activeCards = data?.active || [];
  const dueCount = data?.due_count || 0;

  // Auto-switch to pending if there are pending cards and we just loaded
  useEffect(() => {
    if (pendingCards.length > 0 && viewMode === "active") {
      setViewMode("pending");
    }
  }, [pendingCards.length]);

  const handleVerify = (cardId: number, front: string, back: string, rating: number = 0) => {
    actionMutation.mutate({ action: 'verify', payload: { card_id: cardId, front, back, quality_rating: rating } });
  };

  const handleDelete = (cardId: number) => {
    actionMutation.mutate({ action: 'delete', payload: { card_id: cardId } });
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#fff]" />
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-12">
        <div className="text-lg text-[#ef4444] mb-4">Failed to load flashcards</div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-md border border-[#222] text-lg text-[#eee] hover:text-[#f0f0f0] transition-colors"
        >
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );

  /* Edit mode (Manual Creation) */
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-[#d0d0d0]">Create Flashcard</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-lg text-[#fff] hover:text-[#fff] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        {draftCards.map((c, i) => (
          <div key={i} className="rounded-xl border border-[#141414] bg-[#090909] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#141414]">
              <span className="text-xs font-mono text-[#fff] uppercase tracking-widest">
                New Card
              </span>
              <button
                className="text-[#fff] hover:text-[#ef4444] transition-colors"
                onClick={() => setDraftCards(draftCards.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs text-[#fff] block mb-1 font-mono uppercase tracking-widest">
                  Front (Question)
                </label>
                <input
                  type="text"
                  value={c.front}
                  onChange={(e) =>
                    setDraftCards(
                      draftCards.map((card, idx) =>
                        idx === i ? { ...card, front: e.target.value } : card,
                      ),
                    )
                  }
                  className="w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-lg text-[#d0d0d0] outline-none focus:border-[#2a2a2a] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#fff] block mb-1 font-mono uppercase tracking-widest">
                  Back (Answer)
                </label>
                <textarea
                  value={c.back}
                  onChange={(e) =>
                    setDraftCards(
                      draftCards.map((card, idx) =>
                        idx === i ? { ...card, back: e.target.value } : card,
                      ),
                    )
                  }
                  className="w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-lg text-[#d0d0d0] outline-none focus:border-[#2a2a2a] resize-y min-h-[56px] transition-colors"
                />
              </div>
              <button
                onClick={() => {
                  if (c.front && c.back) {
                    actionMutation.mutate({ action: 'create_manual', payload: { front: c.front, back: c.back } });
                    setDraftCards(draftCards.filter((_, idx) => idx !== i));
                  }
                }}
                disabled={!c.front || !c.back || actionMutation.isPending}
                className="w-full py-2.5 rounded-lg bg-[#22c55e] text-[#030f05] text-lg font-semibold hover:bg-[#16a34a] disabled:opacity-40 transition-all mt-4"
              >
                Save & Add
              </button>
            </div>
          </div>
        ))}

        <button
          className="w-full py-3 rounded-xl border border-dashed border-[#1e1e1e] text-lg text-[#eee] hover:border-[#2a2a2a] hover:text-[#fff] transition-all flex items-center justify-center gap-2"
          onClick={() => setDraftCards([...draftCards, { front: "", back: "" }])}
        >
          <Plus size={13} /> Add Draft Card
        </button>
      </div>
    );
  }

  /* View mode */
  return (
    <div>
      {pendingCards.length === 0 && activeCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#141414] rounded-xl">
          <div className="text-lg text-[#fff] mb-4">No flashcards yet</div>
          <div className="flex gap-3">
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20 text-lg font-medium hover:bg-[#3b82f6]/15 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {generateMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Auto-Generate with AI
            </button>
            <button
              onClick={() => {
                setDraftCards([{ front: "", back: "" }]);
                setIsEditing(true);
              }}
              className="px-4 py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-lg font-medium hover:bg-[#22c55e]/15 transition-colors"
            >
              Create manually
            </button>
          </div>
        </div>
      ) : viewMode === "pending" && pendingCards.length > 0 ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 p-4 rounded-xl mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="text-[#f59e0b] mt-1 shrink-0" size={18} />
              <div>
                <h4 className="text-[#f59e0b] font-semibold mb-1">Human Verification Required</h4>
                <p className="text-sm text-[#eee]/80">
                  AI generated these cards. To ensure quality learning, you must manually read, edit (if necessary), and approve each card before it enters your Spaced Repetition queue. 
                  <br/><span className="text-[#22c55e] font-mono mt-2 inline-block">+1 XP for every card you verify.</span>
                </p>
              </div>
            </div>
          </div>
          
          {pendingCards.map((c: any) => {
             return (
               <PendingCard key={c.id} card={c} handleVerify={handleVerify} handleDelete={handleDelete} actionMutation={actionMutation} />
             );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {activeCards.map((f: any, i: number) => {
            const isFlipped = flipped[i];
            const isDue = new Date(f.next_review_date) <= new Date();
            const wrapStyle: React.CSSProperties = { perspective: "1200px" };
            const innerStyle: React.CSSProperties = {
              transformStyle: "preserve-3d",
              transition: "transform 0.5s ease",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            };
            const frontStyle: React.CSSProperties = { backfaceVisibility: "hidden" };
            const backStyle: React.CSSProperties = {
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            };
            return (
              <div
                key={f.id}
                style={wrapStyle}
                className="h-52 cursor-pointer"
                onClick={() => setFlipped({ ...flipped, [i]: !isFlipped })}
              >
                <div style={innerStyle} className="relative w-full h-full">
                  {/* Front */}
                  <div
                    style={frontStyle}
                    className="absolute inset-0 rounded-2xl border border-[#1e1e1e] bg-[#0d0d0d] flex flex-col justify-between p-6"
                  >
                    <div className={`text-[10px] font-mono uppercase tracking-widest ${isDue ? "text-[#f59e0b]" : "text-[#444]"}`}>
                      {isDue ? "⚡ Due now" : "Learned"}
                    </div>
                    <div className="text-[#e8e8e8] text-base font-medium leading-relaxed">
                      {f.front}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">Tap to reveal answer</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }}
                        className="text-[#2a2a2a] hover:text-[#ef4444] transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {/* Back */}
                  <div
                    style={backStyle}
                    className="absolute inset-0 rounded-2xl border border-[#22c55e]/15 bg-[#080f08] flex flex-col justify-between p-6"
                  >
                    <div className="text-[10px] uppercase font-mono tracking-widest text-[#22c55e]/50">Answer</div>
                    <div className="text-[#d4d4d4] text-base leading-relaxed">{f.back}</div>
                    <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest">Tap to flip back</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PendingCard({ card, handleVerify, handleDelete, actionMutation }: any) {
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [rating, setRating] = useState<number>(0);

  return (
    <div className="rounded-xl border border-[#141414] bg-[#090909] overflow-hidden">
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs text-[#666] block mb-1.5 font-mono uppercase tracking-[0.2em] font-medium">Question</label>
          <input
            type="text"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-base text-[#e8e8e8] outline-none focus:border-[#333] transition-colors shadow-inner"
          />
        </div>
        <div>
          <label className="text-xs text-[#666] block mb-1.5 font-mono uppercase tracking-[0.2em] font-medium">Answer</label>
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-base text-[#e8e8e8] outline-none focus:border-[#333] resize-y min-h-[80px] transition-colors shadow-inner leading-relaxed"
          />
        </div>
        <div className="flex gap-2 pt-2 items-center">
          <div className="flex gap-1.5 mr-auto">
            <button
              onClick={() => setRating(1)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                rating === 1 
                  ? 'bg-[#22c55e]/20 border-[#22c55e]/40 text-[#22c55e]' 
                  : 'bg-[#111] border-[#1e1e1e] text-[#666] hover:text-[#fff] hover:border-[#2a2a2a]'
              }`}
              title="Good AI Generation"
            >
              👍
            </button>
            <button
              onClick={() => setRating(-1)}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                rating === -1 
                  ? 'bg-[#ef4444]/20 border-[#ef4444]/40 text-[#ef4444]' 
                  : 'bg-[#111] border-[#1e1e1e] text-[#666] hover:text-[#fff] hover:border-[#2a2a2a]'
              }`}
              title="Poor AI Generation"
            >
              👎
            </button>
          </div>
          <button
            onClick={() => handleVerify(card.id, front, back, rating)}
            disabled={actionMutation.isPending}
            className="flex-1 max-w-[220px] py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-sm font-medium hover:bg-[#22c55e]/20 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} /> Approve (+1 XP)
          </button>
          <button
            onClick={() => handleDelete(card.id)}
            disabled={actionMutation.isPending}
            className="px-4 py-2 rounded-lg bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}


/* ─────────────────────────────────────────────
   Build Tab
───────────────────────────────────────────── */
function BuildTab({ topic, materials, progress }: { topic: any; materials: any[]; progress: any }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [buildMode, setBuildMode] = useState<"choose" | "ai" | "own">("choose");
  const [repoUrl, setRepoUrl] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  const {
    data: projectIdeas,
    isLoading: ideasLoading,
    refetch: refetchIdeas,
  } = useQuery({
    queryKey: ["project-ideas", topic.id],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topic.id}/project-ideas/`);
      if (!res.ok) throw new Error("Failed to generate ideas");
      return res.json();
    },
    enabled: buildMode === "ai",
    refetchOnWindowFocus: false,
  });

  const scanRepoMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiFetch(`/topics/${topic.id}/scan-repo/`, {
        method: "POST",
        body: JSON.stringify({ repo_url: url }),
      });
      if (!res.ok) throw new Error("Scan failed");
      return res.json();
    },
    onSuccess: (data) => {
      setScanResult(data);
      if (data.passed) {
        showToast("✨ +5 XP — Project Verified!", "xp");
        queryClient.invalidateQueries({ queryKey: ["topic", String(topic.id)] });
        queryClient.invalidateQueries({ queryKey: ["paths"] });
        queryClient.invalidateQueries({ queryKey: ["heatmap"] });
        queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      }
    },
  });

  /* Completed state */
  if (progress?.status === "completed") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-4">
          <CheckCircle2 size={22} className="text-[#22c55e]" />
        </div>
        <div className="text-lg font-semibold text-[#e8e8e8]">Topic Verified</div>
        <div className="text-lg text-[#22c55e]/70 mt-1">Your proof of work was accepted</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Mode chooser */}
      {buildMode === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              mode: "ai" as const,
              accent: "#22c55e",
              label: "AI Project Ideas",
              desc: "Get tailored project suggestions. Pick one and build it.",
              tag: "Guided",
            },
            {
              mode: "own" as const,
              accent: "#f59e0b",
              label: "Your Own Project",
              desc: "Submit a GitHub repo. AI will evaluate your work.",
              tag: "Freestyle",
            },
          ].map(({ mode, accent, label, desc, tag }) => (
            <button
              key={mode}
              onClick={() => setBuildMode(mode)}
              className="group text-left p-5 rounded-xl border border-[#141414] bg-[#090909] hover:border-[#222] transition-all"
            >
              <div
                className="text-xs font-mono uppercase tracking-[0.2em] font-medium mb-3"
                style={{ color: accent }}
              >
                {tag}
              </div>
              <div className="text-xl font-semibold text-[#e8e8e8] mb-1.5 group-hover:text-[#fff] transition-colors">
                {label}
              </div>
              <div className="text-base text-[#aaa] leading-relaxed">{desc}</div>
              <div className="mt-4 flex items-center gap-1.5" style={{ color: accent + "80" }}>
                <span className="text-sm font-mono tracking-widest uppercase">Select</span>
                <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* AI Ideas */}
      {buildMode === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setBuildMode("choose")}
              className="text-sm font-mono text-[#eee] hover:text-[#eee] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={11} /> Back
            </button>
            <button
              onClick={() => refetchIdeas()}
              className="text-sm font-mono text-[#eee] hover:text-[#eee] transition-colors flex items-center gap-1"
            >
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>

          {ideasLoading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={18} className="animate-spin text-[#fff]" />
              <span className="text-sm font-mono text-[#fff] uppercase tracking-widest">
                Generating ideas
              </span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(projectIdeas?.ideas || []).map((idea: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-[#141414] bg-[#090909] hover:border-[#1e1e1e] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-sm font-mono text-[#22c55e]/60 mt-0.5 shrink-0 tabular-nums">
                      0{i + 1}
                    </span>
                    <div>
                      <div className="text-xl font-semibold text-[#e8e8e8] mb-1.5">
                        {idea.title || `Project ${i + 1}`}
                      </div>
                      <div className="text-base text-[#d4d4d4] leading-relaxed">
                        {idea.description || idea}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Own project */}
      {buildMode === "own" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setBuildMode("choose")}
              className="text-sm font-mono text-[#eee] hover:text-[#eee] transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={11} /> Back
            </button>
          </div>
          <div className="text-lg text-[#fff] leading-relaxed pb-1">
            Build any project that demonstrates your understanding, then submit the GitHub link
            below for AI evaluation.
          </div>
        </div>
      )}

      {/* Repo submission */}
      {buildMode !== "choose" && (
        <div className="rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center gap-2.5">
            <Github size={15} className="text-[#666]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] font-medium text-[#666]">
              Submit Repository
            </span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="flex-1 bg-[#050505] border border-[#222] rounded-xl px-4 py-3 text-base text-[#e8e8e8]
                           placeholder-[#333] focus:outline-none focus:border-[#444] font-mono transition-colors shadow-inner"
              />
              <button
                onClick={() => scanRepoMutation.mutate(repoUrl)}
                disabled={!repoUrl || scanRepoMutation.isPending}
                className="px-5 py-3 rounded-xl bg-[#22c55e] text-[#030f05] text-base font-semibold
                           hover:bg-[#16a34a] disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {scanRepoMutation.isPending ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={11} className="animate-spin" /> Scanning
                  </span>
                ) : (
                  "Scan Repo"
                )}
              </button>
            </div>

            {scanResult && (
              <div
                className={`rounded-lg border p-3 ${scanResult.passed ? "border-[#22c55e]/20 bg-[#22c55e]/5" : "border-[#ef4444]/20 bg-[#ef4444]/5"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-lg font-semibold ${scanResult.passed ? "text-[#22c55e]" : "text-[#ef4444]"}`}
                  >
                    {scanResult.passed ? "✓ Approved" : "✗ Needs work"}
                  </span>
                  {scanResult.score !== undefined && (
                    <span
                      className={`text-sm font-mono px-2 py-0.5 rounded ${scanResult.passed ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}
                    >
                      {scanResult.score}/100
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#eee] leading-relaxed whitespace-pre-wrap">
                  {scanResult.feedback}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous submissions */}
      {materials?.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-widest font-mono text-[#eee] mb-3">
            Previous Submissions
          </div>
          <ul className="space-y-2">
            {materials
              .slice()
              .reverse()
              .map((m: any) => (
                <li
                  key={m.id}
                  className="border border-[#141414] rounded-xl bg-[#090909] overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#101010]">
                    <span className="text-sm font-mono text-[#eee]">Submission #{m.id}</span>
                    <div className="flex items-center gap-2">
                      {m.ai_score > 0 && (
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded ${m.ai_status === "verified" ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}
                        >
                          {m.ai_score}/100
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono px-1.5 py-0.5 rounded capitalize ${
                          m.ai_status === "verified"
                            ? "text-[#22c55e] bg-[#22c55e]/10"
                            : m.ai_status === "rejected"
                              ? "text-[#ef4444] bg-[#ef4444]/10"
                              : "text-[#f59e0b] bg-[#f59e0b]/10"
                        }`}
                      >
                        {m.ai_status}
                      </span>
                    </div>
                  </div>
                  {m.ai_feedback && (
                    <div className="px-4 py-3 text-sm text-[#fff] leading-relaxed whitespace-pre-wrap">
                      {m.ai_feedback}
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feynman Tab
───────────────────────────────────────────── */
function FeynmanTab({ topicId }: { topicId: number | string }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [concept, setConcept] = useState("");
  const [explanation, setExplanation] = useState("");
  const [selfScore, setSelfScore] = useState(100);
  const [isNew, setIsNew] = useState(false);
  const [viewMode, setViewMode] = useState<"ai" | "manual">("ai");

  const { data, isLoading } = useQuery({
    queryKey: ["feynman", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/feynman/`);
      if (!res.ok) throw new Error("Failed to load Feynman entries");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (mode: "ai" | "manual") => {
      const payload: any = { concept, explanation, mode };
      if (mode === "manual") {
        payload.score = selfScore;
      }
      const res = await apiFetch(`/topics/${topicId}/feynman/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: (data) => {
      showToast("Feynman Entry Saved!", "success");
      queryClient.invalidateQueries({ queryKey: ["feynman", topicId] });
      queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
      queryClient.invalidateQueries({ queryKey: ["heatmap"] });
      queryClient.invalidateQueries({ queryKey: ["user_profile"] });
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["custom-paths"] });
      setIsNew(false);
      setConcept("");
      setExplanation("");
      setSelfScore(100);
    },
    onError: (err: any) => showToast(err.message, "error"),
  });

  const entries = data?.feynman_entries || [];

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader2 className="animate-spin text-[#60a5fa]" />
      </div>
    );
  }

  if (isNew) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-[#f0f0f0]">New Feynman Explanation</div>
          <button onClick={() => setIsNew(false)} className="text-[#888] hover:text-[#fff]">
            Cancel
          </button>
        </div>

        <div className="space-y-4 bg-[#0a0a0a] border border-[#1e1e1e] p-6 rounded-xl">
          <div>
            <label className="text-xs uppercase font-mono tracking-widest text-[#888] mb-2 block">
              Concept
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. Docker Containers"
              className="w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-[#eee] focus:border-[#60a5fa]/50 outline-none"
            />
          </div>

          <div>
            <label className="text-xs uppercase font-mono tracking-widest text-[#888] mb-2 block">
              Explanation (Explain it to a 5-year-old)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="A container is like a lunchbox..."
              className="w-full h-48 bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-[#eee] focus:border-[#60a5fa]/50 outline-none resize-y"
            />
          </div>

          <div className="flex border-b border-[#1e1e1e] mb-4">
            <button
              onClick={() => setViewMode("ai")}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-widest border-b-2 transition-colors ${viewMode === "ai" ? "border-[#a855f7] text-[#a855f7]" : "border-transparent text-[#888] hover:text-[#aaa]"}`}
            >
              AI Evaluate
            </button>
            <button
              onClick={() => setViewMode("manual")}
              className={`px-4 py-2 text-sm font-semibold uppercase tracking-widest border-b-2 transition-colors ${viewMode === "manual" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#888] hover:text-[#aaa]"}`}
            >
              Self-Grade (Manual)
            </button>
          </div>

          {viewMode === "manual" && (
            <div className="mb-4">
              <label className="text-xs uppercase font-mono tracking-widest text-[#888] mb-2 block">
                My Score (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={selfScore}
                onChange={(e) => setSelfScore(Number(e.target.value))}
                className="w-32 bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-[#eee]"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => submitMutation.mutate(viewMode)}
              disabled={!concept || !explanation || submitMutation.isPending}
              className={`px-5 py-2.5 rounded-lg font-semibold text-[#000] flex items-center gap-2 transition-opacity disabled:opacity-50 ${viewMode === "ai" ? "bg-[#a855f7] hover:bg-[#9333ea]" : "bg-[#22c55e] hover:bg-[#16a34a]"}`}
            >
              {submitMutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <MessageSquare size={16} />
              )}
              {viewMode === "ai" ? "Submit to AI Tutor" : "Save Manual Entry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-[#f0f0f0] tracking-tight">Feynman Technique</h2>
          <p className="text-sm text-[#888] mt-1">Explain concepts simply. Expose logical gaps.</p>
        </div>
        <button
          onClick={() => setIsNew(true)}
          className="px-4 py-2 bg-[#111] border border-[#2a2a2a] rounded-lg text-[#eee] hover:text-[#fff] hover:border-[#444] transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Explanation
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-[#1e1e1e] rounded-2xl bg-[#0a0a0a]">
          <div className="w-12 h-12 rounded-full bg-[#111] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={20} className="text-[#888]" />
          </div>
          <div className="text-lg text-[#eee] mb-2">No concepts explained yet</div>
          <div className="text-sm text-[#888]">
            Use the Feynman Technique to solidify your knowledge.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {entries.map((e: any) => {
            let feedbackObj = null;
            if (!e.is_self_graded && e.feedback) {
              try {
                feedbackObj = JSON.parse(e.feedback);
              } catch (err) {}
            }
            return (
              <div
                key={e.id}
                className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden shadow-xl"
              >
                <div className="px-6 py-4 border-b border-[#1e1e1e] flex justify-between items-center bg-[#0d0d0d]">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-[#fff]">{e.concept}</span>
                    {e.is_self_graded ? (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                        MANUAL
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
                        AI GRADED
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-lg font-mono font-bold ${e.score >= 80 ? "text-[#22c55e]" : e.score >= 50 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}
                  >
                    {e.score}/100
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div>
                    <div className="text-xs uppercase font-mono tracking-widest text-[#555] mb-2">
                      Your Explanation
                    </div>
                    <div className="text-[#d0d0d0] leading-relaxed whitespace-pre-wrap">
                      {e.explanation}
                    </div>
                  </div>

                  {e.is_self_graded
                    ? e.feedback && (
                        <div className="bg-[#111] border border-[#22c55e]/20 rounded-lg p-4">
                          <div className="text-xs uppercase font-mono tracking-widest text-[#22c55e] mb-2">
                            Self-Reflection
                          </div>
                          <div className="text-[#eee] text-sm">{e.feedback}</div>
                        </div>
                      )
                    : feedbackObj && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-[#111] border border-[#ef4444]/20 rounded-lg p-4">
                            <div className="text-xs uppercase font-mono tracking-widest text-[#ef4444] mb-2">
                              Jargon Spotted
                            </div>
                            {feedbackObj.jargon && feedbackObj.jargon.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {feedbackObj.jargon.map((j: string, i: number) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-[#ef4444]/10 text-[#ef4444] px-2 py-1 rounded"
                                  >
                                    {j}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-[#888]">
                                No jargon spotted. Good job!
                              </div>
                            )}
                          </div>
                          <div className="bg-[#111] border border-[#f59e0b]/20 rounded-lg p-4">
                            <div className="text-xs uppercase font-mono tracking-widest text-[#f59e0b] mb-2">
                              Logical Gaps
                            </div>
                            <div className="text-sm text-[#eee] leading-relaxed">
                              {feedbackObj.gaps || "None identified."}
                            </div>
                          </div>
                          <div className="bg-[#111] border border-[#60a5fa]/20 rounded-lg p-4 md:col-span-2">
                            <div className="text-xs uppercase font-mono tracking-widest text-[#60a5fa] mb-2">
                              Tutor Feedback
                            </div>
                            <div className="text-sm text-[#eee] leading-relaxed">
                              {feedbackObj.feedback}
                            </div>
                          </div>
                        </div>
                      )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
