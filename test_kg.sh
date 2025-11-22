#!/bin/bash

# KG Testing Script
BASE_URL="http://localhost:8000"

echo "=== Knowledge Graph Testing ==="
echo

# Step 1: Login and get token
echo "[1/5] Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@dimini.com&password=test123456')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo

# Step 2: Create Patient
echo "[2/5] Creating test patient..."
PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/patients/" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"John Doe","email":"john.doe@test.com","demographics":{"age":30}}')

PATIENT_ID=$(echo $PATIENT_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -z "$PATIENT_ID" ]; then
  echo "❌ Patient creation failed!"
  echo "$PATIENT_RESPONSE"
  exit 1
fi

echo "✅ Patient created: $PATIENT_ID"
echo

# Step 3: Start Session
echo "[3/5] Starting therapy session..."
SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/sessions/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"patient_id\":\"$PATIENT_ID\"}")

SESSION_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)

if [ -z "$SESSION_ID" ]; then
  echo "❌ Session creation failed!"
  echo "$SESSION_RESPONSE"
  exit 1
fi

echo "✅ Session started: $SESSION_ID"
echo

# Step 4: Send Test Transcripts
echo "[4/5] Sending test transcripts to extract entities..."
echo

echo "  📝 Transcript 1: 'I feel anxious about work...'"
TRANSCRIPT1=$(curl -s -X POST "$BASE_URL/api/sessions/$SESSION_ID/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"I feel very anxious about work. My boss gives me so much stress."}')
echo "$TRANSCRIPT1" | python3 -m json.tool
echo

sleep 2

echo "  📝 Transcript 2: 'I worry about my girlfriend...'"
TRANSCRIPT2=$(curl -s -X POST "$BASE_URL/api/sessions/$SESSION_ID/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"I worry a lot about my girlfriend. Our relationship causes me frustration."}')
echo "$TRANSCRIPT2" | python3 -m json.tool
echo

sleep 2

# Step 5: Get Graph Data
echo "[5/5] Retrieving graph data..."
GRAPH_DATA=$(curl -s -X GET "$BASE_URL/api/sessions/$SESSION_ID/graph" \
  -H "Authorization: Bearer $TOKEN")

echo "$GRAPH_DATA" | python3 -m json.tool
echo

# Summary
echo "==="
echo "✅ KG Testing Complete!"
echo
echo "Session ID: $SESSION_ID"
echo
echo "Next steps:"
echo "1. Open Neo4j Browser: http://localhost:7474"
echo "2. Login: neo4j / diminipassword"
echo "3. Run query: MATCH (e:Entity {session_id: \"$SESSION_ID\"}) RETURN e"
echo
