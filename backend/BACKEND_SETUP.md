# Dimini Backend Setup Guide

This document captures everything we just went through to get the FastAPI backend running locally. Share it with teammates or future-you when you need a refresher (or want to Dockerize the stack later).

---

## 1. Prerequisites

- **macOS / Linux** shell (commands below were run on macOS 15.0).
- **Python 3.9+** with `venv`.
- **Node.js 16+** *(only used for Prisma CLI compatibility, even though the backend is Python).*
- **PostgreSQL 16+** running locally.
- **OpenAI API key** (optional for bootstrapping, required for AI features).

Check versions:

```bash
python3 --version
pip3 --version
node --version
npm --version
psql --version
```

If `psql` is missing on macOS:

```bash
brew install postgresql@16
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
brew services start postgresql@16
```

---

## 2. Clone & Directory Layout

Repo root: `/Users/tonyystef/base-jump/Dimini`

Backend lives in `backend/`, frontend in `frontend/`.

---

## 3. Python Virtual Environment

From the backend directory:

```bash
cd /Users/tonyystef/base-jump/Dimini/backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

The requirements file now includes `pydantic[email]` so the email validator is available.

---

## 4. PostgreSQL Setup

Create the DB role + database once:

```bash
createuser dimini_user --createdb --pwprompt
createdb dimini_db --owner dimini_user
psql -d dimini_db -c '\dt'   # should show "Did not find any relations." on first run
```

Keep `brew services start postgresql@16` running while you work. Shut down later with `brew services stop postgresql@16` if needed.

---

## 5. Environment Variables (`backend/.env`)

Create `backend/.env` with **real values**:

```env
# Database
DATABASE_URL=postgresql://dimini_user:YOUR_PASSWORD@localhost:5432/dimini_db

# OpenAI (optional until AI features are tested)
OPENAI_API_KEY=sk-...
GPT_MODEL=gpt-4-0125-preview
EMBEDDING_MODEL=text-embedding-3-small
SIMILARITY_THRESHOLD=0.75
EXTRACTION_INTERVAL=30

# Auth/JWT
SECRET_KEY=<python -c "import secrets; print(secrets.token_hex(32))">
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS (must be valid JSON list)
ALLOWED_ORIGINS=["http://localhost:3000","http://localhost:3001"]
```

> **Gotcha:** `ALLOWED_ORIGINS` must be valid JSON, not a comma-separated string. If you see `SettingsError: error parsing value for field "ALLOWED_ORIGINS"`, retype the line exactly as above.

---

## 6. Prisma (Python Client) Setup

We use the **Python** Prisma client, not the Node one.

Update `backend/prisma/schema.prisma` generator:

```prisma
generator client {
  provider  = "prisma-client-py"
  interface = "asyncio"
}
```

Generate the client + sync schema:

```bash
python -m prisma generate
python -m prisma db push    # safe, idempotent schema syncing
```

Ignore the warning about recursive types unless you need Mypy—Pyright handles async models better.

---

## 7. Running the Backend

With the venv active and Postgres running:

```bash
python -m uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000
```

Check Swagger: <http://localhost:8000/docs>  
Check ReDoc: <http://localhost:8000/redoc>

Logs should show:

```
INFO:app.database:Connected to database
INFO:app.main:Dimini API started
```

Now you can:

- `POST /api/auth/register` → create a therapist.
- `POST /api/auth/login` → obtain JWT.
- Hit patient/session endpoints with the `Authorize` button in Swagger.

---

## 8. Common Errors & Fixes

| Symptom | Fix |
| --- | --- |
| `bad interpreter: /Applications/Xcode...` when running uvicorn | Always run `python -m uvicorn ...` inside the activated venv. |
| `SettingsError: ALLOWED_ORIGINS` | Ensure `.env` value is valid JSON list (see above) and contains no stray characters. |
| `Client hasn't been generated yet` | Run `python -m prisma generate` (not `npx prisma generate`). |
| `email-validator is not installed` | The requirements file now installs `pydantic[email]`. If you still see it, rerun `pip install -r requirements.txt`. |
| Prisma CLI error about datasource URL | We pin the Node CLI to 5.x **only** for the frontend if needed; backend uses the Python CLI. |

---

## 9. Optional: Preparing for Docker

Not implemented yet, but when you have time:

1. Create `backend/Dockerfile`:
   - Base `python:3.9-slim`.
   - Copy code + `pip install -r requirements.txt`.
   - Run `python -m prisma generate`.
   - `CMD ["uvicorn", "app.main:socket_app", "--host", "0.0.0.0", "--port", "8000"]`.
2. Add `docker-compose.yml` with services:
   - `api` (builds backend Dockerfile).
   - `db` (Postgres with volume + env).
3. Use `.env` or `.env.docker` for container env vars.

Keep this guide handy so you/we can script that transition later.

---

## 10. Quick Start Checklist

1. `brew services start postgresql@16`
2. `cd backend && python3 -m venv venv && source venv/bin/activate`
3. `pip install -r requirements.txt`
4. `python -m prisma generate && python -m prisma db push`
5. `python -m uvicorn app.main:socket_app --reload --host 0.0.0.0 --port 8000`
6. Visit `http://localhost:8000/docs`

You’re ready to develop features or hand this off to another teammate/LLM. Save/commit this file so the knowledge doesn’t disappear again.


