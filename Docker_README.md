# Docker Architecture - Dimini Local Production

Technical overview of containerization strategy and setup.

---

## Architecture Decision

### Why 3 Containers (Minimal Setup)

```
┌─────────────────┐
│   Frontend      │  Next.js 15 (React 19)
│   Port: 3000    │  Hot reload enabled
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Backend       │  FastAPI (Python 3.11)
│   Port: 8000    │  - REST API
│                 │  - WebSocket (Socket.io)
│                 │  - Hume AI Webhooks
│                 │  - Voice Agent Tools
└────────┬────────┘
         │ PostgreSQL
         ▼
┌─────────────────┐
│   PostgreSQL    │  Database
│   Port: 5432    │  Persistent volume
└─────────────────┘
```

### Why NOT Microservices Yet

**Decision:** Backend monolith (all services in one container)

**Reasoning:**
1. **Phase 3 scope:** Testing voice agent webhooks (low traffic)
2. **Development velocity:** Faster debugging, simpler networking
3. **Team size:** 2 developers, shared setup priority
4. **Voice agent:** Just webhook handlers (~100 lines), not CPU intensive
5. **WebSocket:** Needs low latency with API (same process = no network hop)
6. **Can split later:** When traffic > 1000 sessions/day or independent scaling needed

**Future split candidates (Phase 5+):**
- Voice agent service (if webhook traffic scales)
- Graph processing service (if blocking API requests)
- Real-time WebSocket service (if connection count grows)

---

## Container Details

### 1. PostgreSQL Container

**Image:** `postgres:15-alpine`

**Why Alpine:** 40MB vs 130MB (full), same functionality

**Configuration:**
- User: `dimini_user`
- Database: `dimini_db`
- Port: `5432` (exposed to host for debugging)
- Volume: `postgres_data_local` (persistent across restarts)
- Health check: `pg_isready` every 10s

**Why exposed port:** Allows local DB clients (pgAdmin, psql) to connect for debugging

---

### 2. Backend Container

**Base:** `python:3.11-slim`

**Build strategy:**
```dockerfile
# 1. Install system deps (gcc, postgresql-client, curl)
# 2. Copy requirements.txt (layer caching)
# 3. Install Python packages
# 4. Copy application code
# 5. Create Prisma directory
```

**Startup sequence:**
```bash
python -m prisma generate   # Generate Python client
python -m prisma db push    # Sync schema to DB
uvicorn app.main:socket_app --reload  # Start with hot reload
```

**Why this order:**
1. Prisma generate MUST run before importing app code
2. DB push ensures schema is up-to-date
3. `--reload` watches for code changes (dev experience)

**Volume mounts:**
- `./backend/app:/app/app:ro` - Code hot reload (read-only for safety)
- Excludes: `venv/`, `__pycache__/`, `.pytest_cache/`

**Environment:**
- DATABASE_URL overridden to `@postgres:5432` (Docker network)
- All other env vars from root `.env`

**Health check:** `curl http://localhost:8000/health` every 30s

---

### 3. Frontend Container

**Base:** `node:18-alpine`

**Multi-stage build:**
```dockerfile
FROM base AS deps          # Install dependencies
FROM base AS development   # Dev mode with hot reload
FROM base AS builder       # Production build (future)
FROM base AS production    # Production runner (future)
```

**Current target:** `development` (hot reload)

**Volume mounts:**
- `./frontend:/app` - Full code mount
- `/app/node_modules` - Anonymous volume (prevent overwrite)
- `/app/.next` - Anonymous volume (Next.js cache)

**Why anonymous volumes:** Node modules built in container (Linux) incompatible with host (macOS/Windows)

**Environment:**
- `NEXT_PUBLIC_API_URL` from root `.env`
- `NODE_ENV=development` for dev features

---

## Networking

**Bridge network:** `dimini_network`

**Service discovery:**
- Backend → Postgres: `postgres:5432` (container name as hostname)
- Frontend → Backend: `localhost:8000` (exposed port, not container network)

