from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # OpenAI
    OPENAI_API_KEY: str
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # Semantic Similarity
    SIMILARITY_THRESHOLD: float = 0.75
    
    # Entity Extraction
    EXTRACTION_INTERVAL: int = 30  # seconds
    
    # OpenAI Models
    GPT_MODEL: str = "gpt-4-0125-preview"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
