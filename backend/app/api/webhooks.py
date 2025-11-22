"""
Webhook Endpoints

Handles incoming webhooks from external services (Hume AI, etc).
"""

from fastapi import APIRouter, Request, HTTPException
from typing import Dict
import logging
import json

from app.voice_agent.services.tool_handlers import TOOL_HANDLERS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/hume/tool_call")
async def hume_tool_call(request: Request):
    """
    Handle Hume AI tool_call webhook.

    Receives tool execution requests from Hume AI voice agent
    and routes them to appropriate handlers.

    Webhook payload structure:
    {
        "chat_id": "string",
        "chat_group_id": "string",
        "event_name": "tool_call",
        "timestamp": 1234567890,
        "tool_call_message": {
            "name": "save_session_note",
            "parameters": "{\"note\": \"...\", \"category\": \"...\"}",
            "tool_call_id": "string",
            "tool_type": "function",
            "response_required": true
        }
    }
    """
    try:
        # Parse webhook payload
        payload = await request.json()
        logger.info(f"Received Hume tool_call webhook: {payload.get('event_name')}")

        # TODO Phase 3: Verify HMAC signature for security
        # signature = request.headers.get("X-Hume-Signature")
        # if not verify_hume_signature(signature, await request.body()):
        #     raise HTTPException(status_code=401, detail="Invalid signature")

        # Extract tool call data
        tool_call_message = payload.get("tool_call_message", {})
        tool_name = tool_call_message.get("name")
        parameters_str = tool_call_message.get("parameters", "{}")
        tool_call_id = tool_call_message.get("tool_call_id")
        chat_id = payload.get("chat_id")

        if not tool_name:
            raise HTTPException(status_code=400, detail="Missing tool name")

        # Parse parameters (Hume sends as JSON string)
        try:
            parameters = json.loads(parameters_str) if isinstance(parameters_str, str) else parameters_str
        except json.JSONDecodeError:
            logger.error(f"Failed to parse parameters: {parameters_str}")
            raise HTTPException(status_code=400, detail="Invalid parameters format")

        # Get handler for this tool
        handler = TOOL_HANDLERS.get(tool_name)
        if not handler:
            logger.error(f"No handler found for tool: {tool_name}")
            raise HTTPException(status_code=404, detail=f"Tool not found: {tool_name}")

        # Map Hume chat_id to PostgreSQL session_id
        from app.database import db

        # Try to find session by humeChatId
        session = await db.session.find_first(
            where={"humeChatId": chat_id}
        )

        if not session:
            # Fallback: If no humeChatId mapping, try to find latest ACTIVE session
            # This handles the case where chat_started hasn't linked yet
            session = await db.session.find_first(
                where={"status": "ACTIVE"},
                order={"startedAt": "desc"}
            )

            if session:
                # Save humeChatId for future tool calls
                await db.session.update(
                    where={"id": session.id},
                    data={"humeChatId": chat_id}
                )
                logger.info(f"Linked chat_id {chat_id} to session {session.id}")

        if not session:
            logger.error(f"No session found for chat_id: {chat_id}")
            raise HTTPException(status_code=404, detail="Session not found for this chat")

        session_id = session.id
        logger.info(f"Executing tool '{tool_name}' for session {session_id}")
        result = await handler(session_id=session_id, params=parameters)

        # Return response to Hume AI
        return {
            "tool_call_id": tool_call_id,
            "result": result,
            "timestamp": payload.get("timestamp")
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Error handling tool_call webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hume/chat_started")
async def hume_chat_started(request: Request):
    """
    Handle Hume AI chat_started webhook.

    Called when a new chat session begins.
    Saves Hume chat_id to session for future tool call mapping.
    """
    from app.database import db

    try:
        payload = await request.json()
        chat_id = payload.get("chat_id")
        custom_session_id = payload.get("custom_session_id")  # May be None if not supported

        logger.info(f"Chat started: chat_id={chat_id}, custom_session_id={custom_session_id}")

        if custom_session_id:
            # OPTION 1: Hume supports custom_session_id
            # Update existing session with humeChatId
            session = await db.session.update(
                where={"id": custom_session_id},
                data={"humeChatId": chat_id}
            )
            logger.info(f"Saved humeChatId {chat_id} for session {session.id}")
        else:
            # OPTION 2: No custom_session_id - cannot link to session yet
            # Session will be linked when tool_call arrives (by querying latest active session)
            logger.warning(f"No custom_session_id provided - humeChatId mapping deferred")

        return {"status": "success", "message": "Chat session initialized", "chat_id": chat_id}

    except Exception as e:
        logger.error(f"Error handling chat_started webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/hume/chat_ended")
async def hume_chat_ended(request: Request):
    """
    Handle Hume AI chat_ended webhook.

    Called when a chat session ends.
    """
    try:
        payload = await request.json()
        chat_id = payload.get("chat_id")
        logger.info(f"Chat ended: {chat_id}")

        # TODO Phase 4: Finalize session in database
        # TODO Phase 5: Broadcast session end to frontend via WebSocket

        return {"status": "success", "message": "Chat session finalized"}

    except Exception as e:
        logger.error(f"Error handling chat_ended webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))
