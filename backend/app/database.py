from prisma import Prisma
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

# Global Prisma instance
prisma = Prisma()

async def connect_db():
    """Connect to the database"""
    if not prisma.is_connected():
        await prisma.connect()
        logger.info("Connected to database")

async def disconnect_db():
    """Disconnect from the database"""
    if prisma.is_connected():
        await prisma.disconnect()
        logger.info("Disconnected from database")

@asynccontextmanager
async def get_db():
    """
    Get database connection context manager.
    Ensures connection is available.
    """
    if not prisma.is_connected():
        await connect_db()
    try:
        yield prisma
    finally:
        # Keep connection alive for other requests
        pass

# Direct access to prisma client for services
db = prisma
