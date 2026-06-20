import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Search, BookOpen, Loader2, ExternalLink, FileText, Image as ImageIcon,
  Plus, Trash2, Edit2, Save, X, Layers, Github
} from "lucide-react";
import { PageShell, Btn } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Library — GrowthOS" }] }),
  component: NotesPage,
});

/* ── helpers ─────────────────────────────────────────────────────────── */

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Skel({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-[3px] bg-[#0f0f0f] animate-pulse ${className}`} />
  );
}

type LibraryItem = {
  id: string;
  rawId: number | string;
  topicId: string;
  type: "note";
  pathTitle: string;
  topicTitle: string;
  topicSlug: string;
  content: string;
  date: string;
  documents: NoteDocument[];
  screenshots: TopicScreenshot[];
};

type NoteDocument = {
  id: number | string;
  topic: number | string;
  file?: string;
  filename?: string;
  uploaded_at?: string;
  file_url?: string;
};

type TopicScreenshot = {
  id: number | string;
  topic: number | string;
  image?: string;
  caption?: string;
  uploaded_at?: string;
  image_url?: string;
};

function isGeneratedAttachmentBlock(text: string) {
  return (
    /^!\[[^\]]*\]\(([^)]+)\)$/.test(text) ||
    /^\[([^\]]+)\]\(([^)]+)\)$/.test(text)
  );
}

function renderInlineNoteText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index).replace(/\*\*/g, ""));
    }

    parts.push(
      <a
        key={`${match[2]}-${match.index}`}
        href={match[2]}
        target="_blank"
        rel="noreferrer"
        className="lib-note-link"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex).replace(/\*\*/g, ""));
  }

  return parts;
}

