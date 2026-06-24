// Mock dataset for GrowthOS. Frontend-only; persisted state lives in store.ts.

export type TopicStatus = "locked" | "available" | "in_progress" | "completed";

export interface Resource {
  id: string;
  type: "video" | "article" | "doc";
  title: string;
  url: string;
  duration?: number; // minutes
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index
  explain: string;
}

export interface Topic {
  id: string;
  title: string;
  moduleId: string;
  pathId: string;
  estMinutes: number;
  prereq: string[];
  resources: Resource[];
  notes: string;
  buildChallenge: string;
  quiz: QuizQuestion[];
  flashcards: { front: string; back: string }[];
}

export interface Module {
  id: string;
  pathId: string;
  title: string;
  topicIds: string[];
}

export interface LearningPath {
  id: string;
  name: string;
  tagline: string;
}

export interface ProjectChallenge {
  id: string;
  title: string;
  pathId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  skills: string[];
  description: string;
}

export const PATHS: LearningPath[] = [
  { id: "backend", name: "Backend Developer", tagline: "APIs, databases, systems" },
  { id: "frontend", name: "Frontend Developer", tagline: "UI, UX, the browser" },
  { id: "fullstack", name: "Full Stack", tagline: "End to end ownership" },
  { id: "aiml", name: "AI / ML", tagline: "Models, data, inference" },
  { id: "devops", name: "DevOps", tagline: "Ship, scale, observe" },
];

