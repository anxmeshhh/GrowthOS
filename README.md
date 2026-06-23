# GrowthOS

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/anxmeshhh/GrowthOS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The execution layer for self-taught developers.**

> **We are Open Source!** 🎉 Check out our [Contributing Guide](CONTRIBUTING.md) to see how you can run GrowthOS locally and build with us!

GrowthOS is a learning operating system that helps self-taught developers stop wandering through scattered tutorials, notes, bookmarks, and unfinished plans. It gives each learner a clear path, one daily mission, proof-based progress, long-term review, and career-ready evidence of their work.

The goal is not to become another course platform. The goal is to become the system a learner opens every day to answer:

> What should I learn today, how do I prove I understood it, and how does this move me closer to becoming job-ready?

---

## Product Promise

GrowthOS turns learning into an accountable daily workflow:

1. Choose a path.
2. Get today's mission.
3. Study one focused topic.
4. Capture notes and examples.
5. Pass an assessment.
6. Build or commit proof.
7. Unlock the next topic.
8. Review weak areas later.
9. Convert completed work into portfolio and career proof.

This is the core idea:

> GrowthOS is not where you consume courses. GrowthOS is where you prove you are becoming a developer.

---

## Why GrowthOS Exists

Self-taught developers usually do not fail because resources are missing. They fail because the learning process is fragmented.

Common problems:

- Notes are scattered across notebooks, Notion pages, docs, and random files.
- Bookmarks and tutorials pile up without a clear sequence.
- Learners study advanced topics before foundations are solid.
- Watching a video feels like progress even when understanding is weak.
- Motivation fades because progress is not visible or trusted.
- There is no reliable answer to "what should I study today?"
- Portfolio output is disconnected from day-to-day learning.

GrowthOS solves this by combining roadmap, notes, assessment, practice, review, and career evidence into one system.

---

## What Makes GrowthOS Different

Most learning tools focus on one part of the journey:

- Roadmap tools show what exists.
- Course platforms teach content.
- Note apps store thoughts.
- Habit apps track streaks.
- AI chatbots answer questions.
- Portfolio tools show finished work.

GrowthOS connects all of these into one proof-based loop.

### Core Differentiator

GrowthOS owns the layer between learning resources and real career readiness:

**daily execution, proof, memory, and output.**

It can link to external resources like documentation, YouTube videos, courses, roadmap.sh, freeCodeCamp, Boot.dev, Codecademy, or Hyperskill. But GrowthOS remains the control center that decides sequence, tracks proof, detects weak spots, and turns completed work into evidence.

---

## Product Principles

### 1. Today First

The dashboard should not overwhelm the learner. It should answer one question:

**What should I do next?**

Every day should start with:

- one active topic
- one mission
- one expected proof outcome
- one clear next action

### 2. Proof Over Checkbox Progress

A learner should not complete a topic just because they watched or read something.

A topic is complete only when the learner provides proof:

- consumed the learning resource
- wrote notes in their own words
- passed a quiz or checkpoint
- completed a build task, challenge, or GitHub commit

### 3. Notes Are Part Of The System

Notes should not live separately from the roadmap. Every note belongs to a topic, path, resource, mistake, or project.

Good notes should later power:

- revision
- quiz generation
- interview prep
- project summaries
- resume bullets
- AI feedback

### 4. AI Should Examine Before It Chats

AI should not be added as a generic chatbot first.

The first useful AI roles are:

- generate quizzes from topic content
- ask Socratic follow-up questions
- review notes for weak understanding
- summarize weekly learning
- explain failed quiz answers
- suggest review topics
- review project README and code quality

### 5. Learning Must Produce Career Evidence

Every completed topic should leave behind useful output:

- notes
- quiz results
- challenge attempts
- commits
- project work
- reflections
- resume-ready bullet points
- interview stories

GrowthOS should make progress visible and defensible.

---

## Target User

GrowthOS is built for self-taught developers who:

- are learning without a college or bootcamp structure
- struggle with tutorial overload
- need a clear path from beginner to job-ready
- want a system that tells them what to study next
- want to prove their skills through projects and commits
- want their learning notes to become long-term knowledge
- want career output, not just completed lessons

