#!/usr/bin/env python3
"""
Knowledge Graph Testing Script
Tests the KG implementation end-to-end with Together AI
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def main():
    print("=== Knowledge Graph Testing ===\n")

    # Step 1: Login
    print("[1/5] Logging in...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "test@dimini.com", "password": "test123456"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )

    if login_response.status_code != 200:
        print("❌ Login failed!")
        print(login_response.text)
        return

    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print("✅ Logged in successfully\n")

    # Step 2: Create Patient
    print("[2/5] Creating test patient...")
    import random
    email = f"patient{random.randint(1000,9999)}@test.com"
    patient_response = requests.post(
        f"{BASE_URL}/api/patients/",
        headers=headers,
        json={"name": "Jane Smith", "email": email, "demographics": {"age": 28}}
    )

    if patient_response.status_code not in [200, 201]:
        print("❌ Patient creation failed!")
        print(patient_response.text)
        return

    patient_id = patient_response.json()["id"]
    print(f"✅ Patient created: {patient_id}\n")

    # Step 3: Start Session
    print("[3/5] Starting therapy session...")
    session_response = requests.post(
        f"{BASE_URL}/api/sessions/start",
        headers=headers,
        json={"patient_id": patient_id}
    )

    if session_response.status_code != 200:
        # Check if session was created despite error
        print(f"⚠️  Response status: {session_response.status_code}")
        try:
            session_data = session_response.json()
            if "id" in session_data:
                session_id = session_data["id"]
                print(f"✅ Session created (with warnings): {session_id}\n")
            else:
                print("❌ Session creation failed!")
                print(session_response.text)
                return
        except:
            print("❌ Session creation failed!")
            print(session_response.text)
            return
    else:
        session_id = session_response.json()["id"]
        print(f"✅ Session started: {session_id}\n")

    # Step 4: Send Test Transcripts
    print("[4/5] Sending test transcripts to extract entities...\n")

    transcripts = [
        "I feel very anxious about work. My boss gives me so much stress and I worry constantly.",
        "My girlfriend and I argue a lot. Our relationship causes me frustration and sadness.",
        "I'm experiencing burnout. Work stress is affecting my mental health and causing anxiety."
    ]

    for i, text in enumerate(transcripts, 1):
        print(f"  📝 Transcript {i}: '{text[:50]}...'")

        try:
            transcript_response = requests.post(
                f"{BASE_URL}/api/sessions/{session_id}/transcript",
                headers=headers,
                json={"text": text},
                timeout=30
            )

            if transcript_response.status_code == 200:
                result = transcript_response.json()
                print(f"     ✅ Extracted {len(result.get('nodes_added', []))} entities")
                print(f"     ✅ Created {len(result.get('edges_added', []))} edges")

                # Show extracted entities
                for node in result.get('nodes_added', []):
                    print(f"        • {node.get('label')} ({node.get('node_type')})")
            else:
                print(f"     ❌ Failed: {transcript_response.status_code}")
                print(f"     {transcript_response.text[:200]}")
        except Exception as e:
            print(f"     ❌ Error: {str(e)}")

        print()
        time.sleep(2)  # Wait between requests

    # Step 5: Get Graph Data
    print("[5/5] Retrieving graph data...")
    graph_response = requests.get(
        f"{BASE_URL}/api/sessions/{session_id}/graph",
        headers=headers
    )

    if graph_response.status_code == 200:
        graph_data = graph_response.json()
        print(f"✅ Graph retrieved:")
        print(f"   Nodes: {len(graph_data.get('nodes', []))}")
        print(f"   Links: {len(graph_data.get('links', []))}")

        print("\n  Nodes:")
        for node in graph_data.get('nodes', [])[:10]:  # Show first 10
            print(f"    • {node.get('label')} ({node.get('type')})")

        print("\n  Edges (top similarities):")
        links = sorted(graph_data.get('links', []), key=lambda x: x.get('value', 0), reverse=True)
        for link in links[:5]:  # Show top 5
            print(f"    • {link.get('source')} ↔ {link.get('target')} (similarity: {link.get('value', 0):.2f})")
    else:
        print(f"❌ Failed to get graph: {graph_response.status_code}")
        print(graph_response.text)

    # Summary
    print("\n===")
    print("✅ KG Testing Complete!")
    print(f"\nSession ID: {session_id}")
    print("\nNext steps:")
    print("1. Open Neo4j Browser: http://localhost:7474")
    print("2. Login: neo4j / diminipassword")
    print(f"3. Run query: MATCH (e:Entity {{session_id: \"{session_id}\"}}) RETURN e")

if __name__ == "__main__":
    main()
