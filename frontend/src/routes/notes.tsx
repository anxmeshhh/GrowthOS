import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  Search,
  StickyNote,
  Trash2,
  Upload,
  Layers,
  Pencil,
  Camera,
  FileCode,
  ExternalLink,
  Lock,
  CheckCircle,
  ClipboardCheck,
} from "lucide-react";
import { NotesUploadPanel } from "@/components/growth/notes-upload";
import { useGrowthState } from "@/hooks/use-growth-state";
import { ACHIEVEMENTS } from "@/lib/gamification";
import { getFlatTopics, LEARNING_PATHS } from "@/lib/roadmaps";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Notes Library · GrowthOS" },
      { name: "description", content: "Upload, search, and access all your learning notes." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { state, deleteUploadedNote } = useGrowthState();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "uploaded" | "topics">("all");
  const activePath = LEARNING_PATHS[state.profile.path];

  const topicNotes = useMemo(() => {
    return getFlatTopics(state.profile.path).map((topic) => {
      const progress = state.topics[topic.id];
      const linkedUploaded = state.uploadedNotes.filter((un) => un.topicId === topic.id);
      return {
        id: topic.id,
        topic: topic.title,
        meta: topic.meta,
        content: progress?.notesText || "",
        status: progress?.status || "locked",
        canvasData: progress?.canvasData || null,
        captureWorkflow: progress?.captureWorkflow || null,
        flashcards: progress?.flashcards || [],
        quizScore: progress?.quizScore,
        linkedUploaded,
        kind: "topic" as const,
      };
    });
  }, [state.profile.path, state.topics, state.uploadedNotes]);

  const uploaded = state.uploadedNotes;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (text: string) => !q || text.toLowerCase().includes(q);

    const topicItems = topicNotes.filter(
      (n) =>
        (tab === "all" || tab === "topics") &&
        (match(n.topic) || match(n.content) || match(n.meta)) &&
        (n.content.trim() || n.status !== "locked"),
    );

    const uploadItems = uploaded.filter(
      (n) =>
        (tab === "all" || tab === "uploaded") &&
        (match(n.title) || match(n.fileName) || match(n.content.slice(0, 500))),
    );

    return { topicItems, uploadItems };
  }, [query, tab, topicNotes, uploaded]);

  const downloadNote = (title: string, content: string, fileName: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8 pb-8">
      <header>
        <div className="text-xs font-mono text-amber-400/90 font-bold tracking-wider mb-2">
          NOTES LIBRARY
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your knowledge vault</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Topic notes, uploaded files, and explain-back — all in one place · {activePath.title}
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold">Upload notes</h2>
        </div>
        <NotesUploadPanel />
      </section>

      <div className="flex flex-wrap gap-2">
        {(["all", "topics", "uploaded"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              tab === t
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : t === "topics" ? "From topics" : "Uploaded"}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, files, topics..."
          className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
        />
      </div>

      {filtered.uploadItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Uploaded files ({filtered.uploadItems.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {filtered.uploadItems.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-border bg-card p-4 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-medium text-sm">{note.title}</h3>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {note.fileName} · {(note.sizeBytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {note.kind === "text" && (
                      <button
                        type="button"
                        onClick={() => downloadNote(note.title, note.content, note.fileName)}
                        className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteUploadedNote(note.id)}
                      className="p-1.5 rounded hover:bg-red-950/50 text-muted-foreground hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {note.kind === "image" ? (
                  <img
                    src={note.content}
                    alt={note.title}
                    className="rounded-md max-h-40 object-contain w-full bg-[var(--surface-2)]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line font-mono text-[12px]">
                    {note.content}
                  </p>
                )}
                {note.topicId && (
                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: note.topicId }}
                    className="text-[11px] text-amber-400/90 mt-2 inline-block"
                  >
                    Open linked topic →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Topic notes & study notebooks ({filtered.topicItems.length})
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.topicItems.map((note) => {
            const isLocked = note.status === "locked";
            const hasNotes = !!note.content.trim();
            const hasCanvas = !!note.canvasData;
            const hasCapture = !!note.captureWorkflow?.imageData;
            const hasFlashcards = note.flashcards.length > 0;
            const hasQuiz = note.quizScore !== undefined;

            return (
              <div
                key={note.id}
                className={`p-5 rounded-lg border border-border bg-card flex flex-col justify-between space-y-4 transition-all relative ${
                  isLocked ? "opacity-50" : "hover:border-amber-500/30"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground/95">
                        <StickyNote className="w-4 h-4 text-amber-400" />
                        {note.topic}
                      </h3>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{note.meta}</div>
                    </div>
                    <span className="text-[9px] uppercase font-mono border border-border rounded px-1.5 py-0.5 text-muted-foreground shrink-0">
                      {note.status}
                    </span>
                  </div>

                  {/* Written note content preview */}
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line leading-relaxed mb-4">
                    {note.content.trim() || "No written notes yet — start your focus session."}
                  </p>

                  {/* Connected System Materials Grid */}
                  {!isLocked && (
                    <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Connected materials</div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* Notes tab link */}
                        <Link
                          to="/topic/$topicId"
                          params={{ topicId: note.id }}
                          search={{ mode: "write" }}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            hasNotes
                              ? "bg-amber-950/20 border-amber-900/40 text-amber-300 hover:bg-amber-950/40"
                              : "bg-[var(--surface-2)] border-border text-muted-foreground hover:bg-[var(--muted)]"
                          }`}
                        >
                          <FileCode className="w-3 h-3" />
                          <span>Notes</span>
                        </Link>

                        {/* Canvas link */}
                        <Link
                          to="/topic/$topicId"
                          params={{ topicId: note.id }}
                          search={{ mode: "sketch" }}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            hasCanvas
                              ? "bg-amber-950/20 border-amber-900/40 text-amber-300 hover:bg-amber-950/40"
                              : "bg-[var(--surface-2)] border-border text-muted-foreground hover:bg-[var(--muted)]"
                          }`}
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Sketch</span>
                          {hasCanvas && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        </Link>

                        {/* Capture link */}
                        <Link
                          to="/topic/$topicId"
                          params={{ topicId: note.id }}
                          search={{ mode: "capture" }}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            hasCapture
                              ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-300 hover:bg-indigo-950/40"
                              : "bg-[var(--surface-2)] border-border text-muted-foreground hover:bg-[var(--muted)]"
                          }`}
                        >
                          <Camera className="w-3 h-3" />
                          <span>Capture</span>
                          {hasCapture && (
                            <span className="text-[9px] font-mono opacity-80">
                              ({note.captureWorkflow?.regions.length})
                            </span>
                          )}
                        </Link>

                        {/* Flashcards link */}
                        <Link
                          to="/topic/$topicId"
                          params={{ topicId: note.id }}
                          search={{ mode: "flashcards" }}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border transition-colors ${
                            hasFlashcards
                              ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/40"
                              : "bg-[var(--surface-2)] border-border text-muted-foreground hover:bg-[var(--muted)]"
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                          <span>Cards</span>
                          {hasFlashcards && (
                            <span className="text-[9px] font-mono opacity-80">
                              ({note.flashcards.length})
                            </span>
                          )}
                        </Link>

                        {/* Quiz stats */}
                        {hasQuiz && (
                          <div className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border bg-blue-950/20 border-blue-900/40 text-blue-300">
                            <ClipboardCheck className="w-3 h-3" />
                            <span>Quiz: {note.quizScore}%</span>
                          </div>
                        )}
                      </div>

                      {/* Linked Uploaded files list */}
                      {note.linkedUploaded.length > 0 && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-border/40">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">Linked Documents & Capture Files</div>
                          <div className="space-y-1">
                            {note.linkedUploaded.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between text-xs p-1.5 rounded bg-[var(--surface-2)] border border-border"
                              >
                                <span className="font-mono text-[11px] truncate pr-2" title={file.fileName}>
                                  📎 {file.title || file.fileName}
                                </span>
                                <div className="flex gap-1.5 shrink-0">
                                  {file.kind === "text" && (
                                    <button
                                      type="button"
                                      onClick={() => downloadNote(file.title, file.content, file.fileName)}
                                      className="text-[10px] text-amber-400/90 hover:underline"
                                    >
                                      Download
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => deleteUploadedNote(file.id)}
                                    className="text-[10px] text-red-400/80 hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Desk Button */}
                <div className="pt-2">
                  <Link
                    to="/topic/$topicId"
                    params={{ topicId: note.id }}
                    disabled={isLocked}
                    className="w-full text-xs font-medium px-3 py-2 rounded-md border border-border bg-[var(--surface-2)] hover:bg-[var(--muted)] flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Open Desk Workspace →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border/80 bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 p-5">
        <h2 className="text-sm font-semibold mb-3">Achievements</h2>
        <div className="flex flex-wrap gap-2">
          {Object.values(ACHIEVEMENTS).map((ach) => {
            const unlocked = state.gamification.achievements.includes(ach.id);
            return (
              <div
                key={ach.id}
                title={ach.description}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${
                  unlocked
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-200"
                    : "border-border bg-[var(--surface-2)]/50 text-muted-foreground opacity-50 grayscale"
                }`}
              >
                <span>{ach.icon}</span>
                <span className="font-medium">{ach.title}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
