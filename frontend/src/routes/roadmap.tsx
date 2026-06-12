import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, Lock, ArrowRight, Bookmark, BookmarkCheck } from "lucide-react";
import { PageShell, PageHeader, Card, StatCard, Progress, Badge, Btn, StepDot } from "@/components/growth-ui";
import { PATHS, MODULES, TOPICS, modulesForPath, topicsForPath } from "@/lib/growth-data";
import { useGrowth, pathCompletion, moduleCompletion } from "@/lib/growth-store";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap — GrowthOS" }, { name: "description", content: "Your visual learning roadmap with clickable topic nodes." }] }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { state, update, topicStatus } = useGrowth();
  const path = PATHS.find((p) => p.id === state.settings.pathId)!;
  const completion = pathCompletion(state, path.id);
  const modules = modulesForPath(path.id);

  // Next move: first available/in_progress topic
  const pathTopics = topicsForPath(path.id);
  const next = pathTopics.find((t) => {
    const s = topicStatus(t.id);
    return s === "available" || s === "in_progress";
  });

  const togglePath = (pid: string) => {
    update((s) => {
      const has = s.settings.enabledPaths.includes(pid);
      const enabled = has ? s.settings.enabledPaths.filter((x) => x !== pid) : [...s.settings.enabledPaths, pid];
      return { ...s, settings: { ...s.settings, enabledPaths: enabled } };
    });
  };

  return (
    <PageShell>
      <PageHeader
        kicker="Learning Roadmap"
        title={path.name}
        subtitle={`Your compass · ${completion.done} / ${completion.total} topics completed`}
      />

      {/* Saved roadmaps row — like the bookmarks reference image */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <BookmarkCheck size={14} className="text-[#22c55e]" />
          <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">Your Bookmarks</div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PATHS.map((p) => {
            const saved = state.settings.enabledPaths.includes(p.id);
            const active = p.id === state.settings.pathId;
            return (
              <button
                key={p.id}
                onClick={() => {
                  if (!saved) togglePath(p.id);
                  update((s) => ({ ...s, settings: { ...s.settings, pathId: p.id, enabledPaths: s.settings.enabledPaths.includes(p.id) ? s.settings.enabledPaths : [...s.settings.enabledPaths, p.id] } }));
                }}
                className={
                  "group flex items-center justify-between gap-2 px-4 py-3 rounded border text-left transition-colors " +
                  (active ? "border-[#22c55e]/40 bg-[#0d1a0d]" : "border-[#222] bg-[#0f0f0f] hover:bg-[#161616]")
                }
              >
                <div className="min-w-0">
                  <div className={"text-sm truncate " + (active ? "text-[#22c55e]" : "text-[#f0f0f0]")}>{p.name}</div>
                  <div className="text-[10px] uppercase tracking-wider font-mono text-[#666] truncate">{p.tagline}</div>
                </div>
                {saved ? (
                  <BookmarkCheck size={14} className="text-[#22c55e] shrink-0" />
                ) : (
                  <Bookmark size={14} className="text-[#666] shrink-0 group-hover:text-[#999]" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-6">
        <StatCard label="Topics Cleared" value={<span className="font-mono">{completion.done} / {completion.total}</span>} sub={<Progress value={completion.pct} />} />
        <StatCard label="Current Focus" value={<span className="text-base">{next?.title ?? "All clear"}</span>} sub={next ? <Badge tone="amber">Up next</Badge> : <Badge tone="green">Done</Badge>} />
        <StatCard label="Path Readiness" value={<span className="font-mono">{completion.pct}%</span>} sub={<Progress value={completion.pct} />} />
      </div>

      {next ? (
        <Card className="p-5 mb-6 border-[#22c55e]/30 bg-[#0d1a0d]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#22c55e] mb-1">Next Move</div>
              <div className="text-lg font-semibold tracking-tight">{next.title}</div>
              <div className="text-xs text-[#999] font-mono mt-0.5">Est. {next.estMinutes} min</div>
            </div>
            <Link to="/topic/$topicId" params={{ topicId: next.id }}>
              <Btn>Continue <ArrowRight size={14} /></Btn>
            </Link>
          </div>
        </Card>
      ) : null}

      {/* Visual roadmap — modules as sections with topic node cards */}
      <div className="space-y-3">
        {modules.map((m, idx) => (
          <ModuleSection key={m.id} moduleId={m.id} initiallyOpen={idx < 2} />
        ))}
      </div>
    </PageShell>
  );
}

function ModuleSection({ moduleId, initiallyOpen }: { moduleId: string; initiallyOpen: boolean }) {
  const { state, topicStatus, topicProgress } = useGrowth();
  const [open, setOpen] = useState(initiallyOpen);
  const m = MODULES.find((x) => x.id === moduleId)!;
  const comp = moduleCompletion(state, m.id);

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#161616] transition-colors"
      >
        {open ? <ChevronDown size={16} className="text-[#666]" /> : <ChevronRight size={16} className="text-[#666]" />}
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold tracking-tight">{m.title}</div>
          <div className="text-[10px] uppercase tracking-wider font-mono text-[#666] mt-0.5">{comp.done}/{comp.total} topics</div>
        </div>
        <div className="w-32 hidden sm:block"><Progress value={comp.pct} /></div>
        <Badge>{comp.pct}%</Badge>
      </button>

      {open ? (
        <div className="border-t border-[#222] p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0c0c0c]">
          {m.topicIds.map((tid) => {
            const t = TOPICS.find((x) => x.id === tid)!;
            const status = topicStatus(tid);
            const p = topicProgress(tid);
            const tone =
              status === "completed" ? "border-[#22c55e]/40 bg-[#0d1a0d]" : status === "in_progress" ? "border-[#f59e0b]/40" : status === "locked" ? "border-[#222] opacity-40" : "border-[#222]";
            const badge =
              status === "completed" ? <Badge tone="green">Done</Badge> : status === "in_progress" ? <Badge tone="amber">In Prog</Badge> : status === "locked" ? <Badge tone="red">Locked</Badge> : <Badge tone="blue">Ready</Badge>;
            const inner = (
              <div className={`relative border ${tone} rounded p-4 transition-colors ${status !== "locked" ? "hover:bg-[#161616] cursor-pointer" : "cursor-not-allowed"}`}>
                {status === "available" || status === "in_progress" ? (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-[#22c55e]" />
                ) : null}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {status === "locked" ? <Lock size={12} className="text-[#666]" /> : <span className="h-2 w-2 rounded-full bg-[#22c55e] inline-block" />}
                    <div className="text-sm font-medium truncate">{t.title}</div>
                  </div>
                  {badge}
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#666] mb-3">Est. {t.estMinutes} min</div>
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-[#999]"><StepDot done={p.resourceDone} /> Read</span>
                  <span className="flex items-center gap-1.5 text-[#999]"><StepDot done={p.notesDone} /> Notes</span>
                  <span className="flex items-center gap-1.5 text-[#999]"><StepDot done={p.quizDone} /> Quiz</span>
                  <span className="flex items-center gap-1.5 text-[#999]"><StepDot done={p.buildDone} /> Build</span>
                </div>
              </div>
            );
            return status === "locked" ? (
              <div key={tid}>{inner}</div>
            ) : (
              <Link key={tid} to="/topic/$topicId" params={{ topicId: tid }} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      ) : null}
    </Card>
  );
}