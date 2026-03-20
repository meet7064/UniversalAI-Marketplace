import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "robot-marketplace"
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "robot_marketplace_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key")
    
    class Config:
        env_file = ".env"

settings = Settings()