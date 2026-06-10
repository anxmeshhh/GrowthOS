import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState, useEffect, type ReactNode, useRef } from "react";
import { useGrowthState } from "@/hooks/use-growth-state";
import {
  LayoutDashboard,
  Map,
  StickyNote,
  Hammer,
  ClipboardCheck,
  Settings,
  CheckCircle2,
  Circle,
  Lock,
  PlayCircle,
  Video,
  FileText,
  Pen,
  Eraser,
  Square as SquareIcon,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Code,
  List,
  X,
  ChevronRight,
  Clock,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { getPathTitle, getTopicResourceDirection } from "@/lib/roadmaps";

/* ─────────────────── TYPES ─────────────────── */
export type TopicStatus = "completed" | "in_progress" | "available" | "locked";
export type Topic = { id: string; title: string; status: TopicStatus; meta?: string };

export const TOPICS: Topic[] = [
  {
    id: "internet",
    title: "Internet Basics",
    status: "completed",
    meta: "DNS · TCP/IP · Browsers",
  },
  {
    id: "http",
    title: "HTTP Protocol",
    status: "in_progress",
    meta: "Methods · Status codes · Headers",
  },
  {
    id: "rest",
    title: "RESTful APIs",
    status: "available",
    meta: "Resources · Verbs · Statelessness",
  },
  { id: "db", title: "Relational Databases", status: "locked", meta: "Prerequisite: RESTful APIs" },
  {
    id: "auth",
    title: "Auth & Sessions",
    status: "locked",
    meta: "Prerequisite: Relational Databases",
  },
  {
    id: "caching",
    title: "Caching Strategies",
    status: "locked",
    meta: "Prerequisite: Relational Databases",
  },
];

/* ─────────────────── SIDEBAR ─────────────────── */
const NAV: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/roadmap", label: "Learning Roadmap", icon: Map },
  { to: "/notes", label: "Smart Notes", icon: StickyNote },
  { to: "/projects", label: "Project Builder", icon: Hammer },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useGrowthState();
  const { name, path, dailyGoalHours } = state.profile;

  // Calculate progress on the current active/in-progress topic
  const activeTopic = Object.values(state.topics).find((t) => t.status === "in_progress");
  let checksCount = 0;
  if (activeTopic) {
    checksCount = Object.values(activeTopic.checks).filter(Boolean).length;
  }
  const progressPercent = (checksCount / 4) * 100;
  const currentHours = (checksCount / 4) * dailyGoalHours;

  const pathLabel = getPathTitle(path);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-[var(--surface)] sticky top-0 h-screen">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
        <div className="w-8 h-8 rounded-md bg-foreground text-background grid place-items-center">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">GrowthOS</div>
          <div className="text-[11px] text-muted-foreground font-mono">v0.1 · personal</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map((it) => {
          const Icon = it.icon;
          const isActive = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-[var(--surface-2)] text-foreground border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-[var(--surface-2)] border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={1.75} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 p-3 rounded-md border border-border bg-[var(--surface-2)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 grid place-items-center text-sm font-semibold uppercase">
            {name ? name[0] : "A"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{name}</div>
            <div className="text-[11px] text-muted-foreground font-mono truncate">{pathLabel}</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-mono text-muted-foreground">
          {state.profile.paths.length} selected path{state.profile.paths.length === 1 ? "" : "s"}
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono mb-1.5">
            <span>Today's goal</span>
            <span>
              {currentHours.toFixed(1)} / {dailyGoalHours} hrs
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full bg-[var(--in-progress)] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* mobile top bar with nav links so routes are reachable on small screens */
export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="md:hidden sticky top-0 z-30 bg-[var(--surface)] border-b border-border">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <div className="w-7 h-7 rounded-md bg-foreground text-background grid place-items-center">
          <Terminal className="w-3.5 h-3.5" />
        </div>
        <div className="text-sm font-semibold tracking-tight">GrowthOS</div>
      </div>
      <nav className="flex overflow-x-auto gap-1 px-2 py-2">
        {NAV.map((it) => {
          const isActive = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md text-xs border ${
                isActive
                  ? "bg-[var(--surface-2)] text-foreground border-border"
                  : "text-muted-foreground border-transparent"
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ─────────────────── STAT CARD ─────────────────── */
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="font-mono uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 font-mono">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-3 h-1 rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full transition-all"
            style={{ width: `${progress * 100}%`, backgroundColor: accent }}
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────── HEATMAP ─────────────────── */
export function Heatmap() {
  const { state } = useGrowthState();
  const cells = useMemo(() => {
    const arr: number[] = [];
    const today = new Date();
    // Generate dates for the last 168 days (24 weeks)
    for (let i = 167; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      if (state.activityDates.includes(dateStr)) {
        // Base value on day of week or string character code to vary grid colors
        const seed = (dateStr.charCodeAt(dateStr.length - 1) % 4) + 1; // 1-4 level
        arr.push(seed);
      } else {
        arr.push(0);
      }
    }
    return arr;
  }, [state.activityDates]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((v, i) => (
          <div key={i} className={`w-3 h-3 rounded-[3px] heat-${v}`} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── STATUS NODE / BADGE ─────────────────── */
export function StatusNode({ status }: { status: TopicStatus }) {
  const map: Record<TopicStatus, { color: string; Icon: LucideIcon }> = {
    completed: { color: "var(--completed)", Icon: CheckCircle2 },
    in_progress: { color: "var(--in-progress)", Icon: PlayCircle },
    available: { color: "var(--available)", Icon: Circle },
    locked: { color: "var(--locked)", Icon: Lock },
  };
  const { color, Icon } = map[status];
  return (
    <span
      className="absolute left-0 top-3 w-8 h-8 rounded-full grid place-items-center border-2 bg-background z-10"
      style={{ borderColor: color, color }}
    >
      <Icon className="w-4 h-4" strokeWidth={2} />
    </span>
  );
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  const map: Record<TopicStatus, { label: string; color: string }> = {
    completed: { label: "Completed", color: "var(--completed)" },
    in_progress: { label: "Study now", color: "var(--in-progress)" },
    available: { label: "Available", color: "var(--available)" },
    locked: { label: "Locked", color: "var(--locked)" },
  };
  const { label, color } = map[status];
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-md border whitespace-nowrap"
      style={{ color, borderColor: color, backgroundColor: `${color}14` }}
    >
      {label}
    </span>
  );
}

/* ─────────────────── TOPIC DRAWER (WORKBENCH) ─────────────────── */
export function TopicDrawer({
  topic,
  onClose,
  onStartQuiz,
}: {
  topic: string | null;
  onClose: () => void;
  onStartQuiz: () => void;
}) {
  const { state } = useGrowthState();
  const [tab, setTab] = useState<"notes" | "canvas">("notes");
  const open = !!topic;

  const topicProgress = topic ? state.topics[topic] : null;
  const title = topicProgress?.title ?? "Topic Details";
  const status = topicProgress?.status ?? "locked";

  // Resource list
  const resources = useMemo(() => {
    if (!topic) return [];
    if (topic === "internet") {
      return [
        { title: "How the Internet Works — MDN", dur: "15 min", type: "Article" },
        { title: "TCP/IP and DNS Explained", dur: "12 min", type: "Video" },
      ];
    }
    if (topic === "http") {
      return [
        { title: "HTTP Crash Course — MDN", dur: "24 min", type: "Video" },
        { title: "REST vs HTTP — high-level", dur: "11 min", type: "Article" },
      ];
    }
    if (topic === "rest") {
      return [
        { title: "Designing RESTful APIs — Tutorial", dur: "18 min", type: "Video" },
        { title: "REST API Best Practices", dur: "15 min", type: "Article" },
      ];
    }
    return [
      { title: `${title} Introduction Guide`, dur: "10 min", type: "Article" },
      { title: `${title} Core Tutorial`, dur: "20 min", type: "Video" },
    ];
  }, [topic, title]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 transition-opacity z-40 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 h-screen w-full md:w-[min(1100px,95vw)] bg-background border-l border-border z-50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--in-progress)] border border-[var(--in-progress)] px-2 py-0.5 rounded-md">
              {status}
            </span>
            <h2 className="font-semibold text-lg">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border hover:bg-[var(--surface-2)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="grid md:grid-cols-[380px_1fr] h-[calc(100vh-65px)]">
          <div className="border-r border-border overflow-y-auto p-5 space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Resources
              </h3>
              <div className="space-y-2">
                {resources.map((r) => (
                  <a
                    key={r.title}
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="flex items-start gap-3 p-3 rounded-md border border-border bg-card hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <div className="mt-0.5 w-8 h-8 rounded-md bg-[var(--surface-2)] border border-border grid place-items-center shrink-0">
                      {r.type === "Video" ? (
                        <Video className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{r.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {r.type}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {r.dur}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                Player
              </h3>
              <div className="aspect-video rounded-md border border-border bg-[var(--surface-2)] grid place-items-center">
                <div className="text-center">
                  <PlayCircle
                    className="w-10 h-10 mx-auto text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <div className="text-xs text-muted-foreground font-mono mt-2">Click to play</div>
                </div>
              </div>
            </div>

            <button
              onClick={onStartQuiz}
              className="w-full px-3 py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            >
              Take assessment quiz →
            </button>
          </div>

          <div className="flex flex-col min-h-0">
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-border">
              <TabBtn active={tab === "notes"} onClick={() => setTab("notes")}>
                Notes
              </TabBtn>
              <TabBtn active={tab === "canvas"} onClick={() => setTab("canvas")}>
                Draw Canvas
              </TabBtn>
            </div>
            {topic &&
              (tab === "notes" ? <NotesEditor topicId={topic} /> : <CanvasPad topicId={topic} />)}
          </div>
        </div>
      </aside>
    </>
  );
}

function TabBtn({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function NotesEditor({ topicId }: { topicId: string }) {
  const { state, updateTopicNotes } = useGrowthState();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState(false);
  const [savedStatus, setSavedStatus] = useState("Saved");
  const savedNotesText = state.topics[topicId]?.notesText || "";

  useEffect(() => {
    setText(savedNotesText);
  }, [savedNotesText, topicId]);

  const handleChange = (val: string) => {
    setText(val);
    setSavedStatus("Saving...");
    updateTopicNotes(topicId, val);
    setTimeout(() => setSavedStatus("Saved"), 400);
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("notes-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    handleChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length,
      );
    }, 50);
  };

  const renderMarkdown = (md: string) => {
    if (!md.trim()) {
      return (
        <p className="text-muted-foreground italic text-sm">
          No notes written yet. Start typing edit mode...
        </p>
      );
    }
    return md.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-xl font-bold text-foreground mt-4 mb-2">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-lg font-semibold text-foreground mt-3 mb-1.5">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("- ")) {
        return (
          <ul key={i} className="list-disc list-inside text-sm text-foreground/90 pl-1 space-y-1">
            <li>{line.replace("- ", "")}</li>
          </ul>
        );
      }
      if (line.startsWith("`") && line.endsWith("`")) {
        return (
          <pre
            key={i}
            className="bg-[var(--surface-2)] p-2 rounded text-xs font-mono border border-border my-2 overflow-x-auto"
          >
            {line.replace(/`/g, "")}
          </pre>
        );
      }
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed my-1.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-[var(--surface)]">
        <button
          onClick={() => insertFormatting("# ", "")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => insertFormatting("## ", "")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground text-xs font-semibold cursor-pointer"
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => insertFormatting("**", "**")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground cursor-pointer"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("*", "*")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground cursor-pointer"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("`", "`")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground cursor-pointer"
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("- ", "")}
          className="p-1.5 rounded hover:bg-[var(--surface-2)] text-muted-foreground hover:text-foreground cursor-pointer"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button
          onClick={() => setPreview(!preview)}
          className={`px-2.5 py-1 rounded text-xs border cursor-pointer ${
            preview
              ? "bg-[var(--surface-2)] text-foreground border-border"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {preview ? "Edit" : "Preview"}
        </button>

        <div className="ml-auto text-[10px] font-mono text-muted-foreground mr-2">
          {savedStatus}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {preview ? (
          <article className="max-w-2xl mx-auto py-2 space-y-1">{renderMarkdown(text)}</article>
        ) : (
          <textarea
            id="notes-textarea"
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Type your notes here in Markdown... e.g. # REST APIs notes"
            className="w-full h-full min-h-[300px] resize-none bg-transparent text-sm focus:outline-none leading-relaxed text-foreground font-sans placeholder-muted-foreground"
          />
        )}
      </div>
    </div>
  );
}

export function CanvasPad({ topicId }: { topicId: string }) {
  const { state, updateTopicCanvas } = useGrowthState();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#f4f4f5");

  const topicData = state.topics[topicId];
  const savedData = topicData?.canvasData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Adjust canvas dimensions dynamically to container size
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = rect?.width || 700;
    canvas.height = rect?.height || 450;

    // Fill background dark
    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid dots
    ctx.fillStyle = "#27272a";
    for (let x = 15; x < canvas.width; x += 30) {
      for (let y = 15; y < canvas.height; y += 30) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    // Load saved image
    if (savedData) {
      const img = new Image();
      img.src = savedData;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [topicId, savedData]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = tool === "eraser" ? 24 : 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === "eraser" ? "#121214" : color;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      updateTopicCanvas(topicId, canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#121214";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#27272a";
    for (let x = 15; x < canvas.width; x += 30) {
      for (let y = 15; y < canvas.height; y += 30) {
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    updateTopicCanvas(topicId, null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--surface)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[var(--surface)]">
        <button
          onClick={() => setTool("pen")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border cursor-pointer ${
            tool === "pen"
              ? "bg-[var(--surface-2)] text-foreground border-border"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <Pen className="w-3 h-3" />
          Pen
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border cursor-pointer ${
            tool === "eraser"
              ? "bg-[var(--surface-2)] text-foreground border-border"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <Eraser className="w-3 h-3" />
          Eraser
        </button>
        {tool === "pen" && (
          <div className="flex items-center gap-1 border-l border-border pl-2">
            {["#f4f4f5", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-3.5 h-3.5 rounded-full border cursor-pointer ${
                  color === c ? "border-foreground scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
        <button
          onClick={clearCanvas}
          className="ml-auto text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 relative min-h-0">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-full cursor-crosshair block bg-[#121214]"
        />
      </div>
    </div>
  );
}

/* ─────────────────── QUIZ DRAWER ─────────────────── */
interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
}

const QUIZZES: Record<string, QuizQuestion[]> = {
  internet: [
    {
      id: "int1",
      question: "What does DNS stand for?",
      options: [
        { id: "a", label: "Domain Name System" },
        { id: "b", label: "Dynamic Node Server" },
        { id: "c", label: "Digital Network Service" },
        { id: "d", label: "Domain Network Security" },
      ],
      correct: "a",
      explanation:
        "DNS (Domain Name System) translates human-readable domain names (like google.com) to numeric IP addresses.",
    },
    {
      id: "int2",
      question:
        "Which protocol guarantees ordered and error-checked delivery of packets over a network?",
      options: [
        { id: "a", label: "UDP" },
        { id: "b", label: "IP" },
        { id: "c", label: "TCP" },
        { id: "d", label: "DNS" },
      ],
      correct: "c",
      explanation:
        "TCP (Transmission Control Protocol) is connection-oriented and guarantees that all sent packets are delivered in order and without errors.",
    },
    {
      id: "int3",
      question: "Which port is standard for encrypted HTTPS requests?",
      options: [
        { id: "a", label: "80" },
        { id: "b", label: "443" },
        { id: "c", label: "8080" },
        { id: "d", label: "22" },
      ],
      correct: "b",
      explanation:
        "HTTPS requests run over port 443 by default, whereas unencrypted HTTP uses port 80.",
    },
  ],
  http: [
    {
      id: "http1",
      question: "Which HTTP status code represents a client unauthorized error?",
      options: [
        { id: "a", label: "200 OK" },
        { id: "b", label: "401 Unauthorized" },
        { id: "c", label: "403 Forbidden" },
        { id: "d", label: "500 Internal Server Error" },
      ],
      correct: "b",
      explanation:
        "401 Unauthorized means the request lacks valid authentication credentials. 403 Forbidden means the server understands but refuses to authorize.",
    },
    {
      id: "http2",
      question:
        "Which HTTP method is designed to be idempotent and replace an entire resource representation?",
      options: [
        { id: "a", label: "POST" },
        { id: "b", label: "PUT" },
        { id: "c", label: "PATCH" },
        { id: "d", label: "DELETE" },
      ],
      correct: "b",
      explanation:
        "PUT is idempotent and replaces the entire resource. POST is not idempotent. PATCH updates a resource partially.",
    },
    {
      id: "http3",
      question:
        "What status code is returned for a successful request that created a new resource?",
      options: [
        { id: "a", label: "200 OK" },
        { id: "b", label: "201 Created" },
        { id: "c", label: "204 No Content" },
        { id: "d", label: "302 Found" },
      ],
      correct: "b",
      explanation:
        "201 Created indicates the request succeeded and resulted in the creation of a new resource.",
    },
  ],
  rest: [
    {
      id: "rest1",
      question: "What does REST stand for?",
      options: [
        { id: "a", label: "Representational State Transfer" },
        { id: "b", label: "Remote Encryption Security Protocol" },
        { id: "c", label: "Regional System Tracker" },
        { id: "d", label: "Resource Engine Stream" },
      ],
      correct: "a",
      explanation:
        "REST stands for Representational State Transfer, an architectural style for design of networked applications.",
    },
    {
      id: "rest2",
      question:
        "Which URI scheme best aligns with RESTful semantic standards for deleting user 42?",
      options: [
        { id: "a", label: "POST /deleteUser?id=42" },
        { id: "b", label: "DELETE /users/42" },
        { id: "c", label: "POST /users/42/delete" },
        { id: "d", label: "GET /users/delete/42" },
      ],
      correct: "b",
      explanation:
        "REST uses nouns in URIs (/users/42) and HTTP verbs (DELETE) to indicate actions.",
    },
  ],
  default: [
    {
      id: "def1",
      question: "What is the primary objective of caching?",
      options: [
        { id: "a", label: "To store permanent user records safely" },
        { id: "b", label: "To reduce latency and database load" },
        { id: "c", label: "To encrypt communications" },
        { id: "d", label: "To automate backups" },
      ],
      correct: "b",
      explanation:
        "Caching stores copies of frequently accessed data temporarily in order to retrieve it faster and avoid database recalculations.",
    },
    {
      id: "def2",
      question: "Which of these represents a relational database?",
      options: [
        { id: "a", label: "Redis" },
        { id: "b", label: "PostgreSQL" },
        { id: "c", label: "MongoDB" },
        { id: "d", label: "Neo4j" },
      ],
      correct: "b",
      explanation:
        "PostgreSQL is a relational database management system (RDBMS) that stores structured data in tables.",
    },
  ],
};

export function QuizDrawer({
  open,
  onClose,
  topicId: overrideTopicId,
}: {
  open: boolean;
  onClose: () => void;
  topicId?: string;
}) {
  const { state, completeTopicQuiz } = useGrowthState();

  // Find active in_progress topic if none overridden
  const activeTopic =
    overrideTopicId ||
    Object.values(state.topics).find((t) => t.status === "in_progress")?.id ||
    "internet";
  const topicTitle = state.topics[activeTopic]?.title || "Fundamentals";

  const questions = QUIZZES[activeTopic] || QUIZZES.default;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  // Reset quiz state when drawer opens for a new topic
  useEffect(() => {
    if (open) {
      setIndex(0);
      setPicked(null);
      setAnswers({});
      setFinished(false);
    }
  }, [open, activeTopic]);

  const currentQ = questions[index];
  const isAnswered = picked !== null || answers[index] !== undefined;

  const handlePick = (optionId: string) => {
    if (isAnswered) return;
    setPicked(optionId);
    setAnswers((prev) => ({ ...prev, [index]: optionId }));
  };

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex((prev) => prev + 1);
      setPicked(null);
    } else {
      setFinished(true);
    }
  };

  const scoreCount = Object.entries(answers).reduce((acc, [idx, ans]) => {
    const q = questions[Number(idx)];
    return q && q.correct === ans ? acc + 1 : acc;
  }, 0);

  const scorePercent = Math.round((scoreCount / questions.length) * 100);
  const isPassing = scorePercent >= 70;

  const handleFinishAndSave = () => {
    completeTopicQuiz(activeTopic, scorePercent);
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 transition-opacity z-[59] ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 right-0 h-screen w-full md:w-[600px] bg-background border-l border-border z-[60] transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Assessment · {topicTitle}
            </div>
            <div className="text-sm font-semibold mt-0.5">
              {finished ? "Completed" : `Question ${index + 1} of ${questions.length}`}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border border-border hover:bg-[var(--surface-2)] cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {!finished && (
          <div className="h-1 bg-[var(--muted)] shrink-0">
            <div
              className="h-full bg-[var(--in-progress)] transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {finished ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] border border-border grid place-items-center mx-auto text-2xl font-bold">
                {scorePercent}%
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {isPassing ? "You Passed!" : "Assessment Failed"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You scored {scoreCount} out of {questions.length} questions correctly.
                  {isPassing ? " Next topic unlocked." : " You need 70% or higher to pass."}
                </p>
              </div>

              <div className="pt-4 space-y-2 max-w-sm mx-auto">
                {isPassing ? (
                  <button
                    onClick={handleFinishAndSave}
                    className="w-full px-4 py-2.5 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Save & Complete Topic
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIndex(0);
                      setPicked(null);
                      setAnswers({});
                      setFinished(false);
                    }}
                    className="w-full px-4 py-2.5 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          ) : (
            currentQ && (
              <>
                <h2 className="text-base font-medium leading-relaxed text-foreground">
                  {currentQ.question}
                </h2>

                <div className="space-y-2">
                  {currentQ.options.map((o) => {
                    const savedAns = answers[index];
                    const isPicked = picked === o.id || savedAns === o.id;
                    const isCorrect = o.id === currentQ.correct;
                    const showResult = isAnswered;

                    const stateVal = !showResult
                      ? "idle"
                      : isPicked && isCorrect
                        ? "correct"
                        : isPicked && !isCorrect
                          ? "wrong"
                          : isCorrect
                            ? "reveal"
                            : "idle";

                    const borderColor =
                      stateVal === "correct" || stateVal === "reveal"
                        ? "var(--completed)"
                        : stateVal === "wrong"
                          ? "var(--destructive)"
                          : "var(--border)";

                    return (
                      <button
                        key={o.id}
                        onClick={() => handlePick(o.id)}
                        disabled={showResult}
                        className="w-full flex items-center gap-3 p-4 rounded-md border bg-card text-left transition-colors disabled:cursor-default hover:bg-[var(--surface-2)] disabled:hover:bg-card cursor-pointer"
                        style={{ borderColor }}
                      >
                        <span
                          className="w-4 h-4 rounded-full border-2 grid place-items-center shrink-0"
                          style={{ borderColor }}
                        >
                          {isPicked && (
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  stateVal === "correct"
                                    ? "var(--completed)"
                                    : "var(--destructive)",
                              }}
                            />
                          )}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground w-4">
                          {o.id.toUpperCase()}.
                        </span>
                        <span className="text-sm flex-1">{o.label}</span>
                      </button>
                    );
                  })}
                </div>

                {isAnswered && (
                  <div
                    className="rounded-md border p-4 text-xs"
                    style={{
                      borderColor:
                        picked === currentQ.correct || answers[index] === currentQ.correct
                          ? "var(--completed)"
                          : "var(--destructive)",
                      backgroundColor:
                        picked === currentQ.correct || answers[index] === currentQ.correct
                          ? "#10b98110"
                          : "#ef444410",
                    }}
                  >
                    <div className="font-medium mb-1 flex items-center gap-1.5">
                      {picked === currentQ.correct || answers[index] === currentQ.correct ? (
                        <span className="text-[var(--completed)]">✓ Correct</span>
                      ) : (
                        <span className="text-destructive">✗ Incorrect</span>
                      )}
                    </div>
                    <div className="text-muted-foreground leading-relaxed">
                      {currentQ.explanation}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border mt-6 shrink-0">
                  <button
                    disabled={index === 0}
                    onClick={() => {
                      setIndex((prev) => prev - 1);
                      setPicked(answers[index - 1] || null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ← Previous
                  </button>
                  <button
                    disabled={!isAnswered}
                    onClick={handleNext}
                    className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    {index === questions.length - 1 ? "Finish quiz" : "Next question"}{" "}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )
          )}
        </div>
      </aside>
    </>
  );
}
