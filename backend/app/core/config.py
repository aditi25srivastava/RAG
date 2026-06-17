from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResearchGPT Pro"
    DATABASE_URL: str = "sqlite:///./researchgpt.db"
    REDIS_URL: str = "redis://localhost:6379/0" # Keeping it but won't strictly depend on it for basic memory
    GEMINI_API_KEY: str = ""
    UPLOAD_DIR: str = "uploads"
    VECTOR_STORE_DIR: str = "vector_store"
    
    class Config:
        env_file = ".env"

settings = Settings()