The first target path should be **Backend Developer**, because backend learning benefits strongly from sequence, proof, projects, and GitHub evidence.

---

## Core Workflow

### 1. Path Selection

The learner chooses a path:

- Backend Developer
- Frontend Developer
- Full Stack Developer
- AI/ML Developer
- DevOps Engineer

Each path contains ordered modules and topics.

Example backend sequence:

1. Internet basics
2. HTTP and REST
3. Git and GitHub
4. Python fundamentals
5. Django basics
6. Databases and SQL
7. Authentication
8. API design
9. Testing
10. Deployment
11. System design basics
12. Portfolio projects

### 2. Daily Mission

The learner opens GrowthOS and sees one mission for today.

Mission example:

- Topic: HTTP and REST Basics
- Time budget: 80 minutes
- Resource: one video and one documentation page
- Note task: explain GET, POST, PUT, PATCH, DELETE
- Quiz task: score at least 70%
- Build task: create a tiny REST endpoint or commit a code example

### 3. Topic Workspace

Each topic has a focused workspace:

- topic overview
- prerequisites
- curated resources
- learning checklist
- notes editor
- code snippets
- quiz/checkpoint
- build challenge
- proof status
- revision history

### 4. Proof Completion

A topic unlocks the next topic only when required proof is complete.

Default proof types:

- Learn proof: resource marked complete
- Notes proof: learner writes a summary in their own words
- Quiz proof: learner passes a topic quiz
- Build proof: learner submits code, challenge output, or GitHub commit

### 5. Review Loop

GrowthOS should remember weak areas.

Review tasks are created from:

- failed quiz answers
- low-confidence notes
- skipped explanations
- old topics due for spaced repetition
- AI-detected weak concepts

### 6. Career Output

As the learner progresses, GrowthOS builds a career evidence layer:

- project list
- GitHub commit history
- verified skills
- readiness score
- resume bullets
- interview prep topics
- mock interview results

---

## Feature Areas

### Phase 1: The Compass

**Goal:** The learner can see their path and always know what comes next.

Features:

- learning paths
- ordered modules
- topic dependency graph
- locked, available, in-progress, and completed topic states
- curated resources per topic
- progress tracking
- dashboard summary

MVP output:

- one seeded Backend Developer path
- roadmap page connected to backend data
- topic detail API
- topic status API

### Phase 2: The Workbench

**Goal:** The learner can study and capture understanding inside the same system.

Features:

- topic-linked notes
- searchable notes
- code snippets
- resource completion tracking
- autosave
- note history
- optional whiteboard/sketch support later

MVP output:

- plain rich text or markdown notes first
- notes API
- search by topic/title/content
- notes visible from topic workspace

### Phase 3: The Checkpoint

**Goal:** The system verifies understanding before progress counts.

Features:

- topic quizzes
- quiz attempts
- pass threshold
- explanations for answers
- mistake tracking
- practice challenges
- automatic topic completion after proof

MVP output:

- static seeded quizzes first
- 70% pass threshold
- failed questions saved as review items
- topic unlock logic

### Phase 4: The Engine

**Goal:** GrowthOS drives consistency and long-term retention.

Features:

- daily mission generator
- time-budget based missions
- streak tracking
- heatmap
- spaced repetition
- review queue
- weekly reflection

MVP output:

- daily mission API
- mission completion
- streak calculation
- heatmap data
- review item model

### Phase 5: The Proof

**Goal:** Learning turns into visible career evidence.

Features:

- project catalog
- difficulty tiers
- project submissions
- GitHub commit proof
- skill radar
- readiness dashboard
- resume bullet generation
- mock interview prep

MVP output:

- projects model
- project proof submission
- skill readiness calculation based on completed topics and projects

### Phase 6: The Intelligence

**Goal:** AI improves feedback, assessment, and personalization.

Features:

- AI quiz generation
- AI note review
- AI weekly summary
- AI learning assistant
- AI project review
- custom learning paths
- calendar-aware scheduling

MVP output:

- Gemini-backed quiz generation
- note quality feedback
- weekly summary job

