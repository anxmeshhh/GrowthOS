import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { TOPICS, MODULES, type TopicStatus } from "./growth-data";

export interface TopicProgress {
  resourceDone: boolean;
  notesDone: boolean;
  quizDone: boolean;
  buildDone: boolean;
  quizScore?: number;
  notes?: string;
  githubUrl?: string;
  completedAt?: string;
}

export interface SavedNote {
  id: string;
  topicId: string;
  title: string;
  body: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  kind: "completed" | "quiz" | "note" | "build";
  label: string;
  date: string;
}

export interface Settings {
  pathId: string;
  enabledPaths: string[];
  dailyMinutes: number;
  displayName: string;
  timezone: string;
  pomodoroFocus: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
}

export interface State {
  progress: Record<string, TopicProgress>;
  notes: SavedNote[];
  activity: ActivityEvent[];
  // ISO date strings the user completed any work
  activeDays: string[];
  // built projects
  submissions: {
    id: string;
    projectId: string;
    githubUrl: string;
    status: "Submitted" | "Under Review" | "Verified";
    submittedAt: string;
  }[];
  settings: Settings;
}

const DEFAULT: State = {
  progress: {
    "net-1": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 100,
      completedAt: new Date().toISOString(),
    },
    "net-2": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 90,
      completedAt: new Date().toISOString(),
    },
    "git-1": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 80,
      completedAt: new Date().toISOString(),
    },
    "git-2": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 85,
      completedAt: new Date().toISOString(),
    },
    "git-3": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 70,
      completedAt: new Date().toISOString(),
    },
    "git-4": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 90,
      completedAt: new Date().toISOString(),
    },
    "git-5": {
      resourceDone: true,
      notesDone: true,
      quizDone: true,
      buildDone: true,
      quizScore: 80,
      completedAt: new Date().toISOString(),
    },
    "http-1": { resourceDone: true, notesDone: true, quizDone: false, buildDone: false },
    "py-1": { resourceDone: true, notesDone: false, quizDone: false, buildDone: false },
  },
  notes: [
    {
      id: "n1",
      topicId: "http-1",
      title: "HTTP Methods",
      body: "GET retrieves data. POST creates. PUT replaces. DELETE removes. PATCH partially updates.\n\nIdempotency: GET/PUT/DELETE are idempotent. POST is not.",
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: "n2",
      topicId: "git-1",
      title: "Git Basics",
      body: "git add stages, git commit snapshots, git push uploads. Branches are pointers to commits.",
      updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    {
      id: "n3",
      topicId: "net-1",
      title: "DNS Lookup",
      body: "Browser → recursive resolver → root → TLD → authoritative. Cached at every layer.",
      updatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
  activity: [
    {
      id: "a1",
      kind: "completed",
      label: "Completed: Git Basics",
      date: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: "a2",
      kind: "quiz",
      label: "Quiz passed: DNS Basics (90%)",
      date: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
    {
      id: "a3",
      kind: "note",
      label: "Wrote notes on HTTP Methods",
      date: new Date(Date.now() - 86400000 / 2).toISOString(),
    },
    {
      id: "a4",
      kind: "build",
      label: "Committed: tiny-http-server",
      date: new Date().toISOString(),
    },
  ],
  activeDays: (() => {
    const out: string[] = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    // sparse history for heatmap
    for (let i = 6; i < 60; i += 2 + Math.floor(Math.random() * 3)) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  })(),
  submissions: [
    {
      id: "s1",
      projectId: "p2",
      githubUrl: "https://github.com/animesh/url-shortener",
      status: "Verified",
      submittedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
  ],
  settings: {
    pathId: "backend",
    enabledPaths: ["backend", "fullstack"],
    dailyMinutes: 80,
    displayName: "Animesh",
    timezone: "Asia/Kolkata",
    pomodoroFocus: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
  },
};

const KEY = "growthos:v1";

function load(): State {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed, settings: { ...DEFAULT.settings, ...parsed.settings } };
  } catch {
    return DEFAULT;
  }
}

interface Ctx {
  state: State;
  update: (fn: (s: State) => State) => void;
  reset: () => void;
  // helpers
  topicStatus: (topicId: string) => TopicStatus;
  topicProgress: (topicId: string) => TopicProgress;
  markStep: (
    topicId: string,
    step: keyof Pick<TopicProgress, "resourceDone" | "notesDone" | "quizDone" | "buildDone">,
    value?: boolean,
    extra?: Partial<TopicProgress>,
  ) => void;
}

const GrowthCtx = createContext<Ctx | null>(null);

export function GrowthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const value = useMemo<Ctx>(() => {
    const update = (fn: (s: State) => State) => setState((s) => fn(s));

    const topicProgress = (topicId: string): TopicProgress =>
      state.progress[topicId] ?? {
        resourceDone: false,
        notesDone: false,
        quizDone: false,
        buildDone: false,
      };

    const topicStatus = (topicId: string): TopicStatus => {
      const topic = TOPICS.find((t) => t.id === topicId);
      if (!topic) return "locked";
      const p = topicProgress(topicId);
      const done = p.resourceDone && p.notesDone && p.quizDone && p.buildDone;
      if (done) return "completed";
      const prereqsDone = topic.prereq.every((pr) => {
        const pp = state.progress[pr];
        return pp && pp.resourceDone && pp.notesDone && pp.quizDone && pp.buildDone;
      });
      if (!prereqsDone) return "locked";
      const any = p.resourceDone || p.notesDone || p.quizDone || p.buildDone;
      return any ? "in_progress" : "available";
    };

    const markStep: Ctx["markStep"] = (topicId, step, value = true, extra = {}) => {
      update((s) => {
        const prev = s.progress[topicId] ?? {
          resourceDone: false,
          notesDone: false,
          quizDone: false,
          buildDone: false,
        };
        const next: TopicProgress = { ...prev, [step]: value, ...extra };
        const allDone = next.resourceDone && next.notesDone && next.quizDone && next.buildDone;
        if (allDone && !next.completedAt) next.completedAt = new Date().toISOString();
        const today = new Date().toISOString().slice(0, 10);
        const activeDays = s.activeDays.includes(today) ? s.activeDays : [...s.activeDays, today];
        const topic = TOPICS.find((t) => t.id === topicId);
        const label = topic?.title ?? topicId;
        const kindLabel =
          step === "resourceDone"
            ? `Watched resource: ${label}`
            : step === "notesDone"
              ? `Wrote notes on ${label}`
              : step === "quizDone"
                ? `Quiz: ${label}${extra.quizScore != null ? ` (${extra.quizScore}%)` : ""}`
                : `Committed build: ${label}`;
        const kind: ActivityEvent["kind"] =
          step === "resourceDone"
            ? "completed"
            : step === "notesDone"
              ? "note"
              : step === "quizDone"
                ? "quiz"
                : "build";
        const activity: ActivityEvent[] = [
          {
            id: `${Date.now()}-${Math.random()}`,
            kind,
            label: kindLabel,
            date: new Date().toISOString(),
          },
          ...s.activity,
        ].slice(0, 30);
        return { ...s, progress: { ...s.progress, [topicId]: next }, activeDays, activity };
      });
    };

    return {
      state,
      update,
      reset: () => setState(DEFAULT),
      topicStatus,
      topicProgress,
      markStep,
    };
  }, [state]);

  return <GrowthCtx.Provider value={value}>{children}</GrowthCtx.Provider>;
}

export function useGrowth() {
  const ctx = useContext(GrowthCtx);
  if (!ctx) throw new Error("useGrowth must be used inside <GrowthProvider>");
  return ctx;
}

// Derived helpers
export function computeStreak(activeDays: string[]): number {
  const set = new Set(activeDays);
  let streak = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  return streak;
}

export function pathCompletion(state: State, pathId: string) {
  const topics = TOPICS.filter((t) => t.pathId === pathId);
  const done = topics.filter((t) => {
    const p = state.progress[t.id];
    return p && p.resourceDone && p.notesDone && p.quizDone && p.buildDone;
  }).length;
  return {
    done,
    total: topics.length,
    pct: topics.length ? Math.round((done / topics.length) * 100) : 0,
  };
}

export function moduleCompletion(state: State, moduleId: string) {
  const m = MODULES.find((x) => x.id === moduleId);
  if (!m) return { done: 0, total: 0, pct: 0 };
  const done = m.topicIds.filter((tid) => {
    const p = state.progress[tid];
    return p && p.resourceDone && p.notesDone && p.quizDone && p.buildDone;
  }).length;
  return { done, total: m.topicIds.length, pct: Math.round((done / m.topicIds.length) * 100) };
}