// ---------- Backend path content ----------
const backendTopics: Topic[] = [
  // Internet Basics
  {
    id: "net-1",
    moduleId: "backend-net",
    pathId: "backend",
    title: "How the Internet Works",
    estMinutes: 30,
    prereq: [],
    resources: [
      {
        id: "r1",
        type: "video",
        title: "How the Internet Works in 5 Minutes",
        url: "https://www.youtube.com/embed/7_LPdttKXPc",
        duration: 5,
      },
      {
        id: "r2",
        type: "article",
        title: "MDN: How the web works",
        url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works",
      },
    ],
    notes: "",
    buildChallenge: "Diagram the request lifecycle from URL to render.",
    quiz: [
      {
        q: "What does DNS do?",
        options: [
          "Translates IP to MAC",
          "Translates domain to IP",
          "Routes packets",
          "Encrypts traffic",
        ],
        answer: 1,
        explain: "DNS resolves human-readable domains to IP addresses.",
      },
      {
        q: "Which layer does HTTP live on?",
        options: ["Transport", "Network", "Application", "Link"],
        answer: 2,
        explain: "HTTP is an application-layer protocol.",
      },
    ],
    flashcards: [
      { front: "DNS", back: "Maps domains to IP addresses" },
      { front: "TCP", back: "Reliable, ordered, byte-stream transport" },
    ],
  },
  {
    id: "net-2",
    moduleId: "backend-net",
    pathId: "backend",
    title: "DNS Basics",
    estMinutes: 25,
    prereq: ["net-1"],
    resources: [
      {
        id: "r1",
        type: "video",
        title: "DNS Explained",
        url: "https://www.youtube.com/embed/72snZctFFtA",
        duration: 12,
      },
    ],
    notes: "",
    buildChallenge: "Trace a domain with `dig` and document each record.",
    quiz: [
      {
        q: "Which record points a domain to an IPv4?",
        options: ["AAAA", "CNAME", "A", "MX"],
        answer: 2,
        explain: "A records map a name to an IPv4 address.",
      },
    ],
    flashcards: [{ front: "A record", back: "Domain → IPv4 address" }],
  },
  {
    id: "net-3",
    moduleId: "backend-net",
    pathId: "backend",
    title: "TCP/IP Fundamentals",
    estMinutes: 40,
    prereq: ["net-1"],
    resources: [],
    notes: "",
    buildChallenge: "Capture a packet with Wireshark and identify TCP handshake.",
    quiz: [
      {
        q: "How many steps in the TCP handshake?",
        options: ["2", "3", "4", "1"],
        answer: 1,
        explain: "SYN, SYN-ACK, ACK.",
      },
    ],
    flashcards: [],
  },

  // HTTP & REST
  {
    id: "http-1",
    moduleId: "backend-http",
    pathId: "backend",
    title: "HTTP & REST Basics",
    estMinutes: 80,
    prereq: ["net-1"],
    resources: [
      {
        id: "r1",
        type: "video",
        title: "HTTP Crash Course",
        url: "https://www.youtube.com/embed/iYM2zFP3Zn0",
        duration: 20,
      },
      {
        id: "r2",
        type: "article",
        title: "MDN: HTTP Overview",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview",
      },
    ],
    notes: "",
    buildChallenge: "Build a tiny REST endpoint that supports GET and POST.",
    quiz: [
      {
        q: "Which method is idempotent?",
        options: ["POST", "PUT", "PATCH", "CONNECT"],
        answer: 1,
        explain: "PUT replaces the resource — repeated calls leave the same state.",
      },
      {
        q: "What status code means 'created'?",
        options: ["200", "201", "202", "204"],
        answer: 1,
        explain: "201 Created indicates a new resource was created.",
      },
      {
        q: "What is REST primarily based on?",
        options: ["RPC", "SOAP", "Resources & verbs", "GraphQL"],
        answer: 2,
        explain: "REST models the system as resources manipulated via HTTP verbs.",
      },
    ],
    flashcards: [
      { front: "GET", back: "Retrieve a resource. Safe & idempotent." },
      { front: "POST", back: "Create a new resource. Not idempotent." },
      { front: "PUT", back: "Replace a resource. Idempotent." },
      { front: "DELETE", back: "Remove a resource. Idempotent." },
    ],
  },
  {
    id: "http-2",
    moduleId: "backend-http",
    pathId: "backend",
    title: "HTTP Status Codes",
    estMinutes: 30,
    prereq: ["http-1"],
    resources: [],
    notes: "",
    buildChallenge: "Return appropriate status codes from your endpoint.",
    quiz: [
      {
        q: "404 means…",
        options: ["Server error", "Not found", "Unauthorized", "Forbidden"],
        answer: 1,
        explain: "Resource not found.",
      },
    ],
    flashcards: [],
  },
  {
    id: "http-3",
    moduleId: "backend-http",
    pathId: "backend",
    title: "Headers, Cookies, CORS",
    estMinutes: 45,
    prereq: ["http-1"],
    resources: [],
    notes: "",
    buildChallenge: "Configure CORS for a cross-origin frontend.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "http-4",
    moduleId: "backend-http",
    pathId: "backend",
    title: "API Authentication",
    estMinutes: 60,
    prereq: ["http-1"],
    resources: [],
    notes: "",
    buildChallenge: "Add JWT auth to your endpoint.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "http-5",
    moduleId: "backend-http",
    pathId: "backend",
    title: "Pagination & Rate Limiting",
    estMinutes: 35,
    prereq: ["http-1"],
    resources: [],
    notes: "",
    buildChallenge: "Implement cursor-based pagination.",
    quiz: [],
    flashcards: [],
  },

  // Git & GitHub
  {
    id: "git-1",
    moduleId: "backend-git",
    pathId: "backend",
    title: "Git Basics",
    estMinutes: 45,
    prereq: [],
    resources: [
      {
        id: "r1",
        type: "video",
        title: "Git in 100 seconds",
        url: "https://www.youtube.com/embed/hwP7WQkmECE",
        duration: 2,
      },
    ],
    notes: "",
    buildChallenge: "Commit and push a README to a new repo.",
    quiz: [
      {
        q: "Which command stages changes?",
        options: ["git push", "git add", "git pull", "git stash"],
        answer: 1,
        explain: "`git add` stages files for the next commit.",
      },
    ],
    flashcards: [],
  },
  {
    id: "git-2",
    moduleId: "backend-git",
    pathId: "backend",
    title: "Branches & Merging",
    estMinutes: 40,
    prereq: ["git-1"],
    resources: [],
    notes: "",
    buildChallenge: "Open a PR with a feature branch.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "git-3",
    moduleId: "backend-git",
    pathId: "backend",
    title: "Rebase vs Merge",
    estMinutes: 35,
    prereq: ["git-2"],
    resources: [],
    notes: "",
    buildChallenge: "Rebase a feature branch on main.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "git-4",
    moduleId: "backend-git",
    pathId: "backend",
    title: "GitHub Workflow",
    estMinutes: 30,
    prereq: ["git-2"],
    resources: [],
    notes: "",
    buildChallenge: "Set up GitHub Actions CI.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "git-5",
    moduleId: "backend-git",
    pathId: "backend",
    title: "Conflict Resolution",
    estMinutes: 30,
    prereq: ["git-3"],
    resources: [],
    notes: "",
    buildChallenge: "Resolve a merge conflict end-to-end.",
    quiz: [],
    flashcards: [],
  },

  // Python Basics
  {
    id: "py-1",
    moduleId: "backend-py",
    pathId: "backend",
    title: "Python Syntax",
    estMinutes: 60,
    prereq: [],
    resources: [],
    notes: "",
    buildChallenge: "Write a CLI calculator.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "py-2",
    moduleId: "backend-py",
    pathId: "backend",
    title: "Data Structures",
    estMinutes: 70,
    prereq: ["py-1"],
    resources: [],
    notes: "",
    buildChallenge: "Implement a LRU cache.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "py-3",
    moduleId: "backend-py",
    pathId: "backend",
    title: "OOP in Python",
    estMinutes: 60,
    prereq: ["py-1"],
    resources: [],
    notes: "",
    buildChallenge: "Model a library with classes.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "py-4",
    moduleId: "backend-py",
    pathId: "backend",
    title: "Async & Concurrency",
    estMinutes: 80,
    prereq: ["py-3"],
    resources: [],
    notes: "",
    buildChallenge: "Fetch 100 URLs concurrently.",
    quiz: [],
    flashcards: [],
  },

  // Databases
  {
    id: "db-1",
    moduleId: "backend-db",
    pathId: "backend",
    title: "SQL Fundamentals",
    estMinutes: 90,
    prereq: [],
    resources: [],
    notes: "",
    buildChallenge: "Design a normalized schema.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "db-2",
    moduleId: "backend-db",
    pathId: "backend",
    title: "Indexing & Performance",
    estMinutes: 60,
    prereq: ["db-1"],
    resources: [],
    notes: "",
    buildChallenge: "Add indexes and measure speed.",
    quiz: [],
    flashcards: [],
  },
  {
    id: "db-3",
    moduleId: "backend-db",
    pathId: "backend",
    title: "Transactions & ACID",
    estMinutes: 45,
    prereq: ["db-1"],
    resources: [],
    notes: "",
    buildChallenge: "Demonstrate isolation levels.",
    quiz: [],
    flashcards: [],
  },
];

