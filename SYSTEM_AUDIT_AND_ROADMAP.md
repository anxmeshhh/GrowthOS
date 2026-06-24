# GrowthOS — Audit & Extension Report

> A full-system audit (security, correctness, data integrity, frontend) plus concrete design
> proposals for new AI features, a JD-screening roadmap module, beginner-to-expert skill tiers,
> and a webcam "Air Draw" notes component. Every finding cites real file paths and line numbers.

A note on the AI stack first, because it reframes everything below: **the entire runtime AI layer is
Groq `llama-3.1-8b-instant`** — 8 copy-pasted client instantiations in `backend/core/views.py`
(lines 435, 494, 722, 790, 889, 948, 1009, 2853). Gemini survives only in one offline admin command
(`backend/core/management/commands/import_roadmaps.py:85`, `gemini-2.5-flash` vision for PDF→roadmap).
NVIDIA is fully dead — `migrate_to_groq.py` rewrote it all to Groq — yet `NVIDIA_API_KEY` is still
shipped in `.env.prod` and `openai`/`google-generativeai` are still in `requirements.txt`. So
"Groq + Gemini + NVIDIA" is really "Groq for everything, Gemini for one batch job, NVIDIA gone."

---

## 1. Full System Audit (severity-ranked)

### 🔴 CRITICAL

