#!/bin/bash

# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@dimini.com&password=test123456' | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Send one transcript
curl -s -X POST "http://localhost:8000/api/sessions/cmi9nu7ru0002rs2uasa43age/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"text":"I feel sad and anxious about my work"}'

echo
echo "Waiting for processing..."
sleep 3
echo
echo "=== Together AI Response Logs ==="
docker-compose logs backend --tail=50 | grep -A 15 "Together AI Response"
