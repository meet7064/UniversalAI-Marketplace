from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from app.db.mongodb import get_database
from app.core.deps import get_current_user

router = APIRouter()

@router.post("/heartbeat")
async def update_heartbeat(
    current_user: dict = Depends(get_current_user), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    SILENT ROUTE: The Next.js frontend pings this every 2 minutes 
    to tell the Admin dashboard this user is online.
    """
    # Update this user's last_active timestamp to RIGHT NOW
    await db["users"].update_one(
        {"email": current_user["email"]},
        {"$set": {"last_active": datetime.now(timezone.utc)}}
    )
    return {"status": "alive"}