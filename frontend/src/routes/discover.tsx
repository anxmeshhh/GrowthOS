import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, Plus, Search, Compass, Loader2, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import { Btn } from "@/components/growth-ui";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover Paths — GrowthOS" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: paths = [], isLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) throw new Error("Failed to load paths");
      return res.json();
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/bookmark/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onMutate: async (slug: string) => {
      await queryClient.cancelQueries({ queryKey: ["paths"] });
      const previousPaths = queryClient.getQueryData(["paths"]);
      queryClient.setQueryData(["paths"], (old: any) => {
        if (!old) return old;
        return old.map((p: any) =>
          p.slug === slug ? { ...p, is_bookmarked: !p.is_bookmarked } : p,
        );
      });
      return { previousPaths };
    },
    onError: (_err: any, _slug: any, context: any) => {
      if (context?.previousPaths) {
        queryClient.setQueryData(["paths"], context.previousPaths);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete path");
      return slug;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      setDeleteConfirm(null);
    },
  });

  const filteredPaths = paths.filter(
    (p: any) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0f0f0]">
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-12">
          <p className="text-sm font-semibold tracking-[0.14em] uppercase text-[#00FF66] mb-3">
            Discover
          </p>
          <h1 className="text-[35px] font-semibold tracking-tight text-[#f0f0f0] leading-tight mb-2">
            Find Your Next Path.
          </h1>
          <p className="text-[15px] text-[#fff] leading-relaxed">
            Select a guided roadmap or create your own custom journey.
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#eee]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search paths, skills, or topics…"
              className="w-full bg-[#0e0e0e] border border-[#1e1e1e] rounded-[10px] py-2.5 pl-9 pr-4 text-[14px] text-[#f0f0f0] placeholder-[#777] focus:outline-none focus:border-[#2e2e2e] transition-colors"
            />
          </div>
          <Link to="/paths/create">
            <button className="flex items-center gap-2 bg-transparent border border-[#222] hover:border-[#666] hover:bg-[#111] rounded-[10px] px-4 py-2.5 text-[14px] font-medium text-[#eee] hover:text-[#f0f0f0] transition-all whitespace-nowrap">
              <Plus size={14} />
              Create Path
            </button>
          </Link>
        </div>

        {/* Section label */}
        {!isLoading && (
          <p className="text-sm font-medium tracking-[0.1em] uppercase text-[#fff] mb-5">
            Available Paths · {filteredPaths.length} Total
          </p>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-[#fff]">
            <Loader2 size={18} className="animate-spin mr-2.5" />
            <span className="text-[14px]">Loading paths…</span>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPaths.map((path: any) => (
                <PathCard
                  key={path.id}
                  path={path}
                  onBookmark={() => bookmarkMutation.mutate(path.slug)}
                  bookmarkPending={bookmarkMutation.isPending}
                  onDelete={() => setDeleteConfirm(path.slug)}
                />
              ))}
            </div>

            {filteredPaths.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[14px] text-[#fff]">No paths match your search.</p>
              </div>
            )}
          </>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#111] border border-[#222] p-6 rounded-xl max-w-sm w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-[#f0f0f0] mb-2 flex items-center gap-2">
              <Trash2 className="text-[#ef4444]" size={20} />
              Delete Path?
            </h3>
            <p className="text-[#eee] text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this path? This action cannot be undone and you will
              lose all tracking progress.
            </p>
            <div className="flex justify-end gap-3">
              <Btn variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Btn>
              <Btn
                tone="red"
                onClick={() => deleteMutation.mutate(deleteConfirm)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Delete Path"
                )}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PathCard({
  path,
  onBookmark,
  bookmarkPending,
  onDelete,
}: {
  path: any;
  onBookmark: () => void;
  bookmarkPending: boolean;
  onDelete: () => void;
}) {
  const isCustom = path.is_custom;
  const topicCount = path.topics?.length || 0;
  const progress = path.topics?.filter((t: any) => t.user_progress === "completed").length || 0;
  const progressPct = topicCount > 0 ? Math.round((progress / topicCount) * 100) : 0;

  return (
    <div className="group bg-[#0e0e0e] border border-[#1a1a1a] hover:border-[#252525] hover:bg-[#111] rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200">
      {/* Card Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
            isCustom ? "bg-[rgba(139,92,246,0.08)]" : "bg-[rgba(0,255,102,0.08)]"
          }`}
        >
          {isCustom ? (
            <Pencil size={16} className="text-[#a78bfa]" />
          ) : (
            <Compass size={16} className="text-[#00FF66]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-[16px] font-semibold text-[#f0f0f0] leading-snug truncate">
            {path.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium tracking-[0.08em] uppercase text-[#fff]">
              {topicCount} Topics
            </span>
            <span className="text-[#fff]">·</span>
            <span
              className={`text-sm font-semibold tracking-[0.07em] uppercase px-2 py-0.5 rounded-[5px] ${
                isCustom
                  ? "bg-[rgba(139,92,246,0.1)] text-[#a78bfa]"
                  : "bg-[rgba(0,255,102,0.08)] text-[#00FF66]"
              }`}
            >
              {isCustom ? "Custom" : "System"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            title="Delete path"
            className="w-8 h-8 rounded-[8px] border border-[#1e1e1e] bg-transparent flex items-center justify-center flex-shrink-0 transition-all duration-150 hover:border-[#ef4444]/50 hover:bg-[#ef4444]/10 hover:text-[#ef4444] text-[#888]"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={onBookmark}
            disabled={bookmarkPending}
            title={path.is_bookmarked ? "Remove bookmark" : "Bookmark path"}
            className={`w-8 h-8 rounded-[8px] border flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
              path.is_bookmarked
                ? "bg-[#00FF66] border-[#00FF66]"
                : "bg-transparent border-[#1e1e1e] hover:border-[#2e2e2e] hover:bg-[#161616]"
            }`}
          >
            <BookMarked size={13} className={path.is_bookmarked ? "text-black" : "text-[#eee]"} />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-[14px] text-[#4a4a4a] leading-[1.7] flex-1">
        {path.description || "No description provided."}
      </p>

      {/* Progress */}
      {topicCount > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#fff] tracking-wide uppercase">
              Progress
            </span>
            <span
              className={`text-sm font-semibold font-mono ${
                isCustom ? "text-[#a78bfa]" : "text-[#00FF66]"
              }`}
            >
              {progress} / {topicCount}
            </span>
          </div>
          <div className="h-[2px] bg-[#161616] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: isCustom ? "#a78bfa" : "#00FF66",
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[#141414] pt-4">
        <Link to="/roadmap" search={{ pathId: path.id }} className="block">
          <button className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-[#1e1e1e] hover:border-[#2a2a2a] rounded-[9px] py-2.5 text-[14px] font-medium text-[#fff] hover:text-[#f0f0f0] transition-all">
            View Roadmap
          </button>
        </Link>
      </div>
    </div>
  );
}
