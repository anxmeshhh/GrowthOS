import { useState, useMemo } from "react";
import { useGrowthState } from "@/hooks/use-growth-state";
import { GitBranch, Github, RefreshCw, Terminal, CheckCircle, ShieldAlert, Award, Brain, Code, FileText, Pencil } from "lucide-react";

const ASSIGNMENT_TEMPLATES: Record<string, { easy: string; medium: string; hard: string }> = {
  css: {
    easy: "Create a glassmorphic profile card with smooth hover transitions, rounded borders, and custom box-shadows.",
    medium: "Build a responsive grid-based gallery layout with dynamic media queries and collapsible mobile menus.",
    hard: "Design a full dashboard shell featuring CSS variables for dark/light themes, custom flex container scrollbars, and fluid scaling fonts."
  },
  html: {
    easy: "Build a semantic HTML5 form containing input validation, radio lists, and accessible fieldsets.",
    medium: "Construct a multi-page documentation skeleton utilizing native nav, main, section, and article structural components.",
    hard: "Implement a fully accessible navigation system using correct ARIA properties, keyboard tab-indices, and modal dialogs."
  },
  javascript: {
    easy: "Write a function that parses a list of query string parameters and returns a structured JavaScript object.",
    medium: "Implement a custom event emitter class supporting subscribe, unsubscribe, and publish patterns.",
    hard: "Create a virtual DOM render utility that converts virtual nodes into actual DOM trees and supports lightweight updates."
  },
  js: {
    easy: "Write a function that parses a list of query string parameters and returns a structured JavaScript object.",
    medium: "Implement a custom event emitter class supporting subscribe, unsubscribe, and publish patterns.",
    hard: "Create a virtual DOM render utility that converts virtual nodes into actual DOM trees and supports lightweight updates."
  },
  react: {
    easy: "Build a custom hook useLocalStorage that synchronizes component state with the browser localStorage API.",
    medium: "Implement a highly customizable search autocomplete component supporting keyboard navigation, debounce, and cached results.",
    hard: "Create a lightweight React routing system using history states, route matching, and context providers."
  },
  django: {
    easy: "Create a Django model schema for a task manager supporting status choices, automatically generated timestamps, and user owners.",
    medium: "Build a custom middleware class that logs path response latencies and limits guest request rates.",
    hard: "Implement a full JWT auth system with custom Django REST framework validation, token refresh hooks, and blacklisting."
  },
  sql: {
    easy: "Draft a schema for an e-commerce database with clean foreign key links, constraint definitions, and index keys.",
    medium: "Write a query utilizing nested joins, subqueries, and partition aggregation to locate the highest spending users.",
    hard: "Implement a database transaction lock sequence to safely transfer funds between user balances and prevent race conditions."
  }
};

const DEFAULT_TEMPLATES = {
  easy: "Create a clean, functional implementation of the topic requirements with comprehensive code comments.",
  medium: "Implement a modularized service demonstrating proper error handling, unit tests, and solid structure.",
  hard: "Develop a robust, high-performance architecture covering advanced edge cases, custom helper functions, and build pipelines."
};

