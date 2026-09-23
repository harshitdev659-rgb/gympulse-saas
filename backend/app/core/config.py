import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Application & Branding
    APP_NAME: str = "GymPulse SaaS"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Production-Ready Multi-Tenant Gym Management Platform"
    DEBUG: bool = False
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Security & JWT
    SECRET_KEY: str = "gympulse-super-secret-key-change-in-production-min32chars!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./gympulse.db"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # SaaS Billing Configuration
    BILLING_ENABLED: bool = True
    TIER_FREE_MAX_MEMBERS: int = 25
    TIER_PRO_MAX_MEMBERS: int = 250
    TIER_BUSINESS_MAX_MEMBERS: int = 100000  # Unlimited
    
    # AI Provider Configuration
    AI_PROVIDER: str = "local"  # "local", "openai", "gemini", "anthropic"
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    
    # Uploads & Media
    UPLOAD_DIR: str = "./uploads"

    # Cloud Hosting 24/7 URL
    CLOUD_APP_URL: str = "https://harshitdev659-rgb.github.io/gympulse-saas/"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
