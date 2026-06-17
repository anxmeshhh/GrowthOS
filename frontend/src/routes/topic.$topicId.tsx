import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowLeft, Pause, Play, ExternalLink, FileText, UploadCloud,
  Loader2, Image as ImageIcon, Clipboard, X, Trash2, Maximize2,
  CheckCircle2, ChevronRight, RefreshCw, Github, Zap, BookOpen,
  Layers, Hammer, Plus, RotateCcw
} from "lucide-react";
import { PageShell, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast-context";

export const Route = createFileRoute("/topic/$topicId")({
  head: () => ({ meta: [{ title: `Workspace — GrowthOS` }] }),
  component: TopicWorkspace,
});

type Tab = "notes" | "flash" | "quiz" | "build";

/* ─────────────────────────────────────────────
   Utility
───────────────────────────────────────────── */
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
   Main Workspace
───────────────────────────────────────────── */
function TopicWorkspace() {
  const { topicId } = useParams({ from: "/topic/$topicId" });
  const queryClient = useQueryClient();

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

  const [tab, setTab] = useState<Tab>("notes");
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const pasteZoneRef = useRef<HTMLDivElement>(null);

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
    onSuccess: () => refetchScreenshots(),
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
    [topicId]
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (isLoading)
    return (
      <PageShell>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-[#22c55e]" />
            <span className="text-xs font-mono text-[#555] tracking-widest uppercase">Loading workspace</span>
          </div>
        </div>
      </PageShell>
    );

  if (!data)
    return (
      <PageShell>
        <div className="p-8 text-[#ef4444] text-sm">Error loading topic.</div>
      </PageShell>
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

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "notes", label: "Notes", icon: <BookOpen size={13} /> },
    { id: "flash", label: "Flashcards", icon: <Layers size={13} /> },
    { id: "quiz", label: "Quiz", icon: <Zap size={13} /> },
    { id: "build", label: "Build", icon: <Hammer size={13} /> },
  ];

  return (
    <main className="flex flex-col h-[calc(100dvh-3rem)] lg:h-screen overflow-hidden bg-[#060606]">

      {/* ── Top bar ── */}
      <header className="shrink-0 border-b border-[#181818] px-4 sm:px-6 py-0 flex items-center gap-4 z-20 h-14" style={{ background: "linear-gradient(180deg,#0d0d0d 0%,#080808 100%)" }}>
        <Link to="/roadmap" className="group flex items-center gap-1.5 text-[#444] hover:text-[#888] transition-colors">
          <ArrowLeft size={14} />
          <span className="text-[10px] font-mono tracking-widest uppercase hidden sm:block">Back</span>
        </Link>

        <div className="w-px h-5 bg-[#1e1e1e]" />

        <div className="min-w-0 flex-1">
          <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#3a3a3a] mb-0.5">Workspace</div>
          <div className="text-sm font-semibold tracking-[-0.01em] truncate text-[#e8e8e8]">{topic.title}</div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0f0f0f] border border-[#1e1e1e]">
            <div className={`w-1.5 h-1.5 rounded-full ${running ? "bg-[#22c55e] shadow-[0_0_6px_#22c55e]" : "bg-[#333]"}`} />
            <span className="font-mono text-xs text-[#e8e8e8] tabular-nums">{formatTime(seconds)}</span>
            <button
              onClick={() => setRunning((r) => !r)}
              className="text-[#444] hover:text-[#999] transition-colors ml-0.5"
            >
              {running ? <Pause size={12} /> : <Play size={12} />}
            </button>
          </div>

          {/* Mark done */}
          <button
            onClick={() => markDoneMutation.mutate()}
            disabled={isCompleted || markDoneMutation.isPending}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${isCompleted
              ? "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e] cursor-default"
              : "border-[#2a2a2a] bg-[#111] text-[#666] hover:border-[#22c55e]/40 hover:text-[#22c55e] hover:bg-[#22c55e]/5"
              }`}
          >
            <CheckCircle2 size={12} />
            <span className="hidden sm:inline">{isCompleted ? "Completed" : "Mark Done"}</span>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* ════ LEFT: Screenshots ════ */}
        <section
          ref={pasteZoneRef}
          className={`flex flex-col lg:w-[42%] xl:w-[38%] border-b lg:border-b-0 lg:border-r border-[#131313] bg-[#060606]
                      max-h-[38vh] lg:max-h-none lg:h-full overflow-hidden transition-colors
                      ${isDragging ? "border-[#22c55e]/30 bg-[#22c55e]/[0.03]" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length) handleScreenshotFiles(e.dataTransfer.files);
          }}
        >
          {/* Section header */}
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-[#131313]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#22c55e]/10 flex items-center justify-center">
                  <ImageIcon size={12} className="text-[#22c55e]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#d0d0d0] leading-none">Screenshots</div>
                  <div className="text-[10px] text-[#3a3a3a] font-mono mt-0.5">{screenshots.length} saved</div>
                </div>
              </div>
              {uploadScreenshotMutation.isPending && (
                <div className="flex items-center gap-1.5 text-[10px] text-[#22c55e] font-mono">
                  <Loader2 size={10} className="animate-spin" />
                  Uploading
                </div>
              )}
            </div>

            {/* Drop zone */}
            <div
              className={`mt-3 border border-dashed rounded-lg py-2.5 px-3 flex items-center gap-2.5 cursor-pointer
                          transition-all hover:border-[#2a2a2a] hover:bg-[#0d0d0d]
                          ${isDragging ? "border-[#22c55e]/40 bg-[#22c55e]/5" : "border-[#1e1e1e]"}`}
              onClick={() => document.getElementById("screenshotUpload")?.click()}
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
              <Clipboard size={13} className="text-[#333] shrink-0" />
              <span className="text-[11px] text-[#444]">
                <kbd className="px-1.5 py-0.5 bg-[#141414] rounded text-[10px] font-mono text-[#555] border border-[#222]">Ctrl+V</kbd>
                <span className="mx-1.5 text-[#2a2a2a]">·</span>
                drag or click to upload
              </span>
            </div>
          </div>

          {/* Gallery */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0 scrollbar-thin">
            {screenshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6">
                <div className="w-12 h-12 rounded-xl bg-[#0e0e0e] border border-[#1a1a1a] flex items-center justify-center mb-3">
                  <ImageIcon size={18} className="text-[#222]" />
                </div>
                <div className="text-xs text-[#3a3a3a] font-mono">No screenshots yet</div>
                <div className="text-[10px] text-[#2a2a2a] mt-1">Paste or drag an image above</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {screenshots.map((ss: any) => (
                  <div
                    key={ss.id}
                    className="group relative rounded-lg overflow-hidden border border-[#1a1a1a] bg-[#0d0d0d] hover:border-[#2a2a2a] transition-all cursor-pointer"
                    onClick={() => setLightboxImg(ss.image_url || ss.image)}
                  >
                    <img
                      src={ss.image_url || ss.image}
                      alt={ss.caption || "Screenshot"}
                      className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <Maximize2 size={13} className="text-white/80" />
                      </div>
                    </div>
                    <button
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-black/70 text-[#666] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); deleteScreenshotMutation.mutate(ss.id); }}
                    >
                      <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="text-[9px] font-mono text-[#666]">
                        {new Date(ss.uploaded_at).toLocaleDateString(undefined, {
                          month: "short", day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topic.summary && (
              <div className="border border-[#141414] rounded-lg p-3 mt-4 bg-[#090909]">
                <div className="text-[9px] uppercase font-mono tracking-widest text-[#333] mb-1.5">Summary</div>
                <div className="text-xs text-[#666] leading-relaxed">{topic.summary}</div>
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

        {/* ════ RIGHT: Tabs ════ */}
        <section className="flex-1 flex flex-col bg-[#080808] min-h-0 overflow-hidden">

          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-[#131313] px-2 pt-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap ${tab === t.id
                  ? "text-[#e8e8e8]"
                  : "text-[#444] hover:text-[#888]"
                  }`}
              >
                {t.icon}
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-px bg-[#22c55e] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-5 scrollbar-thin">
            {tab === "notes" && <StudyNotesTab topicId={topic.id} />}
            {tab === "flash" && <FlashcardsTab topicId={topic.id} />}
            {tab === "quiz" && <QuizTab topicId={topic.id} />}
            {tab === "build" && <BuildTab topic={topic} materials={materials} progress={progress} />}
          </div>
        </section>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Notes Tab
───────────────────────────────────────────── */
function StudyNotesTab({ topicId }: { topicId: number | string }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteFile, setNoteFile] = useState<File | null>(null);

  const { isLoading } = useQuery({
    queryKey: ["notes", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/notes/`);
      if (!res.ok) return { content: "", documents: [] };
      const json = await res.json();
      setContent(json.content || "");
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

  const saveNote = async (val: string) => {
    setSaving(true);
    await apiFetch(`/topics/${topicId}/notes/`, {
      method: "POST",
      body: JSON.stringify({ content: val }),
    });
    setSaving(false);
  };

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
    onSuccess: () => { setNoteFile(null); refetchDocs(); },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#333]" />
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Text area */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[9px] uppercase tracking-widest font-mono text-[#333]">Markdown</label>
          <span className={`text-[9px] uppercase tracking-widest font-mono transition-colors ${saving ? "text-[#f59e0b]" : "text-[#22c55e]/60"}`}>
            {saving ? "Saving…" : "Saved"}
          </span>
        </div>
        <textarea
          className="w-full h-60 bg-[#060606] border border-[#181818] rounded-lg p-3.5 text-sm text-[#d0d0d0] leading-relaxed
                     focus:outline-none focus:border-[#2a2a2a] resize-y placeholder-[#2a2a2a] font-mono transition-colors"
          placeholder="Start typing your notes…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={() => saveNote(content)}
        />
      </div>

      {/* Document upload */}
      <div>
        <div className="text-[9px] uppercase tracking-widest font-mono text-[#333] mb-2 flex items-center gap-1.5">
          <FileText size={10} />
          Documents
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
            accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => { if (e.target.files?.length) setNoteFile(e.target.files[0]); }}
          />
          <div className="w-8 h-8 rounded-lg bg-[#0f0f0f] border border-[#1e1e1e] flex items-center justify-center shrink-0">
            <UploadCloud size={14} className="text-[#333]" />
          </div>
          <div>
            <div className="text-xs text-[#555]">{noteFile ? noteFile.name : "Drop a file or click to browse"}</div>
            <div className="text-[10px] text-[#333] mt-0.5">PDF, DOCX, TXT, images</div>
          </div>
          {noteFile && (
            <button
              className="ml-auto px-3 py-1.5 rounded-md bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-xs font-medium hover:bg-[#22c55e]/15 transition-colors"
              onClick={(e) => { e.stopPropagation(); uploadDocMutation.mutate(noteFile); }}
              disabled={uploadDocMutation.isPending}
            >
              {uploadDocMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "Upload"}
            </button>
          )}
        </div>
      </div>

      {/* Saved docs */}
      {noteDocuments.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest font-mono text-[#333] mb-2">
            Saved ({noteDocuments.length})
          </div>
          <ul className="space-y-1.5">
            {noteDocuments.map((doc: any) => (
              <li key={doc.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[#141414] bg-[#0a0a0a] hover:border-[#1e1e1e] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={13} className="shrink-0 text-[#22c55e]/60" />
                  <span className="text-xs text-[#888] truncate">
                    {doc.filename || doc.file?.split("/").pop() || `Document #${doc.id}`}
                  </span>
                </div>
                <a href={doc.file_url || doc.file} target="_blank" rel="noreferrer"
                  className="text-[#333] hover:text-[#666] ml-2 shrink-0 transition-colors">
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
    questions.forEach((q: any, i: number) => { if (answers[i] === q.answer) score++; });
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let currentScore = 0;
    questions.forEach((q: any, i: number) => { if (answers[i] === q.answer) currentScore++; });
    try {
      const res = await apiFetch(`/topics/${topicId}/submit-quiz/`, {
        method: "POST",
        body: JSON.stringify({ score: currentScore, total: questions.length }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.status === "passed") {
          showToast(`✨ +${result.xp_earned} XP — Quiz Mastered!`, "xp");
          queryClient.invalidateQueries({ queryKey: ["heatmap"] });
          queryClient.invalidateQueries({ queryKey: ["recent_activity"] });
        }
      }
    } catch (e) { console.error(e); }
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
        <Loader2 size={20} className="animate-spin text-[#333]" />
        <span className="text-[10px] font-mono tracking-widest text-[#333] uppercase">Generating {difficulty} questions</span>
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-12">
        <div className="text-xs text-[#ef4444] mb-4">Failed to generate quiz</div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-md border border-[#222] text-xs text-[#666] hover:text-[#f0f0f0] transition-colors">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );

  return (
    <div className="space-y-5">
      {/* Difficulty */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-widest font-mono text-[#333]">Level</span>
        <div className="flex gap-1.5 ml-1">
          {(["easy", "medium", "hard"] as const).map((d) => {
            const s = DIFF_STYLES[d];
            const active = difficulty === d;
            return (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider border transition-all ${active ? s.active : "border-[#181818] text-[#444] hover:border-[#2a2a2a] hover:text-[#666]"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? s.dot : "bg-[#333]"}`} />
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score card */}
      {submitted && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${score === questions.length
          ? "border-[#22c55e]/20 bg-[#22c55e]/5"
          : "border-[#f59e0b]/20 bg-[#f59e0b]/5"
          }`}>
          <div>
            <div className="text-2xl font-bold text-[#e8e8e8] tabular-nums">{score}<span className="text-base text-[#444] font-normal">/{questions.length}</span></div>
            <div className={`text-xs mt-0.5 ${score === questions.length ? "text-[#22c55e]" : "text-[#f59e0b]"}`}>
              {score === questions.length ? "Perfect score!" : "Review your notes and try again"}
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setAnswers({}); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#222] text-xs text-[#666] hover:text-[#f0f0f0] hover:border-[#333] transition-colors"
          >
            <RotateCcw size={11} /> Retake
          </button>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q: any, i: number) => (
          <div key={i} className="rounded-xl border border-[#141414] bg-[#090909] overflow-hidden">
            <div className="px-4 py-3 border-b border-[#141414] flex items-start gap-3">
              <span className="text-[10px] font-mono text-[#333] mt-0.5 shrink-0">Q{i + 1}</span>
              <span className="text-sm text-[#d0d0d0] leading-snug">{q.question}</span>
            </div>
            <div className="p-3 grid grid-cols-1 gap-1.5">
              {q.options.map((opt: string, j: number) => {
                const isSelected = answers[i] === opt;
                const isCorrect = submitted && opt === q.answer;
                const isWrong = submitted && isSelected && !isCorrect;
                return (
                  <button
                    key={j}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${isCorrect ? "border-[#22c55e]/40 bg-[#22c55e]/10 text-[#22c55e]" :
                      isWrong ? "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]" :
                        isSelected ? "border-[#333] bg-[#141414] text-[#e8e8e8]" :
                          "border-[#141414] hover:border-[#222] hover:bg-[#0f0f0f] text-[#666] hover:text-[#aaa]"
                      }`}
                    onClick={() => !submitted && setAnswers({ ...answers, [i]: opt })}
                    disabled={submitted}
                  >
                    <span className="font-mono text-[9px] mr-2 opacity-50">{String.fromCharCode(65 + j)}.</span>
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
          className="w-full py-2.5 rounded-xl bg-[#22c55e] text-[#030f05] text-sm font-semibold
                     hover:bg-[#16a34a] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? "Submitting…" : `Submit — ${Object.keys(answers).length}/${questions.length} answered`}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Flashcards Tab
───────────────────────────────────────────── */
function FlashcardsTab({ topicId }: { topicId: number }) {
  const queryClient = useQueryClient();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [draftCards, setDraftCards] = useState<{ front: string; back: string }[]>([]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["flashcards", topicId],
    queryFn: async () => {
      const res = await apiFetch(`/topics/${topicId}/flashcards/`);
      if (!res.ok) throw new Error("Failed to load flashcards");
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: async (cards: { front: string; back: string }[]) => {
      const res = await apiFetch(`/topics/${topicId}/flashcards/`, {
        method: "POST",
        body: JSON.stringify({ cards }),
      });
      if (!res.ok) throw new Error("Failed to save flashcards");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flashcards", topicId] });
      setIsEditing(false);
      setFlipped({});
    },
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-[#333]" />
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-12">
        <div className="text-xs text-[#ef4444] mb-4">Failed to load flashcards</div>
        <button onClick={() => refetch()} className="flex items-center gap-1.5 mx-auto px-3 py-1.5 rounded-md border border-[#222] text-xs text-[#666] hover:text-[#f0f0f0] transition-colors">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );

  const flashcards = data?.flashcards || [];

  /* Edit mode */
  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-[#d0d0d0]">Edit Flashcards</div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs text-[#555] hover:text-[#999] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate(draftCards)}
              disabled={saveMutation.isPending}
              className="px-3 py-1.5 rounded-md bg-[#22c55e] text-[#030f05] text-xs font-semibold hover:bg-[#16a34a] disabled:opacity-40 transition-all"
            >
              {saveMutation.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {draftCards.map((c, i) => (
          <div key={i} className="rounded-xl border border-[#141414] bg-[#090909] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#141414]">
              <span className="text-[9px] font-mono text-[#333] uppercase tracking-widest">Card {i + 1}</span>
              <button
                className="text-[#333] hover:text-[#ef4444] transition-colors"
                onClick={() => setDraftCards(draftCards.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[9px] text-[#333] block mb-1 font-mono uppercase tracking-widest">Front</label>
                <input
                  type="text"
                  value={c.front}
                  onChange={(e) => setDraftCards(draftCards.map((card, idx) => idx === i ? { ...card, front: e.target.value } : card))}
                  className="w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#d0d0d0] outline-none focus:border-[#2a2a2a] transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#333] block mb-1 font-mono uppercase tracking-widest">Back</label>
                <textarea
                  value={c.back}
                  onChange={(e) => setDraftCards(draftCards.map((card, idx) => idx === i ? { ...card, back: e.target.value } : card))}
                  className="w-full bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm text-[#d0d0d0] outline-none focus:border-[#2a2a2a] resize-y min-h-[56px] transition-colors"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          className="w-full py-3 rounded-xl border border-dashed border-[#1e1e1e] text-xs text-[#444] hover:border-[#2a2a2a] hover:text-[#777] transition-all flex items-center justify-center gap-2"
          onClick={() => setDraftCards([...draftCards, { front: "", back: "" }])}
        >
          <Plus size={13} /> Add card
        </button>
      </div>
    );
  }

  /* View mode */
  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div className="text-[9px] uppercase tracking-widest font-mono text-[#333]">
          {flashcards.length} {flashcards.length === 1 ? "card" : "cards"}
        </div>
        <button
          onClick={() => { setDraftCards(data?.flashcards || []); setIsEditing(true); }}
          className="px-3 py-1.5 rounded-md border border-[#1e1e1e] text-xs text-[#555] hover:border-[#2a2a2a] hover:text-[#999] transition-all"
        >
          Edit
        </button>
      </div>

      {flashcards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 border border-dashed border-[#141414] rounded-xl">
          <div className="text-xs text-[#3a3a3a] mb-4">No flashcards yet</div>
          <button
            onClick={() => { setDraftCards([]); setIsEditing(true); }}
            className="px-4 py-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 text-xs font-medium hover:bg-[#22c55e]/15 transition-colors"
          >
            Create flashcards
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {flashcards.map((f: any, i: number) => {
            const isFlipped = flipped[i];
            return (
              <div
                key={i}
                className="perspective-1000 h-44 cursor-pointer"
                onClick={() => setFlipped({ ...flipped, [i]: !isFlipped })}
              >
                <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? "rotate-y-180" : ""}`}>
                  {/* Front */}
                  <div className="absolute inset-0 backface-hidden rounded-xl border border-[#181818] bg-[#0a0a0a] hover:border-[#222] transition-colors flex flex-col items-center justify-center p-5">
                    <div className="text-[9px] uppercase font-mono tracking-widest text-[#2a2a2a] mb-3">Term</div>
                    <div className="text-sm font-semibold text-[#e8e8e8] text-center leading-snug">{f.front}</div>
                    <div className="absolute bottom-3 right-3">
                      <RotateCcw size={11} className="text-[#222]" />
                    </div>
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border border-[#22c55e]/15 bg-[#0a0f0a] flex flex-col items-center justify-center p-5">
                    <div className="text-[9px] uppercase font-mono tracking-widest text-[#22c55e]/40 mb-3">Definition</div>
                    <div className="text-xs text-[#aaa] text-center leading-relaxed">{f.back}</div>
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

/* ─────────────────────────────────────────────
   Build Tab
───────────────────────────────────────────── */
function BuildTab({ topic, materials, progress }: { topic: any; materials: any[]; progress: any }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [buildMode, setBuildMode] = useState<"choose" | "ai" | "own">("choose");
  const [repoUrl, setRepoUrl] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  const { data: projectIdeas, isLoading: ideasLoading, refetch: refetchIdeas } = useQuery({
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
        <div className="text-sm font-semibold text-[#e8e8e8]">Topic Verified</div>
        <div className="text-xs text-[#22c55e]/70 mt-1">Your proof of work was accepted</div>
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
              <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: accent }}>{tag}</div>
              <div className="text-sm font-semibold text-[#d0d0d0] mb-1.5 group-hover:text-[#e8e8e8] transition-colors">{label}</div>
              <div className="text-[11px] text-[#3a3a3a] leading-relaxed">{desc}</div>
              <div className="mt-4 flex items-center gap-1" style={{ color: accent + "80" }}>
                <span className="text-[10px] font-mono">Select</span>
                <ChevronRight size={11} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* AI Ideas */}
      {buildMode === "ai" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setBuildMode("choose")} className="text-[10px] font-mono text-[#444] hover:text-[#888] transition-colors flex items-center gap-1">
              <ArrowLeft size={11} /> Back
            </button>
            <button onClick={() => refetchIdeas()} className="text-[10px] font-mono text-[#444] hover:text-[#888] transition-colors flex items-center gap-1">
              <RefreshCw size={11} /> Regenerate
            </button>
          </div>

          {ideasLoading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <Loader2 size={18} className="animate-spin text-[#333]" />
              <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">Generating ideas</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(projectIdeas?.ideas || []).map((idea: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-[#141414] bg-[#090909] hover:border-[#1e1e1e] transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-[9px] font-mono text-[#22c55e]/40 mt-0.5 shrink-0 tabular-nums">0{i + 1}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#d0d0d0] mb-1">{idea.title || `Project ${i + 1}`}</div>
                      <div className="text-xs text-[#555] leading-relaxed">{idea.description || idea}</div>
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
            <button onClick={() => setBuildMode("choose")} className="text-[10px] font-mono text-[#444] hover:text-[#888] transition-colors flex items-center gap-1">
              <ArrowLeft size={11} /> Back
            </button>
          </div>
          <div className="text-xs text-[#555] leading-relaxed pb-1">
            Build any project that demonstrates your understanding, then submit the GitHub link below for AI evaluation.
          </div>
        </div>
      )}

      {/* Repo submission */}
      {buildMode !== "choose" && (
        <div className="rounded-xl border border-[#141414] bg-[#090909] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#141414] flex items-center gap-2">
            <Github size={13} className="text-[#333]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#333]">Submit Repository</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="flex-1 bg-[#060606] border border-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-[#d0d0d0]
                           placeholder-[#2a2a2a] focus:outline-none focus:border-[#2a2a2a] font-mono transition-colors"
              />
              <button
                onClick={() => scanRepoMutation.mutate(repoUrl)}
                disabled={!repoUrl || scanRepoMutation.isPending}
                className="px-4 py-2 rounded-lg bg-[#22c55e] text-[#030f05] text-xs font-semibold
                           hover:bg-[#16a34a] disabled:opacity-30 disabled:cursor-not-allowed transition-all whitespace-nowrap"
              >
                {scanRepoMutation.isPending ? (
                  <span className="flex items-center gap-1.5"><Loader2 size={11} className="animate-spin" /> Scanning</span>
                ) : "Scan Repo"}
              </button>
            </div>

            {scanResult && (
              <div className={`rounded-lg border p-3 ${scanResult.passed ? "border-[#22c55e]/20 bg-[#22c55e]/5" : "border-[#ef4444]/20 bg-[#ef4444]/5"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold ${scanResult.passed ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                    {scanResult.passed ? "✓ Approved" : "✗ Needs work"}
                  </span>
                  {scanResult.score !== undefined && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${scanResult.passed ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}>
                      {scanResult.score}/100
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#666] leading-relaxed whitespace-pre-wrap">{scanResult.feedback}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Previous submissions */}
      {materials?.length > 0 && (
        <div>
          <div className="text-[9px] uppercase tracking-widest font-mono text-[#2a2a2a] mb-3">Previous Submissions</div>
          <ul className="space-y-2">
            {materials.slice().reverse().map((m: any) => (
              <li key={m.id} className="border border-[#141414] rounded-xl bg-[#090909] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#101010]">
                  <span className="text-[10px] font-mono text-[#444]">Submission #{m.id}</span>
                  <div className="flex items-center gap-2">
                    {m.ai_score > 0 && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${m.ai_status === "verified" ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}>
                        {m.ai_score}/100
                      </span>
                    )}
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded capitalize ${m.ai_status === "verified" ? "text-[#22c55e] bg-[#22c55e]/10" :
                      m.ai_status === "rejected" ? "text-[#ef4444] bg-[#ef4444]/10" :
                        "text-[#f59e0b] bg-[#f59e0b]/10"
                      }`}>
                      {m.ai_status}
                    </span>
                  </div>
                </div>
                {m.ai_feedback && (
                  <div className="px-4 py-3 text-[11px] text-[#555] leading-relaxed whitespace-pre-wrap">{m.ai_feedback}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}