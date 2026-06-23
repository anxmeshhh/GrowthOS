# GrowthOS

[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/anxmeshhh/GrowthOS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The execution layer for self-taught developers.**

> **We are Open Source!** 🎉 Check out our [Contributing Guide](CONTRIBUTING.md) to see how you can run GrowthOS locally and build with us!

---

## Overview

GrowthOS is a learning operating system that helps self-taught developers stop wandering through scattered tutorials, notes, bookmarks, and unfinished plans. It provides a clear path, daily missions, proof-based progress, long-term review mechanisms, and career-ready evidence of completed work.

## Problem Statement

Self-taught developers rarely fail due to a lack of resources; they fail because the learning process is fundamentally fragmented:
- Notes are scattered across different apps (Notion, Apple Notes, physical notebooks).
- Tutorials pile up without a sequenced curriculum.
- Consuming content (watching videos) gives a false sense of progress.
- There is no central hub to say: "What should I study today?"
- Learning is disconnected from career evidence (GitHub commits, portfolios).

## Solution

GrowthOS unifies the entire learning loop into one cohesive "Command Center". It enforces a **Proof over Progress** philosophy: you cannot advance to the next topic until you have written notes, passed an AI-generated quiz, successfully explained the concept using the Feynman technique, and built a verifiable project.

---

## Key Features

- **Dynamic Learning Paths**: Support for structured roadmaps (e.g., Backend Developer) and AI-generated custom paths.
- **Topic Workspaces**: A dedicated study space per topic containing curated resources, markdown notes, code snippets, and file attachments.
- **AI Assessment Engine**: Uses Groq/Gemini to dynamically generate quizzes, grade Feynman technique explanations, and evaluate uploaded project code.
- **Spaced Repetition (SRS)**: Built-in flashcard system that automatically generates cards from your notes and schedules them based on an ease-factor algorithm.
- **Gamification & Habit Tracking**: Daily missions, Pomodoro timers, activity heatmaps, and streak tracking (with "Streak Revives").
- **GitHub & Portfolio Integration**: Seamlessly connect your GitHub account to automatically create repositories, scan commits for proof of work, and generate a public portfolio.
- **Admin Command Center**: A comprehensive admin panel for user management, roadmap uploading (JSON), and platform analytics.

---

## System Architecture

GrowthOS follows a modern decoupled architecture:
1. **Client**: A high-performance Single Page Application (SPA) built with React and Vite. It uses TanStack Router for type-safe routing and TanStack Query for caching and API state management.
2. **API Server**: A robust Django REST Framework backend handling business logic, database transactions, and authentication.
3. **AI Layer**: An abstraction layer integrating with Groq, Google Gemini, and NVIDIA APIs to process natural language, generate quizzes, and evaluate code.
4. **Third-Party Integrations**: OAuth providers (Google/GitHub) and the GitHub API for workspace synchronization.

---

## Technology Stack

### Frontend
- **Framework**: React 19 + Vite
- **Routing & State**: TanStack Router, TanStack Query
- **Styling**: Tailwind CSS v4, Radix UI Primitives
- **Visuals**: Recharts (Heatmaps/Stats), Lucide React (Icons)
- **Forms**: React Hook Form, Zod

### Backend
- **Framework**: Python 3.10+, Django 5, Django REST Framework
- **Authentication**: SimpleJWT, Google/GitHub OAuth, SMTP (Email OTP)
- **Database**: MySQL 8.0 (Production), SQLite (Local)

### AI & Integrations
- **AI Providers**: Groq API, Google Gemini, NVIDIA API
- **External APIs**: GitHub API (Commits, Gists, Repos)

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Server**: Gunicorn

---

## Project Structure

```text
GrowthOS/
├── backend/                 # Django backend
│   ├── config/              # Django core settings & urls
│   ├── core/                # Main application logic (Models, Views)
│   ├── manage.py            # Django CLI
│   └── requirements.txt     # Python dependencies
├── frontend/                # React frontend
│   ├── src/                 
│   │   ├── components/      # Reusable UI components (growth-ui)
│   │   ├── routes/          # TanStack Router page components
│   │   ├── lib/             # API client and utilities
│   │   └── styles.css       # Global Tailwind styles
│   ├── package.json         # Node dependencies
│   └── vite.config.ts       # Vite configuration
├── docker-compose.production.yml # Deployment config
├── .env.prod.example        # Production environment template
├── CONTRIBUTING.md          # Open source contribution guide
└── README.md                # Project documentation
```

---

## Database Design

The database is built around three core pillars: Content, Assessment, and User State.

### Major Entities:
- **User & Identity**: `User`, `UserProfile`, `OTPVerification`, `AdminRequest`
- **Curriculum**: `LearningPath`, `Topic`, `Bookmark`, `PathSharing`
- **Study Materials**: `TopicNote`, `TopicMaterial`, `NoteDocument`, `TopicScreenshot`
- **Assessments**: `TopicProgress`, `TopicQuiz`, `TopicFlashcard`, `Flashcard` (handles SRS scheduling), `TopicFeynman`
- **Proof & Activity**: `VerifiedProject`, `PomodoroSession`, `Contribution`, `ChatMessage`

---

## Authentication & Security

- **JWT Authorization**: All secured endpoints require stateless JSON Web Tokens.
- **Multiple Login Methods**: Support for Email OTP (One Time Password), Google OAuth, and GitHub OAuth.
- **Role-Based Access**: Specialized `/api/admin/` routes protected by staff-level verification via the `AdminRequest` approval flow.
- **Environment Isolation**: Absolute separation of local and production environment variables.

---

## Installation Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MySQL (Optional for local, defaults to SQLite)

### 1. Clone the repository
```bash
git clone https://github.com/anxmeshhh/GrowthOS.git
cd GrowthOS
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## Configuration

You must configure environment variables to enable full functionality.
Create a `.env` file in the `backend/` directory (Refer to `.env.prod.example`):

```env
# Database (Local uses SQLite if omitted)
MYSQL_DATABASE=growthos
MYSQL_USER=growthos_user
MYSQL_PASSWORD=secure_password

# Authentication
DJANGO_SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret
FERNET_KEY=your_fernet_key

# External Providers
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
GOOGLE_CLIENT_ID=your_google_id
GITHUB_CLIENT_ID=your_github_id
GITHUB_CLIENT_SECRET=your_github_secret

# AI APIs
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
NVIDIA_API_KEY=your_nvidia_key
```

Create a `.env` in the `frontend/` directory:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GITHUB_CLIENT_ID=your_github_client_id
```

---

## API Documentation

The backend exposes a comprehensive RESTful API under `/api/`.

### Core Endpoints:
- **Auth**: `/auth/login/`, `/auth/register/`, `/auth/google/`, `/auth/github/`, `/auth/verify-otp/`
- **Dashboard**: `/dashboard/`, `/heatmap/`, `/activity/`, `/pomodoro/`, `/today/`
- **Paths & Topics**: `/paths/`, `/custom-paths/`, `/topics/<id>/`
- **Study Workspaces**: `/topics/<id>/notes/`, `/topics/<id>/quiz/`, `/topics/<id>/feynman/`, `/topics/<id>/flashcards/`
- **GitHub Integration**: `/github/repos/`, `/github/path/sync/`, `/github/workspace/commit/`
- **Admin**: `/admin/stats/`, `/admin/users/`, `/admin/roadmaps/`

---

## Workflows

### User Workflow
1. **Onboarding**: User creates an account, connects GitHub, and selects/generates a Learning Path.
2. **Daily Routine**: The user reviews the Dashboard heatmap and starts their Pomodoro timer.
3. **Consumption**: User reads/watches curated resources for the current topic.
4. **Distillation**: User writes markdown notes and attaches screenshots.
5. **Assessment**: User takes the AI-generated Quiz and performs a Feynman technique explanation.
6. **Proof**: User builds a mini-project and the system automatically commits their workspace to GitHub.
7. **Progression**: The topic is marked as mastered, updating the trajectory timeline and unlocking the next concept.

### Admin Workflow
1. **Access**: Admins navigate to the command center via a secure toggle.
2. **User Management**: Monitor user activity, approve admin requests, and export platform data.
3. **Curriculum Management**: Upload structured Roadmap JSON files to instantly populate new core paths.

---

## Deployment

GrowthOS includes a production-ready Docker Compose configuration.

```bash
# 1. Create your .env.prod file on your server
cp .env.prod.example .env.prod
nano .env.prod

# 2. Build and spin up the containers
docker compose --env-file .env.prod -f docker-compose.production.yml up -d --build

# 3. Collect static files for Django
docker exec -it growthos_backend python manage.py collectstatic --noinput
```

---

## Known Limitations & Future Scope

- **Partially Implemented**: The NVIDIA API layer is currently configured but primarily delegates to Groq/Gemini for heavy lifting.
- **Calendar Integration**: Google Calendar sync for scheduling study sessions is planned but not fully integrated.
- **Mobile Responsiveness**: The frontend works on mobile, but the UI is heavily optimized for desktop "Command Center" usage.
- **Future Scope**: 
  - Advanced whiteboard editor for architectural drawings.
  - Social/Community features (Public leaderboards).
  - Resume PDF export generated directly from verified project proofs.

---

## Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) to understand our branching strategy, local setup process, and code style guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.