---

## MVP Scope

The first real version should be small and strict.

### MVP Must Have

- Backend Developer path
- ordered roadmap
- topic unlock system
- topic detail page
- daily mission
- topic notes
- quiz attempts
- proof tracking
- progress dashboard
- streak and heatmap basics

### MVP Should Not Have Yet

- generic AI chatbot
- multiple complex learning paths
- calendar sync
- resume PDF export
- social/community features
- complex whiteboard editor
- advanced project review

The MVP should prove the core loop:

> mission -> learn -> notes -> quiz -> build proof -> unlock -> review

---

## Current Repository State

This repository currently has two main parts:

```text
GrowthOS/
+-- backend/
|   +-- config/
|   +-- manage.py
|   +-- requirements.txt
+-- frontend/
    +-- src/
    |   +-- components/
    |   +-- routes/
    |   +-- lib/
    |   +-- styles.css
    +-- package.json
    +-- vite.config.ts
```

Current state:

- `backend/` is a Django project scaffold.
- `frontend/` already contains mock GrowthOS screens.
- The frontend currently uses React, Vite, TanStack Router, TanStack Query, Tailwind CSS, Radix UI, lucide-react, and Recharts.
- The README vision originally referenced Next.js, but the active frontend is Vite/TanStack. The practical path is to continue with the existing frontend unless a Next.js migration becomes necessary.

---

## Recommended Architecture

```text
Client
  React + Vite + TanStack Router
  TanStack Query for API state
  Tailwind CSS for styling
  Recharts for visual progress

Backend API
  Django 5
  Django REST Framework
  Django ORM
  Service modules for AI, GitHub, scheduling

Data
  SQLite for local development
  PostgreSQL for production

External Services
  Gemini API for AI assessments and summaries
  GitHub API for commit/project proof
  Google Calendar later for scheduling
```

---

## Backend Domain Model

Initial models should support the real learning loop.

### User/Profile

Tracks learner preferences and learning settings.

Fields:

- user
- display name
- selected path
- daily time budget
- timezone
- current streak
- longest streak

### LearningPath

Represents a career path.

Examples:

- Backend Developer
- Frontend Developer
- Full Stack Developer
- AI/ML Developer
- DevOps Engineer

Fields:

- title
- slug
- description
- estimated weeks
- is active

### Module

Groups topics inside a path.

Fields:

- path
- title
- description
- order

### Topic

The core learning unit.

Fields:

- module
- title
- slug
- summary
- order
- estimated minutes
- difficulty
- prerequisites
- proof requirements

### Resource

Curated learning material attached to a topic.

Fields:

- topic
- type
- title
- url
- source
- estimated minutes
- order

### TopicProgress

Tracks user state for each topic.

States:

- locked
- available
- in progress
- completed

Fields:

- user
- topic
- status
- started at
- completed at
- progress percentage

### Proof

Tracks required proof for topic completion.

Proof types:

- resource completed
- notes submitted
- quiz passed
- build submitted
- GitHub commit verified

Fields:

- user
- topic
- proof type
- status
- metadata
- submitted at
- verified at

### Note

Topic-linked learning notes.

Fields:

- user
- topic
- title
- content
- content format
- tags
- created at
- updated at

### Quiz

Assessment attached to a topic.

Fields:

- topic
- title
- pass percentage
- source
- is active

### Question

Quiz question.

Fields:

- quiz
- prompt
- question type
- choices
- correct answer
- explanation
- order

### QuizAttempt

Learner attempt.

Fields:

- user
- quiz
- score
- passed
- answers
- started at
- completed at

### Mission

Daily assigned work.

Fields:

- user
- date
- topic
- mission type
- estimated minutes
- status
- generated reason

### ReviewItem

Spaced repetition or weak-area review task.

Fields:

- user
- topic
- source
- prompt
- due date
- interval
- ease factor
- repetitions
- status

### Project

Career proof project.

Fields:

- title
- path
- difficulty
- description
- required skills
- acceptance criteria

### ProjectSubmission

Learner project proof.

Fields:

- user
- project
- repository url
- live url
- notes
- status
- review summary

