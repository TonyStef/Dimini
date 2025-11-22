# KG Testing Session Summary - November 22, 2025

## 🆕 LATEST SESSION (Nov 22, 2025 - Evening)

**Duration:** ~3 hours (+ ongoing fixes tonight)
**Goal:** End-to-end KG testing with frontend + voice integration setup
**Status:** ⚠️ Voice agent connects but still errors (config + payload fixes in progress)

### What We Accomplished This Session

#### 1. ✅ Full Stack Setup & Verification
**Services Started:**
- PostgreSQL (port 5432) - ✅ Healthy
- Neo4j (ports 7474, 7687) - ✅ Healthy
- Backend (port 8000) - ✅ Healthy
- Frontend (port 3000) - ✅ Running in Docker

**Docker Command:**
```bash
docker-compose -f docker-compose.local-prod.yml up -d
```

#### 2. ✅ Fixed Session Start 404 Error
**Problem:** Frontend calling wrong endpoint
**File:** `frontend/lib/api.ts` (lines 187-192)

**Fix:**
```typescript
// BEFORE: POST /api/patients/{id}/sessions/start (404)
async startSession(patientId: string): Promise<Session> {
  const response = await api.post<Session>(`/api/patients/${patientId}/sessions/start`);
  return response.data;
}

// AFTER: POST /api/sessions/start (200)
async startSession(patientId: string): Promise<Session> {
  const response = await api.post<Session>('/api/sessions/start', {
    patient_id: patientId
  });
  return response.data;
}
```

**Status:** ✅ FIXED - Sessions now start successfully

#### 3. ✅ Fixed Authentication Error
**Problem:** Graph API returning 401 Unauthorized
**File:** `frontend/hooks/useRealtimeGraph.ts` (lines 134-143)

