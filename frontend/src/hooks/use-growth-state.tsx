import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getFlatTopics,
  LEARNING_PATHS,
  type LearningPath,
  type LearningRole,
  type TopicStatus,
} from "@/lib/roadmaps";

export type { LearningPath, LearningRole, TopicStatus } from "@/lib/roadmaps";

export interface TopicProgress {
  id: string;
  title: string;
  status: TopicStatus;
  meta: string;
  checks: {
    video: boolean;
    notes: boolean;
    quiz: boolean;
    commit: boolean;
  };
  notesText: string;
  canvasData: string | null;
  quizScore?: number;
}

export interface ProjectInfo {
  name: string;
  status: TopicStatus;
  desc: string;
  repoUrl?: string;
  connectedAt?: string;
  commits?: { message: string; date: string }[];
  aiReview?: {
    score: number;
    feedback: string;
    details: { category: string; rating: number; text: string }[];
  };
}

export interface ProfileInfo {
  name: string;
  path: LearningPath;
  paths: LearningPath[];
  roles: LearningRole[];
  dailyGoalHours: number;
  githubUser: string | null;
  githubConnected: boolean;
  timezone: string;
  theme: "dark" | "light" | "system";
}

export interface GrowthState {
  profile: ProfileInfo;
  topics: { [key: string]: TopicProgress };
  projects: { [key: string]: ProjectInfo };
  streak: number;
  longestStreak: number;
  activityDates: string[];
}

interface GrowthContextType {
  state: GrowthState;
  isHydrated: boolean;
  setProfile: (profile: Partial<ProfileInfo>) => void;
  setActivePath: (path: LearningPath) => void;
  updateTopicCheck: (
    topicId: string,
    checkKey: "video" | "notes" | "quiz" | "commit",
    value: boolean,
  ) => void;
  updateTopicNotes: (topicId: string, notesText: string) => void;
  updateTopicCanvas: (topicId: string, canvasData: string | null) => void;
  completeTopicQuiz: (topicId: string, score: number) => void;
  completeTopic: (topicId: string) => void;
  connectProjectRepo: (projectName: string, repoUrl: string) => void;
  disconnectProjectRepo: (projectName: string) => void;
  runProjectAIReview: (projectName: string) => Promise<void>;
  resetAll: () => void;
  registerActivityToday: () => void;
}

const PROJECT_NAMES: Record<LearningPath, string[]> = {
  backend: [
    "Backend Proof API",
    "Auth Service",
    "Database Scaling Notes",
    "Observability Checklist",
  ],
  frontend: ["Frontend Proof UI", "Responsive Layout", "Framework Comparison", "Performance Audit"],
  api_design: ["API Contract", "REST Design", "Auth Strategy", "Performance Plan"],
  ai: ["AI Concept Map", "Embeddings Demo", "RAG Prototype", "Agent Proof"],
  dsa: ["DSA Notebook", "Sorting Visualizer", "Graph Problems", "Pattern Practice"],
  django: ["Django Starter", "ORM Proof", "Auth Flow", "Deployment Notes"],
  sql: ["SQL Query Pack", "Schema Design", "Join Workbook", "Optimization Notes"],
  system_design: [
    "System Design Brief",
    "Caching Plan",
    "Queue Architecture",
    "Reliability Review",
  ],
};

const PROJECT_DESCRIPTIONS: Record<LearningPath, string[]> = {
  backend: [
    "Proof built from backend.pdf nodes",
    "Authentication nodes and proof",
    "Database roadmap nodes",
    "Monitoring and telemetry nodes",
  ],
  frontend: [
    "Proof built from frontend.pdf nodes",
    "HTML/CSS responsive proof",
    "Framework roadmap comparison",
    "Lighthouse and DevTools proof",
  ],
  api_design: [
    "Proof built from api-design.pdf nodes",
    "OpenAPI and REST proof",
    "Auth and authorization proof",
    "Caching and rate limit proof",
  ],
  ai: [
    "Proof built from ai-engineer.pdf nodes",
    "Embeddings and vector DB proof",
    "Retrieval and generation proof",
    "Tools and agent proof",
  ],
  dsa: [
    "Proof built from datastructures-and-algorithms.pdf nodes",
    "Sorting algorithm proof",
    "Graph traversal proof",
    "Problem pattern notes",
  ],
  django: [
    "Proof built from django.pdf nodes",
    "Models and ORM proof",
    "Auth and permissions proof",
    "Deployment checklist proof",
  ],
  sql: [
    "Proof built from sql.pdf nodes",
    "DDL and DML proof",
    "Join and subquery proof",
    "Index and transaction proof",
  ],
  system_design: [
    "Proof built from system-design.pdf nodes",
    "Scalability and availability proof",
    "Async and queue proof",
    "Reliability pattern proof",
  ],
};

function normalizePaths(
  paths?: LearningPath[],
  fallback: LearningPath = "backend",
): LearningPath[] {
  const valid = (paths || []).filter((path): path is LearningPath => Boolean(LEARNING_PATHS[path]));
  return valid.length ? Array.from(new Set(valid)) : [fallback];
}