---

## API Plan

### Dashboard

```http
GET /api/dashboard/
```

Returns:

- active mission
- current topic
- progress summary
- streak summary
- heatmap data
- review count

### Roadmap

```http
GET /api/paths/
GET /api/paths/{slug}/roadmap/
GET /api/topics/{slug}/
```

Returns:

- paths
- modules
- topics
- status per topic
- unlock state
- resources
- proof requirements

### Progress

```http
POST /api/topics/{slug}/start/
POST /api/topics/{slug}/proofs/
POST /api/topics/{slug}/complete/
```

Handles:

- start topic
- submit proof
- verify required proofs
- complete topic
- unlock next topic

### Notes

```http
GET /api/notes/
POST /api/notes/
GET /api/notes/{id}/
PATCH /api/notes/{id}/
DELETE /api/notes/{id}/
```

Supports:

- list notes
- filter by topic
- search content
- create/update/delete notes

### Quizzes

```http
GET /api/topics/{slug}/quiz/
POST /api/quizzes/{id}/attempts/
GET /api/quiz-attempts/{id}/
```

Supports:

- fetch quiz
- submit answers
- calculate score
- save mistakes
- mark quiz proof complete on pass

### Missions

```http
GET /api/missions/today/
POST /api/missions/{id}/complete/
GET /api/missions/history/
```

Supports:

- daily mission
- completion
- streak tracking
- mission history

### Reviews

```http
GET /api/reviews/due/
POST /api/reviews/{id}/complete/
```

Supports:

- spaced repetition queue
- weak area review
- SM-2 style scheduling later

### Projects

```http
GET /api/projects/
POST /api/projects/{id}/submissions/
GET /api/readiness/
```

Supports:

- project catalog
- project submissions
- readiness dashboard

---

## Frontend Screens

The mock UI should become the frontend contract for the backend.

### Dashboard

Purpose:

- show today's mission
- show active topic
- show proof checklist
- show streak and heatmap
- show overall progress

Backend data:

- `/api/dashboard/`
- `/api/missions/today/`

### Roadmap

Purpose:

- show ordered path
- show locked/available/in-progress/completed topics
- open topic detail

Backend data:

- `/api/paths/{slug}/roadmap/`
- `/api/topics/{slug}/`

### Topic Workspace

Purpose:

- central place to study a topic
- resources, notes, quiz, build proof, progress

Backend data:

- topic detail
- resources
- notes by topic
- quiz
- proof status

### Notes

Purpose:

- searchable knowledge base
- topic-linked learning records

Backend data:

- `/api/notes/`

### Assessments

Purpose:

- quizzes
- attempts
- mistakes
- explanations

Backend data:

- quiz endpoints
- attempt endpoints

### Projects

Purpose:

- career proof
- portfolio projects
- submission tracking

Backend data:

- project endpoints
- readiness endpoint

### Settings

Purpose:

- selected path
- time budget
- profile preferences
- API/service connections later

Backend data:

- profile endpoint
- path selection endpoint

---

## Implementation Roadmap

### Sprint 1: Backend Foundation

Deliverables:

- create Django apps
- add models for paths, topics, resources, progress, notes, quizzes, missions, proofs
- add migrations
- register admin models
- add seed command for Backend Developer path
- configure DRF and CORS

Done when:

- local backend starts
- database migrates
- seed command creates usable roadmap data

### Sprint 2: Roadmap API

Deliverables:

- serializers
- path list endpoint
- roadmap endpoint
- topic detail endpoint
- progress status per topic
- unlock calculation

Done when:

- frontend can render roadmap from backend data

### Sprint 3: Dashboard API

Deliverables:

- active mission endpoint
- dashboard summary endpoint
- progress counters
- streak basics
- heatmap response shape

Done when:

- dashboard mock data can be removed

### Sprint 4: Notes API

Deliverables:

- CRUD notes
- topic filter
- search
- note proof creation

Done when:

- learner can write notes for a topic and satisfy notes proof

### Sprint 5: Quiz And Proof Loop

Deliverables:

