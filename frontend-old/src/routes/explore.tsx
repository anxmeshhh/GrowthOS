import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Map as MapIcon, Loader2, Bookmark } from "lucide-react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast-context";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore Roadmaps — GrowthOS" }] }),
  component: ExplorePage,
});

function ExplorePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { data: roadmaps = [], isLoading } = useQuery({
    queryKey: ["explore_roadmaps"],
    queryFn: async () => {
      const res = await apiFetch("/explore/roadmaps/");
      if (!res.ok) throw new Error("Failed to load roadmaps");
      return (await res.json()).public_roadmaps || [];
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/bookmark/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onSuccess: () => {
      showToast("Roadmap bookmarked to your dashboard!", "success");
      queryClient.invalidateQueries({ queryKey: ["paths"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      navigate({ to: "/roadmap" });
    },
    onError: () => {
      showToast("Error bookmarking roadmap", "error");
    },
  });

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#22c55e]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Library"
        title="Explore Roadmaps"
        subtitle="Discover curated learning paths and structured curriculums to level up your skills."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {roadmaps.map((rm: any) => (
          <Card
            key={rm.id}
            className="flex flex-col border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden hover:border-[#333] transition-colors"
          >
            <div className="p-6 flex-1">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center">
                  <MapIcon size={20} className="text-[#22c55e]" />
                </div>
                <div className="text-xs font-mono px-2 py-1 bg-[#111] text-[#888] rounded uppercase tracking-widest border border-[#222]">
                  {rm.topics.length} Modules
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#f0f0f0] mb-2">{rm.title}</h3>
              <p className="text-sm text-[#aaa] line-clamp-3 mb-6">
                {rm.description ||
                  "A comprehensive learning path covering the essential topics from start to finish."}
              </p>

              <div className="space-y-2 mb-6">
                <div className="text-xs uppercase font-mono tracking-widest text-[#555] mb-2">
                  Curriculum Preview
                </div>
                {rm.topics.slice(0, 3).map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-[#d0d0d0]">
                    <span className="text-[#22c55e] mt-0.5">•</span>
                    <span className="line-clamp-1">{t.title}</span>
                  </div>
                ))}
                {rm.topics.length > 3 && (
                  <div className="text-xs font-mono text-[#666] italic mt-2">
                    + {rm.topics.length - 3} more topics
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[#1a1a1a] bg-[#080808] flex items-center justify-between">
              <div className="text-xs text-[#666] font-mono">By {rm.created_by}</div>
              <button
                onClick={() => bookmarkMutation.mutate(rm.slug)}
                disabled={bookmarkMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-[#111] hover:bg-[#1a1a1a] border border-[#333] hover:border-[#22c55e] text-[#eee] rounded-md transition-all text-sm font-medium disabled:opacity-50"
              >
                <Bookmark size={14} />
                Enroll
              </button>
            </div>
          </Card>
        ))}

        {roadmaps.length === 0 && (
          <div className="col-span-full py-20 text-center border border-dashed border-[#1a1a1a] rounded-xl bg-[#080808]">
            <Search size={32} className="mx-auto text-[#444] mb-4" />
            <div className="text-lg text-[#eee] mb-2">No public roadmaps found</div>
            <div className="text-sm text-[#888]">Check back later for new curated paths.</div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