function normalizeActivePath(path: LearningPath | undefined, paths: LearningPath[]): LearningPath {
  return path && paths.includes(path) ? path : paths[0];
}

function buildTopics(paths: LearningPath[], existingTopics: { [key: string]: TopicProgress } = {}) {
  const topics: { [key: string]: TopicProgress } = { ...existingTopics };

  paths.forEach((path) => {
    getFlatTopics(path).forEach((topic, index) => {
      if (topics[topic.id]) return;

      topics[topic.id] = {
        id: topic.id,
        title: topic.title,
        status: index === 0 ? "in_progress" : index === 1 ? "available" : "locked",
        meta: topic.meta,
        checks: {
          video: false,
          notes: false,
          quiz: false,
          commit: false,
        },
        notesText: "",
        canvasData: null,
      };
    });
  });

  return topics;
}

function buildProjects(
  paths: LearningPath[],
  existingProjects: { [key: string]: ProjectInfo } = {},
) {
  const projects: { [key: string]: ProjectInfo } = { ...existingProjects };

  paths.forEach((path) => {
    PROJECT_NAMES[path].forEach((name, index) => {
      if (projects[name]) return;

      projects[name] = {
        name,
        status: index === 0 ? "in_progress" : index === 1 ? "available" : "locked",
        desc: PROJECT_DESCRIPTIONS[path][index] || "Milestone project",
      };
    });
  });

  return projects;
}

function recalculateUnlocks(topics: { [key: string]: TopicProgress }, paths: LearningPath[]) {
  const updatedTopics = { ...topics };

  paths.forEach((path) => {
    let activeFound = false;

    getFlatTopics(path).forEach((roadmapTopic, index, pathTopics) => {
      const current = updatedTopics[roadmapTopic.id];
      if (!current) return;

      const allChecksDone = Object.values(current.checks).every(Boolean);
      if (allChecksDone) {
        updatedTopics[roadmapTopic.id] = { ...current, status: "completed" };
        return;
      }

      if (!activeFound) {
        updatedTopics[roadmapTopic.id] = { ...current, status: "in_progress" };
        activeFound = true;
        return;
      }

      const previousTopic = pathTopics[index - 1];
      const previousProgress = previousTopic ? updatedTopics[previousTopic.id] : null;
      updatedTopics[roadmapTopic.id] = {
        ...current,
        status: previousProgress?.status === "completed" ? "available" : "locked",
      };
    });
  });

  return updatedTopics;
}

function generateActivityDates() {
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const activityDates: string[] = [todayKey];

  for (let index = 1; index <= 45; index += 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - index * 2);
    activityDates.push(date.toISOString().split("T")[0]);
  }

  return activityDates;
}

function getInitialState(
  paths: LearningPath[] = ["backend"],
  activePath?: LearningPath,
): GrowthState {
  const normalizedPaths = normalizePaths(paths);
  const path = normalizeActivePath(activePath, normalizedPaths);

  return {
    profile: {
      name: "Animesh",
      path,
      paths: normalizedPaths,
      roles: ["backend_engineer", "api_engineer"],
      dailyGoalHours: 2,
      githubUser: null,
      githubConnected: false,
      timezone: "Asia/Kolkata",
      theme: "dark",
    },
    topics: buildTopics(normalizedPaths),
    projects: buildProjects(normalizedPaths),
    streak: 12,
    longestStreak: 21,
    activityDates: generateActivityDates(),
  };
}

function migrateSavedState(saved: GrowthState): GrowthState {
  const rawPaths = saved.profile.paths || [saved.profile.path || "backend"];
  const paths = normalizePaths(rawPaths);
  const path = normalizeActivePath(saved.profile.path, paths);
  const topics = recalculateUnlocks(buildTopics(paths, saved.topics || {}), paths);
  const projects = buildProjects(paths, saved.projects || {});

  return {
    ...saved,
    profile: {
      ...saved.profile,
      path,
      paths,
      roles: saved.profile.roles || ["backend_engineer", "api_engineer"],
    },
    topics,
    projects,
  };
}

const GrowthContext = createContext<GrowthContextType | undefined>(undefined);