**Why localhost for frontend:**
- Browser runs on host, not in Docker network
- CORS configured for `http://localhost:3000`

---

## Volume Strategy

**Named volume:** `postgres_data_local`
- Persists database across `docker-compose down`
- Deleted only with `docker-compose down -v` (explicit)

**Anonymous volumes:** `node_modules`, `.next`
- Per-container, not shared
- Auto-deleted on container removal

**Bind mounts:** Code directories
- Real-time sync for hot reload
- Changes on host = changes in container

---

## Environment Variables

**Single source of truth:** `/Dimini/.env` (root)

**Why not separate .env files:**
1. Easier to share with team (one file to send)
2. No sync issues between backend/.env and frontend/.env
3. Docker Compose `env_file` directive loads for all services
4. Frontend needs minimal config (`NEXT_PUBLIC_API_URL` only)

**Security:**
- `.env` in `.gitignore`
- `.env.example` provided (no secrets)
- Tool IDs and config IDs included (safe to commit in private repo)

---

## Quick Setup

### Prerequisites

```bash
docker --version        # 20.10+
docker-compose --version  # 1.29+
```

### Step 1: Environment

Copy `.env.example` to `.env` and fill:
```env
OPENAI_API_KEY=sk-...           # Your OpenAI key
SECRET_KEY=<generate-random>    # python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Hume AI credentials already in `.env` (from Phase 3 setup).

### Step 2: Start

```bash
docker-compose -f docker-compose.local-prod.yml up -d
```

**What happens:**
1. Builds backend image (~2 min first time)
2. Builds frontend image (~1 min first time)
3. Starts PostgreSQL
4. Waits for DB health check
5. Starts backend (Prisma generate + DB push)
6. Starts frontend (npm dev)

### Step 3: Verify

```bash
# Check containers
docker-compose -f docker-compose.local-prod.yml ps

# Expected:
# dimini_postgres_local   Up (healthy)
# dimini_backend_local    Up (healthy)
# dimini_frontend_local   Up

# Test endpoints
curl http://localhost:8000/health  # {"status":"healthy"}
open http://localhost:3000         # Frontend loads
```

### Step 4: View Logs

```bash
# All services
docker-compose -f docker-compose.local-prod.yml logs -f

# Specific service
docker-compose -f docker-compose.local-prod.yml logs -f backend
```

---

## Development Workflow

### Code Changes

**Backend:** Edit `backend/app/**/*.py` → Auto-reload (~1s)

**Frontend:** Edit `frontend/**/*.tsx` → Hot module replacement (instant)

**Database schema:** Edit `backend/prisma/schema.prisma` → Run:
```bash
docker exec -it dimini_backend_local python -m prisma db push
```

### Rebuilding

**When needed:**
- Added new Python package to `requirements.txt`
- Added new npm package to `package.json`
- Changed Dockerfile

**Command:**
```bash
docker-compose -f docker-compose.local-prod.yml up -d --build
```

### Debugging

**Backend shell:**
```bash
docker exec -it dimini_backend_local sh
```

**Check logs:**
```bash
docker-compose -f docker-compose.local-prod.yml logs backend --tail=100
```

**Database access:**
```bash
docker exec -it dimini_postgres_local psql -U dimini_user -d dimini_db
```

---

## Hume AI Webhook Testing

**Setup ngrok:**
```bash
ngrok http 8000
```

**Configure in Hume Platform:**
- Webhook URL: `https://<ngrok-id>.ngrok.io/api/webhooks/hume/tool_call`
- Events: `tool_call`, `chat_started`, `chat_ended`

**Backend receives webhooks at:**
- `/api/webhooks/hume/tool_call`
- `/api/webhooks/hume/chat_started`
- `/api/webhooks/hume/chat_ended`

**View webhook logs:**
```bash
docker-compose -f docker-compose.local-prod.yml logs -f backend | grep "webhook"
```

---

## Common Issues

### Port Already in Use

**Error:** `bind: address already in use`

**Fix:**
```bash
# Find process
lsof -i :8000  # or :3000 or :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.local-prod.yml
ports:
  - "8001:8000"  # Host:Container
```

