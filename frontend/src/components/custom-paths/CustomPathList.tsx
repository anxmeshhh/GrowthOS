import React, { useState, useEffect } from "react";
import {
  Copy,
  Trash2,
  Eye,
  Globe,
  Lock,
  Users,
  GitFork,
  Clock,
  BookOpen,
  AlertCircle,
  Plus,
  Edit2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { apiClient } from "../../lib/api-client";
import { PathSharingDialog } from "./PathSharingDialog";
import { CustomPathBuilder } from "./PathBuilder";
import { useNavigate } from "@tanstack/react-router";

interface LearningPath {
  id: number;
  title: string;
  slug: string;
  description: string;
  is_custom: boolean;
  created_by: number;
  created_by_username: string;
  visibility: "private" | "public" | "shared";
  estimated_weeks: number;
  can_edit: boolean;
  topics: Array<{ id: number; title: string }>;
}

interface CustomPathListProps {
  onPathCloned?: (path: LearningPath) => void;
}

// ── Visibility config ─────────────────────────────────────────────────────────
const VISIBILITY = {
  public: {
    icon: Globe,
    label: "Public",
    accent: "#3b82f6",
    bg: "#0a0f1e",
    border: "#1e3a5f",
    text: "#60a5fa",
  },
  shared: {
    icon: Users,
    label: "Shared",
    accent: "#8b5cf6",
    bg: "#0f0a1e",
    border: "#3b2a5f",
    text: "#a78bfa",
  },
  private: {
    icon: Lock,
    label: "Private",
    accent: "#2a3a1e",
    bg: "#0f120a",
    border: "#2a3a1e",
    text: "#4a6a2a",
  },
} as const;

// ── Tiny icon button ──────────────────────────────────────────────────────────
function IconBtn({
  onClick,
  title,
  danger = false,
  children,
}: {
  onClick?: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="group relative w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-100"
      style={{
        background: "transparent",
        border: "1px solid #1a1a1a",
        color: danger ? "#7f1d1d" : "#3a5a3a",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = danger ? "#1a0707" : "#0f1a0f";
        el.style.borderColor = danger ? "#7f1d1d" : "#2a4a2a";
        el.style.color = danger ? "#ef4444" : "#00FF66";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.borderColor = "#1a1a1a";
        el.style.color = danger ? "#7f1d1d" : "#3a5a3a";
      }}
    >
      {children}
      {/* Tooltip */}
      <span
        className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "#111", color: "#888", border: "1px solid #222" }}
      >
        {title}
      </span>
    </button>
  );
}