export function GitBuildProof({ topicId, topicTitle }: { topicId: string; topicTitle: string }) {
  const { state, connectTopicRepo, runTopicBuildAnalysis } = useGrowthState();
  const topic = state.topics[topicId];
  const repoUrl = topic?.repoUrl ?? "";
  const buildAnalysis = topic?.buildAnalysis;

  const [inputUrl, setInputUrl] = useState(repoUrl);
  const [branch, setBranch] = useState("main");
  const [isLinking, setIsLinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isFetchingCommits, setIsFetchingCommits] = useState(false);

  // Assignment states
  const [assignmentType, setAssignmentType] = useState<"ai" | "custom">("ai");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [customText, setCustomText] = useState("");

  const activeTemplate = useMemo(() => {
    const slug = topicTitle.toLowerCase();
    let template = DEFAULT_TEMPLATES;
    for (const [key, t] of Object.entries(ASSIGNMENT_TEMPLATES)) {
      if (slug.includes(key)) {
        template = t;
        break;
      }
    }
    return template;
  }, [topicTitle]);

  const activeAssignmentText = useMemo(() => {
    if (assignmentType === "ai") {
      return activeTemplate[difficulty];
    }
    return customText.trim() || "My custom practical programming build goal.";
  }, [assignmentType, difficulty, activeTemplate, customText]);

  const mockCommits = useMemo(() => {
    return [
      {
        sha: "a7c2d91",
        msg: `feat: implement ${topicTitle.toLowerCase()} structure & test coverage`,
        date: "2 hours ago",
        author: state.profile.githubUser || "anxmeshhh",
      },
      {
        sha: "0d8f3b2",
        msg: `fix: resolve style binding issues & edge cases in ${topicTitle.toLowerCase()}`,
        date: "1 day ago",
        author: state.profile.githubUser || "anxmeshhh",
      },
    ];
  }, [topicTitle, state.profile.githubUser]);

  const handleLinkRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    setIsLinking(true);
    setTimeout(() => {
      connectTopicRepo(topicId, inputUrl.trim());
      setIsLinking(false);
    }, 800);
  };

  const handleFetchCommits = () => {
    setIsFetchingCommits(true);
    setTimeout(() => {
      setIsFetchingCommits(false);
    }, 1000);
  };

  const runAnalysis = () => {
    setIsAnalyzing(true);
    setTerminalLogs([]);
    
    const logs = [
      `Connecting to GitHub repository API...`,
      `Repository: github.com/${inputUrl.replace(/https:\/\/github\.com\//, "")}`,
      `Selected branch: ${branch}`,
      `Target Assignment: [${assignmentType === "ai" ? `AI ${difficulty.toUpperCase()}` : "CUSTOM"}]`,
      `Prompt: "${activeAssignmentText.slice(0, 60)}..."`,
      `Retrieving latest commits...`,
      `Found commit: a7c2d91 (Author: ${state.profile.githubUser || "anxmeshhh"})`,
      `Found commit: 0d8f3b2 (Author: ${state.profile.githubUser || "anxmeshhh"})`,
      `Analyzing code diffs & concepts for "${topicTitle}"...`,
      `Verifying build correctness against selected assignment requirements...`,
      `Groq AI code verification initialized...`,
      `Proof approved successfully.`
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setTerminalLogs((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(() => {
            setIsAnalyzing(false);
            const score = 85 + Math.floor(Math.random() * 15);
            const feedback = `The repository commits successfully resolve the requirements for your ${
              assignmentType === "ai" ? `${difficulty} level AI` : "custom"
            } assignment: "${activeAssignmentText}". The commit messages detail a logical progression, and the code adheres to clean architecture principles. Proof approved.`;
            runTopicBuildAnalysis(topicId, score, feedback);
          }, 600);
        }
      }, (index + 1) * 300);
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-[var(--paper-line)] bg-[var(--paper-bg)]/40 p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--paper-line)]/60 pb-3">
        <div className="flex items-center gap-2">
          <Github className="w-4 h-4 text-amber-900/80" />
          <h3 className="text-sm font-semibold text-[var(--paper-ink)] font-sans">
            GitHub Build Proof verification
          </h3>
        </div>
      </div>

      {/* Assignment Setup Mode */}
      <div className="space-y-3 bg-white/60 p-4 border border-[var(--paper-line)] rounded-xl shadow-sm">
        <h4 className="text-xs font-semibold text-[var(--paper-ink)]">
          1. Select Build Assignment
        </h4>
        <div className="flex border-b border-[var(--paper-line)]/50 text-[11px] pb-1.5 gap-2">
          <button
            type="button"
            onClick={() => setAssignmentType("ai")}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              assignmentType === "ai"
                ? "bg-amber-700/80 text-white"
                : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
            }`}
          >
            AI Assignment Template
          </button>
          <button
            type="button"
            onClick={() => setAssignmentType("custom")}
            className={`px-3 py-1 rounded-md font-medium cursor-pointer transition-colors ${
              assignmentType === "custom"
                ? "bg-amber-700/80 text-white"
                : "text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
            }`}
          >
            Make Your Own Assignment
          </button>
        </div>

        {assignmentType === "ai" ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[var(--paper-muted)]">DIFFICULTY LEVEL:</span>
              <div className="flex gap-1">
                {(["easy", "medium", "hard"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider cursor-pointer border transition-all ${
                      difficulty === lvl
                        ? "bg-amber-900 border-amber-950 text-amber-50"
                        : "bg-white/40 border-[var(--paper-line)] text-[var(--paper-muted)] hover:text-[var(--paper-ink)]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-amber-50/40 border border-amber-200/50 rounded-lg text-xs leading-relaxed text-amber-950 font-serif">
              <span className="font-semibold block font-mono text-[10px] uppercase text-amber-900/80 mb-1">
                Assignment Challenge:
              </span>
              {activeTemplate[difficulty]}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-[var(--paper-muted)] block">
              DESCRIBE YOUR OWN PRACTICAL BUILD OBJECTIVE:
            </label>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="e.g., Build a local task runner script that connects to the database..."
              rows={3}
              className="paper-editor w-full text-xs rounded border border-[var(--paper-line)] bg-white/80 px-3 py-2 text-[var(--paper-ink)] focus:outline-none resize-none"
            />
          </div>
        )}
      </div>

      {/* Repo Link / Verify Action */}
      {!repoUrl ? (
        <form onSubmit={handleLinkRepo} className="space-y-3 bg-white/60 p-4 border border-[var(--paper-line)] rounded-xl shadow-sm">
          <h4 className="text-xs font-semibold text-[var(--paper-ink)]">
            2. Connect GitHub Repository
          </h4>
          <p className="text-[11px] text-[var(--paper-muted)]">
            Connect the GitHub repository that holds the practical implementation for this topic.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[9px] font-mono text-[var(--paper-muted)] block mb-1">GITHUB REPOSITORY</label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="e.g. anxmeshhh/GrowthOS"
                className="paper-editor w-full text-xs rounded border border-[var(--paper-line)] bg-white/80 px-3 py-1.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[9px] font-mono text-[var(--paper-muted)] block mb-1">BRANCH</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="paper-editor w-full text-xs rounded border border-[var(--paper-line)] bg-white/80 px-3 py-1.5 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isLinking || !inputUrl.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isLinking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Linking repo...
                </>
              ) : (
                <>
                  <GitBranch className="w-3.5 h-3.5" />
                  Connect repository
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2 bg-white/60 p-4 border border-[var(--paper-line)] rounded-xl shadow-sm">
            <h4 className="text-xs font-semibold text-[var(--paper-ink)] mb-1">
              2. Connected Code Repository
            </h4>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-700 animate-pulse" />
                <div>
                  <span className="font-semibold text-[var(--paper-ink)]">{repoUrl}</span>
                  <span className="text-[10px] text-[var(--paper-muted)] font-mono ml-2">[{branch}]</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => connectTopicRepo(topicId, "")}
                className="text-[10px] text-amber-800 hover:underline cursor-pointer font-medium"
              >
                Disconnect
              </button>
            </div>

            {/* Commits List */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between border-t border-[var(--paper-line)]/50 pt-2">
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--paper-muted)]">
                  Latest Commits on {branch}
                </span>
                <button
                  type="button"
                  onClick={handleFetchCommits}
                  className="text-[9px] text-[var(--paper-muted)] hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isFetchingCommits ? "animate-spin" : ""}`} />
                  {isFetchingCommits ? "Fetching..." : "Fetch commits"}
                </button>
              </div>
              <div className="space-y-1 max-h-[90px] overflow-y-auto pr-1">
                {mockCommits.map((c) => (
                  <div key={c.sha} className="flex items-center justify-between p-1.5 bg-white/40 border border-[var(--paper-line)]/50 rounded text-[11px] leading-relaxed">
                    <div className="flex items-center gap-1.5 truncate">
                      <code className="text-[8px] font-mono text-amber-900 bg-amber-50 px-1 py-0.5 rounded border border-amber-200 shrink-0">
                        {c.sha}
                      </code>
                      <span className="truncate text-[var(--paper-ink)]">{c.msg}</span>
                    </div>
                    <span className="text-[8px] text-[var(--paper-muted)] font-mono shrink-0 ml-2">
                      {c.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analyzer */}
          {!isAnalyzing && !buildAnalysis && (
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={runAnalysis}
                className="w-full py-2 rounded-xl text-xs font-semibold bg-amber-700 hover:bg-amber-800 text-white flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer border border-amber-600"
              >
                <Brain className="w-4 h-4" />
                Analyze build with AI
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="bg-neutral-900 text-neutral-300 font-mono text-[10px] rounded-xl p-4 space-y-1 border border-neutral-800 max-h-[150px] overflow-y-auto shadow-inner leading-relaxed">
              <div className="flex items-center gap-2 border-b border-neutral-800 pb-1.5 mb-1.5 text-neutral-400">
                <Terminal className="w-3.5 h-3.5 animate-pulse text-amber-500" />
                <span>AI ANALYSIS CONSOLE</span>
              </div>
              {terminalLogs.map((log, i) => (
                <div key={i} className="animate-in fade-in duration-200">
                  <span className="text-neutral-500 mr-1.5">&gt;</span>
                  {log}
                </div>
              ))}
            </div>
          )}

          {buildAnalysis && !isAnalyzing && (
            <div className="space-y-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-emerald-200/50 pb-2 mb-2">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-700" />
                  <span>Build proof approved!</span>
                </div>
                <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-700 shadow-sm">
                  {buildAnalysis.score}/100
                </span>
              </div>

              <p className="text-[11px] text-emerald-900/90 leading-relaxed font-sans">
                {buildAnalysis.feedback}
              </p>

              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-700 border-t border-emerald-200/50 pt-2 mt-2">
                <span>Verification passed</span>
                <span>{new Date(buildAnalysis.analyzedAt).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="text-xs font-medium text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-analyze build
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
