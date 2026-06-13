import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, Plus, Search, Compass, Loader2 } from "lucide-react";
import { PageShell, PageHeader, Card, Btn } from "@/components/growth-ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { useState } from "react";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover Paths — GrowthOS" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: paths = [], isLoading } = useQuery({
    queryKey: ['paths'],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) throw new Error("Failed to load paths");
      return res.json();
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiFetch(`/paths/${slug}/bookmark/`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to bookmark");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paths'] });
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    }
  });

  const filteredPaths = paths.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Find Your Next Path."
        subtitle="Select a guided roadmap or create your own custom journey."
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for paths, skills, or topics..." 
            className="w-full bg-[#111] border border-[#222] rounded-lg py-2.5 pl-9 pr-4 text-sm text-[#f0f0f0] placeholder-[#666] focus:outline-none focus:border-[#444] transition-colors"
          />
        </div>
        <Btn variant="outline" className="gap-2">
          <Plus size={16} />
          Create Custom Path
        </Btn>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-[#666]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading paths...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {filteredPaths.map((path: any) => (
            <Card key={path.id} className="p-6 flex flex-col group hover:border-[#444] transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                    <Compass size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{path.title}</h3>
                    <div className="text-xs font-mono tracking-wider text-[#666] uppercase mt-0.5">
                      {path.topics?.length || 0} Topics · {path.is_custom ? 'Custom' : 'System'}
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-[#999] mb-6 flex-1">
                {path.description || "No description provided."}
              </p>
              
              <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[#222]">
                <Link to="/roadmap" search={{ pathId: path.id }} className="flex-1">
                  <Btn className="w-full">
                    View Roadmap
                  </Btn>
                </Link>
                <Btn 
                  variant={path.is_bookmarked ? "solid" : "outline"} 
                  tone={path.is_bookmarked ? "green" : "neutral"}
                  className="px-3" 
                  title={path.is_bookmarked ? "Remove Bookmark" : "Bookmark Path"}
                  onClick={() => bookmarkMutation.mutate(path.slug)}
                  disabled={bookmarkMutation.isPending}
                >
                  <BookMarked size={16} className={path.is_bookmarked ? "text-[#000]" : "text-[#999] group-hover:text-[#f0f0f0] transition-colors"} />
                </Btn>
              </div>
            </Card>
          ))}
          {filteredPaths.length === 0 && (
            <div className="col-span-full p-8 text-center text-[#666]">
              No paths found matching your search.
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