**C1 — Live secrets committed to the repo.** `backend/.env.prod` is git-tracked and contains real
`FERNET_KEY`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`, `GROQ_API_KEY`,
`NVIDIA_API_KEY`. The `FERNET_KEY` is the master key that decrypts every stored GitHub OAuth token in
the DB.
*Fix:* rotate **all** of these now (they must be considered burned), `git rm --cached backend/.env.prod`,
purge from history (`git filter-repo`), confirm `.gitignore`'s `.env.*` actually covers it (it was
committed before the rule, so it stays tracked until removed).

**C2 — Full production DB dump committed.** `growthos_backup.sql` (291 KB) + `growthos_backup_utf8.sql`
leak `auth_user` rows with **pbkdf2 password hashes**, user emails, OTP codes (`core_otpverification`),
chat history, and **Fernet-encrypted GitHub tokens** (`gAAAA…`). Combined with C1's leaked `FERNET_KEY`,
those tokens are decryptable.
*Fix:* `git rm --cached` both, purge from history, force every user to reset password, revoke all
GitHub grants.

**C3 — DRF default permission is `AllowAny`.** `backend/config/settings.py:137-151` sets auth classes
and throttles but **no `DEFAULT_PERMISSION_CLASSES`**. Every view that omits `permission_classes` is
fully public.
*Fix:* add `'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated']`.

**C4 — `LearningPathViewSet` has no `permission_classes` (`views.py:297`).** Because of C3, an
**unauthenticated** caller can `POST/PUT/DELETE /paths/…` — create, edit, or delete any official
roadmap. No ownership check on `update`/`destroy`.
*Fix:* `permission_classes=[IsAuthenticated]`; override `update/destroy` to require
`created_by == request.user`, gate official (non-custom) path mutation behind `IsAdminUser`.

**C5 — Hardcoded `SECRET_KEY` + DB password in source.** `settings.py:13` ships a literal
`django-insecure-…` key; `settings.py:70` defaults `MYSQL_PASSWORD` to `"theanimesh2005"`;
`ALLOWED_HOSTS` defaults to include `*` (line 17) and `DEBUG` defaults `True` (line 15).
*Fix:* read `SECRET_KEY` from env with no insecure default, drop the `*` host and the password
default, force `DEBUG=False` in prod.

### 🟠 HIGH

**H1 — Google login trusts an unverified access token (`views.py:83-137`).** It calls the userinfo
endpoint with a client-supplied bearer token and never checks `aud`/`email_verified`. Any Google
access token minted for *any other app* can be replayed to log in as that email → **account takeover**.
*Fix:* require a Google **ID token** and `id_token.verify_oauth2_token(token, Request(), CLIENT_ID)`,
assert `aud`, `iss`, `email_verified`.

**H2 — GitHub login links accounts by email without checking `verified` (`views.py:139-225`).** Same
takeover class against existing email/password accounts.
*Fix:* require `email['verified'] is True` before linking.

**H3 — XP/verification is forgeable.**
- `SubmitQuizView` (`views.py:1188`) takes `score`/`total` straight from the client — `POST {"score":100}`
  passes any quiz. Grade server-side against stored `TopicQuiz.questions`.
- `_resolve_topic` (`views.py:378`) does `Topic.objects.get(pk=…)` with **no path-ownership/visibility
  check**, so any topic ID (incl. another user's private path) can be quizzed/progressed → private-content
  leak + XP farming.
- `PomodoroView` (`views.py:611`) awards XP equal to client-supplied `duration_minutes` — uncapped minting.
- `ScanRepoView` (`views.py:1022`) and `VerifyMaterialView` (`views.py:495`) feed attacker-controlled
  README / PDF text to the model with no injection defense; a crafted file saying "return score:100"
  auto-creates a `VerifiedProject`.

*Fix:* server-side grading; ownership gate in `_resolve_topic`; cap pomodoro XP; treat AI verification
as advisory and clamp/sanity-check returned scores.

**H4 — JWTs in `localStorage` + 7-day access tokens, no blacklist.** `frontend/src/lib/api-client.ts:3-15`
stores access+refresh in `localStorage` (XSS-exfiltratable); `settings.py:154-160` sets a **7-day access
token** with `BLACKLIST_AFTER_ROTATION=False` (rotated refresh tokens stay valid). A stolen token is good
for a week with no revocation.
*Fix:* shorten access token to ~15 min, enable blacklist + `rest_framework_simplejwt.token_blacklist`,
move refresh token to an httpOnly cookie.

**H5 — Admin routes have no server-trust boundary on the client and a spoofable super-admin gate.**
Frontend admin routes (`admin.dashboard.tsx`, `admin.roadmap.tsx`) have **no `beforeLoad` guard** — they
render for anyone and rely on the API 403'ing. The "super admin" actions (`views.py:2160, 2196`) gate on
a hardcoded `email=='guptaanimesh020@gmail.com'`/`username=='theanimesh2005'`, and
`AdminUserDetailView.patch` (`views.py:2126`) lets any staff set `is_staff` on anyone (self-promotion).
*Fix:* gate on `request.user.is_superuser`; add `beforeLoad` redirect; forbid privilege changes by
non-superusers.

### 🟡 MEDIUM

- **M1 — Zero DB indexes/constraints.** Across `models.py` and all **29 migrations** there is not one
  `db_index`, composite `indexes=[]`, `CheckConstraint`, or `UniqueConstraint`. Hot query patterns —
  `Contribution(user, action_type, created_at__date)`, `TopicProgress(user, status)` — do full scans.
  *Fix:* add `Meta.indexes` for those tuples; `CheckConstraint` for score ∈ [0,100].
- **M2 — `TopicProgress` lacks `unique_together('user','topic')`.** Every other per-user model has it;
  this one doesn't, and progress is created via `get_or_create` in N+1 loops → concurrent requests create
  duplicate progress rows. *Fix:* add the constraint (after de-duping existing rows).
- **M3 — XP race conditions.** "`exists()` then `create()`" everywhere (`DailyLoginView:637`,
  `award_topic_completion_xp` in `helpers.py:4`, `ReviveStreakView:1877`, `SubmitQuizView:1209`) with no
  `transaction.atomic`/`select_for_update` → double-award under concurrency. *Fix:* wrap in atomic +
  unique constraints on award `action_type`.
- **M4 — N+1 queries.** `AdminUserListView:1990` runs one `Sum` aggregate per user; `UserProfileView:1230`
  walks the streak day-by-day (one query/day) and runs `compute_topic_mastery` (~4 queries) per completed
  topic; `ExploreRoadmapsView`, `TodayBriefingView`, `PathProgressView` all loop without
  `prefetch_related`. *Fix:* annotate/aggregate in one query, `select_related('topic')`,
  `prefetch_related('topics')`.
- **M5 — `str(e)` returned to clients across ~15 views** (`GoogleLoginView:137`, `GeneratePathView:471`,
  etc.) leaks stack/library internals. *Fix:* log server-side, return generic messages.
- **M6 — `TopicMaterialUploadView` (`views.py:403`) does no file-type/size validation** (other upload
  views do). Stored then parsed by PyPDF2. *Fix:* mirror the extension/size checks from `NoteDocumentView`.
- **M7 — `requests` calls in OAuth/GitHub flows have no `timeout`** (`views.py:93,153,170,178,240,257`)
  → worker-hang DoS. *Fix:* add `timeout=10`.
- **M8 — OTP uses non-crypto `random` (`models.py:40`) with no per-email attempt limit.** *Fix:*
  `secrets.randbelow`, add attempt counter + lockout.

### 🟢 FRONTEND CORRECTNESS (Medium/Low)

- **F1 — Stale-cache bugs (same class as the recently-fixed custom-paths one):** `["today"]` (read in
  `dashboard.tsx:168`, `growth-sidebar.tsx:61`) is **never invalidated** by topic-complete / quiz /
  feynman / pomodoro / revive mutations → stale streak & "study today" panel. Topic-page flashcard rating
  (`topic.$topicId.tsx:1242`) doesn't invalidate `["global_review"]`. Topic-page note/doc/screenshot saves
  don't invalidate `["all-notes"]/["all-note-documents"]/["all-screenshots"]`. And a **typo'd key**:
  `["github-repos"]` (`topic.$topicId.tsx:160`) vs `["github_repos"]` (`settings.tsx:123`,
  `projects.tsx:29`) are two separate caches for one endpoint.
- **F2 — Crash-on-undefined:** `profile.tsx:188-213` reads `profile.streak` etc. with only a loading guard
  (error → `profile=undefined` → crash); `admin.dashboard.tsx:90` `u.username.toLowerCase()` unguarded;
  `review.tsx:56` destructures `isLoading` but not `isError`, so a **failed** load shows the celebratory
  "queue cleared!" screen.
- **F3 — Hardcoded `localhost:8000`** in `admin.login.tsx:25` and `portfolio.$username.tsx:10` → breaks in
  production.

### 🧹 DEAD CODE / CRUFT (to delete)

Root: `debug_500.py`, `patch.py`, `migrate_to_groq.py`,
`backend/test_{all_users,full_flow,jwt,mastery,profile,views}.py`, `test_views.out`, `verify_endpoints.py`,
`backend_full.txt`, `build_output.txt`, `all_pdfs.txt`, `extra_pdfs.txt`, `pdf_extract.txt`, `image*.png`
(4 screenshots in repo root), `db.sqlite3`. Frontend: `brighten_text.py`, `bump_styles.py`, `rewrite.py`
(all hardcode `c:\Users\Animesh\…`), `build_output.txt`, `.lovable/`, `src/lib/api/example.functions.ts`,
and duplicate builders `roadmap/CustomPathBuilder.tsx` vs `custom-paths/PathBuilder.tsx`. Requirements:
drop `openai` and reconsider `google-generativeai` (gate it as an offline-only tool).

---

## 2. Where to Add AI — concrete features → provider/model

The current AI is all on the **8B instant** model — great for cheap/fast generation, too weak for
reasoning. The right move is a small provider abstraction (`core/ai/service.py`) with **three tiers**,
then map features onto them:

| Feature | Where it hooks | Provider / model | Why |
|---|---|---|---|
| **"What to study today" engine** (upgrade `TodayBriefingView:3013`) | Already aggregates due cards + fading topics; add an LLM ranker over `compute_topic_mastery` + decay + streak | **Groq `llama-3.3-70b-versatile`** | Needs reasoning over many signals; 70B not 8B. Cheap on Groq. |
| **AI flashcards from screenshots** (extend `TopicScreenshot` + `GenerateFlashcardsView:885`) | OCR/understand the uploaded `screenshots/` image → cards | **Gemini 2.5 Flash (vision)** — already wired in `import_roadmaps.py` | Only multimodal model in the stack; Groq has no vision. |
| **AI code review on `VerifiedProject`** (replace the injectable `ScanRepoView:971`) | Pull repo via GitHub API, send diffs/structure | **Groq `llama-3.3-70b-versatile`**, optionally **Gemini 2.5 Pro** for large repos | Code reasoning needs the big model; 8B will hallucinate pass/fail. |
| **GitHub-commit → progress mapping** | New job over `UserProfile.github_access_token`; classify commits → Topic | **Groq 70B** (text classification) | Map commit messages/files to your `Topic` taxonomy. |
| **Chatbot tutor** (upgrade `ChatAssistantView:715`) | Already exists on 8B; add retrieval over the user's notes/topics | Keep **Groq 8B** for latency; escalate hard turns to **70B** | Chat is latency-sensitive; tiered. |
| **Burnout / streak-risk prediction** | New endpoint over `Contribution` + `PomodoroSession` + streak gaps | **No LLM** — a logistic/heuristic model; Groq 8B only to phrase the nudge | This is tabular ML, not generation. |
| **JD parsing (Part 4)** | New `parse_jd` | **Groq `llama-3.3-70b-versatile`** | Structured extraction + timeline reasoning. |

Rule of thumb to encode: **Groq 8B** = fast/cheap generation (quiz, cards, chat); **Groq 70B** =
reasoning (JD parse, code review, study planner); **Gemini 2.5 Flash/Pro** = anything with an image or
very long context.

---

## 3. Prioritized Change List

**DO NOW — security/correctness (≈4–6 days):**
1. Rotate + purge all secrets (C1, C2); remove tracked `.env.prod`/SQL dumps from history. *(1d, urgent)*
2. Add `DEFAULT_PERMISSION_CLASSES` + lock `LearningPathViewSet` (C3, C4); env-only `SECRET_KEY`, drop DB-password default & `*` host, `DEBUG=False` (C5). *(1d)*
3. Verify Google/GitHub tokens properly (H1, H2). *(1d)*
4. Server-side quiz grading + `_resolve_topic` ownership gate + pomodoro XP cap + AI-score clamping (H3). *(1–2d)*
5. Short-lived access tokens + blacklist + httpOnly refresh; `beforeLoad` admin guard; `is_superuser` gate (H4, H5). *(1d)*

**DO NEXT — cleanup/integrity (≈3–4 days):**
6. Add indexes + `CheckConstraint`s + `TopicProgress` unique_together (M1, M2); wrap XP awards in atomic (M3). *(1d)*
7. Kill N+1s in admin/profile/today (M4). *(1d)*
8. Frontend: fix `["today"]`/`["global_review"]`/`all-*` invalidation + the `github-repos` typo (F1); guard undefined crashes & `review.tsx` false-success (F2); env-driven base URL (F3). *(1d)*
9. Delete all cruft files; drop dead `openai`/NVIDIA config; extract `core/ai/service.py` to replace the 8 duplicated Groq clients. *(0.5–1d)*

**DO FOR DIFFERENTIATION — AI features (impact ÷ effort):**

| Feature | Impact | Effort | Verdict |
|---|---|---|---|
| Smart "study today" planner (70B over existing signals) | High | 2–3d | **Build first** — reuses `TodayBriefingView`, biggest daily-retention lever |
| JD-screening roadmap (Part 4) | Very High | 5–7d | **Flagship differentiator** |
| Screenshot→flashcards (Gemini vision) | Med-High | 2–3d | Quick win, model already wired |
| Real AI code review on projects (70B) | High | 3–4d | Replaces the exploitable `ScanRepoView` *and* adds value |
| Beginner→expert tiers + diagnostic (Part 5) | Very High | 4–5d | Expands TAM; mostly additive schema |
| Air Draw (Part 6) | Med (wow-factor) | 4–6d | Demo/marketing value, lower retention impact |
| Burnout prediction | Med | 2d | Cheap, no LLM cost |

---

## 4. JD-Screening Roadmap Feature

**Data model** (new models, all additive):

```python
class JobApplication(models.Model):
    user = FK(User, related_name='applications')
    raw_jd = TextField()                       # pasted JD
    company = CharField(...); role = CharField(...)
    seniority = CharField(...)                 # intern/junior/mid/senior
    parsed = JSONField(default=dict)           # {stack, must_have, nice_to_have, domain}
    timeline_days = IntegerField(default=21)   # AI-estimated hiring cycle
    # The roadmap itself is a synthetic LearningPath so ALL existing infra works:
    generated_path = FK('LearningPath', null=True, on_delete=SET_NULL)
    created_at = DateTimeField(auto_now_add=True)

