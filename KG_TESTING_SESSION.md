# Knowledge Graph Testing Session - Nov 22, 2025

**Status:** Testing KG implementation merged from teammate
**Time Constraint:** <24 hours (Hackathon mode)
**Goal:** Verify KG functionality works end-to-end

---

## 🎯 What We're Testing

Your teammate built the Knowledge Graph (KG) functionality and it's been merged. We need to:
1. Create a patient
2. Populate database with relationships, topics, emotions
3. Verify the KG actually works (backend + Neo4j)
4. (If time) Test frontend visualization

---

## 📋 What I Found - KG Implementation Analysis

### ✅ COMPLETED BY TEAMMATE

#### Backend Architecture (Dual Database)

**PostgreSQL (Prisma)** - Application Data:
- Users, Patients, Sessions
- Voice Agent Tools (SessionNote, SessionProgress, SessionConcern)
- Audit Logs
- **NO graph data** (clean separation)

**Neo4j** - Graph Data Only:
- Entity nodes (topics and emotions with embeddings)
- SIMILAR_TO edges (semantic relationships)
- Graph algorithms (PageRank, Betweenness, Weighted Degree)

#### Core Services Implemented

**1. Entity Extractor** (`backend/app/services/entity_extractor.py`)
- Uses GPT-4 function calling
- Extracts TOPICS (work, family, therapy, etc.)
- Extracts EMOTIONS (anxiety, joy, anger, sadness, etc.)
- Normalized IDs: "work_stress", "anxiety"
- Display labels: "Work Stress", "Anxiety"

**2. Semantic Linker** (`backend/app/services/semantic_linker.py`)
- OpenAI embeddings (text-embedding-3-small, 1536 dimensions)
- Cosine similarity calculation
- Threshold: 0.75 (creates edge if similarity > 0.75)
- Example: "anxiety" ↔ "stress" = 0.89 similarity

**3. Graph Builder** (`backend/app/services/graph_builder.py`)
- Orchestrates extraction → embedding → similarity → database
- Real-time processing of 30-second transcript chunks
- WebSocket broadcasting for live updates

**4. Neo4j Client** (`backend/app/graph/neo4j_client.py`)
- Connection: bolt://localhost:7687
- User: neo4j / Password: diminipassword
- Operations: create entities, create edges, query graph

**5. Graph Algorithms** (`backend/app/graph/algorithms.py`)
- **Tier 1: Weighted Degree** (instant, <5ms)
- **Tier 2: PageRank** (10s intervals, identifies core issues)
- **Tier 3: Betweenness** (60s intervals, finds bridge topics)

#### API Endpoints Available

**Sessions API** (`backend/app/api/sessions.py`):
- `POST /api/sessions/start` - Start session
- `POST /api/sessions/{id}/transcript` - Process transcript (MAIN KG ENTRY POINT)
- `GET /api/sessions/{id}/graph` - Get graph data
- `GET /api/sessions/{id}/insights` - Get multi-tier insights
- `POST /api/sessions/{id}/end` - End session

**Patients API** (`backend/app/api/patients.py`):
- `POST /api/patients/` - Create patient
- `GET /api/patients/` - List patients
- `GET /api/patients/{id}` - Get patient details

### ❌ MISSING / NOT TESTED

- No test files exist
- No example/demo data
- Never been tested end-to-end
- Unknown if it actually works

---

## 🚀 DOCKER SETUP (Your Cofounder's Work)

### Files Found:
- `docker-compose.yml` - Main setup (Postgres + Neo4j + Backend)
- `docker-compose.local-prod.yml` - Local production testing (includes Frontend)
- `backend/Dockerfile` - Backend container
- `.env` - Configuration (in project root)

### Services in Docker Compose:
1. **PostgreSQL** (port 5432)
2. **Neo4j** (ports 7474 HTTP, 7687 Bolt)
3. **Backend** (port 8000)
4. **Frontend** (port 3000) - only in local-prod

### Environment Variables (from `.env`):
```env
POSTGRES_USER=dimini_user
POSTGRES_PASSWORD=dimini_password
POSTGRES_DB=dimini_db

NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=diminipassword

OPENAI_API_KEY=(your key)
HUME_API_KEY=(your key)
HUME_SECRET_KEY=(your key)
HUME_CONFIG_ID=(your id)
```

---

## ✅ PROGRESS SO FAR (This Session)

### Completed:
1. ✅ Explored KG implementation (found all code)
2. ✅ Started Neo4j manually (Docker container)
3. ✅ Initialized Neo4j schema (constraints + indexes)
4. ✅ Synced PostgreSQL database (Prisma)
5. ✅ Found Docker Compose setup
6. ✅ Stopped manual services

### Issues Encountered:
- ❌ Config.py missing fields (Neo4j vars not in Settings class)
- ❌ slowapi not installed in venv
- ❌ Tried to use venv but cofounder set up Docker

### Current State:
- Manual Neo4j container running (need to stop and use docker-compose instead)
- Backend not running
- Ready to start with Docker Compose

---

