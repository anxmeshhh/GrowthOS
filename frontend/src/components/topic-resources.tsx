import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { ExternalLink, Plus, ThumbsUp, BookOpen, Video, FileText, Wrench, GraduationCap, Dumbbell, Loader2, X, CheckCircle2 } from "lucide-react";

const TYPE_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  doc:      { label: "Docs",     icon: BookOpen,      color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  video:    { label: "Video",    icon: Video,         color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
  article:  { label: "Article",  icon: FileText,      color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  tool:     { label: "Tool",     icon: Wrench,        color: "#00FF66", bg: "rgba(0,255,102,0.1)" },
  course:   { label: "Course",   icon: GraduationCap, color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
  practice: { label: "Practice", icon: Dumbbell,      color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
};

const TYPES = Object.entries(TYPE_META).map(([id, m]) => ({ id, ...m }));

interface Resource {
  id: number;
  title: string;
  url: string;
  type: string;
  description: string;
  upvotes: number;
  is_verified: boolean;
  added_by: string | null;
}

function AddResourceForm({ topicId, onDone }: { topicId: string; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("article");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: async () => {
      const r = await apiFetch(`/topics/${topicId}/resources/`, {
        method: "POST",
        body: JSON.stringify({ title, url, type, description: desc }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error || "Failed"); }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["resources", topicId] });
      onDone();
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #222", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#ddd" }}>Add a resource</span>
        <button onClick={onDone} style={{ background: "none", border: "none", cursor: "pointer", color: "#555" }}><X size={16} /></button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (e.g. MDN — Array Methods)" style={inputStyle} />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (https://...)" style={inputStyle} />
        <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Short description (optional)" style={inputStyle} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 10px", borderRadius: 20, fontSize: 12, cursor: "pointer",
              background: type === t.id ? t.bg : "#161616",
              border: `1px solid ${type === t.id ? t.color + "60" : "#222"}`,
              color: type === t.id ? t.color : "#666",
              transition: "all 0.15s",
            }}>
              <t.icon size={11} /> {t.label}
            </button>
          ))}
        </div>

        {err && <p style={{ fontSize: 12, color: "#ef4444", margin: 0 }}>{err}</p>}

        <button
          onClick={() => add.mutate()}
          disabled={!title.trim() || !url.trim() || add.isPending}
          style={{
            padding: "9px 16px", borderRadius: 8, border: "none", cursor: "pointer",
            background: title && url ? "#00FF66" : "#1a1a1a",
            color: title && url ? "#0a0a0a" : "#444",
            fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
          }}
        >
          {add.isPending ? <Loader2 size={14} className="animate-spin" /> : "Add Resource"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#161616", border: "1px solid #222", borderRadius: 8,
  padding: "8px 12px", fontSize: 13, color: "#ccc", outline: "none",
  width: "100%", boxSizing: "border-box",
};

export function TopicResources({ topicId }: { topicId: string }) {
  const [adding, setAdding] = useState(false);
  const [upvoted, setUpvoted] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["resources", topicId],
    queryFn: async () => {
      const r = await apiFetch(`/topics/${topicId}/resources/`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  const upvote = useMutation({
    mutationFn: async (resourceId: number) => {
      const r = await apiFetch(`/topics/${topicId}/resources/`, {
        method: "PATCH",
        body: JSON.stringify({ resource_id: resourceId }),
      });
      return r.json();
    },
    onMutate: (id) => setUpvoted(s => new Set([...s, id])),
    onSettled: () => qc.invalidateQueries({ queryKey: ["resources", topicId] }),
  });

  const grouped = TYPES.reduce((acc, t) => {
    acc[t.id] = resources.filter(r => r.type === t.id);
    return acc;
  }, {} as Record<string, Resource[]>);

  const hasAny = resources.length > 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Resources ({resources.length})
        </div>
        <button onClick={() => setAdding(a => !a)} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "5px 12px", borderRadius: 8, fontSize: 12, cursor: "pointer",
          background: "rgba(0,255,102,0.08)", border: "1px solid rgba(0,255,102,0.2)",
          color: "#00FF66", fontWeight: 600,
        }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {adding && <AddResourceForm topicId={topicId} onDone={() => setAdding(false)} />}

      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
          <Loader2 size={20} style={{ color: "#444" }} className="animate-spin" />
        </div>
      )}

      {!isLoading && !hasAny && !adding && (
        <div style={{ padding: "28px 16px", textAlign: "center", color: "#444", fontSize: 13 }}>
          No resources yet. Be the first to add a helpful link for this topic.
        </div>
      )}

      {TYPES.filter(t => grouped[t.id]?.length > 0).map(t => (
        <div key={t.id} style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <t.icon size={12} style={{ color: t.color }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em" }}>{t.label}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {grouped[t.id].map(res => (
              <div key={res.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: "10px 12px", background: "#111", border: "1px solid #1e1e1e",
                borderRadius: 10, transition: "border-color 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#2a2a2a")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e1e")}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <a href={res.url} target="_blank" rel="noopener noreferrer" style={{
                      fontSize: 13, fontWeight: 600, color: "#ddd", textDecoration: "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      display: "flex", alignItems: "center", gap: 5,
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#00FF66")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#ddd")}
                    >
                      {res.title}
                      <ExternalLink size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
                    </a>
                    {res.is_verified && <CheckCircle2 size={12} style={{ color: "#00FF66", flexShrink: 0 }} />}
                  </div>
                  {res.description && (
                    <div style={{ fontSize: 11, color: "#555", lineHeight: 1.4 }}>{res.description}</div>
                  )}
                </div>
                <button
                  onClick={() => !upvoted.has(res.id) && upvote.mutate(res.id)}
                  disabled={upvoted.has(res.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                    padding: "4px 8px", borderRadius: 6, cursor: upvoted.has(res.id) ? "default" : "pointer",
                    background: upvoted.has(res.id) ? "rgba(0,255,102,0.08)" : "transparent",
                    border: `1px solid ${upvoted.has(res.id) ? "rgba(0,255,102,0.2)" : "#1a1a1a"}`,
                    color: upvoted.has(res.id) ? "#00FF66" : "#555",
                    fontSize: 11, transition: "all 0.15s",
                  }}
                >
                  <ThumbsUp size={11} /> {res.upvotes}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