class ScreeningRound(models.Model):
    application = FK(JobApplication, related_name='rounds')
    kind = CharField(choices=[('oa_dsa','OA/DSA'),('project_design','Project/System Design'),
                              ('technical','Technical'),('hr','HR')])
    order = IntegerField()
    target_date = DateField()                  # timed against timeline_days
    status = CharField(default='upcoming')
    topics = M2M('Topic')                      # reuse Topic graph
    quiz = FK('TopicQuiz', null=True)          # reuse quiz infra

class ResumeGap(models.Model):
    application = FK(JobApplication, related_name='gaps')
    project = FK('VerifiedProject', null=True) # or contribution_ref
    is_weak = BooleanField(default=False)
    reason = TextField()                       # "JD wants Kafka; project has none"
    checkpoints = JSONField(default=list)      # deepening tasks -> become Topics
```

**Reuse of existing infra (the key design move):** generate the roadmap as a real
`LearningPath(is_custom=True, created_by=user, title="JD: {company} {role}")`. Each `ScreeningRound`
becomes a **milestone `Topic`** (`node_kind='milestone'`), and prep sub-topics hang off it. Then
**everything already built works for free**: `TopicProgress` tracks round completion,
`TopicQuiz`/`SubmitQuizView` give per-round mock OAs, `TopicFlashcard` for DSA patterns,
`TodayBriefingView` schedules it day-by-day, the heatmap counts it, and `compute_topic_mastery` measures
readiness. `target_date`s are derived by distributing `timeline_days` across rounds (OA→DSA early, HR last).

**AI calls (Groq 70B for reasoning):**
1. `parse_jd(raw_jd)` → JSON `{company, role, seniority, stack[], must_have[], nice_to_have[], domain,
   estimated_timeline_days, rounds:[{kind, focus, est_days}]}`.
2. `jd_to_topics(parsed)` → reuse the existing `GeneratePathView` prompt to turn the stack into the Topic
   graph with dependencies.
3. `resume_depth(parsed, user.verified_projects[ai_evaluation, ai_score, repo_name], contributions)` →
   per-project `{is_weak, reason, checkpoints[]}`. Each checkpoint becomes a deepening `Topic` linked back
   to the existing `VerifiedProject`, so "deepen this project against this JD's stack" is a trackable task.

**Endpoints:** `POST /applications/` (paste JD → parse + generate), `GET /applications/{id}/roadmap/`,
`GET /applications/{id}/resume-gaps/`.

---

## 5. Beginner-to-Expert Scaling (additive, no breaking changes)

The graph you need **already half-exists**: `Topic.dependencies` (M2M self, `models.py:126`) is the
prerequisite graph, and `TopicProgress.status` already has `locked/available/in_progress/completed`. Layer
tiers on top:

**Additive schema (one migration, all defaulted → no behavior change):**
```python
# Topic
difficulty = CharField(choices=BEGINNER/INTERMEDIATE/ADVANCED/EXPERT,
                       default='intermediate', db_index=True)