## 🎯 NEXT STEPS - TESTING PLAN (Simplified)

### Option 1: Quick Docker Test (RECOMMENDED for Hackathon)

**Time: ~30 minutes**

```bash
# 1. Stop manual Neo4j container
docker stop neo4j-dimini
docker rm neo4j-dimini

# 2. Start everything with docker-compose
docker-compose up -d

# 3. Wait for services to be healthy (~30 seconds)
docker-compose ps

# 4. Check logs
docker-compose logs backend -f

# 5. Test API
curl http://localhost:8000/api/health
```

Then proceed with API testing (see below).

### Option 2: Frontend Included (Local-Prod)

```bash
docker-compose -f docker-compose.local-prod.yml up -d
```

This starts Backend + Frontend + Databases.

---

## 📝 MANUAL API TESTING (After Docker is Running)

### Step 1: Create Test Patient

```bash
curl -X POST http://localhost:8000/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Patient",
    "email": "test@example.com",
    "demographics": {"age": 30}
  }'
```

**Save the returned `id` → this is `patient_id`**

### Step 2: Start Session

```bash
curl -X POST http://localhost:8000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PASTE_PATIENT_ID_HERE"
  }'
```

**Save the returned `id` → this is `session_id`**

### Step 3: Send Test Transcript #1

```bash
curl -X POST http://localhost:8000/api/sessions/SESSION_ID/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I feel anxious about work."
  }'
```

**Expected Response:**
```json
{
  "nodes_added": [
    {"node_id": "anxiety", "label": "Anxiety", "node_type": "EMOTION"},
    {"node_id": "work", "label": "Work", "node_type": "TOPIC"}
  ],
  "edges_added": [...],
  "status": "success"
}
```

### Step 4: Send Test Transcript #2 (Creates Edges)

```bash
curl -X POST http://localhost:8000/api/sessions/SESSION_ID/transcript \
  -H "Content-Type: application/json" \
  -d '{
    "text": "My boss gives me stress and I worry a lot."
  }'
```

**Should extract:** anxiety, work, stress, worry, boss
**Should create edges** between similar emotions (anxiety ↔ stress, anxiety ↔ worry)

### Step 5: Get Graph Data

```bash
curl http://localhost:8000/api/sessions/SESSION_ID/graph
```

**Expected Response:**
```json
{
  "nodes": [
    {"id": "anxiety", "label": "Anxiety", "type": "emotion", "group": 1},
    {"id": "work", "label": "Work", "type": "topic", "group": 2}
  ],
  "links": [
    {"source": "anxiety", "target": "work", "value": 0.89}
  ]
}
```

### Step 6: Get Insights (Multi-tier Algorithms)

```bash
curl http://localhost:8000/api/sessions/SESSION_ID/insights
```

**Expected Response:**
```json
{
  "real_time": {
    "top_entities": [
      {"label": "Anxiety", "weighted_degree": 4.52, "mention_count": 8}
    ]
  },
  "core_issues": {
    "top_entities": [
      {"label": "Anxiety", "pagerank": 0.32}
    ]
  },
  "emotional_triggers": {
    "top_entities": [
      {"label": "Work", "betweenness": 0.15}
    ]
  }
}
```

---

## 🔍 VERIFICATION - Neo4j Browser

### Access Neo4j:
```
URL: http://localhost:7474
Login: neo4j / diminipassword
```

### Cypher Queries to Run:

**See all entities:**
```cypher
MATCH (e:Entity {session_id: "SESSION_ID"})
RETURN e.label, e.node_type, e.mention_count, e.weighted_degree
```

**See all relationships:**
```cypher
MATCH (a:Entity {session_id: "SESSION_ID"})-[r:SIMILAR_TO]->(b:Entity)
RETURN a.label, r.similarity_score, b.label
ORDER BY r.similarity_score DESC
```

**Visualize graph:**
```cypher
MATCH (e:Entity {session_id: "SESSION_ID"})
OPTIONAL MATCH (e)-[r:SIMILAR_TO]-(other)
RETURN e, r, other
```

### Success Criteria:
- ✅ Nodes exist for: anxiety, work, stress, worry, boss
- ✅ Edges exist with similarity > 0.75
- ✅ weighted_degree > 0 for connected nodes
- ✅ Visual graph shows connections

---

## 🐛 TROUBLESHOOTING