**Fix:** Added JWT token from localStorage to fetch requests
```typescript
// Added token to graph fetch
const token = localStorage.getItem('token');
const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/graph`, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
});
```

**Status:** ✅ FIXED - Graph loads without auth errors

#### 4. ✅ Hume AI Voice Integration Setup
**Problem:** Voice integration requires environment variables
**File:** `frontend/.env.local`

**Added:**
```bash
HUME_CONFIG_ID=68132b2a-19af-4ecd-b33f-58511ac03ea1
HUME_API_KEY=weW2wCphVE2X6iLIbMIimGRAPe7czeHjahJzr9brOOqStTEi
HUME_SECRET_KEY=0tG3E5sAsDo59ILBT50dtLZHQeY8KCvRAXfTQ4RGNN6bz0OfpRZo9eAp9hqqVwA7
```

**Action:** Restarted frontend container to load new environment variables
```bash
docker-compose -f docker-compose.local-prod.yml restart frontend
```

**Status:** ✅ CONFIGURED - Hume AI credentials loaded

#### 5. ✅ Resolved Active Session Conflict
**Problem:** "Patient already has an active session" error
**Root Cause:** Previous test session still ACTIVE (ID: `cmia4tts40003ns3wzafushw6`)

**Solution:** Cancelled old session via API
```bash
curl -X POST http://localhost:8000/api/sessions/cmia4tts40003ns3wzafushw6/cancel \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "id": "cmia4tts40003ns3wzafushw6",
  "status": "CANCELLED",
  "endedAt": "2025-11-22T10:34:05.764000Z"
}
```

**Status:** ✅ RESOLVED - Can now start fresh sessions

### 🎯 Current Status

**✅ READY TO TEST:**
1. All services running and healthy
2. Frontend accessible at http://localhost:3000
3. Backend API responding at http://localhost:8000
4. Authentication working correctly
5. Hume AI credentials configured
6. No active session conflicts

**📍 NEXT STEPS:**
1. Navigate to http://localhost:3000/sessions
2. Click "Quick Start Session" or start session with patient
3. Allow microphone permission
4. Speak into microphone
5. Verify:
   - Voice input captured
   - Transcript appears in real-time
   - AI voice response plays
   - Emotion detection works
   - Knowledge graph builds with nodes/edges

### 📊 Testing Paths Available

**Path 1: Voice-Enabled Session** (`/sessions` page)
- Full Hume AI integration
- Microphone → Voice Agent → Real-time transcript
- Emotion detection
- (Future) Auto-send transcripts → KG building

**Path 2: Manual API Testing** (Current approach)
- Start session via UI
- Send test transcripts via curl commands
- Watch graph build in real-time
- Faster for controlled testing

### 🔧 Key Files Modified This Session

| File | Change | Status |
|------|--------|--------|
| `frontend/lib/api.ts` | Fixed session start endpoint | ✅ Fixed |
| `frontend/hooks/useRealtimeGraph.ts` | Added JWT auth to graph fetch | ✅ Fixed |
| `frontend/.env.local` | Added Hume AI credentials | ✅ Configured |
| Session `cmia4tts40003ns3wzafushw6` | Cancelled via API | ✅ Resolved |

### ⚠️ Known Issues (Current blockers)

1. **Betweenness background spam**
   - `gds.betweenness.stream` still runs on every session start and throws `Type mismatch: expected String but was Map`.
   - Temporary fix: disable task via `BETWEENNESS_ENABLED = False` (added in code but restart required).

2. **Voice agent config errors**
   - Initial error: `config_not_found` because the frontend env used `HUME_CONFIG_ID` instead of `NEXT_PUBLIC_HUME_CONFIG_ID` → Hume saw `config_id=undefined`.
   - After reconnect, new Hume WS errors:
     - `code 'E0101' slug 'payload_parse'`: caused by sending `encoding: 'webm'`. Hume expects `linear16` (48kHz mono).
     - `code 'I0100' slug 'uncaught'`: bubbled up after payload parse failed.
   - Fix applied: update `frontend/hooks/useHumeWebSocket.ts` to send:
     ```ts
     audio: { encoding: 'linear16', sample_rate: 48000, channels: 1 }
     ```
   - Need to rebuild frontend + confirm WS URL now shows `config_id=<uuid>` and no payload errors.

3. **401s when ending quick-start sessions**
   - `POST /api/sessions/quick-start-session/end` returns 401 if the user is logged out. Harmless but clutters console.

4. **Together AI rate limiting**
   - Still applies; keep 10–15 s delays between transcript calls.

### 🎬 Ready for Demo!

**Recommended Test Flow:**
1. Start fresh session (patient or quick start)
2. Speak emotional statements:
   - "I feel anxious about work"
   - "My boss stresses me out"
   - "This affects my sleep and relationships"
3. Watch entities extract in real-time
4. See graph nodes appear (red = emotions, blue = topics)
5. Observe edges connecting similar concepts

**Time to Working Demo:** Once Hume payload errors stop (test again after frontend rebuild)

---

## PREVIOUS SESSION (Nov 22, 2025 - Morning)

**Duration:** ~2 hours
**Goal:** Migrate from OpenAI to Together AI (Kimi K2) and test Knowledge Graph functionality
**Status:** ⚠️ Partially Complete - Entity extraction working, embeddings rate-limited

---

## 🎯 What We Accomplished

### 1. ✅ Together AI Integration (Kimi K2 for Entity Extraction)

**Changes Made:**
- **File:** `backend/app/config.py`
  - Added `TOGETHER_API_KEY` configuration variable
  - Kept `OPENAI_API_KEY` as optional fallback (currently empty)

- **File:** `backend/app/services/entity_extractor.py`
  - Replaced `import openai` with `from together import Together`
  - Changed model from `gpt-4-0125-preview` to `moonshotai/Kimi-K2-Thinking`
  - Updated prompt to request raw JSON output (no markdown)
  - **Increased `max_tokens` from 500 to 2000** (critical fix!)
  - Added JSON cleanup logic to handle markdown formatting

- **File:** `.env`
  - Added Together AI API key: `TOGETHER_API_KEY="tgp_v1_ZM1gndNX2_..."`
  - Set OpenAI key to empty string

- **File:** `backend/requirements.txt`
  - Added `together>=1.0.0` dependency
  - Upgraded `pydantic` from 2.5.0 to 2.6.3 (required by Together AI)

**Result:** ✅ **Entity extraction WORKING!**
- Successfully extracted 3 entities from test transcript "I feel sad and anxious about my work":
  - `sadness` (emotion)
  - `anxiety` (emotion)
  - `work` (topic)

**Key Learning:** Kimi K2 is a "thinking model" that outputs reasoning in the `reasoning` field. It needs higher `max_tokens` to complete both thinking AND the JSON answer.

---

### 2. ✅ Rate Limiting / Retry Logic

**Problem:** Together AI embeddings API returned 503 errors due to 600 RPM limit on free tier.

**Solution:** Added exponential backoff retry logic

**Changes Made:**
- **File:** `backend/app/services/semantic_linker.py`
  - Added `max_retries = 3` and `base_delay = 1.0`
  - Implemented exponential backoff: 1s → 2s → 4s delays
  - Applied to both `get_embedding()` and `get_embeddings_batch()`
  - Detects 503 errors and "overloaded" messages

**Code Pattern:**
```python
for attempt in range(self.max_retries):
    try:
        response = client.embeddings.create(...)
        return response.data[0].embedding
    except Exception as e:
        if "503" in str(e) or "overloaded" in str(e).lower():
            if attempt < self.max_retries - 1:
                delay = self.base_delay * (2 ** attempt)
                time.sleep(delay)
                continue
        return None
