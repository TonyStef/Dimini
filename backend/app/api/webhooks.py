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

        # Execute tool handler
        # TODO Phase 4: Extract session_id from chat_id or custom_session_id
        # For now, use chat_id as session_id
        session_id = chat_id or "default_session"

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
    """
    try:
        payload = await request.json()
        chat_id = payload.get("chat_id")
        logger.info(f"Chat started: {chat_id}")

        # TODO Phase 4: Initialize session in database
        # TODO Phase 5: Broadcast session start to frontend via WebSocket

        return {"status": "success", "message": "Chat session initialized"}

    except Exception as e:
        logger.error(f"Error handling chat_started webhook: {e}")
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
