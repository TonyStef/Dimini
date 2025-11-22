# Debugging Session: Knowledge Graph Not Appearing

**Date:** 2025-11-22
**Duration:** ~4 hours
**Goal:** Fix Knowledge Graph not appearing + audio issues
**Context:** Hackathon with 100K Euro prize (< 24 hours remaining)

---

## Table of Contents

1. [Initial Problem Statement](#initial-problem-statement)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Fixes Applied](#fixes-applied)
4. [Test Results](#test-results)
5. [Next Steps: Switch to Anthropic API](#next-steps-switch-to-anthropic-api)
6. [Remaining Issues](#remaining-issues)
7. [Architecture Flow](#architecture-flow)
8. [Key Code Locations](#key-code-locations)
9. [Success Criteria](#success-criteria)

---

## Initial Problem Statement

### Symptoms

1. **Audio reaching Hume** ✅ - Microphone works, conversation registered in Hume
2. **Knowledge Graph not building** ❌ - Despite saying meaningful therapy content
3. **Three console errors** ❌ - Appearing during session
4. **No tool calls** ❌ - Hume voice agent not calling configured tools
5. **Together AI being called** ✅ - API key usage confirmed
6. **No nodes appearing** ❌ - KG remains empty

### User Actions

- Logged in to `stef@therapy.com` account
- Started session with patient "Marian Diaconescu"
- Said: "I have been having work related issues that cause me a lot of stress and anxiety"
- Checked Hume dashboard - conversation working, audio present
- Checked backend logs - Together AI called
- **Result:** Entities extracted but KG still empty

---

## Root Cause Analysis

### Issue #1: Socket.IO Ping Timeout (HIGH PRIORITY)

**Symptom:**
```
[useRealtimeGraph] ❌ Socket DISCONNECTED - Reason: ping timeout
[useRealtimeGraph] ❌ Connection ERROR: timeout Error: timeout
WebSocket connection to 'ws://localhost:8000/socket.io/' failed
```

**Impact:**
Even if backend broadcasts graph updates, frontend Socket.IO can't receive them due to disconnection.

**Status:** 🔴 Needs fixing (Socket.IO configuration or backend not responding to pings)

---

### Issue #2: Embedding API Failing (CRITICAL)

**Service:** OpenAI/Together AI embeddings
**Error:**
```
WARNING:app.services.semantic_linker:Rate limited, retrying in 1.0s (attempt 1/3)
WARNING:app.services.semantic_linker:Rate limited, retrying in 2.0s (attempt 2/3)
ERROR:app.services.semantic_linker:Error generating embedding for 'Work':
  Error code: 503 - The server is overloaded or not ready yet.
WARNING:app.services.graph_builder:Failed to generate embedding for: Work
```

**Impact:**
1. Together AI successfully extracts entities: **Work**, **Stress**, **Anxiety**
2. Embedding API returns `503 - Server overloaded` for all 3 entities
3. Without embeddings, entities get **SKIPPED** (see `graph_builder.py:98`)
4. No nodes added to Neo4j
5. No broadcast sent (because `nodes_added` is empty)
6. KG remains empty

**Root Cause Code:**
```python
# backend/app/services/graph_builder.py:94-98
embedding = await self.linker.get_embedding(entity.label)

if not embedding:
    logger.warning(f"Failed to generate embedding for: {entity.label}")
    continue  # ❌ ENTITY SKIPPED!
```

**Status:** 🔴 **BLOCKING KG** - Must fix to get KG working

**Solution:** Switch to Anthropic API (more reliable, better rate limits)

---

### Issue #3: Webhook Routing Mismatch

**Error:**
```
INFO:app.api.webhooks:Received Hume tool_call webhook: chat_started
INFO: ... "POST /webhooks/hume/tool_call HTTP/1.1" 400 Bad Request
```

**Problem:**
Hume sends `chat_started` events to `/webhooks/hume/tool_call`, but that endpoint expects `tool_call_message` payload structure, not `chat_started`.

**Correct Flow:**
- `chat_started` events → `/webhooks/hume/chat_started` ✅
- `chat_ended` events → `/webhooks/hume/chat_ended` ✅
- `tool_call` events → `/webhooks/hume/tool_call` ✅

**Status:** 🟡 Needs Hume dashboard webhook URL configuration fix

---

### Issue #4: Neo4j PageRank Syntax Error

**Error:**
```
org.neo4j.bolt.protocol.common.fsm.error.TransactionStateTransitionException:
  Type mismatch: expected String but was Map (line 2, column 26)
  "CALL gds.pageRank.stream({"
```

**Impact:** Background PageRank task fails (doesn't block entity extraction)

**Status:** 🟡 Low priority - metrics won't update but KG can still build

---

### Issue #5: Context Fetch Error (RESOLVED)

**Error (earlier):** `Context fetch failed: Not Found`

**Problem:** Frontend calling `/api/patients/{patientId}/context` but endpoint was at `/api/sessions/patients/{patientId}/context`

**Fix:** Changed URL in `frontend/lib/hume.ts:41`
**Status:** ✅ Fixed

---

### Issue #6: Premature Session Ending (RESOLVED)

**Problem:** Component unmount in `LiveSessionView.tsx` triggered `endSession()`, marking session COMPLETED, causing 400 errors on transcript endpoint

**Fix:** Removed `endSession()` from useEffect cleanup
**Status:** ✅ Fixed

---

### Issue #7: Audio Format Mismatch (RESOLVED)

**Problem:** Session settings said `encoding: 'linear16'` but actually sending WebM format

**Fix:** Changed encoding to `'webm'` in `useHumeWebSocket.ts:64`
**Status:** ✅ Fixed

---

### Issue #8: Prisma GraphNode Error (RESOLVED)

**Error:**
```
ERROR: 'Prisma' object has no attribute 'graphnode'
```

**Problem:** Session analyzer trying to query `db.graphnode` which doesn't exist in Prisma schema (graph data is in Neo4j)

**Fix:** Replaced all Prisma queries with Neo4j queries in `session_analyzer.py`
**Status:** ✅ Fixed

---

## Fixes Applied

### Phase 1: Socket.IO Enhanced Logging ✅

**File:** `frontend/hooks/useRealtimeGraph.ts`

**Changes:**
- Added connection/disconnection logging with emojis (`✅`, `❌`, `🎯`)
- Added ping timeout detection and reason logging
- Added reconnection attempt tracking
- Added detailed batch update logging (node/edge counts)
- Added listener for `graph_state` initial state event
- Added `forceNew: true` and `autoConnect: true` to Socket.IO config

**Example Logs:**
```
[useRealtimeGraph] Connecting to Socket.IO... http://localhost:8000
[useRealtimeGraph] ✅ Socket CONNECTED - ID: abc123
[useRealtimeGraph] Joining session room: cmia...
[useRealtimeGraph] ✅ JOINED session room: cmia...
[useRealtimeGraph] 🎯 BATCH UPDATE received: {nodes: 3, edges: 2}
[useRealtimeGraph] Adding to graph: {newNodes: 3, newEdges: 2}
```

---

### Phase 2: Tool Call Webhook Routing Fix ✅

**File:** `backend/app/main.py:77`

**Change:**
```python
# BEFORE
app.include_router(webhooks.router, prefix="/api")
# Path: /api/webhooks/hume/tool_call (404 from Hume)

# AFTER
app.include_router(webhooks.router)  # No /api prefix
# Path: /webhooks/hume/tool_call (matches Hume config)
```

**Impact:** Webhook endpoint now accessible at correct path

---

### Phase 3: Prisma GraphNode Error Fix ✅

**File:** `backend/app/services/session_analyzer.py`

**Changes:**

1. **In `analyze_session()` method (lines 83-108):**
   ```python
   # BEFORE - Prisma queries
   nodes = await db.graphnode.find_many(where={"sessionId": session_id})
   edges = await db.graphedge.find_many(where={"sessionId": session_id})

   # AFTER - Neo4j queries
   from app.graph.neo4j_client import neo4j_client
   nodes = neo4j_client.get_session_entities(session_id)
   edges_query = """
   MATCH (source:Entity {session_id: $session_id})-[r:SIMILAR_TO]-(target:Entity)
   RETURN source.label AS source_label, target.label AS target_label,
          r.similarity_score AS similarity
   ORDER BY r.similarity_score DESC LIMIT 10
   """
   edges = neo4j_client.execute_query(edges_query, {"session_id": session_id})
   ```

2. **In `get_session_insights()` method (lines 173-224):**
   - Replaced all `db.graphnode` and `db.graphedge` queries
   - Now uses `neo4j_client.get_session_entities()` and Cypher queries
   - Fixed dictionary access from `n.label` to `n['label']`

**Impact:** Session summary generation no longer crashes on session end

---

## Test Results

### What Works ✅

1. **Audio reaches Hume successfully** - Microphone capture working, WebM format correct
2. **Voice conversation works** - Chloe (voice AI agent) responds properly
3. **Together AI extracts entities** - Confirmed extraction of: Work, Stress, Anxiety
4. **Transcript reaches backend** - `/api/sessions/{id}/transcript` receiving data
5. **No more Prisma GraphNode errors** - Session analyzer fixed
6. **Webhook routing fixed** - Endpoints at correct paths
7. **Context injection working** - Patient context successfully fetched and sent to Hume

### What Doesn't Work ❌

1. **Embedding API returns 503** - Rate limited/overloaded, all 3 entities fail
2. **Entities skipped due to missing embeddings** - `continue` statement in graph builder
3. **No nodes added to Neo4j** - Graph database remains empty
4. **No KG visualization** - Frontend shows empty graph
5. **Socket.IO ping timeout** - Frontend disconnecting from backend
6. **Webhook 400 errors** - `chat_started`/`chat_ended` going to wrong endpoint (needs Hume dashboard fix)

---

## Backend Logs Evidence

### Entity Extraction Success ✅

```
INFO:app.services.entity_extractor:Extracting entities from chunk:
  I have been having work related issues currently and they've been causing me a lot of stress and anx...

INFO:app.services.entity_extractor:Together AI Response:
  id='oLHk1o7-zqrih-9a28f5963f47b68b' model='moonshotai/Kimi-K2-Thinking'

INFO:app.services.entity_extractor:Extracted 3 entities
INFO:app.services.graph_builder:Extracted 3 entities from transcript chunk
```

**Entities Extracted:**
1. **Work** (topic) - "having work related issues currently"
2. **Stress** (emotion) - "caused by work related issues"
3. **Anxiety** (emotion) - "caused by work related issues"

---

### Embedding Failure (CRITICAL BLOCKER) ❌

**For "Work" entity:**
```
INFO:app.services.realtime:Broadcasted processing_status event for session cmiacxm6d0001qa3vyzngoeig: embedding

WARNING:app.services.semantic_linker:Rate limited, retrying in 1.0s (attempt 1/3)
WARNING:app.services.semantic_linker:Rate limited, retrying in 2.0s (attempt 2/3)

ERROR:app.services.semantic_linker:Error generating embedding for 'Work':
  Error code: 503 - The server is overloaded or not ready yet.

WARNING:app.services.graph_builder:Failed to generate embedding for: Work
```

**Same pattern repeated for "Stress" and "Anxiety"** - all 3 entities failed embedding generation.

**Result:**
```
INFO: ... "POST /api/sessions/cmiacxm6d0001qa3vyzngoeig/transcript HTTP/1.1" 200 OK
```
No broadcast sent because `nodes_added` and `edges_added` arrays are empty.

---

### Frontend Logs Evidence

**Socket.IO Connection Issues:**
```
[useRealtimeGraph] ❌ Socket DISCONNECTED - Reason: ping timeout
[useRealtimeGraph] ❌ Connection ERROR: timeout Error: timeout

WebSocket connection to 'ws://localhost:8000/socket.io/?EIO=4&transport=websocket' failed:
  WebSocket is closed before the connection is established.
```

**No Batch Updates Received:**
- No `[useRealtimeGraph] 🎯 BATCH UPDATE received` logs
- Because backend never broadcasts (empty nodes array)

---

## Next Steps: Switch to Anthropic API

### Why Anthropic?

1. **More reliable API uptime** - Less likely to return 503 errors
2. **Better rate limits** - Higher throughput for embeddings
3. **Already have API access** - User mentioned having Anthropic API key

### Files to Modify

#### 1. Backend Configuration

**File:** `backend/.env`
```env
# Add Anthropic API key
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**File:** `backend/app/config.py`
```python
class Settings(BaseSettings):
    # ... existing fields ...

    # Anthropic API (for embeddings)
    ANTHROPIC_API_KEY: str
```

#### 2. Embedding Service

**File:** `backend/app/services/semantic_linker.py`

**Current implementation:** Uses OpenAI/Together AI for embeddings

**Need to change to:** Anthropic API

**Note:** Anthropic doesn't have a native embedding model yet (as of 2025). Options:
1. Use Anthropic Claude to generate semantic representations
2. Switch to a different embedding provider (Voyage AI, Cohere)
3. Use local embeddings (sentence-transformers)

**Recommended:** Use **Voyage AI** or **Cohere** embeddings (both have reliable APIs)

#### 3. Alternative: Use Voyage AI Embeddings

**File:** `backend/.env`
```env
VOYAGE_API_KEY=your_voyage_api_key_here
```

**File:** `backend/app/services/semantic_linker.py`
- Replace OpenAI client with Voyage AI client
- Use `voyage-large-2` model for embeddings
- Maintains same interface for graph builder

---

## Remaining Issues to Fix

### HIGH PRIORITY 🔴

1. **Switch embedding API** (Anthropic/Voyage/Cohere)
   - Prevents 503 errors
   - Unblocks entity creation in Neo4j
   - Enables KG building

2. **Fix Socket.IO ping timeout**
   - Investigate backend Socket.IO server configuration
   - Check for firewall/network issues
   - Ensure backend responds to pings
   - Prevents broadcasts from reaching frontend

### MEDIUM PRIORITY 🟡

3. **Fix Hume webhook routing in Hume dashboard**
   - Update webhook URLs in Hume configuration
   - `chat_started` → `/webhooks/hume/chat_started`
   - `chat_ended` → `/webhooks/hume/chat_ended`
   - `tool_call` → `/webhooks/hume/tool_call`

4. **Fix Neo4j PageRank syntax error**
   - Update Cypher query in `backend/app/graph/algorithms.py`
   - Fix GDS function call syntax
   - Enables background metrics updates

### LOW PRIORITY 🟢

5. **Test with extended conversation**
   - Verify full KG building with multiple transcripts
   - Test entity deduplication
   - Test edge creation between entities
   - Test metrics updates (PageRank, etc.)

---

## Architecture Flow

### Current Flow (With Failure Point)

```
User speaks → Hume AI processes → Frontend receives transcript
  ↓
Frontend sends to: POST /api/sessions/{sessionId}/transcript
  ↓
Backend receives transcript ✅
  ↓
Backend extracts entities with Together AI ✅
  └─ Result: 3 entities (Work, Stress, Anxiety)
  ↓
Backend generates embeddings ❌ (503 ERROR - FLOW STOPS HERE)
  └─ Error: "503 - The server is overloaded or not ready yet"
  └─ Result: All 3 entities SKIPPED (no embeddings)
  ↓
[FLOW BLOCKED - NO FURTHER PROCESSING]
```

### Expected Flow (After Anthropic/Voyage Fix)

```
User speaks → Hume AI processes → Frontend receives transcript
  ↓
Frontend sends to: POST /api/sessions/{sessionId}/transcript
  ↓
Backend receives transcript ✅
  ↓
Backend extracts entities with Together AI ✅
  └─ Result: 3 entities (Work, Stress, Anxiety)
  ↓
Backend generates embeddings with Anthropic/Voyage ✅
  └─ Result: 3 embeddings generated successfully
  ↓
Backend creates nodes in Neo4j ✅
  └─ Result: 3 nodes added (Work, Stress, Anxiety)
  ↓
Backend calculates semantic similarity ✅
  └─ Result: 2-3 edges created between related entities
  ↓
Backend broadcasts via Socket.IO ✅
  └─ Event: graph_batch_update
  └─ Payload: {nodes: 3, edges: 2, status: "completed"}
  ↓
Frontend Socket.IO receives broadcast ✅
  └─ Log: [useRealtimeGraph] 🎯 BATCH UPDATE received
  ↓
SemanticGraph component renders KG ✅
  └─ Visual: Blue nodes (topics), Red nodes (emotions), Lines (connections)
```

---

## Key Code Locations

### Entity Extraction

**File:** `backend/app/services/entity_extractor.py`
- Uses Together AI (Kimi-K2-Thinking model)
- Extracts topics and emotions from transcript
- Returns structured entity list

### Embedding Generation (NEEDS FIX)

**File:** `backend/app/services/semantic_linker.py`
- Currently uses OpenAI/Together AI
- **Returning 503 errors** - rate limited
- **TODO:** Switch to Anthropic/Voyage/Cohere

### Graph Building

**File:** `backend/app/services/graph_builder.py`

**Critical section (lines 94-98):**
```python
embedding = await self.linker.get_embedding(entity.label)

if not embedding:
    logger.warning(f"Failed to generate embedding for: {entity.label}")
    continue  # ❌ ENTITY SKIPPED IF NO EMBEDDING
```

**Broadcast section (lines 158-165):**
```python
if self.realtime_service and (nodes_added or edges_added):
    await self.realtime_service.broadcast_graph_batch_update(
        session_id,
        nodes=nodes_added,
        edges=edges_added,
        status="completed",
        message=f"Added {len(nodes_added)} entities, {len(edges_added)} connections"
    )
```

### Socket.IO

**Frontend:** `frontend/hooks/useRealtimeGraph.ts`
- Connects to backend Socket.IO server
- Joins session room: `session_{sessionId}`
- Listens for `graph_batch_update` events
- **Currently experiencing ping timeout**

**Backend:** `backend/app/main.py`
- Socket.IO server setup with CORS
- Room-based broadcasting
- Event handlers for join/leave

### Webhooks

**File:** `backend/app/api/webhooks.py`

**Endpoints:**
- `POST /webhooks/hume/tool_call` - Tool execution requests
- `POST /webhooks/hume/chat_started` - Chat session start
- `POST /webhooks/hume/chat_ended` - Chat session end

---

## Files Modified This Session

### 1. `frontend/hooks/useRealtimeGraph.ts` ✅
- Added comprehensive Socket.IO logging
- Added error handling and reconnection logic
- Added `graph_state` event listener

### 2. `backend/app/main.py` ✅
- Fixed webhook router mounting (removed `/api` prefix)
- Webhooks now at `/webhooks/*` instead of `/api/webhooks/*`

### 3. `backend/app/services/session_analyzer.py` ✅
- Replaced all Prisma `db.graphnode` queries with Neo4j queries
- Fixed `analyze_session()` method
- Fixed `get_session_insights()` method

---

## Commands Run

```bash
# Stopped all containers
docker-compose down

# Started all containers fresh
docker-compose up -d

# Accessed frontend
# http://localhost:3000

# Logged in
# Email: stef@therapy.com
# Password: Testing123

# Started session
# Patient: Marian Diaconescu

# Tested conversation
# Said: "I have been having work related issues that cause me a lot of stress and anxiety"

# Results:
# ✅ Audio working
# ✅ Chloe responds
# ✅ Entities extracted (3)
# ❌ Embeddings failed (503)
# ❌ KG empty
```

---

## Time Breakdown

- **Investigation & Log Analysis:** ~2 hours
- **Implementing Fixes:** ~1 hour
- **Testing & Debugging:** ~1 hour
- **Total:** ~4 hours

---

## Success Criteria (After Anthropic/Voyage Switch)

### Backend Logs Should Show:

```
✅ INFO:app.services.entity_extractor:Extracted 3 entities
✅ INFO:app.services.semantic_linker:Generated embedding for: Work
✅ INFO:app.services.semantic_linker:Generated embedding for: Stress
✅ INFO:app.services.semantic_linker:Generated embedding for: Anxiety
✅ INFO:app.services.graph_builder:Created node in Neo4j: Work
✅ INFO:app.services.graph_builder:Created node in Neo4j: Stress
✅ INFO:app.services.graph_builder:Created node in Neo4j: Anxiety
✅ INFO:app.services.realtime:Broadcasted graph_batch_update for session {id}: 3 nodes, 2 edges - completed
```

### Frontend Logs Should Show:

```
✅ [useRealtimeGraph] Connecting to Socket.IO... http://localhost:8000
✅ [useRealtimeGraph] ✅ Socket CONNECTED - ID: abc123
✅ [useRealtimeGraph] ✅ JOINED session room: cmiacxm6d0001qa3vyzngoeig
✅ [useRealtimeGraph] 🎯 BATCH UPDATE received: {nodes: 3, edges: 2, status: "completed"}
✅ [useRealtimeGraph] Adding to graph: {newNodes: 3, newEdges: 2, currentNodes: 0, currentEdges: 0}
```

### KG UI Should Show:

```
✅ 3 nodes visible:
   - 🔵 Work (topic)
   - 🔴 Stress (emotion)
   - 🔴 Anxiety (emotion)
✅ 2-3 edges (lines) connecting related entities
✅ Interactive graph with force-directed layout
✅ Node labels visible
```

### Tool Calls Should Work:

```
✅ No 400 errors on webhook endpoints
✅ Tool execution logs showing successful handling
✅ Hume calling tools during conversation
```

---

## Quick Reference: How to Test After Fix

### 1. Start Fresh Session

```bash
# Navigate to http://localhost:3000
# Login with: stef@therapy.com / Testing123
# Go to Sessions page
# Click on patient "Marian Diaconescu"
# Click "Start Session"
```

### 2. Have Meaningful Conversation

**Say something substantial:**
```
"I've been feeling anxious about work deadlines and stressed about my relationship.
I also have trouble sleeping at night because I keep worrying about everything."
```

**Don't say:**
- "Hello"
- "How are you?"
- Single words or short phrases

### 3. Watch Backend Logs

**Search for:** `extracted`
```bash
docker logs dimini-backend-1 | grep -i "extracted"
```

**Should see:**
```
INFO:app.services.entity_extractor:Extracted 5 entities
```

**Search for:** `embedding`
```bash
docker logs dimini-backend-1 | grep -i "embedding"
```

**Should see:**
```
INFO:app.services.semantic_linker:Generated embedding for: Work
INFO:app.services.semantic_linker:Generated embedding for: Anxiety
...
```

**Search for:** `broadcast`
```bash
docker logs dimini-backend-1 | grep -i "broadcast"
```

**Should see:**
```
INFO:app.services.realtime:Broadcasted graph_batch_update for session {id}: 5 nodes, 4 edges - completed
```

### 4. Watch Frontend Console

**Filter by:** `useRealtimeGraph`

**Should see:**
```
[useRealtimeGraph] ✅ Socket CONNECTED - ID: xyz
[useRealtimeGraph] ✅ JOINED session room: cmiacxm6d0001qa3vyzngoeig
[useRealtimeGraph] 🎯 BATCH UPDATE received: {nodes: 5, edges: 4}
```

### 5. Check KG Visualization

**Look for:**
- Blue nodes (topics)
- Red nodes (emotions)
- Gray lines connecting related entities
- Interactive force-directed layout

---

## Additional Notes

### Hume Dashboard Configuration

**Current webhook URL in Hume dashboard (assumed):**
```
https://your-backend-url/webhooks/hume/tool_call
```

**Need to configure separate webhooks:**
1. Chat Started: `https://your-backend-url/webhooks/hume/chat_started`
2. Chat Ended: `https://your-backend-url/webhooks/hume/chat_ended`
3. Tool Call: `https://your-backend-url/webhooks/hume/tool_call`

### Tools Configured in Hume

1. **generate_session_summary** - Generate session summary with emotions/topics
2. **flag_concern** - Flag concerning patterns (distress, risk, crisis)
3. **mark_progress** - Mark therapeutic progress
4. **save_session_note** - Save therapist notes

All tools have proper schemas defined.

---

## Lessons Learned

1. **Always check embedding API status** - 503 errors can silently block entity creation
2. **Socket.IO needs health monitoring** - Ping timeout can disconnect even with good backend
3. **Webhook routing is critical** - External services need exact URL matches
4. **Logging is essential** - Detailed logs helped identify exact failure points
5. **Rate limits matter** - Free tier APIs may not sustain production load

---

**End of Debugging Session Documentation**