function RenderedNote({ content }: { content: string }) {
  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter((block) => block && !isGeneratedAttachmentBlock(block));

  if (blocks.length === 0) {
    return <p className="lib-note-empty">No written note yet.</p>;
  }

  return (
    <div className="lib-note-content">
      {blocks.map((trimmed, index) => {
        return (
          <p key={index} className="lib-note-paragraph">
            {renderInlineNoteText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

function NotesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [filterPath, setFilterPath] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("notes_filter_path") || "all";
    }
    return "all";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notes_filter_path", filterPath);
    }
  }, [filterPath]);

  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; subtitle: string; onConfirm: () => void } | null>(null);

  /* ── Queries ──────────────────────────────────────────────────────── */
  const { data: paths = [], isLoading: pl } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      return res.ok ? res.json() : [];
    },
  });

  const { data: customPaths = [], isLoading: cl } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => {
      const res = await apiFetch("/custom-paths/");
      return res.ok ? res.json() : [];
    },
  });

  const { data: allNotes = [], isLoading: nl } = useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => {
      const res = await apiFetch("/all-notes/");
      return res.ok ? res.json() : [];
    },
  });

  const { data: allDocs = [], isLoading: dl } = useQuery({
    queryKey: ["all-note-documents"],
    queryFn: async () => {
      const res = await apiFetch("/all-note-documents/");
      return res.ok ? res.json() : [];
    },
  });

  const { data: allScreenshots = [], isLoading: sl } = useQuery({
    queryKey: ["all-screenshots"],
    queryFn: async () => {
      const res = await apiFetch("/all-screenshots/");
      return res.ok ? res.json() : [];
    },
  });

  /* ── Mutations ────────────────────────────────────────────────────── */
  const saveNoteMutation = useMutation({
    mutationFn: async ({ topicId, content }: { topicId: string; content: string }) => {
      const res = await apiFetch(`/topics/${topicId}/notes/`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notes"] }),
  });

  const publishGistMutation = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const res = await apiFetch("/github/gist/", {
        method: "POST",
        body: JSON.stringify({ title, content, description: "Exported from GrowthOS Notes", filename: `${title.replace(/\s+/g, "_").toLowerCase()}.md` }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to publish Gist");
      }
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Successfully published to Gist!\nURL: ${data.url}`);
      window.open(data.url, '_blank');
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  /* ── Derived Data ─────────────────────────────────────────────────── */
  const isLoading = pl || cl || nl || dl || sl;

  const combinedPaths = [
    ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` })),
  ];

  const resolveTopic = (topicId: string | number) => {
    const key = String(topicId);
    for (const p of combinedPaths) {
      const t = p.topics?.find((t: any) => String(t.id) === key);
      if (t)
        return { pathTitle: p.title, topicTitle: t.title, topicSlug: String(t.id) };
    }
    return { pathTitle: "Unknown Path", topicTitle: `Topic #${topicId}`, topicSlug: key };
  };

  const pathTitles = [...new Set(combinedPaths.map((p: any) => p.title))];

  const libraryItems = useMemo<LibraryItem[]>(() => {
    const byTopic = new Map<string, LibraryItem>();

    const ensureItem = (topicId: string | number, seed?: any) => {
      const key = String(topicId);
      const existing = byTopic.get(key);
      if (existing) return existing;

      const info = resolveTopic(key);
      const item: LibraryItem = {
        id: `topic-${key}`,
        rawId: seed?.id ?? key,
        topicId: key,
        type: "note",
        ...info,
        content: seed?.content || "",
        date: seed?.updated_at || seed?.uploaded_at || new Date(0).toISOString(),
        documents: [],
        screenshots: [],
      };
      byTopic.set(key, item);
      return item;
    };

    for (const note of allNotes) {
      const item = ensureItem(note.topic, note);
      item.id = `n-${note.id}`;
      item.rawId = note.id;
      item.content = note.content || "";
      item.date = note.updated_at || item.date;
    }

    for (const doc of allDocs) {
      const item = ensureItem(doc.topic, doc);
      item.documents.push(doc);
      if (doc.uploaded_at && new Date(doc.uploaded_at).getTime() > new Date(item.date || 0).getTime()) {
        item.date = doc.uploaded_at;
      }
    }

    for (const screenshot of allScreenshots) {
      const item = ensureItem(screenshot.topic, screenshot);
      item.screenshots.push(screenshot);
      if (screenshot.uploaded_at && new Date(screenshot.uploaded_at).getTime() > new Date(item.date || 0).getTime()) {
        item.date = screenshot.uploaded_at;
      }
    }

    return Array.from(byTopic.values())
      .filter((item) => item.content || item.documents.length > 0 || item.screenshots.length > 0)
      .sort((a: LibraryItem, b: LibraryItem) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [allNotes, allDocs, allScreenshots, combinedPaths]);

  const filteredItems = libraryItems.filter((item: LibraryItem) => {
    if (filterPath !== "all" && item.pathTitle !== filterPath) return false;
    if (q) {
      const lower = q.toLowerCase();
      return (
        item.topicTitle.toLowerCase().includes(lower) ||
        item.content?.toLowerCase().includes(lower) ||
        item.documents.some((doc) => (doc.filename || doc.file || "").toLowerCase().includes(lower))
      );
    }
    return true;
  });

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleEditNote = (item: any) => {
    setEditDrafts({ ...editDrafts, [item.id]: item.content });
  };

  const handleCancelEdit = (item: any) => {
    const next = { ...editDrafts };
    delete next[item.id];
    setEditDrafts(next);
  };

  const handleSaveNote = (item: any) => {
    const content = editDrafts[item.id];
    saveNoteMutation.mutate({ topicId: item.topicId, content }, {
      onSuccess: () => handleCancelEdit(item),
    });
  };

    const handleDeleteNote = (item: any) => {
      setConfirmAction({
        title: "Delete Note",
        subtitle: "Are you sure you want to delete this note entirely? This action cannot be undone.",
        onConfirm: () => {
          saveNoteMutation.mutate({ topicId: item.topicId, content: "" });
          setConfirmAction(null);
        }
      });
    };

    /* ── Render ───────────────────────────────────────────────────────── */
    if (isLoading) {
      return (
        <PageShell>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-[#eee] animate-spin" />
          </div>
        </PageShell>
      );
    }

    const activeTopics = combinedPaths
      .flatMap((p: any) =>
        (p.topics || []).map((t: any) => ({ ...t, pathTitle: p.title }))
      )
      .filter(
        (t: any) =>
          t.user_progress === "in_progress" || t.user_progress === "completed"
      );

    const noteCount = filteredItems.filter((item) => item.content).length;
    const documentCount = filteredItems.reduce((total, item) => total + item.documents.length, 0);
    const screenshotCount = filteredItems.reduce((total, item) => total + item.screenshots.length, 0);

    return (
      <PageShell>
        <div className="lib-grid">

          {/* ── [HDR] ──────────────────────────────────────────────────── */}
          <div className="lib-header" style={{ gridArea: "hdr" }}>
            <div>
              <p className="lib-eyebrow">GrowthOS</p>
              <h1 className="lib-title">Library</h1>
            </div>

            <div className="lib-header-meta">
              <span className="lib-stat-pill">
                <BookOpen size={10} className="text-[#22c55e]" />
                {noteCount} notes
              </span>
              <span className="lib-stat-pill">
                <FileText size={10} className="text-[#60a5fa]" />
                {documentCount} docs
              </span>
              <span className="lib-stat-pill">
                <ImageIcon size={10} className="text-[#f59e0b]" />
                {screenshotCount} screenshots
              </span>
              <Btn
                onClick={() => setShowNewModal(true)}
                size="sm"
                variant="solid"
                tone="green"
                className="lib-new-btn"
              >
                <Plus size={13} /> New Material
              </Btn>
            </div>
          </div>

          {/* ── [SIDE] ─────────────────────────────────────────────────── */}
          <div className="lib-card" style={{ gridArea: "side" }}>

            {/* Search */}
            <div className="lib-search-wrap">
              <Search size={13} className="text-[#fff]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search materials…"
                className="lib-search-input"
              />
              {q && (
                <button onClick={() => setQ("")} className="lib-search-clear">
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Filter list */}
            <div className="lib-side-section">
              <p className="lib-section-label">Filter by path</p>
              <div className="lib-filter-list">
                <FilterPill
                  active={filterPath === "all"}
                  onClick={() => setFilterPath("all")}
                  icon={Layers}
                  label="All Paths"
                  count={libraryItems.length}
                />
                {pathTitles.map((pt) => {
                  const c = libraryItems.filter((i: LibraryItem) => i.pathTitle === pt).length;
                  return (
                    <FilterPill
                      key={pt}
                      active={filterPath === pt}
                      onClick={() => setFilterPath(pt)}
                      label={pt}
                      count={c}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom hint */}
            <div className="lib-side-footer">
              <p className="lib-hint">
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} shown
              </p>
            </div>
          </div>

          {/* ── [MAIN] ─────────────────────────────────────────────────── */}
          <div className="lib-card lib-main" style={{ gridArea: "main" }}>
            {filteredItems.length === 0 ? (
              <div className="lib-empty">
                <BookOpen size={28} className="text-[#eee] mb-3" />
                <p className="lib-empty-label">No materials found</p>
                <p className="lib-empty-sub">
                  {q ? "Try a different search term" : "Start a roadmap and take notes to see them here"}
                </p>
              </div>
            ) : (
              <div className="lib-masonry">
                {filteredItems.map((item: LibraryItem) => {
                  const isEditing = editDrafts[item.id] !== undefined;

                  return (
                    <div key={item.id} className="lib-item-card lib-item-note">

                      {/* Card header */}
                      <div className="lib-item-header">
                        <div className="lib-item-header-left">
                          <BookOpen size={11} className="text-[#22c55e] shrink-0" />
                          <span className="lib-item-topic">{item.topicTitle}</span>
                        </div>
                        <div className="lib-item-actions">
                          {!isEditing && (
                            <>
                              <button
                                onClick={() => {
                                  setConfirmAction({
                                    title: "Publish Gist",
                                    subtitle: "Publish this note as a public GitHub Gist?",
                                    onConfirm: () => {
                                      publishGistMutation.mutate({ title: item.topicTitle, content: item.content });
                                      setConfirmAction(null);
                                    }
                                  });
                                }}
                                className="lib-action-btn"
                                title="Publish to GitHub Gist"
                              >
                                <Github size={11} />
                              </button>
                              <button
                                onClick={() => handleEditNote(item)}
                                className="lib-action-btn"
                                title="Edit"
                              >
                                <Edit2 size={11} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteNote(item)}
                            className="lib-action-btn lib-action-danger"
                            title="Clear note text"
                          >
                            <Trash2 size={11} />
                          </button>
                          <Link
                            to="/topic/$topicId"
                            params={{ topicId: item.topicSlug }}
                            className="lib-action-btn"
                            title="Open topic"
                          >
                            <ExternalLink size={11} />
                          </Link>
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="lib-item-body">
                        {isEditing ? (
                          <div className="lib-edit-wrap">
                            <textarea
                              autoFocus
                              value={editDrafts[item.id]}
                              onChange={(e) =>
                                setEditDrafts({ ...editDrafts, [item.id]: e.target.value })
                              }
                              className="lib-textarea"
                            />
                            <div className="lib-edit-actions">
                              <Btn
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelEdit(item)}
                              >
                                Cancel
                              </Btn>
                              <Btn
                                size="sm"
                                variant="solid"
                                tone="green"
                                onClick={() => handleSaveNote(item)}
                              >
                                {saveNoteMutation.isPending ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Save size={13} />
                                )}{" "}
                                Save
                              </Btn>
                            </div>
                          </div>
                        ) : item.content ? (
                          <RenderedNote content={item.content} />
                        ) : (
                          <p className="lib-note-empty">No written note yet.</p>
                        )}

                        {!isEditing && (item.documents.length > 0 || item.screenshots.length > 0) && (
                          <div className="lib-attachments">
                            {item.screenshots.length > 0 && (
                              <div className="lib-asset-section">
                                <div className="lib-asset-heading">
                                  <ImageIcon size={11} />
                                  {item.screenshots.length} screenshot{item.screenshots.length !== 1 ? "s" : ""}
                                </div>
                                <div className="lib-screenshot-grid">
                                  {item.screenshots.map((screenshot) => {
                                    const imageUrl = screenshot.image_url || screenshot.image || "";
                                    return (
                                      <a
                                        key={screenshot.id}
                                        href={imageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="lib-screenshot-thumb"
                                      >
                                        <img
                                          src={imageUrl}
                                          alt={screenshot.caption || "Screenshot"}
                                          loading="lazy"
                                        />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {item.documents.length > 0 && (
                              <div className="lib-asset-section">
                                <div className="lib-asset-heading">
                                  <FileText size={11} />
                                  {item.documents.length} document{item.documents.length !== 1 ? "s" : ""}
                                </div>
                                <div className="lib-doc-list">
                                  {item.documents.map((doc) => {
                                    const fileUrl = doc.file_url || doc.file || "";
                                    return (
                                      <a
                                        key={doc.id}
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="lib-doc-chip"
                                      >
                                        <FileText size={11} />
                                        <span>{doc.filename || doc.file?.split("/").pop() || `Document #${doc.id}`}</span>
                                        <ExternalLink size={10} />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>

                      {/* Card footer */}
                      {!isEditing && (
                        <div className="lib-item-footer">
                          <span className="lib-item-path">{item.pathTitle}</span>
                          <span className="lib-item-date">{timeAgo(item.date)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── New Material Modal ─────────────────────────────────────────── */}
        {showNewModal && (
          <Modal onClose={() => setShowNewModal(false)}>
            <div className="lib-modal-inner">
              <div className="lib-modal-header">
                <h3 className="lib-modal-title">New Material</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="lib-modal-close"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="lib-modal-sub">
                Select an active topic to upload documents or write notes in its workspace.
              </p>

              <div className="lib-modal-list">
                {activeTopics.length === 0 ? (
                  <div className="lib-modal-empty">
                    No active topics found. Start a roadmap first.
                  </div>
                ) : (
                  activeTopics.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setShowNewModal(false);
                        navigate({
                          to: "/topic/$topicId",
                          params: { topicId: String(t.id) },
                        });
                      }}
                      className="lib-modal-topic-btn"
                    >
                      <div className="lib-modal-topic-icon">
                        <BookOpen size={12} className="text-[#22c55e]" />
                      </div>
                      <div className="lib-modal-topic-text">
                        <span className="lib-modal-topic-title">{t.title}</span>
                        <span className="lib-modal-topic-path">{t.pathTitle}</span>
                      </div>
                      <ExternalLink size={12} className="text-[#eee] group-hover:text-[#22c55e] transition-colors shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* ── Confirm Action Modal ─────────────────────────────────────────── */}
        {confirmAction && (
          <Modal onClose={() => setConfirmAction(null)}>
            <div className="lib-modal-inner" style={{ maxWidth: '400px' }}>
              <div className="lib-modal-header">
                <h3 className="lib-modal-title">{confirmAction.title}</h3>
                <button
                  onClick={() => setConfirmAction(null)}
                  className="lib-modal-close"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="lib-modal-sub">
                {confirmAction.subtitle}
              </p>
              <div className="flex gap-2 justify-end mt-6">
                <Btn size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Btn>
                <Btn size="sm" variant="solid" tone="green" onClick={confirmAction.onConfirm}>Confirm</Btn>
              </div>
            </div>
          </Modal>
        )}

        {/* ── Styles ────────────────────────────────────────────────────── */}
        <style>{`

        /* ── Shared font base — matches profile page ── */
        .lib-grid,
        .lib-grid * {
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        /* ── Grid layout ── */
        .lib-grid {
          display: grid;
          gap: 6px;
          padding: 6px;
          height: calc(100vh - 64px);
          overflow: hidden;
          grid-template-columns: minmax(210px, 240px) minmax(0, 1fr);
          grid-template-rows: auto 1fr;
          grid-template-areas:
            "hdr  hdr"
            "side main";
        }

        /* ── Header ── */
        .lib-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 10px 4px 6px;
          flex-shrink: 0;
        }

        .lib-eyebrow {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.28em;
          color: #555;
          margin: 0 0 4px;
        }

        .lib-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.025em;
          color: #f5f5f5;
          line-height: 1;
          margin: 0;
        }

        .lib-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .lib-stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 10px;
          border-radius: 4px;
          border: 1px solid #181818;
          background: #0a0a0a;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          color: #777;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .lib-new-btn {
          height: 30px;
        }

        /* ── Card shell ── */
        .lib-card {
          border: 1px solid #131313;
          border-radius: 6px;
          background: #060606;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .lib-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #1c1c1c 30%, #1c1c1c 70%, transparent 100%);
          pointer-events: none;
        }

        /* ── Sidebar ── */
        .lib-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 12px 0;
          padding: 8px 11px;
          border-radius: 5px;
          border: 1px solid #181818;
          background: #0a0a0a;
          flex-shrink: 0;
          transition: border-color 0.15s;
        }

        .lib-search-wrap:focus-within {
          border-color: #2a2a2a;
        }

        .lib-search-input {
          flex: 1;
          background: transparent;
          outline: none;
          font-size: 12px;
          color: #e0e0e0;
          font-family: ui-sans-serif, system-ui, sans-serif;
        }

        .lib-search-input::placeholder {
          color: #444;
        }

        .lib-search-clear {
          color: #444;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s;
        }

        .lib-search-clear:hover {
          color: #aaa;
        }

        .lib-side-section {
          flex: 1;
          overflow-y: auto;
          padding: 14px 12px;
          min-height: 0;
        }

        .lib-section-label {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #3a3a3a;
          margin-bottom: 10px;
        }

        .lib-filter-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .lib-side-footer {
          padding: 10px 14px;
          border-top: 1px solid #0f0f0f;
          flex-shrink: 0;
        }

        .lib-hint {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #2f2f2f;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        /* ── Main panel ── */
        .lib-main {
          overflow: hidden;
        }

        .lib-masonry {
          columns: 1;
          gap: 10px;
          column-gap: 10px;
          padding: 14px;
          overflow-y: auto;
          height: 100%;
        }

        @media (min-width: 900px) {
          .lib-masonry { columns: 2; }
        }

        @media (min-width: 1300px) {
          .lib-masonry { columns: 3; }
        }

        .lib-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }

        .lib-empty-label {
          font-size: 13px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #3a3a3a;
          margin: 0 0 6px;
        }

        .lib-empty-sub {
          font-size: 12px;
          color: #2a2a2a;
          max-width: 240px;
        }

        /* ── Item cards ── */
        .lib-item-card {
          break-inside: avoid;
          border-radius: 6px;
          border: 1px solid #151515;
          background: #080808;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 10px;
          transition: border-color 0.15s ease;
          position: relative;
        }

        .lib-item-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          pointer-events: none;
        }

        .lib-item-note::before {
          background: linear-gradient(90deg, transparent, #22c55e18, transparent);
        }

        .lib-item-doc::before {
          background: linear-gradient(90deg, transparent, #3b82f618, transparent);
        }

        .lib-item-card:hover {
          border-color: #222;
        }

        /* Card header */
        .lib-item-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid #0f0f0f;
          background: #060606;
          flex-shrink: 0;
        }

        .lib-item-header-left {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          flex: 1;
        }

        .lib-item-topic {
          font-size: 10px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #888;
          truncate: ellipsis;
          overflow: hidden;
          white-space: nowrap;
        }

        .lib-item-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0;
          transition: opacity 0.15s;
          flex-shrink: 0;
          margin-left: 8px;
        }

        .lib-item-card:hover .lib-item-actions {
          opacity: 1;
        }

        .lib-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          color: #555;
          transition: color 0.12s, background 0.12s;
        }

        .lib-action-btn:hover {
          color: #ddd;
          background: #111;
        }

        .lib-action-danger:hover {
          color: #ef4444;
          background: #1a0a0a;
        }

        /* Card body */
        .lib-item-body {
          padding: 13px 14px;
          flex: 1;
        }

        .lib-note-content {
          font-size: 13px;
          line-height: 1.65;
          color: #c8c8c8;
          font-family: ui-sans-serif, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lib-note-paragraph {
          white-space: pre-wrap;
          margin: 0;
        }

        .lib-note-link {
          color: #60a5fa;
          text-decoration: none;
          border-bottom: 1px solid #1d4ed8;
          word-break: break-word;
        }

        .lib-note-link:hover {
          color: #93c5fd;
          border-bottom-color: #60a5fa;
        }

        .lib-note-image-link {
          display: block;
        }

        .lib-note-image {
          display: block;
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          border-radius: 6px;
          border: 1px solid #181818;
          background: #050505;
        }

        .lib-note-empty {
          font-size: 12px;
          line-height: 1.5;
          color: #555;
          margin: 0;
          font-style: italic;
        }

        .lib-attachments {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #151515;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .lib-asset-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lib-asset-heading {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #888;
          font-size: 10px;
          font-family: ui-monospace, monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .lib-screenshot-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
          gap: 6px;
        }

        .lib-screenshot-thumb {
          display: block;
          overflow: hidden;
          border-radius: 6px;
          border: 1px solid #181818;
          background: #050505;
          aspect-ratio: 16 / 10;
        }

        .lib-screenshot-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.86;
          transition: opacity 0.15s;
        }

        .lib-screenshot-thumb:hover img {
          opacity: 1;
        }

        .lib-doc-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .lib-doc-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          min-width: 0;
          padding: 7px 8px;
          border-radius: 6px;
          border: 1px solid #181818;
          background: #080808;
          color: #b8c7e6;
          font-size: 12px;
          text-decoration: none;
        }

        .lib-doc-chip span {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lib-doc-chip:hover {
          border-color: #26364f;
          color: #d3e1ff;
        }

        /* Edit mode */
        .lib-edit-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .lib-textarea {
          width: 100%;
          background: #0a0a0a;
          border: 1px solid #222;
          border-radius: 5px;
          padding: 10px 12px;
          font-size: 13px;
          line-height: 1.65;
          color: #ddd;
          outline: none;
          font-family: ui-sans-serif, system-ui, sans-serif;
          min-height: 140px;
          resize: vertical;
          transition: border-color 0.15s;
        }

        .lib-textarea:focus {
          border-color: #333;
        }

        .lib-edit-actions {
          display: flex;
          justify-content: flex-end;
          gap: 7px;
        }

        /* Card footer */
        .lib-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 13px;
          border-top: 1px solid #0d0d0d;
          background: #060606;
          flex-shrink: 0;
        }

        .lib-item-path {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #3a3a3a;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          max-width: 60%;
        }

        .lib-item-date {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #3a3a3a;
          flex-shrink: 0;
        }

        /* ── Modal ── */
        .lib-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.72);
          backdrop-filter: blur(4px);
        }

        .lib-modal-bg {
          position: absolute;
          inset: 0;
        }

        .lib-modal-box {
          position: relative;
          background: #080808;
          border: 1px solid #1f1f1f;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 32px 64px rgba(0,0,0,0.6);
          max-width: 90vw;
          max-height: 90vh;
        }

        .lib-modal-inner {
          width: 420px;
          max-width: 100%;
        }

        .lib-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .lib-modal-title {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #f0f0f0;
          margin: 0;
        }

        .lib-modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 5px;
          color: #555;
          transition: color 0.15s, background 0.15s;
        }

        .lib-modal-close:hover {
          color: #ddd;
          background: #111;
        }

        .lib-modal-sub {
          font-size: 12px;
          color: #666;
          line-height: 1.5;
          margin: 0 0 18px;
        }

        .lib-modal-list {
          max-height: 55vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding-right: 2px;
        }

        .lib-modal-empty {
          text-align: center;
          font-size: 11px;
          font-family: ui-monospace, monospace;
          color: #444;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 24px 0;
        }

        .lib-modal-topic-btn {
          display: flex;
          align-items: center;
          gap: 11px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #161616;
          background: #0a0a0a;
          text-align: left;
          transition: border-color 0.15s, background 0.15s;
          cursor: pointer;
        }

        .lib-modal-topic-btn:hover {
          border-color: #22c55e20;
          background: #0c150e;
        }

        .lib-modal-topic-icon {
          width: 30px;
          height: 30px;
          border-radius: 5px;
          background: #0c140f;
          border: 1px solid #1a3020;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lib-modal-topic-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }

        .lib-modal-topic-title {
          font-size: 13px;
          font-weight: 500;
          color: #cccccc;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .lib-modal-topic-path {
          font-size: 9px;
          font-family: ui-monospace, monospace;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #3a3a3a;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .lib-grid {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto 1fr;
            height: auto;
            overflow: visible;
            grid-template-areas:
              "hdr"
              "side"
              "main";
          }

          .lib-masonry {
            height: auto;
            min-height: 400px;
            overflow-y: visible;
          }
        }
      `}</style>
      </PageShell>
    );
  }

  /* ── Sub-components ───────────────────────────────────────────────────── */

  function FilterPill({
    active,
    onClick,
    label,
    icon: Icon,
    count,
  }: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon?: React.ElementType;
    count?: number;
  }) {
    return (
      <button
        onClick={onClick}
        className={`lib-filter-pill ${active ? "lib-filter-pill-active" : ""}`}
      >
        <style>{`
        .lib-filter-pill {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-family: ui-sans-serif, system-ui, sans-serif;
          text-align: left;
          color: #555;
          transition: color 0.15s, background 0.15s;
          cursor: pointer;
        }
        .lib-filter-pill:hover {
          color: #bbb;
          background: #0d0d0d;
        }
        .lib-filter-pill-active {
          color: #e0e0e0 !important;
          background: #111 !important;
        }
        .lib-filter-pill-count {
          margin-left: auto;
          font-size: 9px;
          font-family: ui-monospace, monospace;
          color: #3a3a3a;
        }
        .lib-filter-pill-active .lib-filter-pill-count {
          color: #555;
        }
      `}</style>
        {Icon && (
          <Icon size={13} style={{ flexShrink: 0, opacity: active ? 1 : 0.5 }} />
        )}
        <span
          style={{
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            flex: 1,
          }}
        >
          {label}
        </span>
        {count !== undefined && (
          <span className="lib-filter-pill-count">{count}</span>
        )}
      </button>
    );
  }

  function Modal({
    children,
    onClose,
  }: {
    children: React.ReactNode;
    onClose: () => void;
  }) {
    return (
      <div className="lib-modal-overlay">
        <div className="lib-modal-bg" onClick={onClose} />
        <div className="lib-modal-box">{children}</div>
      </div>
    );
  }
