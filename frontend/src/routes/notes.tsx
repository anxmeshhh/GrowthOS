import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, StickyNote } from "lucide-react";
import { useGrowthState } from "@/hooks/use-growth-state";
import { getFlatTopics, LEARNING_PATHS } from "@/lib/roadmaps";

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Smart Notes · GrowthOS" },
      { name: "description", content: "Your searchable topic-linked knowledge base." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const { state } = useGrowthState();
  const [query, setQuery] = useState("");
  const activePath = LEARNING_PATHS[state.profile.path];

  const notes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return getFlatTopics(state.profile.path)
      .map((topic) => {
        const progress = state.topics[topic.id];
        return {
          id: topic.id,
          topic: topic.title,
          meta: topic.meta,
          content: progress?.notesText || "",
          status: progress?.status || "locked",
        };
      })
      .filter((note) => {
        if (!normalizedQuery) return note.content.trim() || note.status !== "locked";
        return (
          note.topic.toLowerCase().includes(normalizedQuery) ||
          note.meta.toLowerCase().includes(normalizedQuery) ||
          note.content.toLowerCase().includes(normalizedQuery)
        );
      });
  }, [query, state.profile.path, state.topics]);

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-6">
      <header>
        <div className="text-xs font-mono text-[var(--in-progress)] font-bold tracking-wider mb-2">
          SMART NOTES
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Your knowledge base</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {notes.length} visible notes and topics from {activePath.title}
        </p>
      </header>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search notes, topics, or concepts..."
          className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-[var(--in-progress)]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {notes.map((note) => (
          <article
            key={note.id}
            className="p-4 rounded-md border border-border bg-card hover:bg-[var(--surface-2)] transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <StickyNote className="w-3.5 h-3.5 text-[var(--in-progress)]" />
                  {note.topic}
                </h3>
                <div className="text-[11px] font-mono text-muted-foreground mt-1">{note.meta}</div>
              </div>
              <span className="text-[10px] uppercase font-mono border border-border rounded-md px-2 py-1 text-muted-foreground">
                {note.status}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
              {note.content.trim() ||
                "No notes yet. Open this topic from the roadmap and write your proof notes."}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
