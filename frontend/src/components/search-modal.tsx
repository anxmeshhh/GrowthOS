import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, FileText, Map, BookOpen, CreditCard } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useNavigate } from "@tanstack/react-router";

interface SearchResult {
  type: "path" | "topic" | "note" | "flashcard";
  id: number;
  title: string;
  subtitle: string;
  link: string;
}

const TYPE_ICONS = {
  path: Map,
  topic: BookOpen,
  note: FileText,
  flashcard: CreditCard,
};

const TYPE_LABELS = {
  path: "Path",
  topic: "Topic",
  note: "Note",
  flashcard: "Flashcard",
};

const TYPE_COLORS = {
  path: "#7c3aed",
  topic: "#00FF66",
  note: "#f59e0b",
  flashcard: "#3b82f6",
};

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await apiFetch(`/search/?q=${encodeURIComponent(query)}`);
        if (r.ok) {
          const data = await r.json();
          setResults(data.results || []);
          setSelected(0);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const go = useCallback((link: string) => {
    onClose();
    navigate({ to: link });
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) { go(results[selected].link); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selected, go, onClose]);

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "15vh" }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} />

      {/* Modal */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "580px",
          margin: "0 16px",
          background: "#111",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* Input row */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={18} style={{ color: "#555", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search topics, notes, flashcards, paths..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "16px",
              color: "#f0f0f0",
              caretColor: "#00FF66",
            }}
          />
          {loading && <div style={{ width: 16, height: 16, border: "2px solid #333", borderTopColor: "#00FF66", borderRadius: "50%", animation: "spin 0.6s linear infinite", flexShrink: 0 }} />}
          {!loading && query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#555", padding: 0 }}><X size={16} /></button>}
          <kbd style={{ flexShrink: 0, fontSize: "11px", color: "#444", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "2px 6px" }}>ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {results.map((r, i) => {
              const Icon = TYPE_ICONS[r.type];
              const color = TYPE_COLORS[r.type];
              return (
                <button
                  key={`${r.type}-${r.id}`}
                  onClick={() => go(r.link)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 20px",
                    background: i === selected ? "rgba(255,255,255,0.05)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 100ms",
                  }}
                  onMouseEnter={() => setSelected(i)}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                    {r.subtitle && <div style={{ fontSize: 12, color: "#666", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: "#444", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 4, padding: "2px 6px", flexShrink: 0 }}>{TYPE_LABELS[r.type]}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "#555", fontSize: 14 }}>
            No results for "<span style={{ color: "#888" }}>{query}</span>"
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div style={{ padding: "20px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {(["path", "topic", "note", "flashcard"] as const).map(t => {
              const Icon = TYPE_ICONS[t];
              return (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
                  <Icon size={13} style={{ color: TYPE_COLORS[t] }} />
                  {TYPE_LABELS[t]}s
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function useSearchModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
