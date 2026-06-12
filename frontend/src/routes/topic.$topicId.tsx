import { createFileRoute, Link, notFound, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pause, Play, ExternalLink, Video, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { PageShell, PageHeader, Card, Btn, Badge, StepDot } from "@/components/growth-ui";
import { TOPICS, PATHS, type Topic } from "@/lib/growth-data";
import { useGrowth } from "@/lib/growth-store";

export const Route = createFileRoute("/topic/$topicId")({
  head: ({ params }) => {
    const t = TOPICS.find((x) => x.id === params.topicId);
    return { meta: [{ title: `${t?.title ?? "Topic"} — GrowthOS` }, { name: "description", content: t ? `Workspace for ${t.title}.` : "Topic workspace" }] };
  },
  loader: ({ params }) => {
    const t = TOPICS.find((x) => x.id === params.topicId);
    if (!t) throw notFound();
    return { topicId: params.topicId };
  },
  notFoundComponent: () => (
    <PageShell>
      <h1 className="text-2xl font-semibold">Topic not found</h1>
      <p className="text-sm text-[#999] mt-2">That topic doesn't exist on your current path.</p>
      <div className="mt-4"><Link to="/roadmap"><Btn>Back to roadmap</Btn></Link></div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <h1 className="text-2xl font-semibold">Something broke</h1>
      <p className="text-sm text-[#999] mt-2">{error.message}</p>
    </PageShell>
  ),
  component: TopicWorkspace,
});

type Tab = "notes" | "flash" | "quiz" | "build";
type Step = "read" | "write" | "check" | "build";

function TopicWorkspace() {
  const { topicId } = useParams({ from: "/topic/$topicId" });
  const topic = TOPICS.find((t) => t.id === topicId)!;
  const path = PATHS.find((p) => p.id === topic.pathId)!;
  const { state, markStep, update, topicProgress } = useGrowth();
  const progress = topicProgress(topicId);

  const [tab, setTab] = useState<Tab>("notes");
  const [activeResource, setActiveResource] = useState(topic.resources[0]);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  const tabToStep: Record<Tab, Step> = { notes: "write", flash: "write", quiz: "check", build: "build" };
  const activeStep: Step = tab === "notes" || tab === "flash" ? "write" : tabToStep[tab];

  return (
    <main className="flex-1 min-w-0 flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-0 border-b border-[#222]">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/roadmap" className="text-[#666] hover:text-[#f0f0f0] p-1.5"><ArrowLeft size={16} /></Link>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666]">{path.name}</div>
            <div className="text-sm sm:text-base font-semibold tracking-tight truncate">{topic.title}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="font-mono text-sm text-[#22c55e] tabular-nums">{formatTime(seconds)}</div>
            <Btn variant="outline" size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause size={14} /> : <Play size={14} />}
              {running ? "Pause" : "Focus"}
            </Btn>
            <Btn size="sm" onClick={() => setTab("quiz")}>Quick check</Btn>
          </div>
        </div>

        {/* Stepper */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {(["read", "write", "check", "build"] as Step[]).map((s) => {
              const stepDone =
                s === "read" ? progress.resourceDone : s === "write" ? progress.notesDone : s === "check" ? progress.quizDone : progress.buildDone;
              const isActive = activeStep === s;
              const label = s === "read" ? "Read" : s === "write" ? "Write" : s === "check" ? "Check" : "Build";
              return (
                <button
                  key={s}
                  onClick={() => setTab(s === "read" ? "notes" : s === "write" ? "notes" : s === "check" ? "quiz" : "build")}
                  className={
                    "flex items-center gap-2 px-3 py-2 border rounded text-xs uppercase tracking-wider font-mono transition-colors " +
                    (isActive
                      ? "border-[#22c55e]/50 bg-[#0d1a0d] text-[#22c55e]"
                      : "border-[#222] text-[#999] hover:text-[#f0f0f0] hover:bg-[#161616]")
                  }
                >
                  <StepDot done={stepDone} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Resource viewer */}
          <section className="lg:col-span-5 space-y-3">
            <Card className="p-0 overflow-hidden">
              {activeResource?.type === "video" && activeResource.url.includes("youtube") ? (
                <div className="aspect-video bg-black">
                  <iframe
                    src={activeResource.url}
                    title={activeResource.title}
                    className="w-full h-full"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : activeResource ? (
                <div className="p-6">
                  <div className="text-[10px] uppercase tracking-wider font-mono text-[#666] mb-2">{activeResource.type}</div>
                  <div className="text-base font-medium mb-3">{activeResource.title}</div>
                  <a href={activeResource.url} target="_blank" rel="noreferrer">
                    <Btn variant="outline" size="sm">Open resource <ExternalLink size={12} /></Btn>
                  </a>
                </div>
              ) : (
                <div className="p-6 text-sm text-[#666]">No resources curated yet. Add one in settings.</div>
              )}
              {activeResource ? (
                <div className="px-4 py-3 border-t border-[#222] flex items-center justify-between">
                  <div className="text-xs text-[#999] truncate">{activeResource.title}</div>
                  <Btn
                    size="sm"
                    tone={progress.resourceDone ? "neutral" : "green"}
                    variant={progress.resourceDone ? "outline" : "solid"}
                    onClick={() => markStep(topic.id, "resourceDone", !progress.resourceDone)}
                  >
                    {progress.resourceDone ? "Watched ✓" : "Mark watched"}
                  </Btn>
                </div>
              ) : null}
            </Card>

            <Card className="p-4">
              <div className="text-[10px] uppercase tracking-[0.18em] font-mono text-[#666] mb-3">All Resources</div>
              <ul className="space-y-1.5">
                {topic.resources.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => setActiveResource(r)}
                      className={
                        "w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded transition-colors " +
                        (activeResource?.id === r.id ? "bg-[#161616] text-[#f0f0f0]" : "text-[#999] hover:bg-[#161616] hover:text-[#f0f0f0]")
                      }
                    >
                      {r.type === "video" ? <Video size={12} /> : <FileText size={12} />}
                      <span className="truncate">{r.title}</span>
                      <Badge tone="blue">{r.type}</Badge>
                    </button>
                  </li>
                ))}
                {topic.resources.length === 0 ? <li className="text-xs text-[#666]">None curated.</li> : null}
              </ul>
            </Card>
          </section>

          {/* Work area */}
          <section className="lg:col-span-7">
            <Card className="p-0 overflow-hidden">
              <div className="flex border-b border-[#222] overflow-x-auto">
                {([
                  { id: "notes", label: "Study Notes" },
                  { id: "flash", label: "Flashcards" },
                  { id: "quiz", label: "Quiz" },
                  { id: "build", label: "Build Proof" },
                ] as { id: Tab; label: string }[]).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={
                      "px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors " +
                      (tab === t.id
                        ? "border-[#22c55e] text-[#f0f0f0]"
                        : "border-transparent text-[#666] hover:text-[#f0f0f0]")
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="p-4 sm:p-5">
                {tab === "notes" && <NotesTab topic={topic} />}
                {tab === "flash" && <FlashTab topic={topic} />}
                {tab === "quiz" && <QuizTab topic={topic} />}
                {tab === "build" && <BuildTab topic={topic} />}
              </div>
            </Card>

            {/* Proof checklist */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Resource", done: progress.resourceDone },
                { label: "Notes", done: progress.notesDone },
                { label: "Quiz", done: progress.quizDone },
                { label: "Build", done: progress.buildDone },
              ].map((r) => (
                <div key={r.label} className={`border rounded px-3 py-2.5 flex items-center justify-between ${r.done ? "border-[#22c55e]/30 bg-[#0d1a0d]" : "border-[#222] bg-[#0f0f0f]"}`}>
                  <span className={`text-xs font-mono uppercase tracking-wider ${r.done ? "text-[#22c55e]" : "text-[#999]"}`}>{r.label}</span>
                  <StepDot done={r.done} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

function NotesTab({ topic }: { topic: Topic }) {
  const { state, update, markStep } = useGrowth();
  const existing = state.notes.find((n) => n.topicId === topic.id);
  const [body, setBody] = useState(existing?.body ?? "");
  const [sub, setSub] = useState<"write" | "sketch" | "capture">("write");

  const save = () => {
    update((s) => {
      const idx = s.notes.findIndex((n) => n.topicId === topic.id);
      const now = new Date().toISOString();
      const note = { id: existing?.id ?? `n-${Date.now()}`, topicId: topic.id, title: topic.title, body, updatedAt: now };
      const notes = idx >= 0 ? s.notes.map((n, i) => (i === idx ? note : n)) : [note, ...s.notes];
      return { ...s, notes };
    });
    markStep(topic.id, "notesDone", body.trim().length > 20);
  };

  return (
    <div>
      <div className="flex gap-1 mb-3">
        {(["write", "sketch", "capture"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setSub(k)}
            className={"px-2.5 py-1 text-xs uppercase tracking-wider font-mono rounded border " + (sub === k ? "border-[#22c55e]/40 bg-[#0d1a0d] text-[#22c55e]" : "border-[#222] text-[#999] hover:text-[#f0f0f0]")}
          >
            {k}
          </button>
        ))}
      </div>
      {sub === "write" ? (
        <>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Capture the core idea in your own words…"
            className="w-full min-h-[260px] font-mono text-sm bg-[#0f0f0f] border border-[#222] rounded p-3 leading-7 text-[#f0f0f0] outline-none focus:border-[#22c55e]/50"
            style={{ backgroundImage: "linear-gradient(transparent 27px, #1a1a1a 27px, #1a1a1a 28px)", backgroundSize: "100% 28px" }}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#666]">{body.length} chars</div>
            <Btn size="sm" onClick={save}>Save notes</Btn>
          </div>
        </>
      ) : sub === "sketch" ? (
        <div className="border border-dashed border-[#222] rounded h-[260px] flex items-center justify-center text-sm text-[#666]">
          Sketch canvas — coming soon. Use pen & paper for now.
        </div>
      ) : (
        <div className="border border-dashed border-[#222] rounded h-[260px] flex items-center justify-center text-sm text-[#666]">
          Screenshot capture placeholder.
        </div>
      )}
    </div>
  );
}

function FlashTab({ topic }: { topic: Topic }) {
  const cards = topic.flashcards.length ? topic.flashcards : [{ front: "No cards yet", back: "Generate them from your notes." }];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[idx];

  return (
    <div>
      <div
        className="border border-[#222] rounded h-[220px] flex items-center justify-center text-center px-6 cursor-pointer bg-[#0f0f0f]"
        onClick={() => setFlipped((f) => !f)}
      >
        <div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">
            {flipped ? "definition" : "term"} · {idx + 1} / {cards.length}
          </div>
          <div className="text-lg font-medium text-[#f0f0f0]">{flipped ? card.back : card.front}</div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mt-3">Click to flip</div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Btn variant="outline" size="sm" onClick={() => { setFlipped(false); setIdx((i) => (i - 1 + cards.length) % cards.length); }}>
          <ChevronLeft size={14} /> Prev
        </Btn>
        <Btn variant="ghost" size="sm">Generate from notes</Btn>
        <Btn variant="outline" size="sm" onClick={() => { setFlipped(false); setIdx((i) => (i + 1) % cards.length); }}>
          Next <ChevronRight size={14} />
        </Btn>
      </div>
    </div>
  );
}

function QuizTab({ topic }: { topic: Topic }) {
  const { markStep } = useGrowth();
  const questions = topic.quiz;
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  if (!questions.length) return <div className="text-sm text-[#666]">No quiz yet for this topic.</div>;

  if (done) {
    const correct = answers.reduce((acc, a, i) => acc + (a === questions[i].answer ? 1 : 0), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;
    return (
      <div className="text-center py-8">
        <div className="text-[10px] uppercase tracking-wider font-mono text-[#666]">Quiz complete</div>
        <div className={`text-5xl font-semibold tracking-tight mt-2 ${passed ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{score}%</div>
        <div className="text-sm text-[#999] mt-1 font-mono">{correct} / {questions.length} correct</div>
        <div className="mt-5 flex justify-center gap-2">
          <Btn variant="outline" size="sm" onClick={() => { setIdx(0); setSelected(null); setAnswers([]); setDone(false); }}>Retake</Btn>
          <Btn size="sm" onClick={() => markStep(topic.id, "quizDone", passed, { quizScore: score })}>{passed ? "Mark passed" : "Save attempt"}</Btn>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#666]">Question {idx + 1} of {questions.length}</div>
        <div className="h-1 w-32 bg-[#222] rounded overflow-hidden">
          <div className="h-1 bg-[#22c55e]" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>
      <div className="text-base font-medium mb-4">{q.q}</div>
      <div className="space-y-2">
        {q.options.map((o, i) => (
          <label
            key={i}
            className={
              "flex items-center gap-3 px-3 py-2.5 border rounded cursor-pointer transition-colors " +
              (selected === i ? "border-[#22c55e]/50 bg-[#0d1a0d]" : "border-[#222] hover:bg-[#161616]")
            }
          >
            <input type="radio" name="opt" className="accent-[#22c55e]" checked={selected === i} onChange={() => setSelected(i)} />
            <span className="text-sm">{o}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Btn
          size="sm"
          disabled={selected === null}
          onClick={() => {
            const next = [...answers, selected!];
            setAnswers(next);
            setSelected(null);
            if (idx + 1 >= questions.length) setDone(true);
            else setIdx(idx + 1);
          }}
        >
          {idx + 1 >= questions.length ? "Finish" : "Next"}
        </Btn>
      </div>
    </div>
  );
}

function BuildTab({ topic }: { topic: Topic }) {
  const { topicProgress, update, markStep } = useGrowth();
  const p = topicProgress(topic.id);
  const [url, setUrl] = useState(p.githubUrl ?? "");
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-[#0f0f0f] border-[#222]">
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-1">Build challenge</div>
        <div className="text-sm text-[#f0f0f0]">{topic.buildChallenge}</div>
      </Card>
      <div>
        <label className="text-[10px] uppercase font-mono tracking-wider text-[#666]">GitHub URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/you/your-repo"
          className="mt-1 w-full font-mono text-sm bg-[#0f0f0f] border border-[#222] rounded px-3 py-2 outline-none focus:border-[#22c55e]/50"
        />
      </div>
      <div className="flex justify-end">
        <Btn
          size="sm"
          onClick={() => {
            markStep(topic.id, "buildDone", url.trim().length > 5, { githubUrl: url });
          }}
        >
          {p.buildDone ? "Committed ✓" : "Mark committed"}
        </Btn>
      </div>
      <div>
        <div className="text-[10px] uppercase font-mono tracking-wider text-[#666] mb-2">Commit history</div>
        <ul className="text-xs font-mono text-[#999] space-y-1">
          {p.githubUrl ? (
            <li className="border border-[#222] rounded px-3 py-2 flex items-center justify-between">
              <span className="truncate">{p.githubUrl}</span>
              <Badge tone="green">Linked</Badge>
            </li>
          ) : (
            <li className="text-[#666]">No commits linked yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}