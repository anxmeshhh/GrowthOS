import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getFlatTopics,
  LEARNING_PATHS,
  type LearningPath,
  type LearningRole,
  type TopicStatus,
} from "@/lib/roadmaps";
import { isLeafTopicId, resolveTopicIdFromLabel } from "@/lib/roadmap-layout/resolve-topic";
import type { GamificationState } from "@/lib/gamification";
import {
  migrateGamification,
  onCaptureSave,
  onExplainBack,
  onNoteUpload,
  onProofStep,
  onQuizPass,
  onTopicComplete,
} from "@/lib/gamification-engine";

export type { LearningPath, LearningRole, TopicStatus } from "@/lib/roadmaps";
export type { GamificationState } from "@/lib/gamification";

export type UploadedNote = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  content: string;
  topicId: string | null;
  uploadedAt: string;
  sizeBytes: number;
  kind: "text" | "image";
};

export type SessionPhase = "read" | "write" | "check" | "build" | "done";

export type UserResource = {
  id: string;
  title: string;
  url: string;
  type: "video" | "article" | "course" | "other";
  addedAt: string;
};

export type ExplainBackAnswer = {
  promptId: string;
  answer: string;
  done: boolean;
};

export type CaptureRegion = {
  id: string;
  kind: "box" | "arrow";
  x: number;
  y: number;
  w: number;
  h: number;
  x2?: number;
  y2?: number;
  label: string;
};

export type CaptureWorkflow = {
  imageData: string | null;
  regions: CaptureRegion[];
  updatedAt: string;
};

export type Flashcard = {
  id: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
};

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
  userResources: UserResource[];
  explainBack: ExplainBackAnswer[];
  sessionPhase: SessionPhase;
  captureWorkflow: CaptureWorkflow | null;
  activeResourceUrl: string | null;
  roadmapNodeId: string | null;
  flashcards?: Flashcard[];
  repoUrl?: string;
  buildAnalysis?: { score: number; feedback: string; analyzedAt: string };
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
  uploadedNotes: UploadedNote[];
  gamification: GamificationState;
  streak: number;
  longestStreak: number;
  activityDates: string[];
  studySessionsCount: number;
  activityLogs?: Record<string, number>;
}