```

**Status:** ⚠️ Partially tested - embeddings still hit rate limits during testing

---

### 3. ✅ Configuration & Bug Fixes

#### A. Neo4j Configuration
- **File:** `backend/app/config.py`
  - Added missing environment variables:
    - `NEO4J_URI: str`
    - `NEO4J_USER: str`
    - `NEO4J_PASSWORD: str`

#### B. Pydantic Model Field Mapping
- **File:** `backend/app/models/session.py`
  - Fixed field name mismatch between Prisma (camelCase) and Pydantic (snake_case)
  - Added `Field(alias="...")` for all fields:
    - `patient_id` → `patientId`
    - `therapist_id` → `therapistId`
    - `started_at` → `startedAt`
    - `created_at` → `createdAt`
    - `updated_at` → `updatedAt`
  - Added `populate_by_name = True` to Config
  - Set default `transcript: str = Field(default="")`

**Before:**
```python
class SessionResponse(BaseModel):
    id: str
    patient_id: str
    # ... caused Pydantic validation errors
```

**After:**
```python
class SessionResponse(BaseModel):
    id: str
    patient_id: str = Field(alias="patientId")
    therapist_id: str = Field(alias="therapistId")
    # ... now works correctly
```

#### C. Missing Tool Handlers File
- **File:** `backend/app/voice_agent/services/tool_handlers.py`
  - Created stub file with empty `TOOL_HANDLERS` dict
  - Added placeholder `handle_tool_call()` function
  - Prevented backend startup error: `ModuleNotFoundError`

---

### 4. ✅ Docker & Services Setup

**Services Started:**
- PostgreSQL (port 5432) - ✅ Healthy
- Neo4j (ports 7474, 7687) - ✅ Healthy
- Backend (port 8000) - ✅ Healthy

**Verified:**
```bash
docker-compose ps
# All services showing "healthy" status

