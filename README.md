# GrowthOS

> **An intelligent, full-stack learning operating system** — built for engineers who want to grow deliberately, not randomly.

GrowthOS combines spaced repetition, AI-powered mock interviews, GitHub portfolio analysis, career gap mapping, and deep note-taking into a single unified platform. It is not a course platform. It is not a flashcard app. It is the system that runs your entire growth journey — tracking what you know, what you don't, how fast you're learning, and what to do next.

---

## Table of Contents

1. [Project Overview & Mission](#1-project-overview--mission)
2. [Core Engines & Mechanics](#2-core-engines--mechanics)
3. [System Architecture](#3-system-architecture)
4. [Security, Auth & Hardening](#4-security-auth--hardening)
5. [UI/UX & Design Philosophy](#5-uiux--design-philosophy)
6. [Deployment & Infrastructure](#6-deployment--infrastructure)
7. [Local Setup & Developer Onboarding](#7-local-setup--developer-onboarding)

---

## 1. Project Overview & Mission

### What Is GrowthOS?

Most developers learn reactively — they watch tutorials when stuck, read docs when broken, and grind LeetCode when an interview is a week away. GrowthOS flips this. It is a **proactive learning operating system** that maps your current skill state, identifies your weakest gaps, generates content to fill them, tests your retention with spaced repetition, and measures your interview readiness — all in one place.

### Who It's For

- Self-taught developers preparing for job switches
- Engineers doing structured upskilling alongside a full-time job
- CS students bridging the gap between academic knowledge and industry expectations

### Core Feature Surface

| Module | What It Does |
|---|---|
| **Roadmaps & Paths** | Structured learning paths across 30+ tech topics (DSA, System Design, DevOps, etc.) — each with topics, notes, flashcards, and Feynman explainers |
| **Spaced Repetition** | SM-2 algorithm drives a daily flashcard review queue — cards resurface at the optimal forgetting-curve interval |
| **Mock Interviews** | AI-generated questions from a job description, from your own notes, or from a custom prompt — voice input supported, scored per answer, interview summary emailed |
| **Career Intel** | Paste a JD, get a match-% ring, weeks-to-ready estimate, skill matrix (Mastered / In Progress / Gap), and prioritized action plan with direct study links |
| **Resume AI** | Upload resume PDF → AI scores it 0–100 with specific tips → cross-maps it against JD skills → shows match % |
| **GitHub Scanner** | OAuth-connected repo scanner — identifies tech stack, estimates complexity, generates project summaries for your portfolio |
| **Notes & Feynman** | Rich per-topic notes with AI Feynman explainer that forces you to explain a concept back in plain language |
| **Pomodoro Timer** | Built-in study timer with session logging and duration constraints (1–1440 min, DB-enforced) |
| **Assessments** | Auto-generated quizzes on topic content, tracked in progress stats |
| **Command Center** | Keyboard-first global command palette for instant navigation across the entire platform |
| **Progress Dashboard** | XP system, streak tracking, GitHub-style activity heatmap, and rolling quiz averages |
| **Email Notifications** | Automated emails: daily motivation, streak warnings, 3-day inactivity nudge, weekly progress recap, interview summary |

---

## 2. Core Engines & Mechanics

### 2.1 Spaced Repetition — SM-2 Algorithm

The `Flashcard` model implements a faithful SM-2 adaptation:

```
new_interval = old_interval × ease_factor   (if score >= 3)
new_interval = 1                            (if score < 3, card resets)
ease_factor  = ease_factor + (0.1 - (5-score) × (0.08 + (5-score) × 0.02))
```

**Key fields on `Flashcard`:**
- `ease_factor` — starts at 2.5, adjusts per answer quality (1–5 scale)
- `interval_days` — current review gap in days
- `next_review_date` — the date this card will surface again
- `repetitions` — how many successful reviews have occurred

The review queue endpoint returns only cards where `next_review_date <= today`, ordered by oldest-due-first. After each answer the client POSTs a quality score (1–5) and the backend recalculates + saves the new interval. A card you know well naturally disappears for weeks; a card you keep failing surfaces every day.

**Why SM-2 over newer algorithms (FSRS)?** SM-2 is deterministic, well-understood, and has 30 years of real-world validation. FSRS requires more data per card and is harder to debug — SM-2 is the right choice for v1.

### 2.2 AI Question Generation — Groq + llama-3.1-8b-instant

All AI calls go through the Groq API. The model is `llama-3.1-8b-instant` — chosen for sub-2s latency and free-tier accessibility while producing coherent technical content.

**Three interview question generation modes:**

**Mode 1 — From JD:** The JD text is trimmed to 3,000 chars, and the prompt instructs the model to extract implied technical requirements and generate behavioral + technical questions a real interviewer would ask for that role.

**Mode 2 — From Notes:** The user's `TopicNote` content (trimmed to 2,500 chars) is sent with a prompt grounding the questions strictly in what the user has written — questions reflect their actual knowledge base, not a generic syllabus.

**Mode 3 — Custom:** Free-form topic string, no context injection, pure topic-driven generation.

**Answer scoring:** Each submitted answer is re-evaluated by the LLM against the original question. The response JSON includes `score` (0–10), `feedback` (string), and `model_answer` (what a great answer looks like). These three fields drive the per-card breakdown in the interview summary email.

**Rate protection:** All AI views share `throttle_scope = 'ai_generation'` — 20 requests/hour. This prevents runaway Groq billing.

### 2.3 Career Gap Mapping — JD → Skill Matrix

When a user pastes a JD:

1. The full JD text + user's existing topic/flashcard state are sent to Groq
2. The model returns a structured `gap_report`: a list of skills each tagged `not_started`, `in_progress`, or `mastered`
3. Three backend helpers process this:
   - `_compute_match_pct(gap_report)` — `(mastered + in_progress×0.5) / total × 100`
   - `_estimate_jd_weeks(gap_report)` — `(not_started×3h + in_progress×1.5h) / (hours_per_day × 7)`
   - The top 5 `not_started` skills become the `action_items` array with direct `topic_slug` links

The result is stored in the `JDMapping` model and returned on GET for history. The frontend renders a `ScoreRing` SVG, a `SkillMatrix` (3 columns), an `ActionPlan` (numbered study links), and a `WeeksBadge`.

### 2.4 Resume Analysis — PDF → Score → Cross-Map

`ResumeAnalysisView` uses `PyPDF2` to extract text from the uploaded PDF. Two AI calls fire:

1. **`_score_resume_quality(text)`** — asks Groq to rate resume quality 0–100 and return 3 specific improvement tips
2. The same gap-report pipeline as JD mapping runs, using the resume's extracted skills as the "current state" input

This gives users a career-readiness double view: how strong is your resume *as a document*, and how well does it actually map to what the job needs.

### 2.5 GitHub Portfolio Scanner

Uses GitHub OAuth (token stored encrypted with Fernet) to list user repos, fetch `README.md` and `package.json`/`requirements.txt` per repo, and send the combined text to Groq for stack detection + project summary generation. The `FERNET_KEY` environment variable holds the AES-128-CBC key used by `cryptography.fernet.Fernet` to encrypt/decrypt the access token before DB storage.

### 2.6 Notification System — 4 Scheduled Jobs

| Job | Schedule | Trigger | Email type |
|---|---|---|---|
| `send_daily_emails` | 08:00 daily | All active users | Morning motivation briefing |
| `send_streak_warnings` | 20:00 daily | Users at risk of losing streak | Streak alert |
| `send_inactive_nudge` | 10:00 daily | Users absent exactly N days (default 3) | Re-engagement nudge |
| `send_weekly_summary` | 09:00 Sunday | All users with any activity this week | XP recap + due cards |

The inactive nudge logic is precise: it checks that the user *was* active on `(today - N days)` AND has *not* been active since. This avoids double-nudging users who returned on day 2 of their gap.

After every completed mock interview, `send_interview_summary()` fires synchronously (wrapped in `try/except` so a mail failure never crashes the response).

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Browser                             │
│   React 19 + TypeScript + TanStack Router (file-based routing)      │
│   TanStack Query v5 (server state) · Tailwind CSS v4 · Radix UI     │
│   Recharts · XYFlow (roadmap graph) · Web Speech API (voice input)  │
└────────────────────────┬────────────────────────────────────────────┘
                         │ HTTPS / REST JSON
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Nginx (reverse proxy)                         │
│   Static SPA assets served directly · /api/* proxied to Django      │
│   HSTS · gzip · rate-limit at infra level                           │
└───────────┬─────────────────────────────────┬───────────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────┐       ┌─────────────────────────────────────┐
│  Django 5 + DRF       │       │  Groq API (external)                │
│  Gunicorn 3w × 4t     │──────▶│  llama-3.1-8b-instant               │
│  JWT SimpleJWT        │       │  Question gen · Answer scoring       │
│  Custom throttling    │       │  Skill extraction · Resume scoring   │
│  OTP auth · OAuth     │       └─────────────────────────────────────┘
└───┬───────────┬───────┘
    │           │
    ▼           ▼
┌──────────┐  ┌─────────────────────────────────────────────────────┐
│  MySQL   │  │  Redis (django-redis)                               │
│  8.0     │  │  Cache backend · JWT token blacklist (rotation)     │
│  InnoDB  │  │  Session storage · throttle counters                │
└──────────┘  └─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Scheduler Container (same Dockerfile, different entrypoint)        │
│  cron -f · loads /etc/cron.d/growthos from /app/crontab            │
│  4 Django management commands run on UTC schedule                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 Frontend Architecture

**File-based routing** via `@tanstack/react-router` — route files in `src/routes/` are auto-discovered and `routeTree.gen.ts` is generated by the Vite plugin. No manual route registration.

**Server state management** via TanStack Query v5:
- `staleTime` set per-query based on how stale data can be (notifications: 10s, user profile: 60s)
- `refetchInterval` for polling (notifications: 15s)
- `invalidateQueries` after mutations to refresh stale caches

**Component layers:**
- `__root.tsx` — Layout shell, auth guard, sidebar, top header, Toaster
- `src/components/` — Shared: `growth-sidebar.tsx`, `top-header.tsx`, `search-modal.tsx`, `pomodoro-timer.tsx`, `floating-chat.tsx`, `onboarding-modal.tsx`, `study-room.tsx`, `tutorial-overlay.tsx`
- `src/routes/` — 20+ page-level components (one per route)

### 3.2 Backend Architecture

**Django app structure:** Single `core` app contains all models, views, serializers, URLs, emails, and management commands. Deliberate monolith — avoids premature service boundaries for a v1 project.

**URL namespacing:** All API endpoints under `/api/` prefix. Grouped:
- `/api/auth/` — login, register, OTP, JWT refresh, OAuth
- `/api/topics/`, `/api/paths/`, `/api/roadmaps/` — learning content
- `/api/flashcards/`, `/api/review/` — spaced repetition
- `/api/interview/` — mock interview, scoring, notes-topics
- `/api/career/` — JD mapping, resume analysis
- `/api/github/` — repo scan, portfolio
- `/api/search/` — global search with `?limit=` param (max 50)
- `/api/notifications/`, `/api/progress/` — activity tracking

### 3.3 Data Models (Key)

| Model | Purpose | Key Fields |
|---|---|---|
| `User` | Django built-in + email verified flag | `is_email_verified`, `otp`, `otp_created_at` |
| `UserProfile` | XP, streak, preferences | `xp`, `streak`, `last_active_date`, `github_token_encrypted` |
| `LearningPath` | A roadmap (e.g., "Backend Engineer") | `title`, `slug`, `topics[]` |
| `Topic` | A single concept node | `title`, `slug`, `path`, `order`, `status` |
| `TopicNote` | Freeform user notes per topic | `content`, `updated_at` |
| `Flashcard` | SM-2 card | `front`, `back`, `ease_factor`, `interval_days`, `next_review_date`, `repetitions` |
| `MockInterview` | Interview session | `job_title`, `questions[]`, `overall_score`, `readiness_pct` |
| `MockInterviewAnswer` | Per-question answer | `question`, `answer`, `score`, `feedback`, `model_answer` |
| `JDMapping` | JD analysis result | `jd_text`, `gap_report`, `match_pct`, `weeks_to_ready`, `action_items` |
| `ResumeAnalysis` | Resume scan result | `extracted_text`, `resume_score`, `resume_tips`, `match_pct` |
| `PomodoroSession` | Completed timer session | `duration_minutes`, `completed_at` (constrained: 1–1440 min) |
| `Notification` | In-app alert | `type`, `message`, `is_read`, `created_at` |

---

## 4. Security, Auth & Hardening

### 4.1 Authentication Flow

```
┌──────────┐   POST /api/auth/register/     ┌──────────────┐
│  Client  │ ───────────────────────────▶   │   Django     │
│          │   { email, password, name }     │              │
│          │ ◀───────────────────────────   │  Creates     │
│          │   { message: "OTP sent" }       │  User +      │
│          │                                 │  sends OTP   │
│          │   POST /api/auth/verify-otp/    │  via email   │
│          │ ───────────────────────────▶   │              │
│          │   { email, otp }                │  Validates   │
│          │ ◀───────────────────────────   │  OTP (5min   │
│          │   { access, refresh }           │  expiry)     │
└──────────┘                                 └──────────────┘
```

**OTP generation:** `secrets.choice(string.digits)` — cryptographically secure PRNG, not `random.randint()`. OTPs are 6 digits, expire after 5 minutes, and are single-use (cleared after verification).

**JWT tokens:**
- Access token: 15-minute lifetime
- Refresh token: 30-day lifetime
- Rotation enabled: every refresh call issues a new refresh token
- Blacklist enabled: old refresh tokens are invalidated after rotation (stored in Redis)

**OAuth flows:**
- Google: `@react-oauth/google` on frontend, token verified server-side with Google's tokeninfo endpoint
- GitHub: Authorization Code flow, `code` exchanged for access token, token Fernet-encrypted before DB storage

### 4.2 Rate Throttling

```python
DEFAULT_THROTTLE_RATES = {
    'anon':          '600/hour',
    'user':          '10000/hour',
    'login':         '5/minute',     # SendOTPView, VerifyOTPView
    'ai_generation': '20/hour',      # All Groq API views
    'search':        '100/minute',
}
```

Views protected by `ai_generation` scope: `GeneratePathView`, `ChatAssistantView`, `GenerateFlashcardsView`, `ProjectIdeasView`, `TopicFeynmanView`, `ScanRepoView`, `ResumeAnalysisView`, `MockInterviewView` (8 views total).

### 4.3 Production Security Headers

```python
SECURE_HSTS_SECONDS = 31536000          # 1 year HSTS
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True
```

### 4.4 CORS

`CORS_ALLOWED_ORIGINS` is an environment variable — no wildcard in production. Defaults to `https://growth-os.tech,https://www.growth-os.tech`. API responses include `Vary: Origin` for correct caching behavior.

### 4.5 Database-Level Constraints

The `PomodoroSession` model has a `CheckConstraint` enforced at MySQL level:

```python
constraints = [
    models.CheckConstraint(
        check=Q(duration_minutes__gte=1) & Q(duration_minutes__lte=1440),
        name='pomosession_duration_range',
    )
]
```

Even if the app layer is bypassed (direct DB insert), the constraint holds.

### 4.6 Encryption at Rest

GitHub OAuth access tokens are never stored in plaintext. Before INSERT:
```python
f = Fernet(settings.FERNET_KEY.encode())
encrypted = f.encrypt(token.encode()).decode()
```

Fernet uses AES-128-CBC with PKCS7 padding + HMAC-SHA256 for authentication. The key must be URL-safe base64 encoded and exactly 32 bytes decoded.

### 4.7 Input Validation

- Search `?limit=` param: `min(int(request.query_params.get('limit', 10)), 50)` — server-enforced cap
- Note content for interview generation: minimum 50 characters enforced before Groq call
- All serializers validate required fields; DRF returns 400 with field-level errors on bad input
- PDF text extraction validated for minimum content before resume scoring

---

## 5. UI/UX & Design Philosophy

### 5.1 Dark Forge Design System

GrowthOS uses a custom design system called **Dark Forge** — a minimal, high-contrast palette optimized for long study sessions:

| Token | Value | Usage |
|---|---|---|
| Background | `#030303` | Page background — near-black, not pure black |
| Card surface | `#0a0a0a` / `#111111` | All card/panel backgrounds |
| Accent | `#00FF66` | Interactive highlights, rings, CTAs, active states |
| Text primary | `#ffffff` | Headings, labels |
| Text muted | `#888888` | Secondary text, descriptions |
| Border | `rgba(255,255,255,0.08)` | Subtle card borders |
| Danger | `#ef4444` | Errors, streak warnings |
| Warning | `#f59e0b` | Amber tips, moderate scores |

No purple. No heavy gradients. Every email template uses the same palette — `#00FF66` border on header, black-text-on-green CTA buttons, stat numbers in green.

### 5.2 Key UI Patterns

**Score Rings:** SVG `circle` with `stroke-dasharray` + `stroke-dashoffset` animated via CSS. Used in Career Intel (match %), Resume (quality score), and Interview result. Color thresholds: green ≥70, amber ≥40, red <40.

**Skill Matrix:** 3-column responsive grid (Mastered / In Progress / Gap). Each item has a "Study →" button that navigates directly to `/topic/${slug}`. Zero friction from insight to action.

**Tab-strip History:** JD history shown as horizontal pills at the top of the Career panel — click any pill to restore that analysis instantly without a round trip (data already in cache from the list query).

**Voice Input:** Browser-native `SpeechRecognition` / `webkitSpeechRecognition` API. Runs entirely client-side — no audio leaves the browser, no backend involvement. `continuous: true` + `interimResults: true` streams live transcription into the answer textarea. A pulsing red dot signals active recording.

**Command Center:** `cmdk`-powered global search palette (`Cmd+K` / `Ctrl+K`). Searches topics, paths, roadmaps, and navigates instantly. Results hit `GET /api/search/?q=...&limit=10`.

**Onboarding Modal:** Multi-step first-run flow using `driver.js` for spotlight-style tooltips walking new users through the sidebar sections.

**Pomodoro Timer:** Floating persistent widget — survives page navigation. Sessions auto-log to the backend on completion with duration, topic context, and timestamp.

### 5.3 Frontend Routing

TanStack Router with file-based routing — route file name maps 1:1 to URL:

```
src/routes/
├── index.tsx               → /
├── dashboard.tsx           → /dashboard
├── topic.$topicId.tsx      → /topic/:topicId
├── career.tsx              → /career
├── interview.tsx           → /interview
├── paths.create.tsx        → /paths/create
├── portfolio.$username.tsx → /portfolio/:username
└── admin.dashboard.tsx     → /admin/dashboard
```

`routeTree.gen.ts` is auto-generated by the Vite plugin on every `dev` or `build` — never edit it manually.

---

## 6. Deployment & Infrastructure

### 6.1 Container Architecture

Five Docker containers defined in `docker-compose.production.yml`:

```
┌─────────────────┐  ┌──────────────────────┐
│   growthos_db   │  │   growthos_redis      │
│   MySQL 8.0     │  │   Redis 7 Alpine      │
│   Persistent    │  │   Cache + blacklist   │
│   volume        │  └──────────────────────┘
└────────┬────────┘           │
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────────┐
│             growthos_backend                │
│   Python 3.12 slim · Gunicorn 3w×4t        │
│   Runs: migrate → collectstatic → serve    │
│   Port: 127.0.0.1:8005 (local-only)        │
│   Volumes: static_volume, media_volume     │
└──────────────┬──────────────────────────────┘
               │
               ├── (same image, different entrypoint)
               ▼
┌─────────────────────────────────────────────┐
│            growthos_scheduler               │
│   entrypoint: []                           │
│   Copies /app/crontab → /etc/cron.d/       │
│   Runs: cron -f (foreground)               │
│   4 jobs: daily/streak/nudge/weekly        │
└─────────────────────────────────────────────┘
               │
               ├── (depends_on: backend)
               ▼
┌─────────────────────────────────────────────┐
│            growthos_frontend                │
│   Nginx Alpine · Serves built SPA          │
│   Port: 127.0.0.1:3005 (local-only)        │
│   Build args: VITE_API_BASE_URL baked in   │
└─────────────────────────────────────────────┘
```

**Entrypoint pattern:** `entrypoint.sh` runs as root, fixes volume mount ownership, then drops privileges to `appuser` using `su-exec`. This solves the "static files owned by root" problem common in Docker + volume setups.

**Gunicorn config:** `--workers 3 --threads 4 --worker-class gthread` = 12 concurrent request slots. `--max-requests 1000 --max-requests-jitter 100` recycles workers to prevent memory leaks.

### 6.2 Nginx Reverse Proxy (Host Level)

Nginx on the VPS host (not containerized) handles:
- TLS termination (Let's Encrypt via Certbot)
- Proxying `api.growth-os.tech` → `127.0.0.1:8005`
- Proxying `growth-os.tech` → `127.0.0.1:3005`
- HSTS headers, gzip compression

### 6.3 Environment Variables

All secrets live in `.env.prod` on the VPS — never committed to git. See `.env.prod.example` for the full template.

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret — `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `MYSQL_PASSWORD` | App user DB password |
| `MYSQL_ROOT_PASSWORD` | MySQL root password |
| `GROQ_API_KEY` | Groq API key for all AI features |
| `FERNET_KEY` | AES key — `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email credentials (Gmail App Password recommended) |
| `GOOGLE_CLIENT_ID/SECRET` | Google OAuth credentials |
| `GITHUB_CLIENT_ID/SECRET` | GitHub OAuth credentials |
| `VITE_GOOGLE_CLIENT_ID` | Public Google client ID baked into frontend SPA at build time |
| `VITE_GITHUB_CLIENT_ID` | Public GitHub client ID baked into frontend SPA at build time |

### 6.4 Cron Schedule (UTC)

```
0 8  * * *  send_daily_emails       # 08:00 UTC daily — motivation briefing
0 20 * * *  send_streak_warnings    # 20:00 UTC daily — streak at risk
0 10 * * *  send_inactive_nudge     # 10:00 UTC daily — 3-day inactive users
0 9  * * 0  send_weekly_summary     # 09:00 UTC Sunday — weekly XP recap
```

### 6.5 Deploy Commands

```bash
# First-time deploy
git clone https://github.com/anxmeshhh/GrowthOS.git && cd GrowthOS
cp .env.prod.example .env.prod   # fill in all values
docker compose --env-file .env.prod -f docker-compose.production.yml up -d --build

# Re-deploy after code changes
git pull origin main
docker compose --env-file .env.prod -f docker-compose.production.yml up -d --build --no-deps backend scheduler frontend

# Health checks
docker compose -f docker-compose.production.yml ps
docker exec growthos_backend python manage.py migrate --check
docker logs growthos_backend --tail 50
docker logs growthos_scheduler --tail 20

# DB backup
docker exec growthos_db mysqldump -u root -p growthos_prod > backup_$(date +%Y%m%d).sql
```

---

## 7. Local Setup & Developer Onboarding

### Prerequisites

- Python 3.12+
- Node.js 20+
- MySQL 8.0
- Redis 7

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # edit with your local MySQL/Redis creds
python manage.py migrate
python manage.py seed_json_roadmaps   # load sample roadmap data
python manage.py runserver
# API at http://localhost:8000/api/
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App at http://localhost:5173/
```

### Local `.env` for Backend

```env
DEBUG=True
SECRET_KEY=any-random-string-for-local
MYSQL_DATABASE=growthos_dev
MYSQL_USER=root
MYSQL_PASSWORD=your_local_mysql_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
GROQ_API_KEY=gsk_your_actual_key
FERNET_KEY=<output of Fernet.generate_key().decode()>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=GrowthOS <your@gmail.com>
REDIS_URL=redis://127.0.0.1:6379/1
```

### Key Management Commands

```bash
python manage.py send_daily_emails
python manage.py send_streak_warnings
python manage.py send_inactive_nudge --days 3
python manage.py send_weekly_summary
python manage.py analyze_pdfs          # import PDF roadmaps (needs GEMINI_API_KEY)
python manage.py seed_db               # seed demo database
```

### Project Structure

```
GrowthOS/
├── backend/
│   ├── config/              # Django project: settings, WSGI, ASGI, root URLs
│   ├── core/                # Main app — all models, views, URLs, emails
│   │   ├── models.py        # 25+ data models
│   │   ├── views.py         # 50+ API views
│   │   ├── urls.py          # URL routing
│   │   ├── serializers.py   # DRF serializers
│   │   ├── emails.py        # HTML email templates + send functions
│   │   ├── admin.py         # Django admin
│   │   ├── migrations/      # 36 migrations
│   │   └── management/
│   │       └── commands/    # 10 custom management commands
│   ├── crontab              # Cron schedule (loaded by scheduler container)
│   ├── entrypoint.sh        # Docker entrypoint (root → appuser drop)
│   ├── Dockerfile.prod      # Production image
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── routes/          # 20+ page components (file-based routing)
│   │   ├── components/      # Shared UI components
│   │   ├── routeTree.gen.ts # Auto-generated by Vite plugin — never edit
│   │   └── main.tsx
│   ├── Dockerfile.prod      # Nginx + built SPA
│   └── package.json
├── docker-compose.production.yml
├── .env.prod.example
└── README.md
```

### Adding New Features

**New API endpoint:**
1. Add/update model in `core/models.py`
2. `python manage.py makemigrations && python manage.py migrate`
3. Create view in `core/views.py` with appropriate `throttle_scope`
4. Add URL in `core/urls.py`
5. Add serializer in `core/serializers.py`

**New frontend route:**
1. Create `src/routes/your-route.tsx`
2. `npm run dev` — Vite plugin auto-regenerates `routeTree.gen.ts`
3. Add sidebar link in `src/components/growth-sidebar.tsx`

**New scheduled job:**
1. Create `core/management/commands/your_command.py`
2. Add cron line to `backend/crontab`
3. Add email function to `core/emails.py` if needed

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + TypeScript |
| Routing | TanStack Router (file-based) |
| Server state | TanStack Query v5 |
| Build tool | Vite 7 |
| UI components | Radix UI + custom Dark Forge tokens |
| Styling | Tailwind CSS v4 |
| Data visualization | Recharts, XYFlow, react-activity-calendar |
| Backend framework | Django 5 + Django REST Framework |
| WSGI server | Gunicorn (gthread worker) |
| Database | MySQL 8.0 (InnoDB) |
| Cache / blacklist | Redis 7 |
| AI / LLM | Groq API (llama-3.1-8b-instant) |
| Auth | JWT (SimpleJWT) + Google OAuth + GitHub OAuth + OTP |
| Encryption | cryptography (Fernet / AES-128-CBC) |
| PDF parsing | PyPDF2 |
| Email | SMTP (Gmail App Password) |
| Containerization | Docker + Docker Compose |
| Web server | Nginx (host) + Nginx Alpine (frontend container) |
| Voice input | Web Speech API (browser-native) |
| Spaced repetition | SM-2 algorithm (custom implementation) |

---

*Built by Animesh — a full-stack educational operating system for deliberate developers.*