export const GrowthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GrowthState>(() => getInitialState(["backend"], "backend"));
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("growthos_state_v1");
    if (saved) {
      try {
        setState(migrateSavedState(JSON.parse(saved)));
      } catch (error) {
        console.error("Error parsing GrowthOS state, resetting...", error);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    localStorage.setItem("growthos_state_v1", JSON.stringify(state));

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (state.profile.theme === "system") {
      root.classList.add(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
      );
    } else {
      root.classList.add(state.profile.theme);
    }
  }, [state, isHydrated]);

  const setProfile = (newProfile: Partial<ProfileInfo>) => {
    setState((previous) => {
      const paths = normalizePaths(
        newProfile.paths || previous.profile.paths,
        previous.profile.path,
      );
      const path = normalizeActivePath(newProfile.path || previous.profile.path, paths);
      const profile = { ...previous.profile, ...newProfile, paths, path };
      const topics = recalculateUnlocks(buildTopics(paths, previous.topics), paths);
      const projects = buildProjects(paths, previous.projects);

      return {
        ...previous,
        profile,
        topics,
        projects,
      };
    });
  };

  const setActivePath = (path: LearningPath) => {
    setProfile({
      path,
      paths: state.profile.paths.includes(path)
        ? state.profile.paths
        : [...state.profile.paths, path],
    });
  };

  const registerActivityToday = () => {
    const todayKey = new Date().toISOString().split("T")[0];

    setState((previous) => {
      if (previous.activityDates.includes(todayKey)) return previous;

      const streak = previous.streak + 1;
      return {
        ...previous,
        streak,
        longestStreak: Math.max(streak, previous.longestStreak),
        activityDates: [...previous.activityDates, todayKey],
      };
    });
  };

  const updateTopicCheck = (
    topicId: string,
    checkKey: "video" | "notes" | "quiz" | "commit",
    value: boolean,
  ) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      const checks = { ...topic.checks, [checkKey]: value };
      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...topic,
            checks,
            status: Object.values(checks).every(Boolean) ? "completed" : topic.status,
          },
        },
        previous.profile.paths,
      );

      return { ...previous, topics };
    });

    registerActivityToday();
  };

  const updateTopicNotes = (topicId: string, notesText: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...topic,
            notesText,
            checks: { ...topic.checks, notes: notesText.trim().length > 10 || topic.checks.notes },
          },
        },
        previous.profile.paths,
      );

      return { ...previous, topics };
    });

    registerActivityToday();
  };

  const updateTopicCanvas = (topicId: string, canvasData: string | null) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: { ...topic, canvasData },
        },
      };
    });

    registerActivityToday();
  };

  const completeTopicQuiz = (topicId: string, score: number) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...topic,
            quizScore: score,
            checks: { ...topic.checks, quiz: score >= 70 },
          },
        },
        previous.profile.paths,
      );

      return { ...previous, topics };
    });

    registerActivityToday();
  };

  const completeTopic = (topicId: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...topic,
            status: "completed",
            checks: {
              video: true,
              notes: true,
              quiz: true,
              commit: true,
            },
          },
        },
        previous.profile.paths,
      );

      return { ...previous, topics };
    });

    registerActivityToday();
  };

  const connectProjectRepo = (projectName: string, repoUrl: string) => {
    setState((previous) => {
      const project = previous.projects[projectName];
      if (!project) return previous;

      const displayRepo = repoUrl
        .replace("https://github.com/", "")
        .split("/")
        .slice(0, 2)
        .join("/");

      return {
        ...previous,
        projects: {
          ...previous.projects,
          [projectName]: {
            ...project,
            status: "in_progress",
            repoUrl: displayRepo,
            connectedAt: new Date().toLocaleDateString(),
            commits: [
              { message: "feat: connect roadmap proof workflow", date: "Just now" },
              { message: "docs: add project acceptance criteria", date: "3 hours ago" },
              { message: "test: cover primary learning flow", date: "Yesterday" },
            ],
          },
        },
      };
    });
  };

  const disconnectProjectRepo = (projectName: string) => {
    setState((previous) => {
      const project = previous.projects[projectName];
      if (!project) return previous;

      return {
        ...previous,
        projects: {
          ...previous.projects,
          [projectName]: {
            ...project,
            repoUrl: undefined,
            connectedAt: undefined,
            commits: undefined,
            aiReview: undefined,
          },
        },
      };
    });
  };

  const runProjectAIReview = async (projectName: string) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setState((previous) => {
      const project = previous.projects[projectName];
      if (!project) return previous;

      return {
        ...previous,
        projects: {
          ...previous.projects,
          [projectName]: {
            ...project,
            status: "completed",
            aiReview: {
              score: 88,
              feedback:
                "The repository has a clear structure, meaningful commit history, and enough implementation proof for this milestone. Add stronger edge-case tests before marking it production-ready.",
              details: [
                {
                  category: "Structure",
                  rating: 9,
                  text: "Files are grouped around product behavior.",
                },
                {
                  category: "Proof",
                  rating: 8,
                  text: "Commits and README explain the learning outcome.",
                },
                {
                  category: "Reliability",
                  rating: 8,
                  text: "Add more negative-path tests for confidence.",
                },
              ],
            },
          },
        },
      };
    });
  };

  const resetAll = () => {
    setState(getInitialState(state.profile.paths, state.profile.path));
  };

  return (
    <GrowthContext.Provider
      value={{
        state,
        isHydrated,
        setProfile,
        setActivePath,
        updateTopicCheck,
        updateTopicNotes,
        updateTopicCanvas,
        completeTopicQuiz,
        completeTopic,
        connectProjectRepo,
        disconnectProjectRepo,
        runProjectAIReview,
        resetAll,
        registerActivityToday,
      }}
    >
      {children}
    </GrowthContext.Provider>
  );
};

export const useGrowthState = () => {
  const context = useContext(GrowthContext);
  if (!context) {
    throw new Error("useGrowthState must be used within a GrowthProvider");
  }
  return context;
};