const backendModules: Module[] = [
  {
    id: "backend-net",
    pathId: "backend",
    title: "Internet Basics",
    topicIds: ["net-1", "net-2", "net-3"],
  },
  {
    id: "backend-http",
    pathId: "backend",
    title: "HTTP & REST",
    topicIds: ["http-1", "http-2", "http-3", "http-4", "http-5"],
  },
  {
    id: "backend-git",
    pathId: "backend",
    title: "Git & GitHub",
    topicIds: ["git-1", "git-2", "git-3", "git-4", "git-5"],
  },
  {
    id: "backend-py",
    pathId: "backend",
    title: "Python Basics",
    topicIds: ["py-1", "py-2", "py-3", "py-4"],
  },
  { id: "backend-db", pathId: "backend", title: "Databases", topicIds: ["db-1", "db-2", "db-3"] },
];

export const MODULES: Module[] = backendModules;
export const TOPICS: Topic[] = backendTopics;

export function getTopic(id: string) {
  return TOPICS.find((t) => t.id === id);
}
export function getModule(id: string) {
  return MODULES.find((m) => m.id === id);
}
export function modulesForPath(pathId: string) {
  return MODULES.filter((m) => m.pathId === pathId);
}
export function topicsForPath(pathId: string) {
  return TOPICS.filter((t) => t.pathId === pathId);
}

export const PROJECTS: ProjectChallenge[] = [
  {
    id: "p1",
    title: "REST API from Scratch",
    pathId: "backend",
    difficulty: "MEDIUM",
    skills: ["Python", "Flask", "SQL"],
    description: "Build a CRUD API with auth, validation, and pagination.",
  },
  {
    id: "p2",
    title: "URL Shortener Service",
    pathId: "backend",
    difficulty: "EASY",
    skills: ["HTTP", "SQL"],
    description: "Shorten and redirect URLs with click analytics.",
  },
  {
    id: "p3",
    title: "Realtime Chat Backend",
    pathId: "backend",
    difficulty: "HARD",
    skills: ["WebSockets", "Python", "Redis"],
    description: "Multi-room chat with presence and history.",
  },
  {
    id: "p4",
    title: "Dockerized Microservices",
    pathId: "backend",
    difficulty: "HARD",
    skills: ["Docker", "API Design"],
    description: "Two services communicating via REST, behind a reverse proxy.",
  },
];
