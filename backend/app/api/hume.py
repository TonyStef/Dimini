from fastapi import APIRouter, HTTPException
from app.voice_agent.services.hume_service import HumeService
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/hume", tags=["hume"])

@router.post("/token")
async def get_session_token():
    """
    Generate Hume AI session token for frontend WebSocket connection.

    Returns:
        {
            "access_token": "...",
            "expires_in": 900
        }
    """
    try:
        hume_service = HumeService(
            api_key=settings.HUME_API_KEY,
            secret_key=settings.HUME_SECRET_KEY,
            config_id=settings.HUME_CONFIG_ID
        )

        token = await hume_service.create_session_token()

        logger.info("Hume session token generated successfully")

        return {
            "access_token": token,
            "expires_in": 900  # 15 minutes
        }

    except Exception as e:
        logger.error(f"Token generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")
