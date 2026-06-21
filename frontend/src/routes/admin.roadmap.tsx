import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
              ? { background: "#0a1e12", color: "#22c55e", border: "1px solid #1a3a22" }
              : { background: "#0a0f1e", color: "#60a5fa", border: "1px solid #1e3a5f" }
          }
        >
          {isNew ? "created" : "updated"}
        </span>
      </div>

      {/* Topic stats */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-2">
        <StatPill icon={Plus} value={result.topics.created} label="created" color="#22c55e" />
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

        {/* ── Editor card ──────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-[#222] bg-[#0a0a0a] overflow-hidden flex flex-col h-[70vh] mb-6">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#111] bg-[#0f0f0f] flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider font-mono">
              JSON Payload Editor
            </h2>
            <div className="flex items-center gap-3">
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
                className="px-4 py-1.5 rounded bg-[#1a1a1a] border border-[#333] hover:border-gray-500 text-sm text-gray-300 transition-colors cursor-pointer"
              >
                Validate JSON
              </button>
              <button
                onClick={handleUpload}
                disabled={!isValidated || isParsing}
                className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Synchronizing…
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Deploy Roadmap
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
                JSON schema is valid and ready for deployment.
              </p>
            </div>
          )}

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              value={jsonContent}
              onChange={(e) => {
                setJsonContent(e.target.value);
                setIsValidated(false);
                setValidationError(null);
              }}
              spellCheck={false}
              placeholder={PLACEHOLDER}
              className="absolute inset-0 w-full h-full bg-[#0a0a0a] text-gray-300 p-6 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-purple-500/50 leading-relaxed"
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

const PLACEHOLDER = `Paste the complete Roadmap JSON here...

Example structure:
{
  "title": "Linux Mastery",
  "slug": "linux-mastery",
  "description": "Comprehensive guide to mastering Linux.",
  "estimated_weeks": 8,
  "topics": [
    {
      "title": "The Command Line",
      "slug": "cli-basics",
      "summary": "ls, cd, rm, cp and navigation.",
      "node_kind": "milestone",
      "order": 1
    },
    {
      "title": "File Permissions",
      "slug": "file-permissions",
      "summary": "chmod, chown, and user groups.",
      "node_kind": "topic",
      "order": 2
    }
  ]
}`;