// ── Path card ─────────────────────────────────────────────────────────────────
function PathCard({
  path,
  onView,
  onDelete,
  onCloneOpen,
  onEditOpen,
}: {
  path: LearningPath;
  onView: () => void;
  onDelete: () => void;
  onCloneOpen: () => void;
  onEditOpen?: () => void;
}) {
  const vis = VISIBILITY[path.visibility];
  const VisIcon = vis.icon;

  return (
    <div
      className="relative flex items-stretch rounded-lg overflow-hidden transition-all duration-150 group"
      style={{ background: "#0d0d0d", border: "1px solid #1a1a1a" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "#1a1a1a";
      }}
    >
      {/* Left accent strip — signature element, color = visibility */}
      <div className="w-[3px] shrink-0 rounded-l-lg" style={{ background: vis.accent }} />

      {/* Body */}
      <div className="flex-1 flex items-center gap-4 px-4 py-3.5 min-w-0">
        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-semibold text-lg truncate" style={{ color: "#d4d4d4" }}>
              {path.title}
            </span>
            {/* Visibility badge */}
            <span
              className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono uppercase tracking-wider"
              style={{ background: vis.bg, border: `1px solid ${vis.border}`, color: vis.text }}
            >
              <VisIcon size={9} />
              {vis.label}
            </span>
          </div>
          {path.description && (
            <p className="text-lg truncate mb-2" style={{ color: "#4a4a4a" }}>
              {path.description}
            </p>
          )}
          {/* Stats row */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" style={{ color: "#3a5a3a" }}>
              <BookOpen size={10} />
              <span className="text-sm font-mono" style={{ color: "#4a6a4a" }}>
                {path.topics.length} topics
              </span>
            </span>
            <span className="flex items-center gap-1" style={{ color: "#3a5a3a" }}>
              <Clock size={10} />
              <span className="text-sm font-mono" style={{ color: "#4a6a4a" }}>
                ~{path.estimated_weeks}w
              </span>
            </span>
            {path.created_by_username && (
              <span className="text-sm font-mono" style={{ color: "#2a3a2a" }}>
                by {path.created_by_username}
              </span>
            )}
          </div>
        </div>

        {/* Action cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconBtn onClick={onView} title="View roadmap">
            <Eye size={13} />
          </IconBtn>

          <IconBtn onClick={onCloneOpen} title="Fork path">
            <GitFork size={13} />
          </IconBtn>

          <PathSharingDialog
            pathSlug={path.slug}
            pathTitle={path.title}
            isCreator={path.can_edit}
            currentVisibility={path.visibility}
          />

          {path.can_edit && (
            <>
              {onEditOpen && (
                <IconBtn onClick={onEditOpen} title="Edit path">
                  <Edit2 size={13} />
                </IconBtn>
              )}
              <IconBtn onClick={onDelete} title="Delete" danger>
                <Trash2 size={13} />
              </IconBtn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function CustomPathList({ onPathCloned }: CustomPathListProps) {
  const navigate = useNavigate();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedPathForClone, setSelectedPathForClone] = useState<LearningPath | null>(null);
  const [selectedPathForEdit, setSelectedPathForEdit] = useState<LearningPath | null>(null);
  const [cloneTitle, setCloneTitle] = useState("");
  const [cloneSlug, setCloneSlug] = useState("");
  const [cloning, setCloning] = useState(false);

  useEffect(() => {
    loadCustomPaths();
  }, []);

  const loadCustomPaths = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get("/api/custom-paths/my_paths/");
      setPaths(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load paths");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();

  const handleClonePath = async () => {
    if (!selectedPathForClone || !cloneTitle.trim()) return;
    try {
      setCloning(true);
      setError("");
      const response = await apiClient.post(
        `/api/custom-paths/${selectedPathForClone.slug}/clone/`,
        { new_title: cloneTitle, new_slug: cloneSlug },
      );
      setPaths((prev) => [...prev, response.data]);
      setCloneDialogOpen(false);
      setSelectedPathForClone(null);
      setCloneTitle("");
      setCloneSlug("");
      onPathCloned?.(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clone path");
    } finally {
      setCloning(false);
    }
  };

  const handleDeletePath = async (pathSlug: string) => {
    if (!window.confirm("Delete this path? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/api/custom-paths/${pathSlug}/`);
      setPaths((prev) => prev.filter((p) => p.slug !== pathSlug));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete path");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] rounded-lg animate-pulse"
            style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", opacity: 1 - i * 0.2 }}
          />
        ))}
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error && paths.length === 0) {
    return (
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ background: "#1a0707", border: "1px solid #3f0f0f" }}
      >
        <AlertCircle size={14} style={{ color: "#ef4444" }} />
        <span className="text-lg font-mono" style={{ color: "#f87171" }}>
          {error}
        </span>
        <button
          onClick={loadCustomPaths}
          className="ml-auto text-sm font-mono underline"
          style={{ color: "#9a3030" }}
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (paths.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-12 rounded-lg"
        style={{ background: "#0a0a0a", border: "1px dashed #1e2e1e" }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "#0f1a0f", border: "1px solid #1e3a1e" }}
        >
          <Plus size={18} style={{ color: "#00FF66" }} />
        </div>
        <div className="text-center">
          <p className="text-lg font-mono" style={{ color: "#3a5a3a" }}>
            No custom paths yet
          </p>
          <p className="text-sm mt-1" style={{ color: "#2a3a2a" }}>
            Build a path tailored to your goals
          </p>
        </div>
      </div>
    );
  }

  // ── List ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* Error banner (non-fatal, paths still visible) */}
      {error && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-md mb-3"
          style={{ background: "#1a0707", border: "1px solid #3f0f0f" }}
        >
          <AlertCircle size={12} style={{ color: "#ef4444" }} />
          <span className="text-sm font-mono" style={{ color: "#f87171" }}>
            {error}
          </span>
        </div>
      )}

      {paths.map((path) => (
        <React.Fragment key={path.id}>
          <PathCard
            path={path}
            onView={() => navigate({ to: `/roadmap?pathSlug=${path.slug}` })}
            onDelete={() => handleDeletePath(path.slug)}
            onEditOpen={() => setSelectedPathForEdit(path)}
            onCloneOpen={() => {
              setSelectedPathForClone(path);
              setCloneTitle(`${path.title} (Fork)`);
              setCloneSlug(generateSlug(`${path.title}-fork`));
              setCloneDialogOpen(true);
            }}
          />
          {selectedPathForEdit?.id === path.id && (
            <CustomPathBuilder
              existingPath={path}
              open={true}
              onOpenChange={(open) => {
                if (!open) setSelectedPathForEdit(null);
              }}
              onSuccess={() => {
                setSelectedPathForEdit(null);
                loadCustomPaths();
              }}
              trigger={<span className="hidden"></span>}
            />
          )}
        </React.Fragment>
      ))}

      {/* Clone / Fork dialog */}
      <Dialog
        open={cloneDialogOpen}
        onOpenChange={(open) => {
          setCloneDialogOpen(open);
          if (!open) {
            setError("");
            setSelectedPathForClone(null);
          }
        }}
      >
        <DialogContent
          style={{ background: "#0d0d0d", border: "1px solid #1e2e1e", borderRadius: "12px" }}
        >
          <DialogHeader>
            <DialogTitle className="font-mono text-lg" style={{ color: "#d4d4d4" }}>
              Fork path
            </DialogTitle>
            <DialogDescription className="text-lg" style={{ color: "#3a5a3a" }}>
              Creates your own copy of{" "}
              <span style={{ color: "#00FF66" }}>"{selectedPathForClone?.title}"</span> — topics and
              structure included.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ background: "#1a0707", border: "1px solid #3f0f0f" }}
              >
                <AlertCircle size={12} style={{ color: "#ef4444" }} />
                <span className="text-sm font-mono" style={{ color: "#f87171" }}>
                  {error}
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <label
                className="block text-sm font-mono uppercase tracking-wider"
                style={{ color: "#3a5a3a" }}
              >
                Path title
              </label>
              <input
                value={cloneTitle}
                onChange={(e) => {
                  setCloneTitle(e.target.value);
                  setCloneSlug(generateSlug(e.target.value));
                }}
                className="w-full px-3 py-2 rounded-md text-lg font-mono outline-none transition-colors"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1e2e1e",
                  color: "#c4c4c4",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#00FF66";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#1e2e1e";
                }}
                placeholder="My custom path"
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="block text-sm font-mono uppercase tracking-wider"
                style={{ color: "#3a5a3a" }}
              >
                Slug
              </label>
              <input
                value={cloneSlug}
                onChange={(e) => setCloneSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-lg font-mono outline-none transition-colors"
                style={{
                  background: "#0a0a0a",
                  border: "1px solid #1e2e1e",
                  color: "#3a5a3a",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#2a4a2a";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "#1e2e1e";
                }}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setCloneDialogOpen(false)}
                className="px-3 py-1.5 rounded-md text-lg font-mono transition-colors"
                style={{ background: "#111", border: "1px solid #222", color: "#555" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#333";
                  (e.currentTarget as HTMLElement).style.color = "#888";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#222";
                  (e.currentTarget as HTMLElement).style.color = "#555";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClonePath}
                disabled={cloning || !cloneTitle.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-lg font-mono transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0f1a0f", border: "1px solid #00FF66", color: "#00FF66" }}
                onMouseEnter={(e) => {
                  if (!cloning && cloneTitle.trim())
                    (e.currentTarget as HTMLElement).style.background = "#162a16";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#0f1a0f";
                }}
              >
                <GitFork size={11} />
                {cloning ? "Forking..." : "Fork path"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
