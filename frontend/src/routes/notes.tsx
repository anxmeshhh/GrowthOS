import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileText, BookOpen, Loader2, ChevronDown, ChevronRight, ExternalLink, LayoutList, FolderOpen } from "lucide-react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — GrowthOS" }, { name: "description", content: "All your study notes in one place." }] }),
  component: NotesPage,
});

type ViewMode = "all" | "topics";

function NotesPage() {
  const [q, setQ] = useState("");
  const [filterPath, setFilterPath] = useState<string>("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => { const res = await apiFetch("/paths/"); return res.ok ? res.json() : []; },
  });

  const { data: allNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => { const res = await apiFetch("/all-notes/"); return res.ok ? res.json() : []; },
  });

  const { data: allDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["all-note-documents"],
    queryFn: async () => { const res = await apiFetch("/all-note-documents/"); return res.ok ? res.json() : []; },
  });

  const isLoading = pathsLoading || notesLoading || docsLoading;

  // Resolve topic info from paths
  const resolveTopic = (topicId: string | number) => {
    const key = String(topicId);
    for (const p of paths) {
      const t = p.topics?.find((t: any) => String(t.id) === key);
      if (t) return { pathTitle: p.title, topicTitle: t.title, topicSlug: t.slug || key };
    }
    return { pathTitle: "Unknown", topicTitle: `Topic #${topicId}`, topicSlug: key };
  };

  // Group notes and docs by topic
  const topicMap = new Map<string, { pathTitle: string; topicTitle: string; topicSlug: string; topicId: string; notes: any[]; docs: any[] }>();
  for (const note of allNotes) {
    const key = String(note.topic);
    if (!topicMap.has(key)) {
      const info = resolveTopic(key);
      topicMap.set(key, { ...info, topicId: key, notes: [], docs: [] });
    }
    topicMap.get(key)!.notes.push(note);
  }
  for (const doc of allDocs) {
    const key = String(doc.topic);
    if (!topicMap.has(key)) {
      const info = resolveTopic(key);
      topicMap.set(key, { ...info, topicId: key, notes: [], docs: [] });
    }
    topicMap.get(key)!.docs.push(doc);
  }

  const pathTitles = [...new Set([...topicMap.values()].map(v => v.pathTitle))];

  // Build flat items list for "all" view
  const flatItems: { id: string; type: "note" | "doc"; topicTitle: string; pathTitle: string; topicSlug: string; content?: string; filename?: string; fileUrl?: string; date?: string }[] = [];
  for (const note of allNotes) {
    if (!note.content) continue;
    const info = resolveTopic(note.topic);
    flatItems.push({ id: `n-${note.id}`, type: "note", ...info, content: note.content, date: note.updated_at });
  }
  for (const doc of allDocs) {
    const info = resolveTopic(doc.topic);
    flatItems.push({ id: `d-${doc.id}`, type: "doc", ...info, filename: doc.filename, fileUrl: doc.file_url || doc.file, date: doc.uploaded_at });
  }

  // Sort: newest first
  flatItems.sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });

  // Filter
  const filterItem = (item: { topicTitle: string; pathTitle: string; content?: string; filename?: string }) => {
    if (filterPath !== "all" && item.pathTitle !== filterPath) return false;
    if (q) {
      const lower = q.toLowerCase();
      return item.topicTitle.toLowerCase().includes(lower) || item.content?.toLowerCase().includes(lower) || item.filename?.toLowerCase().includes(lower);
    }
    return true;
  };

  const filteredFlat = flatItems.filter(filterItem);
  const filteredTopics = [...topicMap.values()].filter(item => {
    if (filterPath !== "all" && item.pathTitle !== filterPath) return false;
    if (q) {
      const lower = q.toLowerCase();
      return item.topicTitle.toLowerCase().includes(lower) || item.notes.some(n => n.content?.toLowerCase().includes(lower)) || item.docs.some(d => d.filename?.toLowerCase().includes(lower));
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  if (isLoading) {
    return <PageShell><div className="flex items-center justify-center p-12 text-[#555]"><Loader2 className="w-5 h-5 animate-spin mr-3" /> Loading your library...</div></PageShell>;
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Library"
        title="Notes & Documents"
        subtitle={`${allNotes.filter((n: any) => n.content).length} notes · ${allDocs.length} documents across ${topicMap.size} topics`}
      />

      {/* Sticky controls */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a] pb-3 pt-1">
        {/* Search */}
        <div className="flex items-center gap-2 bg-[#111] border border-[#1a1a1a] rounded-lg px-3 py-2.5 mb-3">
          <Search size={14} className="text-[#555]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, documents..."
            className="flex-1 bg-transparent outline-none text-sm text-[#e0e0e0] placeholder:text-[#555]"
          />
          {q && <button onClick={() => setQ("")} className="text-[10px] text-[#666] hover:text-[#ccc]">Clear</button>}
        </div>

        {/* View toggle + path filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("all")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${viewMode === "all" ? "bg-[#1a1a1a] text-[#e0e0e0]" : "text-[#555] hover:text-[#ccc]"}`}
            >
              <LayoutList size={12} /> All Items
            </button>
            <button
              onClick={() => setViewMode("topics")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${viewMode === "topics" ? "bg-[#1a1a1a] text-[#e0e0e0]" : "text-[#555] hover:text-[#ccc]"}`}
            >
              <FolderOpen size={12} /> By Topic
            </button>
          </div>
          <div className="h-4 w-px bg-[#222]" />
          <Pill active={filterPath === "all"} onClick={() => setFilterPath("all")}>All</Pill>
          {pathTitles.map(pt => <Pill key={pt} active={filterPath === pt} onClick={() => setFilterPath(pt)}>{pt}</Pill>)}
        </div>
      </div>

      {/* ─── ALL ITEMS VIEW ─── */}
      {viewMode === "all" && (
        filteredFlat.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
            {filteredFlat.map(item => (
              <div key={item.id} className="flex flex-col bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#333] transition-colors group h-64 relative">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] bg-[#111]">
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === "note" ? <BookOpen size={14} className="text-[#22c55e] shrink-0" /> : <FileText size={14} className="text-[#3b82f6] shrink-0" />}
                    <div className="text-[11px] font-medium text-[#ccc] truncate">{item.topicTitle}</div>
                  </div>
                  <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }} className="text-[#555] hover:text-[#e0e0e0] opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={14} />
                  </Link>
                </div>
                
                <div className="flex-1 p-4 overflow-hidden relative">
                  {item.type === "note" ? (
                    <p className="text-[13px] text-[#999] leading-relaxed whitespace-pre-wrap line-clamp-[7]">
                      {item.content}
                    </p>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center mb-3">
                        <FileText size={20} className="text-[#3b82f6]" />
                      </div>
                      <span className="text-[13px] text-[#ccc] font-medium px-2 line-clamp-2">{item.filename}</span>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="mt-3 text-[11px] text-[#3b82f6] hover:text-[#60a5fa] px-3 py-1.5 rounded-full bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 transition-colors">
                        Download / View
                      </a>
                    </div>
                  )}
                  {item.type === "note" && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0d0d0d] to-transparent pointer-events-none" />
                  )}
                </div>
                
                <div className="px-4 py-3 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center justify-between mt-auto">
                  <div className="text-[10px] text-[#555] truncate max-w-[60%]">{item.pathTitle}</div>
                  {item.date && <div className="text-[10px] text-[#444]">{new Date(item.date).toLocaleDateString()}</div>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ─── BY TOPIC VIEW ─── */}
      {viewMode === "topics" && (
        filteredTopics.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3 mt-4">
            {filteredTopics.map(item => {
              const isOpen = expanded.has(item.topicId);
              const noteCount = item.notes.filter(n => n.content).length;
              const docCount = item.docs.length;
              return (
                <div key={item.topicId} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden hover:border-[#2a2a2a] transition-all">
                  <div 
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer group bg-[#111]"
                    onClick={() => toggleExpand(item.topicId)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isOpen ? "bg-[#22c55e]/10 text-[#22c55e]" : "bg-[#1a1a1a] text-[#555] group-hover:text-[#ccc]"}`}>
                      {isOpen ? <FolderOpen size={16} /> : <FolderOpen size={16} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-[#e0e0e0] truncate group-hover:text-white transition-colors">{item.topicTitle}</div>
                      <div className="text-[11px] text-[#666] mt-1">{item.pathTitle}</div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden sm:flex items-center gap-4 mr-4">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
                          <BookOpen size={12} className={noteCount > 0 ? "text-[#22c55e]/70" : ""} />
                          <span className={noteCount > 0 ? "text-[#ccc]" : ""}>{noteCount} Notes</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#555]">
                          <FileText size={12} className={docCount > 0 ? "text-[#3b82f6]/70" : ""} />
                          <span className={docCount > 0 ? "text-[#ccc]" : ""}>{docCount} Docs</span>
                        </div>
                      </div>
                      <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }} onClick={(e) => e.stopPropagation()}>
                        <Btn variant="outline" size="sm" className="h-8 bg-[#1a1a1a] hover:bg-[#222] border-transparent">View Topic</Btn>
                      </Link>
                      <div className="w-8 flex items-center justify-center text-[#444] group-hover:text-[#ccc] transition-colors">
                        {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-5 border-t border-[#1a1a1a] bg-[#0d0d0d] grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Notes Column */}
                      <div className="space-y-4">
                        <h4 className="text-[12px] font-semibold text-[#888] uppercase tracking-wider flex items-center gap-2">
                          <BookOpen size={14} className="text-[#22c55e]" /> Written Notes
                        </h4>
                        {item.notes.length === 0 || !item.notes.some(n => n.content) ? (
                          <div className="text-[12px] text-[#444] italic">No written notes.</div>
                        ) : (
                          <div className="space-y-3">
                            {item.notes.filter(n => n.content).map(note => (
                              <div key={note.id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 relative group">
                                <div className="text-[13px] text-[#ccc] leading-relaxed whitespace-pre-wrap">
                                  {note.content}
                                </div>
                                <div className="text-[10px] text-[#555] mt-3">
                                  Last updated: {new Date(note.updated_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Docs Column */}
                      <div className="space-y-4">
                        <h4 className="text-[12px] font-semibold text-[#888] uppercase tracking-wider flex items-center gap-2">
                          <FileText size={14} className="text-[#3b82f6]" /> Documents
                        </h4>
                        {item.docs.length === 0 ? (
                          <div className="text-[12px] text-[#444] italic">No documents uploaded.</div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {item.docs.map((doc: any) => (
                              <a 
                                key={doc.id} 
                                href={doc.file_url || doc.file} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#1a1a1a] rounded-xl hover:bg-[#161616] hover:border-[#222] transition-colors text-center group"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                  <FileText size={18} className="text-[#3b82f6]" />
                                </div>
                                <span className="text-[12px] font-medium text-[#ccc] line-clamp-2 px-2">{doc.filename}</span>
                                <span className="text-[10px] mt-1 text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-opacity">Click to open</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <BookOpen size={28} className="mx-auto mb-3 text-[#333]" />
      <div className="text-sm text-[#555]">No notes found. Start studying a topic to create notes.</div>
    </div>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-2.5 py-1 rounded-md text-[11px] transition-colors " +
        (active ? "bg-[#1a1a1a] text-[#e0e0e0]" : "text-[#555] hover:text-[#ccc] hover:bg-[#111]")
      }
    >
      {children}
    </button>
  );
}