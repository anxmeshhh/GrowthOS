import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, FileText, Video, ExternalLink, BookOpen, Loader2 } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — GrowthOS" }, { name: "description", content: "All your study notes, documents, and references in one place." }] }),
  component: NotesPage,
});

function NotesPage() {
  const [q, setQ] = useState("");
  const [filterPath, setFilterPath] = useState<string>("all");

  // Fetch all learning paths with topics
  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch all notes across topics
  const { data: allNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => {
      const res = await apiFetch("/all-notes/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch all note documents across topics
  const { data: allDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["all-note-documents"],
    queryFn: async () => {
      const res = await apiFetch("/all-note-documents/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const isLoading = pathsLoading || notesLoading || docsLoading;

  // Group notes and docs by topic
  const topicMap = new Map<string, { pathTitle: string; topicTitle: string; topicSlug: string; topicId: string; notes: any[]; docs: any[] }>();

  for (const note of allNotes) {
    const key = String(note.topic);
    if (!topicMap.has(key)) {
      // Find topic info from paths
      let pathTitle = "Unknown Path";
      let topicTitle = `Topic #${note.topic}`;
      let topicSlug = String(note.topic);
      for (const p of paths) {
        const t = p.topics?.find((t: any) => String(t.id) === key);
        if (t) { pathTitle = p.title; topicTitle = t.title; topicSlug = t.slug || String(t.id); break; }
      }
      topicMap.set(key, { pathTitle, topicTitle, topicSlug, topicId: key, notes: [], docs: [] });
    }
    topicMap.get(key)!.notes.push(note);
  }

  for (const doc of allDocs) {
    const key = String(doc.topic);
    if (!topicMap.has(key)) {
      let pathTitle = "Unknown Path";
      let topicTitle = `Topic #${doc.topic}`;
      let topicSlug = String(doc.topic);
      for (const p of paths) {
        const t = p.topics?.find((t: any) => String(t.id) === key);
        if (t) { pathTitle = p.title; topicTitle = t.title; topicSlug = t.slug || String(t.id); break; }
      }
      topicMap.set(key, { pathTitle, topicTitle, topicSlug, topicId: key, notes: [], docs: [] });
    }
    topicMap.get(key)!.docs.push(doc);
  }

  // Get unique path titles for filter
  const pathTitles = [...new Set([...topicMap.values()].map(v => v.pathTitle))];

  // Filter and search
  const filteredTopics = [...topicMap.values()].filter(item => {
    if (filterPath !== "all" && item.pathTitle !== filterPath) return false;
    if (q) {
      const lower = q.toLowerCase();
      const matchTitle = item.topicTitle.toLowerCase().includes(lower);
      const matchNotes = item.notes.some(n => n.content?.toLowerCase().includes(lower));
      const matchDocs = item.docs.some(d => d.filename?.toLowerCase().includes(lower));
      if (!matchTitle && !matchNotes && !matchDocs) return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12 text-[#666]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading notes...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Library"
        title="Notes & Documents"
        subtitle={`${allNotes.length} notes · ${allDocs.length} documents across ${topicMap.size} topics`}
      />

      {/* Search */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#666] ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, documents..."
            className="flex-1 bg-transparent outline-none text-sm text-[#f0f0f0] placeholder:text-[#666]"
          />
        </div>
      </Card>

      {/* Path filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <Pill active={filterPath === "all"} onClick={() => setFilterPath("all")}>All Paths</Pill>
        {pathTitles.map(pt => (
          <Pill key={pt} active={filterPath === pt} onClick={() => setFilterPath(pt)}>{pt}</Pill>
        ))}
      </div>

      {/* Notes grouped by topic */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 text-[#666]">
          <BookOpen size={32} className="mx-auto mb-3 opacity-50" />
          <div className="text-sm">No notes found. Start studying a topic to create notes!</div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map(item => (
            <Card key={item.topicId} className="p-0 overflow-hidden">
              {/* Topic header */}
              <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-[#f0f0f0]">{item.topicTitle}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mt-0.5">{item.pathTitle}</div>
                </div>
                <Link to="/topic/$topicId" params={{ topicId: item.topicSlug }}>
                  <Btn variant="outline" size="sm">Open Workspace</Btn>
                </Link>
              </div>

              <div className="p-5 space-y-4">
                {/* Text notes */}
                {item.notes.map(note => (
                  note.content && (
                    <div key={note.id}>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mb-1.5 flex items-center gap-1">
                        <BookOpen size={10} /> Written Notes
                      </div>
                      <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-4 text-sm text-[#ccc] leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {note.content}
                      </div>
                      <div className="text-[10px] font-mono text-[#444] mt-1">
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  )
                ))}

                {/* Uploaded documents */}
                {item.docs.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mb-1.5 flex items-center gap-1">
                      <FileText size={10} /> Uploaded Documents ({item.docs.length})
                    </div>
                    <div className="space-y-1.5">
                      {item.docs.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1a1a1a] bg-[#0d0d0d]">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={14} className="shrink-0 text-[#22c55e]" />
                            <span className="text-sm text-[#ccc] truncate">{doc.filename}</span>
                          </div>
                          <a
                            href={doc.file_url || doc.file}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#22c55e] hover:text-[#4ade80] ml-2 shrink-0"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {item.notes.every(n => !n.content) && item.docs.length === 0 && (
                  <div className="text-xs text-[#555] py-2">No content yet.</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Pill({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider border transition-colors " +
        (active ? "border-[#22c55e]/40 bg-[#0d1a0d] text-[#22c55e]" : "border-[#222] text-[#999] hover:text-[#f0f0f0]")
      }
    >
      {children}
    </button>
  );
}