from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SECRET_KEY: str = "ccrts-secret-key-2024-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = "sqlite:///./ccrts.db"

settings = Settings()
