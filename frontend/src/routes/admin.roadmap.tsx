import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/components/toast-context";
import { apiFetch } from "@/lib/api-client";
import {
  ShieldAlert,
  Map,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Minus,
  RefreshCw,
  Trash2,
  Edit2,
  BookOpen,
  FileJson,
  Copy,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/roadmap")({
  component: AdminRoadmapManager,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface TopicStats {
  created: number;
  updated: number;
  deleted: number;
  deleted_titles: string[];
}

interface RoadmapResult {
  slug: string;
  title: string;
  path_status: "created" | "updated";
  topics: TopicStats;
  topic_warnings?: string[];
}

interface SyncResponse {
  message: string;
  roadmaps?: RoadmapResult[];
  warnings?: { roadmap: string; error: string }[];
  errors?: { roadmap: string; error: string }[];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  color: string;
}) {
  if (value === 0) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
      style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <Icon size={10} />
      {value} {label}
    </span>
  );
}

function RoadmapResultCard({ result }: { result: RoadmapResult }) {
  const isNew = result.path_status === "created";
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#0d0d0d", border: "1px solid #1e2e1e" }}
    >
      {/* Header strip */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "#111" }}
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 size={14} className="text-green-500 shrink-0" />
          <span className="font-mono text-sm font-semibold" style={{ color: "#d4d4d4" }}>
            {result.title}
          </span>
          <span className="font-mono text-xs" style={{ color: "#3a5a3a" }}>
            /{result.slug}
          </span>
        </div>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={
            isNew
              ? { background: "#0a1e12", color: "#00FF66", border: "1px solid #1a3a22" }
              : { background: "#0a0f1e", color: "#60a5fa", border: "1px solid #1e3a5f" }
          }
        >
          {isNew ? "created" : "updated"}
        </span>
      </div>

      {/* Topic stats */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-2">
        <StatPill icon={Plus} value={result.topics.created} label="created" color="#00FF66" />
        <StatPill icon={RefreshCw} value={result.topics.updated} label="updated" color="#60a5fa" />
        <StatPill icon={Minus} value={result.topics.deleted} label="deleted" color="#ef4444" />

        {result.topics.created === 0 &&
          result.topics.updated === 0 &&
          result.topics.deleted === 0 && (
            <span className="text-xs font-mono" style={{ color: "#3a3a3a" }}>
              no topic changes
            </span>
          )}

        {result.topics.deleted_titles.length > 0 && (
          <span className="text-xs font-mono ml-1" style={{ color: "#5a2a2a" }}>
            removed: {result.topics.deleted_titles.join(", ")}
          </span>
        )}
      </div>

      {/* Per-topic warnings */}
      {result.topic_warnings && result.topic_warnings.length > 0 && (
        <div className="px-4 pb-2.5 flex flex-col gap-1">
          {result.topic_warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle size={12} className="text-yellow-500 shrink-0 mt-0.5" />
              <span className="text-xs font-mono" style={{ color: "#b45309" }}>
                {w}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorCard({ item }: { item: { roadmap: string; error: string } }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: "#1a0707", border: "1px solid #3f0f0f" }}
    >
      <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-mono font-semibold" style={{ color: "#f87171" }}>
          {item.roadmap}
        </p>
        <p className="text-xs font-mono mt-0.5" style={{ color: "#9a3030" }}>
          {item.error}
        </p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

function AdminRoadmapManager() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: roadmaps = [], isLoading: isLoadingRoadmaps } = useQuery({
    queryKey: ["admin-roadmaps"],
    queryFn: async () => {
      const res = await apiFetch("/admin/roadmaps/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const deleteRoadmap = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/admin/roadmaps/${slug}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete roadmap");
      return slug;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roadmaps"] });
      showToast("Roadmap deleted successfully", "success");
    },
    onError: (err: any) => {
      showToast(err.message || "Failed to delete roadmap", "error");
    },
  });

  const handleEditClick = (roadmap: any) => {
    // Generate JSON payload schema for the roadmap
    const payload = {
      title: roadmap.title,
      slug: roadmap.slug,
      description: roadmap.description,
      estimated_weeks: roadmap.estimated_weeks,
      topics:
        roadmap.topics?.map((t: any) => ({
          title: t.title,
          slug: t.slug,
          summary: t.summary,
          node_kind: t.node_kind,
          order: t.order,
        })) || [],
    };
    setJsonContent(JSON.stringify(payload, null, 2));
    setIsValidated(false);
    setValidationError(null);
    showToast(`Loaded ${roadmap.title} for editing`, "success");
  };

  const [jsonContent, setJsonContent] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File Import ──────────────────────────────────────────────────────────────
  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setJsonContent(text);
        setIsValidated(false);
        setValidationError(null);
        setSyncResult(null);
        showToast(`Imported: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, "success");
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [showToast],
  );

  // Live stats
  const lineCount = jsonContent ? jsonContent.split("\n").length : 0;
  const charCount = jsonContent.length;
  let parsedTopicCount: number | null = null;
  try {
    const p = JSON.parse(jsonContent);
    const arr = Array.isArray(p) ? p : [p];
    parsedTopicCount = arr.reduce(
      (acc: number, r: any) => acc + (Array.isArray(r.topics) ? r.topics.length : 0),
      0,
    );
  } catch {}

  const copySchema = () => {
    navigator.clipboard.writeText(SCHEMA_EXAMPLE);
    showToast("Schema copied to clipboard!", "success");
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const handleValidate = () => {
    setValidationError(null);
    setIsValidated(false);
    setSyncResult(null);

    if (!jsonContent.trim()) {
      setValidationError("JSON content cannot be empty.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonContent);

      const validateRoadmap = (roadmap: any, idx?: number) => {
        const label = idx !== undefined ? `roadmap[${idx}]` : "roadmap";
        if (!roadmap.slug) throw new Error(`Missing 'slug' in ${label}.`);
        if (!roadmap.title) throw new Error(`Missing 'title' in ${label}.`);
        if (!Array.isArray(roadmap.topics))
          throw new Error(`'topics' must be an array in ${label}.`);

        roadmap.topics.forEach((t: any, i: number) => {
          if (!t.slug) throw new Error(`Topic[${i}] in ${label} is missing 'slug'.`);
          if (!t.title) throw new Error(`Topic[${i}] in ${label} is missing 'title'.`);
          if (t.node_kind && !["topic", "milestone", "optional"].includes(t.node_kind)) {
            throw new Error(
              `Topic[${i}] in ${label} has invalid node_kind '${t.node_kind}'. ` +
                `Must be topic | milestone | optional.`,
            );
          }
        });
      };

      if (Array.isArray(parsed)) {
        if (parsed.length === 0) throw new Error("Array must contain at least one roadmap.");
        parsed.forEach((r, i) => validateRoadmap(r, i));
      } else {
        validateRoadmap(parsed);
      }

      setIsValidated(true);
      showToast(
        `JSON valid — ${Array.isArray(parsed) ? parsed.length + " roadmap(s)" : "1 roadmap"} ready to deploy.`,
        "success",
      );
      setJsonContent(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setValidationError(e.message || "Invalid JSON syntax.");
    }
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!isValidated) {
      showToast("Please validate the JSON first.", "error");
      return;
    }

    setIsParsing(true);
    setSyncResult(null);

    try {
      const payload = JSON.parse(jsonContent);
      const res = await apiFetch("/admin/roadmaps/upload/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data: SyncResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.errors?.[0]?.error || (data as any).error || "Upload failed.");
      }

      setSyncResult(data);
      showToast(data.message || "Roadmap(s) synchronized!", "xp");
      setJsonContent("");
      setIsValidated(false);
      queryClient.invalidateQueries({ queryKey: ["admin-roadmaps"] });
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setJsonContent("");
    setIsValidated(false);
    setValidationError(null);
    setSyncResult(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans selection:bg-red-500/30">
      <div className="p-6 max-w-5xl mx-auto">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate({ to: "/admin/dashboard" })}
              className="text-gray-500 hover:text-white transition-colors text-sm font-mono flex items-center gap-1 cursor-pointer mb-2"
            >
              <ArrowLeft size={14} /> Back to Command Center
            </button>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Map className="text-purple-500" />
              Roadmap Manager
            </h1>
            <p className="text-gray-400 font-mono text-sm mt-1">Centralized System Path Upload</p>
          </div>
          <div className="px-3 py-1 rounded-full border border-red-900 bg-red-950/30 text-red-500 text-xs font-mono uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={14} />
            Admin Only
          </div>
        </div>

        {/* ── Schema Reference Panel ────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#1e1e2e] bg-[#0a0a12] overflow-hidden mb-4">
          <button
            onClick={() => setShowSchema((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-[#0d0d18] transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-purple-400 uppercase tracking-wider font-mono">
              <Info size={14} /> JSON Schema Reference
            </span>
            {showSchema ? (
              <ChevronDown size={14} className="text-purple-500" />
            ) : (
              <ChevronRight size={14} className="text-purple-500" />
            )}
          </button>

          {showSchema && (
            <div className="border-t border-[#1e1e2e] p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Field table */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-3">
                  Required Fields
                </h3>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left py-1.5 pr-4 text-gray-500">Field</th>
                      <th className="text-left py-1.5 pr-4 text-gray-500">Type</th>
                      <th className="text-left py-1.5 text-gray-500">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#111]">
                    {[
                      ["title", "string", "Display name of the roadmap", true],
                      ["slug", "string", "URL-safe unique ID (e.g. backend-dev)", true],
                      ["description", "string", "Short description", false],
                      ["estimated_weeks", "number", "Duration estimate (default: 12)", false],
                      ["topics", "array", "Array of topic objects", true],
                      ["topics[].title", "string", "Display name of the topic", true],
                      ["topics[].slug", "string", "Unique within this path", true],
                      ["topics[].summary", "string", "Short description", false],
                      ["topics[].node_kind", "string", "milestone | topic | optional", false],
                      ["topics[].order", "number", "Display order (1, 2, 3...)", false],
                    ].map(([field, type, note, req]) => (
                      <tr key={String(field)}>
                        <td className="py-1.5 pr-4 text-purple-300">{String(field)}</td>
                        <td className="py-1.5 pr-4 text-blue-400">{String(type)}</td>
                        <td className="py-1.5 text-gray-500">
                          {req && <span className="text-red-400 mr-1">*</span>}
                          {String(note)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 space-y-2">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400 mb-2">
                    node_kind Values
                  </h3>
                  {[
                    [
                      "milestone",
                      "#3b5bdb",
                      "Section header — starts a new group. Topics below it are grouped under it.",
                    ],
                    [
                      "topic",
                      "#00FF66",
                      "Standard topic (default). Grouped under the previous milestone.",
                    ],
                    [
                      "optional",
                      "#888",
                      "Optional topic — dashed border. Grouped under the previous milestone.",
                    ],
                  ].map(([kind, color, desc]) => (
                    <div key={String(kind)} className="flex items-start gap-2">
                      <span
                        className="mt-0.5 shrink-0 px-2 py-0.5 rounded text-xs font-mono font-bold"
                        style={{
                          color: String(color),
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {String(kind)}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{String(desc)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Example JSON */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400">
                    Example JSON
                  </h3>
                  <button
                    onClick={copySchema}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-[#1a1a2a] border border-[#2a2a4a] text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
                <pre
                  className="text-xs font-mono text-gray-400 bg-[#050508] border border-[#1a1a2a] rounded-lg p-4 overflow-auto"
                  style={{ maxHeight: "340px", lineHeight: 1.6 }}
                >
                  {SCHEMA_EXAMPLE}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ── Editor card ──────────────────────────────────────────────────── */}
        <div
          className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col mb-6"
          style={{ height: "65vh" }}
        >
          {/* Toolbar */}
          <div className="p-3 border-b border-[#111] bg-[#0f0f0f] flex items-center justify-between shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">
                JSON Editor
              </h2>
              {/* Live stats */}
              {jsonContent && (
                <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
                  <span>{lineCount.toLocaleString()} lines</span>
                  <span>{charCount.toLocaleString()} chars</span>
                  {parsedTopicCount !== null && (
                    <span className="text-purple-500">{parsedTopicCount} topics</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* File import */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileImport}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#2a2a4a] text-xs text-purple-400 hover:text-purple-300 font-mono transition-colors cursor-pointer"
              >
                <FileJson size={12} /> Import File
              </button>
              {(jsonContent || syncResult) && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded text-xs text-gray-500 hover:text-gray-300 font-mono transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                onClick={handleValidate}
                className="px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] hover:border-gray-500 text-xs text-gray-300 transition-colors cursor-pointer font-mono"
              >
                Validate
              </button>
              <button
                onClick={handleUpload}
                disabled={!isValidated || isParsing}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                    Syncing…
                  </>
                ) : (
                  <>
                    <Upload size={12} /> Deploy Roadmap
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Validation error banner */}
          {validationError && (
            <div className="bg-red-950/40 border-b border-red-900/50 p-3 px-6 flex items-start gap-3 shrink-0">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <div>
                <p className="text-sm font-medium text-red-400">Validation Error</p>
                <p className="text-xs text-red-300 font-mono mt-1">{validationError}</p>
              </div>
            </div>
          )}

          {/* Validation success banner */}
          {isValidated && !validationError && (
            <div className="bg-green-950/20 border-b border-green-900/30 p-3 px-6 flex items-center gap-3 shrink-0">
              <CheckCircle2 className="text-green-500 shrink-0" size={16} />
              <p className="text-sm font-medium text-green-400">
                JSON valid and ready for deployment.
              </p>
            </div>
          )}

          {/* Editor with line numbers */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Line numbers */}
            <div
              className="shrink-0 select-none overflow-hidden"
              style={{
                background: "#070707",
                borderRight: "1px solid #111",
                padding: "24px 10px 24px 10px",
                minWidth: "48px",
                textAlign: "right",
                fontSize: "12px",
                lineHeight: "20px",
                fontFamily: "monospace",
                color: "#333",
              }}
            >
              {Array.from({ length: Math.max(lineCount, 1) }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setIsValidated(false);
                setValidationError(null);
              }}
              spellCheck={false}
              placeholder={PLACEHOLDER}
              style={{
                flex: 1,
                background: "#0a0a0a",
                color: "#d4d4d4",
                padding: "24px 24px 24px 16px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "12px",
                lineHeight: "20px",
                resize: "none",
                border: "none",
                outline: "none",
                overflowY: "scroll",
                whiteSpace: "pre",
                overflowX: "auto",
              }}
            />
          </div>
        </div>

        {/* ── System Roadmaps List ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[#111] bg-[#0f0f0f] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <BookOpen size={14} className="text-purple-500" />
              Existing System Roadmaps
            </h2>
            <span className="text-xs font-mono text-gray-500">{roadmaps.length} total</span>
          </div>

          <div className="p-0">
            {isLoadingRoadmaps ? (
              <div className="p-5 text-sm text-gray-500 font-mono">Loading roadmaps...</div>
            ) : roadmaps.length === 0 ? (
              <div className="p-5 text-sm text-gray-500 font-mono">
                No roadmaps found in the system.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {roadmaps.map((roadmap: any) => (
                  <div
                    key={roadmap.id}
                    className="flex flex-col rounded-lg border border-[#1a1a1a] bg-[#0d0d0d] overflow-hidden hover:border-[#333] transition-colors"
                  >
                    <div className="p-4 flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-[#f0f0f0] truncate">{roadmap.title}</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#111] text-[#888] border border-[#222]">
                          ~{roadmap.estimated_weeks}w
                        </span>
                      </div>
                      <p className="text-sm text-[#888] font-mono truncate mb-3">/{roadmap.slug}</p>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#555]">
                        <span className="flex items-center gap-1.5">
                          <BookOpen size={10} /> {roadmap.topics?.length || 0} topics
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#111] px-4 py-2 flex items-center justify-end gap-2 border-t border-[#1a1a1a]">
                      <button
                        onClick={() => handleEditClick(roadmap)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#1a1a1a] hover:bg-[#222] text-[#aaa] hover:text-white transition-colors border border-[#222] hover:border-[#444]"
                      >
                        <Edit2 size={12} /> Edit JSON
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete '${roadmap.title}'? This cannot be undone.`,
                            )
                          ) {
                            deleteRoadmap.mutate(roadmap.slug);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono bg-[#2a0808] hover:bg-[#3a0a0a] text-red-500 transition-colors border border-[#3a0a0a] hover:border-red-900/50"
                        disabled={deleteRoadmap.isPending}
                      >
                        <Trash2 size={12} /> {deleteRoadmap.isPending ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sync results panel ────────────────────────────────────────────── */}
        {syncResult && (
          <div className="rounded-xl border border-[#1e2e1e] bg-[#0a0a0a] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#111] bg-[#0d0d0d] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">
                Sync Results
              </h2>
              <span className="text-xs font-mono text-green-600">{syncResult.message}</span>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {/* Successful roadmaps */}
              {syncResult.roadmaps?.map((r) => (
                <RoadmapResultCard key={r.slug} result={r} />
              ))}

              {/* Roadmap-level warnings (partial success) */}
              {syncResult.warnings?.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-lg"
                  style={{ background: "#1a1200", border: "1px solid #3a2a00" }}
                >
                  <AlertCircle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono font-semibold text-yellow-500">{w.roadmap}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: "#9a7030" }}>
                      {w.error}
                    </p>
                  </div>
                </div>
              ))}

              {/* Hard errors */}
              {syncResult.errors?.map((e, i) => (
                <ErrorCard key={i} item={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Placeholder ────────────────────────────────────────────────────────────────

const PLACEHOLDER = `Paste JSON here, or click "Import File" to load a .json file from disk...`;

const SCHEMA_EXAMPLE = `[
  {
    "title": "Backend Developer Path",
    "slug": "backend-developer",
    "description": "Master backend engineering from scratch.",
    "estimated_weeks": 16,
    "topics": [
      {
        "title": "Internet Fundamentals",
        "slug": "internet-fundamentals",
        "summary": "How the web works: HTTP, DNS, TCP/IP.",
        "node_kind": "milestone",
        "order": 1
      },
      {
        "title": "HTTP & REST APIs",
        "slug": "http-rest",
        "summary": "Request/response cycle, status codes, REST.",
        "node_kind": "topic",
        "order": 2
      },
      {
        "title": "DNS Deep Dive",
        "slug": "dns-deep-dive",
        "summary": "Optional extra: how DNS resolution works.",
        "node_kind": "optional",
        "order": 3
      },
      {
        "title": "Databases",
        "slug": "databases",
        "summary": "SQL, NoSQL, indexing, normalization.",
        "node_kind": "milestone",
        "order": 4
      },
      {
        "title": "PostgreSQL Fundamentals",
        "slug": "postgresql-fundamentals",
        "summary": "CRUD, joins, transactions, indexing.",
        "node_kind": "topic",
        "order": 5
      }
    ]
  }
]`;
