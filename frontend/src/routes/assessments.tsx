import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageShell, PageHeader, Card, StatCard, Btn, Badge, Progress } from "@/components/growth-ui";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { Loader2, CheckCircle2, ChevronDown, ChevronRight, ArrowRight, Map as MapIcon } from "lucide-react";

export const Route = createFileRoute("/assessments")({
  head: () => ({ meta: [{ title: "Assessments — GrowthOS" }, { name: "description", content: "Topic mastery grouped by learning path." }] }),
  component: AssessmentsPage,
});

type Section = {
  id: string;
  label: string;
  children: { id: string; label: string; slug: string; status: string; topicId: string }[];
};

function buildSections(topics: any[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  
  const sorted = [...topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  for (const t of sorted) {
    if (t.node_kind === 'milestone') {
      currentSection = {
        id: String(t.id),
        label: t.title,
        children: [],
      };
      sections.push(currentSection);
    } else {
      if (!currentSection) {
        currentSection = { id: 'root', label: 'General', children: [] };
        sections.push(currentSection);
      }
      // Skip callouts/notes from assessments
      if (t.node_kind === 'note' || t.node_kind === 'callout') continue;
      
      currentSection.children.push({
        id: String(t.id),
        label: t.title,
        slug: t.slug ?? String(t.id),
        status: t.user_progress || 'available',
        topicId: String(t.id),
      });
    }
  }
  return sections;
}

function AssessmentsPage() {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const { data: paths = [], isLoading: pathsLoading } = useQuery({
    queryKey: ["paths"],
    queryFn: async () => {
      const res = await apiFetch("/paths/");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const allTopics = paths.flatMap((p: any) => p.topics || []);
  const completedTopics = allTopics.filter((t: any) => t.user_progress === "completed");
  const totalAll = allTopics.length;
  const completionPct = totalAll > 0 ? Math.round((completedTopics.length / totalAll) * 100) : 0;

  const togglePath = (slug: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  if (pathsLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center p-12 text-[#666]">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader kicker="Assessments" title="Topic Mastery" subtitle="Track your progress across all learning paths and topics." />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Topics" value={<span className="font-mono">{totalAll}</span>} />
        <StatCard label="Completed" value={<span className="font-mono text-[#22c55e]">{completedTopics.length}</span>} accent />
        <StatCard label="Remaining" value={<span className="font-mono">{totalAll - completedTopics.length}</span>} />
        <StatCard label="Mastery" value={<span className="font-mono">{completionPct}%</span>} sub={<Progress value={completionPct} />} />
      </div>

      {/* Paths tree */}
      <div className="space-y-3">
        {paths.map((path: any) => {
          const topics = path.topics || [];
          const done = topics.filter((t: any) => t.user_progress === "completed").length;
          const pct = topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;
          const isExpanded = expandedPaths.has(path.slug);
          const sections = useMemo(() => buildSections(topics), [topics]);

          return (
            <Card key={path.slug} className="p-0 overflow-hidden">
              {/* Path header */}
              <button
                onClick={() => togglePath(path.slug)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[#111] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                  <MapIcon size={16} className="text-[#22c55e]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#f0f0f0]">{path.title}</div>
                  <div className="text-[10px] uppercase font-mono tracking-wider text-[#555] mt-0.5">
                    {done}/{topics.length} completed
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 hidden sm:block"><Progress value={pct} /></div>
                  <span className="text-xs font-mono text-[#666] w-10 text-right">{pct}%</span>
                  {isExpanded
                    ? <ChevronDown size={16} className="text-[#555]" />
                    : <ChevronRight size={16} className="text-[#555]" />
                  }
                </div>
              </button>

              {/* Sections tree */}
              {isExpanded && (
                <div className="border-t border-[#1a1a1a] px-3 py-2" style={{ background: '#070a07' }}>
                  {sections.length > 0 ? sections.map(section => {
                    const sectionKey = `${path.slug}::${section.id}`;
                    const isSectionOpen = expandedSections.has(sectionKey);
                    const sectionDone = section.children.filter(c => c.status === 'completed').length;
                    const sectionPct = section.children.length > 0 ? Math.round((sectionDone / section.children.length) * 100) : 0;

                    return (
                      <div key={section.id} className="mb-1">
                        {/* Section milestone header */}
                        <button
                          onClick={() => toggleSection(sectionKey)}
                          className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md transition-colors duration-150"
                          style={{
                            background: isSectionOpen ? '#0d1428' : '#0a0f1e',
                            border: '1px solid #1e3060',
                          }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#0d1428'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSectionOpen ? '#0d1428' : '#0a0f1e'; }}
                        >
                          <span className="font-mono font-semibold tracking-wide" style={{ fontSize: '11px', color: '#60a5fa' }}>
                            {section.label}
                          </span>
                          <span className="ml-auto flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono" style={{ color: '#3b5bdb' }}>
                              {sectionDone}/{section.children.length}
                            </span>
                            <span style={{ color: '#3b5bdb' }}>
                              {isSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            </span>
                          </span>
                        </button>

                        {/* Section children */}
                        {isSectionOpen && section.children.length > 0 && (
                          <div className="ml-4 mt-1 space-y-0.5 relative">
                            {/* Vertical connector line */}
                            <span className="absolute left-0 top-0 bottom-0 w-px" style={{ background: '#1e3a1e' }} />
                            {section.children.map(child => {
                              const isCompleted = child.status === 'completed';
                              const isInProgress = child.status === 'in_progress';
                              return (
                                <div key={child.id} className="relative flex items-center">
                                  {/* Horizontal connector */}
                                  <span className="absolute left-0 top-1/2 w-3 h-px" style={{ background: '#1e3a1e' }} />
                                  <Link
                                    to="/topic/$topicId"
                                    params={{ topicId: child.slug }}
                                    className="flex-1 ml-5 flex items-center gap-2 px-3 py-[6px] rounded text-left no-underline transition-colors duration-100"
                                    style={{
                                      background: isCompleted ? '#0c1a07' : '#0f120a',
                                      border: `1px solid ${isCompleted ? '#22c55e33' : '#2a3a1e'}`,
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#151f0e'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isCompleted ? '#0c1a07' : '#0f120a'; }}
                                  >
                                    <span className="shrink-0 w-[14px] flex items-center justify-center">
                                      {isCompleted
                                        ? <CheckCircle2 size={12} className="text-[#22c55e]" strokeWidth={2.5} />
                                        : isInProgress
                                          ? <span className="w-[10px] h-[10px] rounded-full animate-pulse bg-[#f59e0b]" />
                                          : <span className="w-[10px] h-[10px] rounded-full border border-[#4a6a2a]" />
                                      }
                                    </span>
                                    <span className="flex-1 font-mono font-medium leading-snug" style={{ fontSize: '12px', color: isCompleted ? '#4ade80' : '#a8c078' }}>
                                      {child.label}
                                    </span>
                                  </Link>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    /* Fallback: flat list if no graph data */
                    <div className="space-y-0.5 py-1">
                      {topics.map((t: any) => {
                        const isCompleted = t.user_progress === 'completed';
                        return (
                          <Link
                            key={t.id}
                            to="/topic/$topicId"
                            params={{ topicId: t.slug || String(t.id) }}
                            className="flex items-center gap-2 px-3 py-[6px] rounded text-left no-underline transition-colors"
                            style={{ background: '#0f120a', border: '1px solid #2a3a1e' }}
                          >
                            <span className="shrink-0 w-[14px] flex items-center justify-center">
                              {isCompleted
                                ? <CheckCircle2 size={12} className="text-[#22c55e]" strokeWidth={2.5} />
                                : <span className="w-[10px] h-[10px] rounded-full border border-[#4a6a2a]" />
                              }
                            </span>
                            <span className="font-mono font-medium" style={{ fontSize: '12px', color: isCompleted ? '#4ade80' : '#a8c078' }}>
                              {t.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}