### If Docker Compose Fails:

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs neo4j
docker-compose logs postgres
```

**Restart services:**
```bash
docker-compose down
docker-compose up -d
```

### If Backend Won't Start:

**Check it's building:**
```bash
docker-compose build backend
```

**Check .env file has OPENAI_API_KEY:**
```bash
grep OPENAI_API_KEY .env
```

### If Neo4j Not Accessible:

**Check container is running:**
```bash
docker ps | grep neo4j
```

**Check logs:**
```bash
docker-compose logs neo4j
```

### If "No Entities Extracted":

- Check backend logs for GPT-4 response
- Verify OPENAI_API_KEY is valid
- Try simpler text: "I feel sad"

### If "No Edges Created":

- Embeddings may be too dissimilar
- Check similarity scores in response
- Lower threshold temporarily (in code: SIMILARITY_THRESHOLD)

---

## 📊 SUCCESS METRICS

### Minimal Working Demo (MVP):
- ✅ Patient created in PostgreSQL
- ✅ Session started
- ✅ Entities extracted from transcripts
- ✅ Graph nodes created in Neo4j
- ✅ Similarity edges created
- ✅ Graph queryable via API
- ✅ Visible in Neo4j browser

### Bonus (If Time):
- ✅ Multi-tier insights working
- ✅ Frontend visualization displaying graph
- ✅ Real-time updates working

---

## 🔑 KEY FILES REFERENCE

### Backend Core:
- `backend/app/main.py` - FastAPI app entry point
- `backend/app/config.py` - Environment settings (NEEDS UPDATE)
- `backend/app/database.py` - Prisma connection

### Graph Implementation:
- `backend/app/graph/neo4j_client.py` - Neo4j operations
- `backend/app/graph/algorithms.py` - PageRank, Betweenness
- `backend/app/graph/schema.cypher` - Database schema

### Services:
- `backend/app/services/graph_builder.py` - Main orchestrator
- `backend/app/services/entity_extractor.py` - GPT-4 extraction
- `backend/app/services/semantic_linker.py` - Embeddings + similarity

### API:
- `backend/app/api/sessions.py` - Session endpoints
- `backend/app/api/patients.py` - Patient endpoints

### Docker:
- `docker-compose.yml` - Main setup
- `docker-compose.local-prod.yml` - With frontend
- `backend/Dockerfile` - Backend container
- `.env` - Configuration

### Documentation:
- `docs/implementations/neo4j-graph-algorithms.md` - Full implementation plan (2225 lines)
- `DEVELOPER_GUIDE.md` - Complete development guide (2174 lines)
- `backend/.claude/claude.md` - Backend architecture guide

---

## ⚡ QUICK START COMMANDS

```bash
# Start everything with Docker
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Create patient
curl -X POST http://localhost:8000/api/patients/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Patient", "email": "test@example.com"}'

# Start session (replace PATIENT_ID)
curl -X POST http://localhost:8000/api/sessions/start \
  -H "Content-Type: application/json" \
  -d '{"patient_id": "PATIENT_ID"}'

# Send transcript (replace SESSION_ID)
curl -X POST http://localhost:8000/api/sessions/SESSION_ID/transcript \
  -H "Content-Type: application/json" \
  -d '{"text": "I feel anxious about work and my boss stresses me out."}'

# Get graph
curl http://localhost:8000/api/sessions/SESSION_ID/graph

# Get insights
curl http://localhost:8000/api/sessions/SESSION_ID/insights

# Access Neo4j browser
open http://localhost:7474
# Login: neo4j / diminipassword

### Voice sanity checklist (Nov 22)
1. `docker-compose -f docker-compose.local-prod.yml up -d`
2. Log in at http://localhost:3000/login
3. Start a patient session or use Quick Start
4. Grant microphone permission and confirm status pill shows “Listening”
5. Speak: “I feel anxious about work and my boss stresses me out”
6. Watch graph nodes appear (red emotions, blue topics)
7. Tail backend logs for `nodes_added` (no betweenness stack traces)
8. Optional: replay transcript via curl to compare `/api/sessions/{id}/graph`

# Stop everything
docker-compose down
```

---

## 🎯 HACKATHON STRATEGY (< 24 Hours)

### Priority 1: Prove It Works (2 hours)
1. Start Docker Compose
2. Test API manually (create patient → session → transcripts)
3. Verify data in Neo4j browser
4. Take screenshots for demo

### Priority 2: Make It Demo-Ready (2 hours)
1. Test frontend visualization (if using local-prod)
2. Prepare 3-4 sample transcripts that show good graph
3. Practice demo flow

### Priority 3: Polish (If Time)
1. Error handling
2. Loading states
3. Better test data

### What to SKIP:
- ❌ Writing automated tests
- ❌ Fixing non-critical bugs
- ❌ Perfect UI polish
- ❌ Documentation beyond this file

---

## 💡 NOTES FROM SESSION

- Your cofounder dockerized everything (smart move!)
- KG code looks solid (professional implementation)
- Multi-tier algorithm system is sophisticated
- Clean database separation (PostgreSQL vs Neo4j)
- Real-time WebSocket updates implemented
- Main risk: Never been tested end-to-end

**Bottom line:** The code is there. Just needs to be started and tested. Docker handles all the complexity.

---

## 📞 IF YOU GET STUCK

1. Check Docker logs: `docker-compose logs backend -f`
2. Check Neo4j is accessible: `curl http://localhost:7474`
3. Check backend health: `curl http://localhost:8000/api/health`
4. Check .env has all required keys
5. Restart everything: `docker-compose down && docker-compose up -d`

---

**Last Updated:** Nov 22, 2025 - 1:55 AM
**Next Action:** Run `docker-compose up -d` and start testing!
