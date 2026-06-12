import { createFileRoute, Link } from "@tanstack/react-router";
import { BookMarked, Plus, Search, Compass } from "lucide-react";
import { PageShell, PageHeader, Card, Badge, Btn } from "@/components/growth-ui";

export const Route = createFileRoute("/discover")({
  head: () => ({ meta: [{ title: "Discover Paths — GrowthOS" }] }),
  component: DiscoverPage,
});

const MOCK_PATHS = [
  { id: "backend", title: "Backend Developer", description: "Master servers, databases, and APIs. Build robust and scalable infrastructure.", topics: 24, estWeeks: 12 },
  { id: "frontend", title: "Frontend Developer", description: "Build pixel-perfect, responsive user interfaces and master modern web frameworks.", topics: 30, estWeeks: 16 },
  { id: "ai-engineer", title: "AI Engineer", description: "Learn machine learning, neural networks, and how to build applications with LLMs.", topics: 18, estWeeks: 10 },
  { id: "system-design", title: "System Design", description: "Learn how to design large-scale distributed systems and architecture patterns.", topics: 15, estWeeks: 8 },
];

function DiscoverPage() {
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
            placeholder="Search for paths, skills, or topics..." 
            className="w-full bg-[#111] border border-[#222] rounded-lg py-2.5 pl-9 pr-4 text-sm text-[#f0f0f0] placeholder-[#666] focus:outline-none focus:border-[#444] transition-colors"
          />
        </div>
        <Btn variant="outline" className="gap-2">
          <Plus size={16} />
          Create Custom Path
        </Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {MOCK_PATHS.map((path) => (
          <Card key={path.id} className="p-6 flex flex-col group hover:border-[#444] transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center text-[#22c55e]">
                  <Compass size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{path.title}</h3>
                  <div className="text-xs font-mono tracking-wider text-[#666] uppercase mt-0.5">
                    {path.topics} Topics · ~{path.estWeeks} Weeks
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-[#999] mb-6 flex-1">
              {path.description}
            </p>
            
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-[#222]">
              <Btn className="flex-1">
                View Roadmap
              </Btn>
              <Btn variant="outline" className="px-3" title="Bookmark Path">
                <BookMarked size={16} className="text-[#999] group-hover:text-[#f0f0f0] transition-colors" />
              </Btn>
            </div>
          </Card>
        ))}
      </div>

    </PageShell>
  );
}