curl http://localhost:8000/health
# {"status":"healthy","database":"connected"}
```

---

### 5. ✅ Test Infrastructure Created

**Test Scripts Created:**
1. `test_kg.py` - Comprehensive Python test script
   - Automated login, patient creation, session start, transcript processing
   - Pretty-printed JSON responses
   - Error handling and status reporting

2. `test_kg.sh` - Bash version with curl commands

3. `test_one_transcript.sh` - Quick single transcript test

**Test Flow:**
```
Login → Create Patient → Start Session → Send Transcripts → Get Graph → Verify Neo4j
```

---

## ⚠️ Issues Encountered & Solutions

### Issue 1: Kimi K2 Returning Empty Content
**Problem:** Entity extraction returned 0 entities
**Root Cause:** Model hit 500 token limit while thinking, never outputted JSON
**Solution:** Increased `max_tokens` from 500 to 2000
**Status:** ✅ FIXED

### Issue 2: Together AI Embeddings 503 Errors
**Problem:** `Error code: 503 - The server is overloaded or not ready yet`
**Root Cause:** Together AI free tier has 600 RPM limit
**Solution:** Added exponential backoff retry logic
**Status:** ⚠️ Partially mitigated - still rate-limited during heavy testing

### Issue 3: Pydantic Validation Errors on Session Creation
**Problem:** Session creation returned 500 error
**Root Cause:** Field name mismatch (camelCase vs snake_case)
**Solution:** Added Field aliases with `populate_by_name=True`
**Status:** ✅ FIXED

### Issue 4: PageRank/Betweenness Background Tasks Failing
**Problem:** Neo4j CypherSyntaxError in graph algorithms
**Root Cause:** Incorrect syntax for `gds.pageRank.stream()` call
**Solution:** ⏸️ NOT FIXED (background task, doesn't block main KG flow)
**Status:** ⚠️ Known issue - algorithms fail but don't prevent entity extraction

---

## 🔴 What's Left To Do

### 1. **Complete Embeddings Testing** (High Priority)
- [ ] Test with slower transcript sending (respect 600 RPM limit)
- [ ] Verify embeddings are generated successfully with retry logic
- [ ] Confirm similarity scores are calculated (threshold: 0.75)

### 2. **Verify Neo4j Graph Creation** (High Priority)
- [ ] Check if nodes were created in Neo4j database
- [ ] Verify edges were created based on semantic similarity
- [ ] Run Cypher queries to inspect graph structure

### 3. **Test Frontend Visualization** (High Priority)
- [ ] Start frontend with `docker-compose -f docker-compose.local-prod.yml up -d`
- [ ] Open http://localhost:3000
- [ ] Navigate to session view
- [ ] Verify graph renders with nodes and edges
- [ ] Test real-time updates via WebSocket

### 4. **Fix PageRank/Betweenness Algorithms** (Medium Priority)
- [ ] Debug Cypher syntax error in `backend/app/graph/algorithms.py`
- [ ] Check if Neo4j Graph Data Science (GDS) library is installed
- [ ] Update query syntax or install missing Neo4j plugins

### 5. **Optimize Rate Limiting** (Medium Priority)
- [ ] Implement request queuing to stay under 600 RPM
- [ ] Add delay between transcript processing calls
- [ ] Consider batching embeddings to reduce API calls

### 6. **Production Readiness** (Low Priority)
- [ ] Add proper error handling for Together AI failures
- [ ] Implement fallback to OpenAI if Together AI is down
- [ ] Add monitoring for API usage and rate limits
- [ ] Clean up debug logging statements

---

## 🧪 How To Test The KG (Step-by-Step)

### Prerequisites
- Together AI API key configured in `.env`
- Docker and docker-compose installed
- All code changes saved (already done)

### Option 1: Quick Single Transcript Test (5 min)

```bash
# 1. Start services
docker-compose up -d

# 2. Wait for healthy status
sleep 15
docker-compose ps

# 3. Run single transcript test
./test_one_transcript.sh

# 4. Check logs for entity extraction
docker-compose logs backend --tail=50 | grep "Extracted"

# Expected output:
# INFO:app.services.entity_extractor:Extracted 3 entities
```

### Option 2: Full KG Test with Multiple Transcripts (15 min)

```bash
# 1. Start services
docker-compose up -d && sleep 15

# 2. Run comprehensive test
python3 test_kg.py