- seeded quiz data
- quiz attempt endpoint
- scoring
- pass/fail logic
- mistake capture
- quiz proof creation
- topic completion check
- next topic unlock

Done when:

- learner can complete a topic through required proofs

### Sprint 6: Daily Engine

Deliverables:

- mission generation
- mission completion
- streak calculation
- review item creation
- due review endpoint

Done when:

- GrowthOS gives a useful daily mission and remembers weak topics

### Sprint 7: AI-Assisted Assessment

Deliverables:

- Gemini service wrapper
- generate quiz from topic metadata/resources
- review notes for missing concepts
- weekly learning summary

Done when:

- AI improves assessment and review without replacing the core workflow

### Sprint 8: Projects And Readiness

Deliverables:

- project catalog
- project submissions
- GitHub proof placeholder
- readiness scoring
- skill radar data

Done when:

- completed work starts becoming career evidence

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- TanStack Router
- TanStack Query
- Tailwind CSS
- Radix UI
- lucide-react
- Recharts

### Backend

- Python
- Django 5
- Django REST Framework
- django-cors-headers
- python-dotenv
- SQLite for local development
- PostgreSQL for production

### AI And Integrations

- Gemini API for AI features
- GitHub API for commit and project proof
- Google Calendar API later for scheduling

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Backend runs at:

```text
http://127.0.0.1:8000/
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173/
```

---

## Environment Variables

### Backend `.env`

```env
SECRET_KEY=your_django_secret_key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
GEMINI_API_KEY=your_gemini_api_key
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Frontend `.env`

```env
VITE_API_URL=http://127.0.0.1:8000
```

---

## Success Metrics

GrowthOS should be judged by behavior, not feature count.

Important metrics:

- learner opens the app daily
- learner completes missions consistently
- topics are completed with proof
- notes are created and reused
- quiz mistakes decrease over time
- old topics are reviewed before they are forgotten
- projects and commits increase
- career readiness becomes evidence-based

---

## Design Direction

GrowthOS should feel like a serious developer workspace, not a marketing site.

Design principles:

- dashboard-first, not landing-page-first
- quiet and focused visual system
- dense but readable layouts
- minimal decorative UI
- clear status states
- strong information hierarchy
- fast access to next action
- no unnecessary gamification

Gamification should support consistency, not distract from learning.

---

## Long-Term Vision

GrowthOS can become the personal operating system for developer growth.

Long-term capabilities:

- custom learning path builder
- AI mentor with context from notes and progress
- GitHub and project verification
- calendar-aware scheduling
- resume and portfolio generation
- mock interview mode
- personal knowledge graph
- self-hosted/local-first option
- team or cohort mode for mentors

The strongest version of GrowthOS is a system learners trust every morning:

> Open GrowthOS. Do the mission. Prove the work. Keep the path moving.

---

## License

This project is currently intended for active development. Add or update license details before public distribution.



Here's the full picture and the plan, no auth currently exists despite login/signup pages, and the backend has no Bookmark, custom-path, file-upload, or AI-verification models — these need to be added.
Architecture (backend additions):

Bookmark (user, path, created_at)
LearningPath: add is_custom, created_by (FK User, null for system paths)
Topic: add created_by (null for system topics, set for custom-path topics)
TopicMaterial (user, topic, file, uploaded_at, ai_status: pending/verified/rejected, ai_feedback)
TopicProgress: already has status; will be driven by material verification
Auth: djangorestframework-simplejwt — register/login/refresh endpoints to match existing login.tsx/signup.tsx

New API endpoints:

POST /api/auth/register/, POST /api/auth/login/, POST /api/auth/refresh/
GET /api/paths/ — all system paths + user's custom paths, each with is_bookmarked
POST /api/paths/{slug}/bookmark/ — toggle
GET /api/bookmarks/ — user's bookmarked paths
POST /api/paths/custom/ — create custom path + topics list
GET /api/topics/{id}/ — detail + user's progress + materials
PATCH /api/topics/{id}/progress/
POST /api/topics/{id}/materials/ — upload file (multipart)
POST /api/materials/{id}/verify/ — runs AI check against topic, updates progress to completed if passed, unlocks next topic