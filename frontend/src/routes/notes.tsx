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
          <div className="space-y-2 mt-2">
            {filteredFlat.map(item => (
              <div key={item.id} className="flex items-start gap-4 px-4 py-3 bg-[#111] border border-[#1a1a1a] rounded-lg hover:border-[#252525] transition-colors group">
                {/* Icon */}
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.type === "note" ? "bg-[#0d1a0d] text-[#22c55e]" : "bg-[#0d1317] text-[#3b82f6]"}`}>
                  {item.type === "note" ? <BookOpen size={14} /> : <FileText size={14} />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#ccc]">{item.topicTitle}</span>
                    <span className="text-[10px] text-[#444]">·</span>
                    <span className="text-[10px] text-[#555]">{item.pathTitle}</span>
                  </div>
                  {item.type === "note" ? (
                    <p className="text-[13px] text-[#888] leading-relaxed line-clamp-2">{item.content}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-[#888]">{item.filename}</span>
                      <a href={item.fileUrl} target="_blank" rel="noreferrer" className="text-[#3b82f6] hover:text-[#60a5fa] opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  {item.date && <div className="text-[10px] text-[#444] mt-1">{new Date(item.date).toLocaleDateString()}</div>}
                </div>
                {/* Open workspace link */}
                <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn variant="ghost" size="sm">Open</Btn>
                </Link>
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
          <div className="space-y-2 mt-2">
            {filteredTopics.map(item => {
              const isOpen = expanded.has(item.topicId);
              const noteCount = item.notes.filter(n => n.content).length;
              const docCount = item.docs.length;
              return (
                <div key={item.topicId} className="bg-[#111] border border-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(item.topicId)}>
                      {isOpen ? <ChevronDown size={14} className="text-[#22c55e] shrink-0" /> : <ChevronRight size={14} className="text-[#444] shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#e0e0e0] truncate">{item.topicTitle}</div>
                        <div className="text-[10px] text-[#555] mt-0.5">{item.pathTitle}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {noteCount > 0 && <span className="text-[10px] text-[#555]">{noteCount} note{noteCount !== 1 ? "s" : ""}</span>}
                        {docCount > 0 && <span className="text-[10px] text-[#555]">{docCount} doc{docCount !== 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }}>
                      <Btn variant="ghost" size="sm">Open</Btn>
                    </Link>
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#1a1a1a] space-y-3">
                      {item.notes.map(note => (
                        note.content && (
                          <div key={note.id}>
                            <div className="text-[10px] text-[#555] mb-1.5 flex items-center gap-1.5">
                              <BookOpen size={10} /> Written notes
                            </div>
                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 text-[13px] text-[#999] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {note.content}
                            </div>
                            <div className="text-[10px] text-[#444] mt-1">
                              {new Date(note.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                        )
                      ))}
                      {item.docs.length > 0 && (
                        <div>
                          <div className="text-[10px] text-[#555] mb-1.5 flex items-center gap-1.5">
                            <FileText size={10} /> Documents ({item.docs.length})
                          </div>
                          <div className="space-y-1">
                            {item.docs.map((doc: any) => (
                              <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText size={13} className="shrink-0 text-[#3b82f6]" />
                                  <span className="text-[13px] text-[#999] truncate">{doc.filename}</span>
                                </div>
                                <a href={doc.file_url || doc.file} target="_blank" rel="noreferrer" className="text-[#3b82f6] hover:text-[#60a5fa] ml-2 shrink-0">
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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