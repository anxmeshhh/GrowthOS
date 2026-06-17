import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, FileText, BookOpen, Loader2, ExternalLink, Plus, Trash2, Edit2, Save, X, Layers } from "lucide-react";
import { PageShell, Card, Btn } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Library — GrowthOS" }] }),
  component: NotesPage,
});

function NotesPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [filterPath, setFilterPath] = useState<string>("all");
  
  // Inline edit state mapping note id to its draft content
  const [editDrafts, setEditDrafts] = useState<Record<string, string>>({});
  
  const [showNewModal, setShowNewModal] = useState(false);

  /* ── Queries ─────────────────────────────────────────────────────────── */
  const { data: paths = [], isLoading: pl } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const res = await apiFetch("/paths/"); return res.ok ? res.json() : []; },
  });

  const { data: customPaths = [], isLoading: cl } = useQuery({
    queryKey: ["custom-paths"],
    queryFn: async () => { const res = await apiFetch("/custom-paths/"); return res.ok ? res.json() : []; },
  });

  const { data: allNotes = [], isLoading: nl } = useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => { const res = await apiFetch("/all-notes/"); return res.ok ? res.json() : []; },
  });

  const { data: allDocs = [], isLoading: dl } = useQuery({
    queryKey: ["all-note-documents"],
    queryFn: async () => { const res = await apiFetch("/all-note-documents/"); return res.ok ? res.json() : []; },
  });

  /* ── Mutations ───────────────────────────────────────────────────────── */
  const saveNoteMutation = useMutation({
    mutationFn: async ({ topicId, content }: { topicId: string, content: string }) => {
      const res = await apiFetch(`/topics/${topicId}/notes/`, {
        method: "POST",
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to save note");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-notes"] }),
  });

  const deleteDocMutation = useMutation({
    mutationFn: async ({ topicId, docId }: { topicId: string, docId: number }) => {
      const res = await apiFetch(`/topics/${topicId}/note-documents/?id=${docId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete document");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-note-documents"] }),
  });

  /* ── Derived Data ────────────────────────────────────────────────────── */
  const isLoading = pl || cl || nl || dl;

  const combinedPaths = [
    ...paths.map((p: any) => ({ ...p, uniqueId: `std-${p.id}` })),
    ...customPaths.map((p: any) => ({ ...p, uniqueId: `cust-${p.id}` }))
  ];

  const resolveTopic = (topicId: string | number) => {
    const key = String(topicId);
    for (const p of combinedPaths) {
      const t = p.topics?.find((t: any) => String(t.id) === key);
      if (t) return { pathTitle: p.title, topicTitle: t.title, topicSlug: t.slug || key };
    }
    return { pathTitle: "Unknown Path", topicTitle: `Topic #${topicId}`, topicSlug: key };
  };

  const pathTitles = [...new Set(combinedPaths.map((p: any) => p.title))];

  const flatItems = useMemo(() => {
    const items: any[] = [];
    for (const note of allNotes) {
      if (!note.content) continue;
      const info = resolveTopic(note.topic);
      items.push({ id: `n-${note.id}`, rawId: note.id, topicId: note.topic, type: "note", ...info, content: note.content, date: note.updated_at });
    }
    for (const doc of allDocs) {
      const info = resolveTopic(doc.topic);
      items.push({ id: `d-${doc.id}`, rawId: doc.id, topicId: doc.topic, type: "doc", ...info, filename: doc.filename, fileUrl: doc.file_url || doc.file, date: doc.uploaded_at });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allNotes, allDocs, combinedPaths]);

  const filteredItems = flatItems.filter(item => {
    if (filterPath !== "all" && item.pathTitle !== filterPath) return false;
    if (q) {
      const lower = q.toLowerCase();
      return item.topicTitle.toLowerCase().includes(lower) || item.content?.toLowerCase().includes(lower) || item.filename?.toLowerCase().includes(lower);
    }
    return true;
  });

  /* ── Handlers ────────────────────────────────────────────────────────── */
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
      onSuccess: () => handleCancelEdit(item)
    });
  };

  const handleDeleteNote = (item: any) => {
    if (!window.confirm("Delete this note entirely?")) return;
    saveNoteMutation.mutate({ topicId: item.topicId, content: "" });
  };

  const handleDeleteDoc = (item: any) => {
    if (!window.confirm(`Delete document "${item.filename}"?`)) return;
    deleteDocMutation.mutate({ topicId: item.topicId, docId: item.rawId });
  };

  /* ── Render ──────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 text-[#444] animate-spin" />
        </div>
      </PageShell>
    );
  }

  // Active topics for the "New" modal
  const activeTopics = combinedPaths
    .flatMap((p: any) => (p.topics || []).map((t: any) => ({ ...t, pathTitle: p.title })))
    .filter((t: any) => t.user_progress === "in_progress" || t.user_progress === "completed");

  return (
    <PageShell>
      <style>{`
        .notes-grid {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }
        @media (min-width: 1024px) {
          .notes-grid {
            display: grid;
            grid-template-columns: 280px 1fr;
            grid-template-rows: auto 1fr;
            grid-template-areas:
              "hdr hdr"
              "side main";
            height: calc(100vh - 64px);
            overflow: hidden;
          }
        }
      `}</style>

      <div className="notes-grid">
        
        {/* ── [HDR] ──────────────────────────────────────────────────────── */}
        <div className="col-span-full flex flex-col md:flex-row md:items-end justify-between pb-1 gap-2 shrink-0" style={{ gridArea: "hdr" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] font-mono text-[#444] mb-1">GrowthOS</p>
            <h1 className="text-xl font-semibold tracking-tight text-[#f0f0f0] leading-none">Library</h1>
          </div>
          <Btn onClick={() => setShowNewModal(true)} size="sm" variant="solid" tone="green" className="w-full md:w-auto">
            <Plus size={14} /> New Material
          </Btn>
        </div>

        {/* ── [SIDE] ─────────────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg flex flex-col overflow-hidden" style={{ gridArea: "side" }}>
          <div className="p-4 border-b border-[#131313] shrink-0 space-y-4">
            <div className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-lg px-3 py-2 focus-within:border-[#444] transition-colors">
              <Search size={14} className="text-[#555]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search materials..."
                className="flex-1 bg-transparent outline-none text-xs text-[#e0e0e0] placeholder:text-[#555]"
              />
              {q && <button onClick={() => setQ("")} className="text-[10px] text-[#666] hover:text-[#ccc]"><X size={12} /></button>}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-0 p-4 custom-scrollbar">
            <div className="text-[9px] uppercase tracking-[0.2em] font-mono text-[#555] mb-3">Filter By Path</div>
            <div className="flex flex-col gap-1.5">
              <FilterPill active={filterPath === "all"} onClick={() => setFilterPath("all")} icon={Layers} label="All Paths" />
              {pathTitles.map(pt => (
                <FilterPill key={pt} active={filterPath === pt} onClick={() => setFilterPath(pt)} label={pt} />
              ))}
            </div>
          </div>
        </div>

        {/* ── [MAIN] ─────────────────────────────────────────────────────── */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] rounded-lg flex flex-col overflow-hidden relative" style={{ gridArea: "main" }}>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#050505]">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-[#555] space-y-3">
                <BookOpen size={32} className="opacity-20" />
                <div className="text-xs font-mono uppercase tracking-wider">No materials found.</div>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 xl:columns-3 gap-4 space-y-4">
                {filteredItems.map(item => {
                  const isEditing = editDrafts[item.id] !== undefined;
                  
                  return (
                    <div key={item.id} className="break-inside-avoid bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-all group flex flex-col">
                      
                      {/* Card Header */}
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#151515] bg-[#0a0a0a]">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {item.type === "note" ? <BookOpen size={12} className="text-[#22c55e] shrink-0" /> : <FileText size={12} className="text-[#3b82f6] shrink-0" />}
                          <div className="text-[10px] font-mono text-[#777] uppercase tracking-wider truncate">{item.topicTitle}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.type === "note" && !isEditing && (
                            <button onClick={() => handleEditNote(item)} className="text-[#555] hover:text-[#fff] transition-colors"><Edit2 size={12} /></button>
                          )}
                          <button onClick={() => item.type === "note" ? handleDeleteNote(item) : handleDeleteDoc(item)} className="text-[#555] hover:text-[#ef4444] transition-colors"><Trash2 size={12} /></button>
                          <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }} className="text-[#555] hover:text-[#fff] transition-colors"><ExternalLink size={12} /></Link>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <div className="p-4 relative">
                        {item.type === "note" ? (
                          isEditing ? (
                            <div className="flex flex-col gap-3">
                              <textarea
                                autoFocus
                                value={editDrafts[item.id]}
                                onChange={(e) => setEditDrafts({ ...editDrafts, [item.id]: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-[#333] rounded-md p-3 text-sm text-[#e0e0e0] outline-none focus:border-[#555] min-h-[150px] resize-none custom-scrollbar"
                              />
                              <div className="flex justify-end gap-2">
                                <Btn size="sm" variant="outline" onClick={() => handleCancelEdit(item)}>Cancel</Btn>
                                <Btn size="sm" variant="solid" tone="green" onClick={() => handleSaveNote(item)}>
                                  {saveNoteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
                                </Btn>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[13px] text-[#b0b0b0] leading-relaxed whitespace-pre-wrap font-sans">
                              {item.content}
                            </div>
                          )
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-3">
                              <FileText size={20} className="text-[#3b82f6]" />
                            </div>
                            <span className="text-[12px] font-medium text-[#ccc] text-center line-clamp-2 px-2 mb-4">{item.filename}</span>
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-mono text-[#3b82f6] uppercase tracking-wider hover:text-[#60a5fa] transition-colors">
                              Download / View
                            </a>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Footer */}
                      {!isEditing && (
                        <div className="px-4 py-2 bg-[#0a0a0a] border-t border-[#151515] flex justify-between items-center mt-auto">
                          <span className="text-[9px] text-[#444] font-mono uppercase tracking-wider truncate mr-4">{item.pathTitle}</span>
                          <span className="text-[9px] text-[#444] font-mono">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Material Modal */}
      {showNewModal && (
        <Modal onClose={() => setShowNewModal(false)}>
          <div className="w-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#f0f0f0]">New Material</h3>
              <button onClick={() => setShowNewModal(false)} className="text-[#666] hover:text-[#fff]"><X size={18}/></button>
            </div>
            <p className="text-sm text-[#888] mb-6">Select an active topic to upload documents or write comprehensive notes in its workspace.</p>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
              {activeTopics.length === 0 ? (
                <div className="text-center text-[#555] text-xs font-mono py-4">No active topics found. Start a roadmap first.</div>
              ) : (
                activeTopics.map((t: any) => (
                  <button 
                    key={t.id}
                    onClick={() => {
                      setShowNewModal(false);
                      navigate({ to: "/topic/$topicId", params: { topicId: t.slug || t.id }});
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-[#222] bg-[#111] hover:border-[#444] hover:bg-[#1a1a1a] transition-all text-left group"
                  >
                    <div className="min-w-0 pr-4">
                      <div className="text-[13px] font-medium text-[#ccc] group-hover:text-[#fff] truncate">{t.title}</div>
                      <div className="text-[10px] font-mono text-[#666] uppercase tracking-wider truncate mt-0.5">{t.pathTitle}</div>
                    </div>
                    <ExternalLink size={14} className="text-[#555] group-hover:text-[#22c55e] shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

function FilterPill({ active, onClick, label, icon: Icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ElementType }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] transition-colors text-left ${
        active ? "bg-[#1a1a1a] text-[#e0e0e0] font-medium" : "text-[#777] hover:bg-[#111] hover:text-[#bbb]"
      }`}
    >
      {Icon && <Icon size={14} className={active ? "text-[#e0e0e0]" : "text-[#555]"} />}
      <span className="truncate">{label}</span>
    </button>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-[#0d0d0d] border border-[#222] rounded-xl p-6 shadow-2xl max-w-[90vw] max-h-[90vh]">
        {children}
      </div>
    </div>
  );
}