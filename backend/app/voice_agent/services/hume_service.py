"""
Hume EVI Integration Service - Adapted from Brian Agent
Handles connection, session management, message routing, and tool execution

Adapted from: brian_agent/webhook_v0_livekit/hume_bridge.py
Reuse: 90% - Connection, auth, tool execution
"""

import json
import base64
import logging
import asyncio
import httpx
import websockets
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class HumeService:
    """
    Service for managing Hume AI EVI connections and sessions.

    Includes:
    - OAuth2 authentication
    - WebSocket connection management
    - Context injection
    - Tool call handling
    - Message routing
    """

    def __init__(self, api_key: str, secret_key: str, config_id: str):
        self.api_key = api_key
        self.secret_key = secret_key
        self.config_id = config_id
        self.hume_ws: Optional[websockets.WebSocketClientProtocol] = None
        self.is_running = False

        # Session data (incremental updates via tools)
        self.session_data = {
            "notes": [],
            "kg_events": [],
            "progress_markers": [],
            "concerns": []
        }

        # Context injection tracking (for continuous updates)
        self.pending_context_update = None
        self.last_context_update_time = 0
        self.context_debounce_delay = 3  # seconds
        self.recent_emotions = []  # Rolling window of emotions
        self.max_emotion_history = 10  # Keep last 10 emotions

    async def create_session_token(self) -> str:
        """
        Create OAuth2 session token for Hume AI.

        Adapted from: hume_bridge.py lines 404-424

        Returns:
            access_token: Session token for WebSocket connection
        """
        logger.info("Creating Hume AI session token...")
        url = "https://api.hume.ai/oauth2-cc/token"

        credentials = f"{self.api_key}:{self.secret_key}"
        auth_header = base64.b64encode(credentials.encode()).decode()

        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        payload = {"grant_type": "client_credentials"}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, data=payload, timeout=10.0)

            if response.status_code != 200:
                raise Exception(f"Failed to create session token: {response.status_code} - {response.text}")

            data = response.json()
            session_token = data.get("access_token")
            logger.info(f"Session token created (expires in {data.get('expires_in')}s)")
            return session_token

    async def connect(self) -> websockets.WebSocketClientProtocol:
        """
        Connect to Hume AI WebSocket with authentication.

        Adapted from: hume_bridge.py lines 426-449

        Returns:
            WebSocket connection
        """
        session_token = await self.create_session_token()

        hume_url = (
            f"wss://api.hume.ai/v0/evi/chat"
            f"?access_token={session_token}"
            f"&config_id={self.config_id}"
        )

        logger.info("Connecting to Hume AI WebSocket...")
        self.hume_ws = await websockets.connect(hume_url)
        logger.info("HUME: Connected to Hume EVI")

        # Send session settings (48kHz audio)
        session_settings = {
            "type": "session_settings",
            "audio": {
                "encoding": "linear16",
                "sample_rate": 48000,
                "channels": 1
            }
        }
        await self.hume_ws.send(json.dumps(session_settings))
        logger.info("HUME: Sent session_settings: linear16, 48kHz, mono")

        self.is_running = True
        return self.hume_ws

    async def inject_patient_context(self, patient_id: str, patient_history: Dict):
        """
        Inject patient context into Hume session.

        Adapted from: hume_bridge.py lines 491-535
        Adaptation: Properties → Patient history

        Args:
            patient_id: Patient identifier
            patient_history: Patient background and history data
        """
        if not self.hume_ws:
            logger.error("CONTEXT_INJECTION: Cannot inject - WebSocket not connected")
            return

        context = self._format_therapy_context(patient_history=patient_history)

        # Inject as initial message
        await self.hume_ws.send(json.dumps({
            "type": "user_input",
            "text": context
        }))

        logger.info(f"CONTEXT_INJECTION: Sent patient context for {patient_id}")

    async def inject_patient_history_text(self, patient_id: str, history_text: str):
        """
        Inject patient history as pre-formatted text.

        Used when therapy history is uploaded as text file from frontend.

        Args:
            patient_id: Patient identifier
            history_text: Pre-formatted patient history text
        """
        if not self.hume_ws:
            logger.error("CONTEXT_INJECTION: Cannot inject - WebSocket not connected")
            return

        if not history_text or not history_text.strip():
            logger.warning(f"CONTEXT_INJECTION: Empty history for patient {patient_id}")
            return

        # Inject as initial message
        await self.hume_ws.send(json.dumps({
            "type": "user_input",
            "text": history_text
        }))

        logger.info(f"CONTEXT_INJECTION: Sent patient history for {patient_id} ({len(history_text)} chars)")

    def _format_therapy_context(self, patient_history: Dict) -> str:
        """
        Format patient history as readable text for Hume context injection.

        Adapted from: PropertyService.format_for_context()
        Adaptation: Properties → Patient data
        """
        lines = ["=== PATIENT CONTEXT ===\n"]

        # Basic info
        lines.append(f"Name: {patient_history.get('name', 'Unknown')}")

        if age := patient_history.get('age'):
            lines.append(f"Age: {age}")

        # Previous diagnoses
        if diagnoses := patient_history.get('diagnoses'):
            lines.append(f"\nPrevious Diagnoses:")
            for diagnosis in diagnoses:
                lines.append(f"- {diagnosis}")

        # Known triggers
        if triggers := patient_history.get('triggers'):
            lines.append(f"\nKnown Triggers:")
            for trigger in triggers:
                lines.append(f"- {trigger['description']} (intensity: {trigger['intensity']})")

        # Therapy goals
        if goals := patient_history.get('therapy_goals'):
            lines.append(f"\nTherapy Goals:")
            for goal in goals:
                lines.append(f"- {goal}")

        # Recent insights
        if insights := patient_history.get('recent_insights'):
            lines.append(f"\nRecent Insights:")
            for insight in insights[:3]:  # Last 3 insights
                lines.append(f"- {insight['date']}: {insight['content']}")

        return "\n".join(lines)

    async def receive_from_hume(self, session_id: str):
        """
        Receive and handle messages from Hume EVI.

        Adapted from: hume_bridge.py lines 702-775
        Reuse: 90% - Message loop structure
        Adaptation: Add emotion extraction + KG updates + WebSocket broadcasts

        Message types:
        - user_message: Extract emotions, update KG, broadcast
        - tool_call: Execute therapy tools
        - assistant_message: Log AI response
        - error: Log errors

        Args:
            session_id: Active therapy session ID for context
        """
        logger.info("HUME: Started receiving from Hume EVI...")
        message_count = 0

        try:
            while self.is_running and self.hume_ws:
                message_str = await self.hume_ws.recv()
                message_count += 1

                message = json.loads(message_str)
                msg_type = message.get("type")

                if msg_type == "user_message":
                    # Extract emotions and content from patient speech
                    msg_data = message.get("message", {})
                    content = msg_data.get("content", "")
                    emotions = msg_data.get("models", {}).get("prosody", {}).get("scores", {})

                    logger.info(f"PATIENT: {content}")
                    if emotions:
                        logger.info(f"EMOTIONS: {emotions}")

                    # NEW: Queue context update (debounced, after every message)
                    asyncio.create_task(self.queue_context_update(session_id, emotions, content))

                    # Store emotion in KG and broadcast to frontend
                    if emotions:
                        try:
                            from app.services.kg_service import KGService
                            from app.services.websocket_manager import websocket_manager

                            # Get primary emotion (highest score)
                            primary_emotion = max(emotions.items(), key=lambda x: x[1]) if emotions else ("neutral", 0.0)
                            emotion_type, intensity = primary_emotion

                            # Store in Neo4j if significant
                            if intensity > 0.3:  # Only store meaningful emotions
                                kg_service = KGService()
                                await kg_service.add_emotion_node(
                                    session_id=session_id,
                                    emotion_data={
                                        "emotion_type": emotion_type,
                                        "intensity": intensity,
                                        "context": content,
                                        "timestamp": datetime.now()
                                    }
                                )

                                # Broadcast to frontend via WebSocket
                                await websocket_manager.broadcast_to_session(session_id, {
                                    "type": "emotion_update",
                                    "emotion": emotion_type,
                                    "intensity": intensity,
                                    "timestamp": datetime.now().isoformat()
                                })

                        except Exception as e:
                            logger.error(f"EMOTION: Failed to process emotion: {e}", exc_info=True)

                elif msg_type == "tool_call":
                    # Execute therapy tool
                    await self.handle_tool_call(message)

                elif msg_type == "assistant_message":
                    # Log AI response (when therapist queries)
                    msg_data = message.get("message", {})
                    content = msg_data.get("content", "")
                    role = msg_data.get("role", "")
                    logger.info(f"AI ({role}): {content}")

                elif msg_type == "error":
                    # Log Hume AI errors
                    error_msg = message.get("message", "Unknown error")
                    logger.error(f"HUME: Hume AI error: {error_msg}")
                    logger.error(f"   Full error: {json.dumps(message, indent=2)}")

        except websockets.exceptions.ConnectionClosed as e:
            logger.info(f"HUME: WebSocket closed after {message_count} messages: {e}")
        except Exception as e:
            logger.error(f"HUME: Receive error after {message_count} messages: {e}", exc_info=True)
        finally:
            # Clean up session state
            self.is_running = False
            self.hume_ws = None
            logger.info("HUME: Session cleaned up, ready for reconnection if needed")

    async def handle_tool_call(self, message: Dict):
        """
        Handle tool calls from Hume AI.

        Adapted from: hume_bridge.py lines 950-1012
        Adaptation: Lead tools → Therapy tools

        Tools:
        - save_session_note: Save therapist observation
        - update_kg_important: Add significant event to KG
        - mark_progress: Flag breakthrough
        - flag_concern: Flag concerning pattern
        - generate_session_summary: Create session summary
        """
        tool_name = message.get("name")
        tool_params_raw = message.get("parameters", {})
        tool_call_id = message.get("tool_call_id")

        # Parse parameters (Hume sends JSON string)
        if isinstance(tool_params_raw, str):
            try:
                tool_params = json.loads(tool_params_raw)
            except json.JSONDecodeError:
                logger.error(f"TOOL: Failed to parse parameters: {tool_params_raw}")
                tool_params = {}
        else:
            tool_params = tool_params_raw

        logger.info(f"TOOL: Tool call: {tool_name}({tool_params})")

        try:
            # Execute tool based on name
            if tool_name == "save_session_note":
                tool_result = await self.execute_save_note(tool_params)
            elif tool_name == "update_kg_important":
                tool_result = await self.execute_kg_update(tool_params)
            elif tool_name == "mark_progress":
                tool_result = await self.execute_mark_progress(tool_params)
            elif tool_name == "flag_concern":
                tool_result = await self.execute_flag_concern(tool_params)
            elif tool_name == "generate_session_summary":
                tool_result = await self.execute_generate_summary(tool_params)
            else:
                tool_result = json.dumps({
                    "status": "error",
                    "message": f"Unknown tool: {tool_name}"
                })

            # Send response to Hume
            await self.hume_ws.send(json.dumps({
                "type": "tool_response",
                "tool_call_id": tool_call_id,
                "content": tool_result
            }))

            logger.info(f"TOOL: Tool response sent for {tool_name}")

        except Exception as e:
            logger.error(f"Tool execution error: {e}", exc_info=True)

            # Send error response
            error_result = json.dumps({
                "status": "error",
                "message": str(e)
            })

            try:
                await self.hume_ws.send(json.dumps({
                    "type": "tool_response",
                    "tool_call_id": tool_call_id,
                    "content": error_result
                }))
            except Exception as send_error:
                logger.error(f"Failed to send error response: {send_error}")

    async def execute_save_note(self, params: Dict) -> str:
        """
        Execute save_session_note tool.

        Stores note in memory for later DB save.

        Args:
            params: {note: str, category: str, importance: str}
        """
        note = params.get("note")
        category = params.get("category")
        importance = params.get("importance", "medium")

        logger.info(f"NOTE: Saving {category} note (importance: {importance})")

        # Store in memory
        self.session_data["notes"].append({
            "content": note,
            "category": category,
            "importance": importance,
            "timestamp": datetime.now().isoformat(),
            "source": "ai_agent"
        })

        result = {
            "status": "success",
            "message": f"Note saved ({category})"
        }

        return json.dumps(result)

    async def execute_kg_update(self, params: Dict) -> str:
        """
        Execute update_kg_important tool.

        Stores KG event for later processing.

        Args:
            params: {node_type: str, significance: str, emotion: str, trigger: str, context: str}
        """
        node_type = params.get("node_type")
        significance = params.get("significance")

        logger.info(f"KG: Adding {node_type} node (significance: {significance})")

        # Store in memory
        self.session_data["kg_events"].append({
            "node_type": node_type,
            "significance": significance,
            "emotion": params.get("emotion"),
            "trigger": params.get("trigger"),
            "context": params.get("context"),
            "timestamp": datetime.now().isoformat()
        })

        result = {
            "status": "success",
            "message": f"KG node added ({node_type})"
        }

        return json.dumps(result)

    async def execute_mark_progress(self, params: Dict) -> str:
        """
        Execute mark_progress tool.

        Flags therapeutic progress.

        Args:
            params: {progress_type: str, description: str, evidence: str}
        """
        progress_type = params.get("progress_type")
        description = params.get("description")

        logger.info(f"PROGRESS: Marking {progress_type} - {description}")

        # Store in memory
        self.session_data["progress_markers"].append({
            "progress_type": progress_type,
            "description": description,
            "evidence": params.get("evidence"),
            "timestamp": datetime.now().isoformat()
        })

        result = {
            "status": "success",
            "message": f"Progress marked ({progress_type})"
        }

        return json.dumps(result)

    async def execute_flag_concern(self, params: Dict) -> str:
        """
        Execute flag_concern tool.

        Flags concerning patterns for therapist attention.

        Args:
            params: {concern_type: str, severity: str, description: str, recommended_action: str}
        """
        concern_type = params.get("concern_type")
        severity = params.get("severity")
        description = params.get("description")

        logger.warning(f"CONCERN: {concern_type} (severity: {severity}) - {description}")

        # Store in memory
        self.session_data["concerns"].append({
            "concern_type": concern_type,
            "severity": severity,
            "description": description,
            "recommended_action": params.get("recommended_action"),
            "timestamp": datetime.now().isoformat()
        })

        result = {
            "status": "success",
            "message": f"Concern flagged ({concern_type})",
            "alert": severity == "urgent"  # Frontend should show urgent alert
        }

        return json.dumps(result)

    async def execute_generate_summary(self, params: Dict) -> str:
        """
        Execute generate_session_summary tool.

        Generates structured summary from session data.

        Args:
            params: {include_emotions: bool, include_topics: bool, include_recommendations: bool}
        """
        logger.info("SUMMARY: Generating session summary")

        summary = {
            "notes_count": len(self.session_data["notes"]),
            "kg_events_count": len(self.session_data["kg_events"]),
            "progress_markers": self.session_data["progress_markers"],
            "concerns": self.session_data["concerns"]
        }

        result = {
            "status": "success",
            "summary": summary
        }

        return json.dumps(result)

    def get_session_data(self) -> Dict:
        """
        Get accumulated session data for DB save.

        Returns:
            Dictionary with notes, kg_events, progress, concerns
        """
        return self.session_data

    # ========================================
    # AUTOMATIC CONTEXT INJECTION (NEW)
    # ========================================

    async def queue_context_update(self, session_id: str, emotions: Dict, content: str):
        """
        Queue context update with debouncing.

        Called after EVERY user_message to keep agent constantly aware.
        Uses debouncing to batch rapid messages together.

        Args:
            session_id: Current session ID
            emotions: Current emotion scores
            content: Patient speech content
        """
        # Store emotion in rolling window
        if emotions:
            primary_emotion = max(emotions.items(), key=lambda x: x[1]) if emotions else ("neutral", 0.0)
            self.recent_emotions.append({
                "emotion": primary_emotion[0],
                "intensity": primary_emotion[1],
                "timestamp": datetime.now()
            })

            # Keep only recent emotions
            if len(self.recent_emotions) > self.max_emotion_history:
                self.recent_emotions.pop(0)

        # Set pending update
        self.pending_context_update = (session_id, datetime.now())

        # Wait for debounce delay
        await asyncio.sleep(self.context_debounce_delay)

        # If no new update came during debounce, send it
        if self.pending_context_update == (session_id, self.pending_context_update[1]):
            await self.inject_context_update(session_id)
            self.pending_context_update = None

    async def inject_context_update(self, session_id: str):
        """
        Inject updated context to Hume AI agent.

        Sends concise summary of current session state to keep
        agent aware of conversation flow and emotional patterns.

        Args:
            session_id: Current session ID
        """
        if not self.hume_ws:
            logger.warning("CONTEXT: Cannot inject update - WebSocket not connected")
            return

        try:
            # Build context update
            context_text = self._build_context_update()

            # Inject via session_settings (hidden from patient)
            context_message = {
                "type": "session_settings",
                "context": {
                    "text": context_text
                }
            }

            await self.hume_ws.send(json.dumps(context_message))
            self.last_context_update_time = datetime.now().timestamp()

            logger.info(f"CONTEXT: Injected update ({len(context_text)} chars)")
            logger.debug(f"CONTEXT: {context_text}")

        except Exception as e:
            logger.error(f"CONTEXT: Failed to inject update: {e}", exc_info=True)

    def _build_context_update(self) -> str:
        """
        Build concise context summary from current session state.

        Returns ultra-concise context (max 400 chars) for performance.

        Returns:
            Formatted context string
        """
        lines = ["[SESSION CONTEXT UPDATE]"]

        # 1. Current emotion trend
        if self.recent_emotions:
            # Get last 3 emotions
            recent_3 = self.recent_emotions[-3:]
            emotion_summary = ", ".join([
                f"{e['emotion']}({e['intensity']:.1f})"
                for e in recent_3
            ])
            lines.append(f"Emotions: {emotion_summary}")

            # Detect trend
            if len(self.recent_emotions) >= 2:
                prev_intensity = self.recent_emotions[-2]['intensity']
                curr_intensity = self.recent_emotions[-1]['intensity']
                if curr_intensity - prev_intensity > 0.2:
                    lines.append("⚠ Emotion intensity increasing")
                elif prev_intensity - curr_intensity > 0.2:
                    lines.append("✓ Emotion intensity decreasing")

        # 2. Recent notes (last 2)
        if self.session_data["notes"]:
            recent_notes = self.session_data["notes"][-2:]
            notes_summary = "; ".join([
                f"{n['category']}: {n['content'][:50]}"
                for n in recent_notes
            ])
            lines.append(f"Notes: {notes_summary}")

        # 3. Progress markers
        if self.session_data["progress_markers"]:
            last_progress = self.session_data["progress_markers"][-1]
            lines.append(f"✓ Progress: {last_progress['progress_type']}")

        # 4. Concerns (if any)
        urgent_concerns = [
            c for c in self.session_data["concerns"]
            if c["severity"] == "urgent"
        ]
        if urgent_concerns:
            lines.append(f"⚠ URGENT: {len(urgent_concerns)} concern(s)")

        # 5. Session duration
        # TODO: Calculate from session start time
        lines.append(f"Duration: ~{len(self.recent_emotions) * 2} min")

        context = "\n".join(lines)

        # Truncate if too long (max 400 chars for performance)
        if len(context) > 400:
            context = context[:397] + "..."

        return context

    async def close(self):
        """Close Hume WebSocket connection"""
        self.is_running = False
        if self.hume_ws:
            await self.hume_ws.close()
            self.hume_ws = None
            logger.info("HUME: WebSocket connection closed")
