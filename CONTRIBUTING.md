# Contributing to GrowthOS

First off, thank you for considering contributing to GrowthOS! It's people like you that make GrowthOS such a great tool for managing learning and progression.

## Getting Started

GrowthOS is a full-stack application built with:
- **Frontend**: React (Vite) + TypeScript + TailwindCSS
- **Backend**: Python (Django)
- **Database**: MySQL (in Production) / SQLite (Local)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Docker (optional, but recommended for production-like environments)

## Setting up the Local Environment

### 1. Backend Setup (Django)

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Environment Variables:**
Create a `.env` file inside the `backend/` directory. Use `.env.prod.example` as a reference.
You will need to provide your own API keys (e.g., Groq, Gemini) to test AI features locally.

### 2. Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:3005` or `http://localhost:5173`.

## Collaboration Workflow

To ensure a smooth collaboration process, we use a standard feature-branch workflow:

1. **Fork the repository** (if you aren't added as a collaborator)
2. **Create a new branch** for your feature or bugfix:
   `git checkout -b feature/your-feature-name`
3. **Commit your changes**:
   Make sure to write clear, descriptive commit messages.
   `git commit -m "feat: added new dashboard trajectory"`
4. **Push your branch**:
   `git push origin feature/your-feature-name`
5. **Open a Pull Request**:
   Target the `main` branch. Provide a clear description of what your PR solves or adds.

## Code Style
- **Frontend**: We use Prettier/ESLint. Please format your code before submitting. Ensure components use the shared `growth-ui` components when applicable.
- **Backend**: Follow PEP-8 standards. Ensure Django models and views are well documented.

## Security Warning 🚨
**NEVER commit `.env` files or hardcoded API keys.** Always use environment variables.

Thanks for helping us build GrowthOS!