### Database Connection Failed

**Error:** `could not connect to server`

**Check:**
1. DATABASE_URL must be `@postgres:5432` (not `@localhost`)
2. PostgreSQL container healthy: `docker-compose ps`
3. Backend can reach DB: `docker exec -it dimini_backend_local ping postgres`

### Prisma Generate Failed

**Error:** `Prisma client not generated`

**Fix:**
```bash
# Regenerate in container
docker exec -it dimini_backend_local python -m prisma generate
docker-compose -f docker-compose.local-prod.yml restart backend
```

### Frontend Can't Reach Backend

**Error:** `NetworkError` in browser console

**Check:**
1. Backend running: `curl http://localhost:8000/health`
2. CORS configured: Check `.env` has `ALLOWED_ORIGINS='["http://localhost:3000"]'`
3. Frontend using correct URL: `NEXT_PUBLIC_API_URL=http://localhost:8000`

---

## Cleanup

### Stop Containers (Keep Data)

```bash
docker-compose -f docker-compose.local-prod.yml down
```

Database persists in `postgres_data_local` volume.

### Full Cleanup (Delete Data)

```bash
docker-compose -f docker-compose.local-prod.yml down -v
```

⚠️ **WARNING:** Deletes all database data!

### Remove Images

```bash
docker-compose -f docker-compose.local-prod.yml down --rmi all
```

---

## Production Considerations (Future)

**Current setup is local-prod (development-like).**

**For real production:**

1. **Multi-stage builds:**
   - Frontend: Use `production` target (optimized build)
   - Backend: Remove `--reload`, add gunicorn workers

2. **Secrets management:**
   - Use Docker secrets or environment-specific .env files
   - Never commit production .env

3. **Health checks:**
   - Already configured, verify thresholds

4. **Logging:**
   - Add log aggregation (e.g., Loki, CloudWatch)
   - Current: stdout/stderr (good for Docker logs)

5. **Reverse proxy:**
   - Add nginx container for SSL termination
   - Route `/api/*` → backend, `/` → frontend

6. **Scaling:**
   - Split backend into microservices if needed
   - Use `docker-compose scale` or orchestrator (K8s)

---

## File Structure

```
Dimini/
├── docker-compose.local-prod.yml   # Main compose file
├── .env                             # Environment variables (gitignored)
├── .env.example                     # Template (committed)
├── Docker_README.md                 # This file
├── DOCKER_QUICK_START.md           # Quick guide for team
├── backend/
│   ├── Dockerfile                   # Backend image definition
│   ├── requirements.txt             # Python dependencies
│   ├── app/                         # Application code
│   └── prisma/
│       └── schema.prisma            # Database schema
└── frontend/
    ├── Dockerfile                   # Frontend image definition
    ├── package.json                 # Node dependencies
    └── app/                         # Next.js application
```

---

## Why This Matters

**For the team:**
- ✅ Onboarding: Clone → Copy .env → `docker-compose up` → Done
- ✅ Consistency: Same environment on all machines
- ✅ Isolation: No PostgreSQL/Python/Node conflicts with host
- ✅ Cleanup: `docker-compose down` removes everything

**For development:**
- ✅ Hot reload on code changes
- ✅ Fast iteration (~1s backend, instant frontend)
- ✅ Easy debugging (exec into containers)
- ✅ Database persistence across restarts

**For Phase 3 testing:**
- ✅ Hume AI webhooks work (ngrok → localhost:8000)
- ✅ Frontend connects to backend
- ✅ Database migrations automatic
- ✅ Logs easily accessible

---

## Next Steps

After Docker setup works:

1. **Test API:** http://localhost:8000/docs
2. **Register user:** `POST /api/auth/register`
3. **Test voice webhooks:** Configure ngrok URL in Hume Platform
4. **Verify tool execution:** Check backend logs when Hume calls tools
5. **Frontend integration:** Connect dashboard to backend API

---

**Questions?** Check logs: `docker-compose -f docker-compose.local-prod.yml logs -f`
