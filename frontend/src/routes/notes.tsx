import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge } from "@/components/growth-ui";
import { useGrowth } from "@/lib/growth-store";
import { TOPICS } from "@/lib/growth-data";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — GrowthOS" }, { name: "description", content: "Your study notes, searchable and tagged by topic." }] }),
  component: NotesPage,
});

function NotesPage() {
  const { state, update } = useGrowth();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Map<string, string>();
    for (const n of state.notes) {
      const t = TOPICS.find((x) => x.id === n.topicId);
      if (t) set.set(t.id, t.title);
    }
    return Array.from(set.entries());
  }, [state.notes]);

  const filtered = state.notes.filter((n) => {
    if (filter !== "all" && n.topicId !== filter) return false;
    if (q && !(n.title.toLowerCase().includes(q.toLowerCase()) || n.body.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  const newNote = () => {
    const id = `n-${Date.now()}`;
    update((s) => ({ ...s, notes: [{ id, topicId: TOPICS[0].id, title: "Untitled note", body: "", updatedAt: new Date().toISOString() }, ...s.notes] }));
    setOpenId(id);
  };

  const open = state.notes.find((n) => n.id === openId);

  return (
    <PageShell>
      <PageHeader
        kicker="Library"
        title="Notes"
        subtitle={`${state.notes.length} saved · searchable across topics`}
        actions={<Btn size="sm" onClick={newNote}><Plus size={14} /> New note</Btn>}
      />

      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2">
          <Search size={14} className="text-[#666] ml-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes…"
            className="flex-1 bg-transparent outline-none text-sm text-[#f0f0f0] placeholder:text-[#666]"
          />
        </div>
      </Card>

      <div className="flex gap-2 flex-wrap mb-4">
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>All Topics</Pill>
        {tags.map(([id, name]) => (
          <Pill key={id} active={filter === id} onClick={() => setFilter(id)}>{name}</Pill>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((n) => {
          const t = TOPICS.find((x) => x.id === n.topicId);
          return (
            <Card key={n.id} className="p-4 hover:bg-[#161616] transition-colors cursor-pointer" >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold tracking-tight text-[#f0f0f0]">{n.title}</h3>
                <Badge>{t?.title ?? "Untagged"}</Badge>
              </div>
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">{timeAgo(n.updatedAt)}</div>
              <p className="text-sm text-[#999] line-clamp-3 whitespace-pre-wrap">{n.body || "Empty note."}</p>
              <div className="mt-3 flex justify-end">
                <Btn variant="outline" size="sm" onClick={() => setOpenId(n.id)}>Open</Btn>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 ? <div className="text-sm text-[#666] col-span-full">No notes match your filter.</div> : null}
      </div>

      {/* Drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/60" onClick={() => setOpenId(null)} />
          <div className="w-full sm:w-[480px] bg-[#0a0a0a] border-l border-[#222] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#222]">
              <div className="text-[10px] uppercase font-mono tracking-wider text-[#666]">Edit note</div>
              <button className="text-[#666] hover:text-[#f0f0f0]" onClick={() => setOpenId(null)}><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <input
                value={open.title}
                onChange={(e) => update((s) => ({ ...s, notes: s.notes.map((n) => n.id === open.id ? { ...n, title: e.target.value, updatedAt: new Date().toISOString() } : n) }))}
                className="w-full text-lg font-semibold tracking-tight bg-transparent outline-none border-b border-[#222] pb-2"
              />
              <select
                value={open.topicId}
                onChange={(e) => update((s) => ({ ...s, notes: s.notes.map((n) => n.id === open.id ? { ...n, topicId: e.target.value, updatedAt: new Date().toISOString() } : n) }))}
                className="text-xs font-mono uppercase tracking-wider bg-[#0f0f0f] border border-[#222] rounded px-2 py-1.5 text-[#999]"
              >
                {TOPICS.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <textarea
                value={open.body}
                onChange={(e) => update((s) => ({ ...s, notes: s.notes.map((n) => n.id === open.id ? { ...n, body: e.target.value, updatedAt: new Date().toISOString() } : n) }))}
                placeholder="Write everything you learned…"
                className="w-full min-h-[300px] font-mono text-sm bg-[#0f0f0f] border border-[#222] rounded p-3 leading-7 outline-none focus:border-[#22c55e]/50"
              />
            </div>
            <div className="border-t border-[#222] p-3 flex justify-between">
              <Btn variant="ghost" tone="red" size="sm" onClick={() => { update((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== open.id) })); setOpenId(null); }}>Delete</Btn>
              <Btn size="sm" onClick={() => setOpenId(null)}>Done</Btn>
            </div>
          </div>
        </div>
      ) : null}
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
}