interface GrowthContextType {
  state: GrowthState;
  isHydrated: boolean;
  setProfile: (profile: Partial<ProfileInfo>) => void;
  setActivePath: (path: LearningPath) => void;
  openTopicFromNode: (label: string) => string;
  openTopicFromNodeId: (topicId: string, label: string, nodeId?: string) => string;
  updateTopicCheck: (
    topicId: string,
    checkKey: "video" | "notes" | "quiz" | "commit",
    value: boolean,
  ) => void;
  updateTopicNotes: (topicId: string, notesText: string) => void;
  updateTopicCanvas: (topicId: string, canvasData: string | null) => void;
  addUserResource: (
    topicId: string,
    resource: Omit<UserResource, "id" | "addedAt">,
  ) => void;
  removeUserResource: (topicId: string, resourceId: string) => void;
  setActiveResource: (topicId: string, url: string | null) => void;
  setSessionPhase: (topicId: string, phase: SessionPhase) => void;
  saveExplainBack: (topicId: string, promptId: string, answer: string) => void;
  saveCaptureWorkflow: (topicId: string, workflow: CaptureWorkflow) => void;
  completeTopicQuiz: (topicId: string, score: number) => void;
  completeTopic: (topicId: string) => void;
  connectProjectRepo: (projectName: string, repoUrl: string) => void;
  disconnectProjectRepo: (projectName: string) => void;
  runProjectAIReview: (projectName: string) => Promise<void>;
  resetAll: () => void;
  registerActivityToday: () => void;
  uploadNote: (file: File, topicId: string | null) => Promise<void>;
  deleteUploadedNote: (noteId: string) => void;
  dismissReward: () => void;
  incrementStudySessionsCount: () => void;
  addFlashcard: (topicId: string, front: string, back: string) => void;
  updateFlashcardReview: (
    topicId: string,
    cardId: string,
    easeFactor: number,
    intervalDays: number,
    repetitions: number,
    nextReviewDate: string,
  ) => void;
  deleteFlashcard: (topicId: string, cardId: string) => void;
  connectTopicRepo: (topicId: string, repoUrl: string) => void;
  runTopicBuildAnalysis: (topicId: string, score: number, feedback: string) => void;
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

function defaultTopicFields(): Pick<
  TopicProgress,
  "userResources" | "explainBack" | "sessionPhase" | "captureWorkflow" | "activeResourceUrl" | "roadmapNodeId" | "flashcards"
> {
  return {
    userResources: [],
    explainBack: [],
    sessionPhase: "read",
    captureWorkflow: null,
    activeResourceUrl: null,
    roadmapNodeId: null,
    flashcards: [],
  };
}

function normalizeTopic(topic: TopicProgress): TopicProgress {
  const defaults = defaultTopicFields();
  return {
    ...defaults,
    ...topic,
    userResources: topic.userResources ?? defaults.userResources,
    explainBack: topic.explainBack ?? defaults.explainBack,
    sessionPhase: topic.sessionPhase ?? defaults.sessionPhase,
    captureWorkflow: topic.captureWorkflow ?? defaults.captureWorkflow,
    activeResourceUrl: topic.activeResourceUrl ?? defaults.activeResourceUrl,
    roadmapNodeId: topic.roadmapNodeId ?? defaults.roadmapNodeId,
    flashcards: topic.flashcards ?? defaults.flashcards,
    repoUrl: topic.repoUrl,
    buildAnalysis: topic.buildAnalysis,
  };
}

function buildTopics(paths: LearningPath[], existingTopics: { [key: string]: TopicProgress } = {}) {
  const topics: { [key: string]: TopicProgress } = {};

  Object.entries(existingTopics).forEach(([id, topic]) => {
    topics[id] = normalizeTopic(topic);
  });

  paths.forEach((path) => {
    getFlatTopics(path).forEach((topic, index) => {
      if (topics[topic.id]) return;

      topics[topic.id] = normalizeTopic({
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
        ...defaultTopicFields(),
      });
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

function generateActivityLogs(dates: string[]): Record<string, number> {
  const logs: Record<string, number> = {};
  dates.forEach((d) => {
    logs[d] = (d.charCodeAt(d.length - 1) % 4) + 1;
  });
  return logs;
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
    uploadedNotes: [],
    gamification: migrateGamification(),
    streak: 12,
    longestStreak: 21,
    activityDates: generateActivityDates(),
    activityLogs: generateActivityLogs(generateActivityDates()),
    studySessionsCount: 0,
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
    uploadedNotes: saved.uploadedNotes ?? [],
    gamification: migrateGamification(saved.gamification),
    studySessionsCount: saved.studySessionsCount ?? 0,
    activityLogs: saved.activityLogs ?? generateActivityLogs(saved.activityDates ?? []),
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
      const logs = previous.activityLogs ?? {};
      const currentCount = logs[todayKey] ?? 0;
      const newLogs = {
        ...logs,
        [todayKey]: currentCount + 1,
      };

      const activityDates = previous.activityDates.includes(todayKey)
        ? previous.activityDates
        : [...previous.activityDates, todayKey];

      const streak = previous.activityDates.includes(todayKey)
        ? previous.streak
        : previous.streak + 1;

      return {
        ...previous,
        streak,
        longestStreak: Math.max(streak, previous.longestStreak),
        activityDates,
        activityLogs: newLogs,
      };
    });
  };

  const openTopicFromNode = (label: string): string => {
    const path = state.profile.path;
    const topicId = resolveTopicIdFromLabel(path, label);
    return openTopicFromNodeId(topicId, label);
  };

  const openTopicFromNodeId = (topicId: string, label: string, nodeId?: string): string => {
    setState((previous) => {
      if (previous.topics[topicId]) {
        const existing = normalizeTopic(previous.topics[topicId]);
        const updates: Partial<TopicProgress> = {};
        if (nodeId) updates.roadmapNodeId = nodeId;
        if (existing.status === "locked" && isLeafTopicId(topicId)) {
          return {
            ...previous,
            topics: {
              ...previous.topics,
              [topicId]: { ...existing, ...updates, status: "available" },
            },
          };
        }
        if (Object.keys(updates).length) {
          return {
            ...previous,
            topics: { ...previous.topics, [topicId]: { ...existing, ...updates } },
          };
        }
        return previous;
      }

      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: normalizeTopic({
            ...defaultTopicFields(),
            id: topicId,
            title: label.trim(),
            status: "in_progress",
            meta: `Roadmap node · ${LEARNING_PATHS[state.profile.path].title}`,
            checks: { video: false, notes: false, quiz: false, commit: false },
            notesText: "",
            canvasData: null,
            roadmapNodeId: nodeId ?? null,
          }),
        },
      };
    });

    registerActivityToday();
    return topicId;
  };

  const updateTopicCheck = (
    topicId: string,
    checkKey: "video" | "notes" | "quiz" | "commit",
    value: boolean,
  ) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;

      const wasDone = topic.checks[checkKey];
      const checks = { ...topic.checks, [checkKey]: value };
      const updatedTopic = {
        ...topic,
        checks,
        status: Object.values(checks).every(Boolean) ? ("completed" as const) : topic.status,
      };
      const topics = recalculateUnlocks(
        { ...previous.topics, [topicId]: updatedTopic },
        previous.profile.paths,
      );

      let gamification = previous.gamification;
      if (value && !wasDone) {
        gamification = onProofStep(gamification, previous, updatedTopic);
      }
      if (
        value &&
        !wasDone &&
        Object.values(checks).every(Boolean) &&
        topic.status !== "completed"
      ) {
        gamification = onTopicComplete(gamification, previous);
      }

      return { ...previous, topics, gamification };
    });

    registerActivityToday();
  };

  const updateTopicNotes = (topicId: string, notesText: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const explainDone = normalized.explainBack.filter((e) => e.done && e.answer.trim().length >= 20).length;

      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...normalized,
            notesText,
            checks: {
              ...normalized.checks,
              notes: explainDone >= 2 || normalized.checks.notes,
            },
          },
        },
        previous.profile.paths,
      );

      return { ...previous, topics };
    });

    registerActivityToday();
  };

  const addUserResource = (
    topicId: string,
    resource: Omit<UserResource, "id" | "addedAt">,
  ) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const entry: UserResource = {
        ...resource,
        id: `ur-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: {
            ...normalized,
            userResources: [entry, ...normalized.userResources],
            activeResourceUrl: resource.url,
          },
        },
      };
    });
    registerActivityToday();
  };

  const removeUserResource = (topicId: string, resourceId: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: {
            ...normalized,
            userResources: normalized.userResources.filter((r) => r.id !== resourceId),
          },
        },
      };
    });
  };

  const setActiveResource = (topicId: string, url: string | null) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: { ...normalizeTopic(topic), activeResourceUrl: url },
        },
      };
    });
  };

  const setSessionPhase = (topicId: string, phase: SessionPhase) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      return {
        ...previous,
        topics: {
          ...previous.topics,
          [topicId]: { ...normalizeTopic(topic), sessionPhase: phase },
        },
      };
    });
  };

  const saveExplainBack = (topicId: string, promptId: string, answer: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const existing = normalized.explainBack.filter((e) => e.promptId !== promptId);
      const entry: ExplainBackAnswer = {
        promptId,
        answer,
        done: answer.trim().length >= 20,
      };
      const explainBack = [...existing, entry];
      const explainDone = explainBack.filter((e) => e.done).length;
      const isFeynmanDone = explainBack.some((e) => e.promptId === "feynman" && e.done);

      const updatedTopic = {
        ...normalized,
        explainBack,
        checks: {
          ...normalized.checks,
          notes: isFeynmanDone || explainDone >= 2,
        },
      };
      const topics = recalculateUnlocks(
        { ...previous.topics, [topicId]: updatedTopic },
        previous.profile.paths,
      );

      let gamification = previous.gamification;
      if (entry.done) {
        gamification = onExplainBack(gamification, previous, updatedTopic);
      }

      return { ...previous, topics, gamification };
    });
    registerActivityToday();
  };

  const saveCaptureWorkflow = (topicId: string, workflow: CaptureWorkflow) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const hasLabeledRegions = workflow.regions.filter((r) => r.label.trim()).length >= 2;
      const hadCapture = Boolean(normalized.captureWorkflow?.regions?.length);
      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...normalized,
            captureWorkflow: workflow,
            checks: {
              ...normalized.checks,
              commit: hasLabeledRegions || normalized.checks.commit,
            },
          },
        },
        previous.profile.paths,
      );
      let gamification = previous.gamification;
      if (!hadCapture && workflow.regions.length > 0) {
        gamification = onCaptureSave(gamification, previous);
      }
      return { ...previous, topics, gamification };
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

      const updatedTopic = {
        ...topic,
        quizScore: score,
        checks: { ...topic.checks, quiz: score >= 70 },
      };
      const topics = recalculateUnlocks(
        { ...previous.topics, [topicId]: updatedTopic },
        previous.profile.paths,
      );

      let gamification = previous.gamification;
      if (score >= 70 && !topic.checks.quiz) {
        gamification = onQuizPass(gamification, previous, score, updatedTopic);
      }

      return { ...previous, topics, gamification };
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

  const dismissReward = () => {
    setState((previous) => ({
      ...previous,
      gamification: { ...previous.gamification, lastReward: null },
    }));
  };

  const uploadNote = async (file: File, topicId: string | null) => {
    const isImage = file.type.startsWith("image/");
    let content: string;
    if (isImage) {
      content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } else {
      content = await file.text();
    }

    const title = file.name.replace(/\.[^.]+$/, "");

    setState((previous) => {
      const entry: UploadedNote = {
        id: `un-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        fileName: file.name,
        mimeType: file.type || "text/plain",
        content,
        topicId,
        uploadedAt: new Date().toISOString(),
        sizeBytes: file.size,
        kind: isImage ? "image" : "text",
      };

      let topics = previous.topics;
      if (topicId && topics[topicId] && !isImage) {
        const topic = normalizeTopic(topics[topicId]);
        const merged = topic.notesText
          ? `${topic.notesText}\n\n---\n## ${title}\n${content}`
          : content;
        topics = {
          ...topics,
          [topicId]: { ...topic, notesText: merged },
        };
      }

      const gamification = onNoteUpload(previous.gamification, previous);

      return {
        ...previous,
        uploadedNotes: [entry, ...previous.uploadedNotes],
        topics,
        gamification,
      };
    });

    registerActivityToday();
  };

  const deleteUploadedNote = (noteId: string) => {
    setState((previous) => ({
      ...previous,
      uploadedNotes: previous.uploadedNotes.filter((n) => n.id !== noteId),
    }));
  };

  const addFlashcard = (topicId: string, front: string, back: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const newCard: Flashcard = {
        id: Math.random().toString(36).substring(2, 9),
        front: front.trim(),
        back: back.trim(),
        easeFactor: 2.5,
        intervalDays: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString().split("T")[0],
      };
      const flashcards = [...(normalized.flashcards ?? []), newCard];
      const topics = {
        ...previous.topics,
        [topicId]: { ...normalized, flashcards },
      };
      return { ...previous, topics };
    });
    registerActivityToday();
  };

  const updateFlashcardReview = (
    topicId: string,
    cardId: string,
    easeFactor: number,
    intervalDays: number,
    repetitions: number,
    nextReviewDate: string,
  ) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const flashcards = (normalized.flashcards ?? []).map((card) => {
        if (card.id !== cardId) return card;
        return {
          ...card,
          easeFactor,
          intervalDays,
          repetitions,
          nextReviewDate,
        };
      });
      const topics = {
        ...previous.topics,
        [topicId]: { ...normalized, flashcards },
      };
      return { ...previous, topics };
    });
    registerActivityToday();
  };

  const deleteFlashcard = (topicId: string, cardId: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const flashcards = (normalized.flashcards ?? []).filter((card) => card.id !== cardId);
      const topics = {
        ...previous.topics,
        [topicId]: { ...normalized, flashcards },
      };
      return { ...previous, topics };
    });
    registerActivityToday();
  };

  const connectTopicRepo = (topicId: string, repoUrl: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      const topics = {
        ...previous.topics,
        [topicId]: { ...normalized, repoUrl },
      };
      return { ...previous, topics };
    });
    registerActivityToday();
  };

  const runTopicBuildAnalysis = (topicId: string, score: number, feedback: string) => {
    setState((previous) => {
      const topic = previous.topics[topicId];
      if (!topic) return previous;
      const normalized = normalizeTopic(topic);
      
      const buildAnalysis = {
        score,
        feedback,
        analyzedAt: new Date().toISOString(),
      };
      
      const topics = recalculateUnlocks(
        {
          ...previous.topics,
          [topicId]: {
            ...normalized,
            buildAnalysis,
            checks: {
              ...normalized.checks,
              commit: score >= 70,
            },
          },
        },
        previous.profile.paths,
      );
      return { ...previous, topics };
    });
    registerActivityToday();
  };

  return (
    <GrowthContext.Provider
      value={{
        state,
        isHydrated,
        setProfile,
        setActivePath,
        openTopicFromNode,
        openTopicFromNodeId,
        updateTopicCheck,
        updateTopicNotes,
        updateTopicCanvas,
        addUserResource,
        removeUserResource,
        setActiveResource,
        setSessionPhase,
        saveExplainBack,
        saveCaptureWorkflow,
        completeTopicQuiz,
        completeTopic,
        connectProjectRepo,
        disconnectProjectRepo,
        runProjectAIReview,
        resetAll,
        registerActivityToday,
        uploadNote,
        deleteUploadedNote,
        dismissReward,
        incrementStudySessionsCount: () => {
          setState((prev) => ({
            ...prev,
            studySessionsCount: (prev.studySessionsCount ?? 0) + 1,
          }));
        },
        addFlashcard,
        updateFlashcardReview,
        deleteFlashcard,
        connectTopicRepo,
        runTopicBuildAnalysis,
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