tier = IntegerField(default=1)             # ordinal within a path
# LearningPath
target_level = CharField(default='all')    # 'beginner'|'pro'|'all'
# TopicProgress
status choices += ('tested_out','Tested Out')   # additive choice
```

**Diagnostic placement test (skip known topics):** new `PlacementResult(user, path, results JSON)` +
`POST /paths/{slug}/diagnostic/`. It reuses the **existing `TopicQuiz` JSON shape** to generate one
adaptive quiz spanning a path's topics; topics the user passes get `TopicProgress.status='tested_out'`,
which — through the **already-present dependency graph** — unlocks everything downstream. No new unlocking
engine needed; you just make `available` mean "all `dependencies` are in `{completed, tested_out}`."

**Prerequisite-graph unlocking:** centralize the rule (currently implied) in one helper
`recompute_availability(user, path)` called after any completion/test-out. Beginners walk the graph from
the roots; experts test out of whole tiers in one diagnostic and land at the frontier.

**Staying true to "Get Direction" at every level:** the same `TodayBriefingView` engine points beginners
at the next unlocked beginner topic and experts at their unlocked advanced frontier — one product, one
motto, tier-aware. Because every field defaults to today's values, existing users and paths are untouched
until they opt into a diagnostic.

---

## 6. "Air Draw" Component

**Stack:** MediaPipe `HandLandmarker` from `@mediapipe/tasks-vision` (in-browser WASM, no Python service).
Pinch detection = distance between thumb-tip (landmark 4) and index-tip (landmark 8) below a threshold →
"pen down"; track index-tip → canvas coordinates.

**Storage (additive migration):** add `svg_layer = models.TextField(blank=True, default='')` to
`TopicNote` (`models.py:191`). The existing notes save endpoint (`POST /topics/{id}/notes/`) carries it; no
new table. Stored as real, editable SVG (`<rect>/<line>/<path>/<text>`), not a raster.

**Shape snapping (no AI needed):** buffer the gesture polyline → simplify with Ramer–Douglas–Peucker →
classify by geometry: closed loop with ~4 corners → snap to `<rect>`; two endpoints near two existing
boxes → `<line>` connector with an arrowhead; mostly-straight → line. Text labels: double-pinch inside a
box opens an input, rendered as `<text>`/`<foreignObject>` centered in the rect. (Optional Groq 8B pass
only to auto-label shapes — not required.)

**Component shape:** new `src/components/notes/AirDrawCanvas.tsx`, an absolutely-positioned `<svg>` overlay
layered into `StudyNotesTab` (`topic.$topicId.tsx:808`). The notes path has **no XSS sink** today (the
renderer builds React nodes, no `dangerouslySetInnerHTML`) — sanitize the SVG on save to keep it that way.
Reuse the existing ReactFlow canvas container pattern (`InteractiveRoadmap.tsx:249`) for the pan/zoom
surface.

**Graceful fallback:** feature-detect `navigator.mediaDevices.getUserMedia`; if absent or permission
denied, the **same SVG pipeline** accepts pointer events (mouse/touch) — hand-tracking is just an alternate
input feeding one draw loop, so mouse/touch is the default path and webcam is the enhancement. Invalidate
`["topic", topicId]` **and** `["all-notes"]` on save (don't repeat the F1 bug class).

---

## Verdict

**The architecture supports all six tracks — but three structural things must change before building any
of them.** The data model is genuinely well-shaped for extension: `Topic`/`TopicQuiz`/`TopicFlashcard`/
`TopicProgress`/`Contribution` are generic per-user-per-topic primitives, the `Topic.dependencies` graph
and `TopicProgress` status machine already encode prerequisites/unlocking, `JSONField` quiz/card storage
absorbs new shapes for free, and the synthetic-`LearningPath` trick lets the JD-screening and tier features
ride entirely on existing infrastructure — so #4, #5, and #6 are **additive migrations, no forking**. What
must be fixed *first*: (1) the **security baseline** — rotate the committed secrets, purge the DB dumps, set
the DRF default permission, and gate `LearningPathViewSet` — because every new endpoint inherits today's
`AllowAny` default and would ship the same holes; (2) the **AI layer** must be refactored from 8 duplicated
`llama-3.1-8b-instant` clients into a `core/ai/service.py` with 8B/70B/Gemini-vision tiering, since JD
parsing, code review, and the study planner are reasoning tasks the 8B model will fail at; and (3) **add the
missing indexes/constraints** (zero exist across 29 migrations) and fix the N+1s before features multiply
the query volume. None of these are rewrites — they're a focused ~1.5-week hardening pass, after which the
codebase is a sound foundation for the differentiation roadmap.