# Expected output:
# ✅ Logged in successfully
# ✅ Patient created: <patient_id>
# ✅ Session started: <session_id>
# ✅ Extracted X entities
# ✅ Created Y edges
# ✅ Graph retrieved: X nodes, Y links
```

### Option 3: Manual Testing with Neo4j Browser (20 min)

```bash
# 1. Start services
docker-compose up -d && sleep 15

# 2. Get auth token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@dimini.com&password=test123456' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# 3. Create patient
PATIENT_ID=$(curl -s -X POST http://localhost:8000/api/patients/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test Patient","email":"patient@test.com","demographics":{"age":30}}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

# 4. Start session
SESSION_ID=$(curl -s -X POST http://localhost:8000/api/sessions/start \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"patient_id\":\"$PATIENT_ID\"}" | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

# 5. Send transcript (WAIT 10 seconds between calls!)
curl -s -X POST "http://localhost:8000/api/sessions/$SESSION_ID/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"I feel anxious about work and my boss stresses me out"}'

sleep 10  # ⏰ IMPORTANT: Wait to avoid rate limiting!

curl -s -X POST "http://localhost:8000/api/sessions/$SESSION_ID/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"My relationship with my girlfriend causes frustration and sadness"}'

# 6. Open Neo4j Browser
open http://localhost:7474
# Login: neo4j / diminipassword

# 7. Run Cypher query to see nodes
MATCH (e:Entity {session_id: "<SESSION_ID>"})
RETURN e.label, e.node_type, e.mention_count

# 8. Run Cypher query to see edges
MATCH (a:Entity {session_id: "<SESSION_ID>"})-[r:SIMILAR_TO]->(b:Entity)
RETURN a.label, r.similarity_score, b.label
ORDER BY r.similarity_score DESC
```

### Option 4: Test Frontend Visualization (30 min)

```bash
# 1. Start all services including frontend
docker-compose -f docker-compose.local-prod.yml up -d

# 2. Wait for services to start
sleep 30
docker-compose ps

# 3. Open frontend
open http://localhost:3000

# 4. Navigate to patient → session → live graph view

# 5. Send transcripts via API (or use voice agent)

# 6. Watch graph update in real-time via WebSocket
```

---

## 📊 What Was Actually Created (Current Status)

### Entities Extracted ✅
From test transcript: **"I feel sad and anxious about my work"**

| Entity ID | Label | Type | Context |
|-----------|-------|------|---------|
| `sadness` | Sadness | emotion | mentioned in relation to work |
| `anxiety` | Anxiety | emotion | mentioned in relation to work |
| `work` | Work | topic | source of sadness and anxiety |

### Graph Database Status ⚠️

**Nodes Created:** ❓ UNKNOWN (embeddings failed due to rate limiting)
**Edges Created:** ❓ UNKNOWN (embeddings needed for similarity calculation)

**What Should Happen:**
1. Entity Extractor extracts 3 entities ✅ **DONE**
2. Semantic Linker generates embeddings for each entity ⚠️ **RATE LIMITED**
3. Cosine similarity calculated between all pairs ❌ **NOT COMPLETED**
4. Edges created where similarity > 0.75 ❌ **NOT COMPLETED**
5. Nodes + edges inserted into Neo4j ❌ **NOT COMPLETED**
6. Frontend receives WebSocket update ❌ **NOT COMPLETED**

**Expected Graph (if embeddings worked):**
```
     anxiety ←→ sadness (similarity ~0.85)
        ↓            ↓
      work ←——————————┘

Nodes: 3 (2 emotions + 1 topic)
Edges: 2-3 (depending on similarity scores)
```

---

## 🔧 Technical Details

### Architecture
```
Frontend (Next.js 14)
    ↓ WebSocket (Supabase Realtime)
PostgreSQL (Prisma)
    ↓ REST API
Backend (FastAPI)
    ↓ Together AI API
Together AI (Kimi K2 + Embeddings)
    ↓
Neo4j Graph Database
```

### API Flow
```
POST /api/sessions/{id}/transcript
    ↓
1. Save transcript to PostgreSQL ✅
2. EntityExtractor.extract() ✅
   - Call Together AI Kimi K2
   - Parse JSON response
   - Return 3 entities
3. SemanticLinker.get_embedding() ⚠️
   - Call Together AI embeddings (with retry)
   - Hit 503 rate limit
4. Calculate similarity ❌
5. Create nodes in Neo4j ❌
6. Create edges in Neo4j ❌
7. Broadcast via WebSocket ❌
```

### Key Files Modified

| File | Changes | Status |
|------|---------|--------|
| `backend/app/config.py` | Added Neo4j + Together AI config | ✅ Complete |
| `backend/app/services/entity_extractor.py` | Migrated to Kimi K2, increased tokens | ✅ Complete |
| `backend/app/services/semantic_linker.py` | Added retry logic for rate limiting | ✅ Complete |
| `backend/app/models/session.py` | Fixed Pydantic field aliases | ✅ Complete |
| `backend/app/voice_agent/services/tool_handlers.py` | Created stub file | ✅ Complete |
| `backend/requirements.txt` | Added together>=1.0.0, upgraded pydantic | ✅ Complete |
| `.env` | Added Together AI API key | ✅ Complete |

---

## 💡 Recommendations for Next Session

### Immediate Actions (Next 30 min)
1. **Test with slower rate** - Send transcripts with 10-15 second delays
2. **Verify Neo4j nodes** - Check if any entities were saved despite errors
3. **Test embeddings in isolation** - Call embedding API directly to verify retry logic

### Short Term (Next 2-4 hours)
1. **Complete one full test** - Get 1 session with full graph created
2. **Verify frontend** - See if graph renders correctly
3. **Fix PageRank/Betweenness** - Debug Cypher syntax errors

### Long Term (Before Demo)
1. **Implement request queuing** - Stay under 600 RPM automatically
2. **Add OpenAI fallback** - If Together AI fails completely
3. **Create demo data** - Pre-load interesting therapy session for showcase
4. **Test real-time updates** - Verify WebSocket broadcasts work

---

## 📝 Notes & Learnings

### Kimi K2 "Thinking Model" Behavior
- Outputs reasoning in `reasoning` field (not `content`)
- Needs high `max_tokens` to finish thinking + answer
- `finish_reason: 'length'` = ran out of tokens
- `finish_reason: 'stop'` = completed successfully

### Together AI Rate Limiting
- Free tier: 600 RPM (10 requests/second)
- Embeddings API is more rate-limited than chat
- 503 errors = overloaded, not authentication issue
- Retry with backoff is essential

### Docker Compose Best Practices
- Use `docker-compose up -d` for background mode
- Check logs with `docker-compose logs -f backend`
- Stop everything with `docker-compose down`
- Health checks are defined in docker-compose.yml

---

## 🎯 Success Metrics

### Minimum Viable (Not Yet Achieved)
- [x] Entity extraction working ✅ **DONE**
- [ ] Embeddings generated successfully ⚠️ **PARTIAL**
- [ ] Nodes created in Neo4j ❌ **TODO**
- [ ] Edges created based on similarity ❌ **TODO**
- [ ] Graph queryable via API ❌ **TODO**

### Full Success (Target)
- [ ] Real-time graph updates via WebSocket
- [ ] Frontend visualization working
- [ ] Multi-tier insights (PageRank, Betweenness)
- [ ] Handles rate limiting gracefully
- [ ] Demo-ready with sample data

---

## 🚀 Quick Commands Reference

```bash
# Start everything
docker-compose up -d

# Start with frontend
docker-compose -f docker-compose.local-prod.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Restart just backend
docker-compose restart backend

# Run tests
python3 test_kg.py

# Access Neo4j
open http://localhost:7474
# Login: neo4j / diminipassword

# Check API health
curl http://localhost:8000/health
```

---

**Last Updated:** November 22, 2025 - 4:30 AM
**Next Session:** Complete embeddings testing and verify Neo4j graph creation
**Estimated Time to MVP:** 2-3 hours (with proper rate limit handling)
