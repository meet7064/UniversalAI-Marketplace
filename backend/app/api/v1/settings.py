from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from app.db.mongodb import get_database

router = APIRouter()

# Schema for our settings
class PlatformSettings(BaseModel):
    admin_name: str = "Admin"
    admin_email: str = "admin@vshop.com"
    notifications_enabled: bool = True
    maintenance_mode: bool = False
    openai_api_key: str = ""

@router.get("/")
async def get_settings(db: AsyncIOMotorDatabase = Depends(get_database)):
    # We use a hardcoded ID "global_settings" so there is always only ONE settings document
    settings = await db["settings"].find_one({"_id": "global_settings"})
    
    if not settings:
        # Return default settings if none exist yet
        return PlatformSettings().model_dump()
        
    # Remove the internal Mongo ID before sending to frontend
    settings.pop("_id", None)
    return settings

@router.post("/")
async def update_settings(settings: PlatformSettings, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Upsert means "Update it if it exists, Create it if it doesn't"
    await db["settings"].update_one(
        {"_id": "global_settings"},
        {"$set": settings.model_dump()},
        upsert=True
    )
    return {"status": "Settings saved successfully"}