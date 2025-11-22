from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import json

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Neo4j
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str

    # OpenAI API
    OPENAI_API_KEY: str = ""
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    @field_validator('ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_allowed_origins(cls, v):
        """Parse ALLOWED_ORIGINS from various formats"""
        if isinstance(v, str):
            # Try parsing as JSON first
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                # Fall back to comma-separated
                return [origin.strip() for origin in v.split(',') if origin.strip()]
        return v

    # Semantic Similarity
    SIMILARITY_THRESHOLD: float = 0.50  # Lowered from 0.75 to allow more connections
    
    # Entity Extraction
    EXTRACTION_INTERVAL: int = 30  # seconds
    
    # OpenAI Models
    GPT_MODEL: str = "gpt-4-0125-preview"
    EMBEDDING_MODEL: str = "text-embedding-3-small"

    # Hume AI
    HUME_API_KEY: str
    HUME_SECRET_KEY: str
    HUME_CONFIG_ID: str

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        # Docker: env vars loaded via docker-compose env_file
        # Local: reads from ../env (project root)
        env_file = "../.env"
        env_file_encoding = "utf-8"

settings = Settings()
