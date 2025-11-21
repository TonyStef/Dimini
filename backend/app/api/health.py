from fastapi import APIRouter
from app.database import prisma

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected" if prisma.is_connected() else "disconnected",
        "version": "1.0.0"
    }

@router.get("/ready")
async def readiness_check():
    """Readiness check for deployment"""
    # Check database connection
    db_connected = prisma.is_connected()
    
    if not db_connected:
        return {
            "status": "not ready",
            "database": "disconnected"
        }, 503
        
    return {
        "status": "ready",
        "database": "connected"
    }
