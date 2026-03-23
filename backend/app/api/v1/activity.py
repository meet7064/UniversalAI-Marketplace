from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone, timedelta
from app.db.mongodb import get_database
from pydantic import BaseModel

router = APIRouter()

# Schema for what the frontend sends every 60 seconds
class HeartbeatPayload(BaseModel):
    user_id: str
    name: str
    company: str
    current_action: str  # e.g., "Browsing Fleet", "Viewing UR10e"

@router.post("/heartbeat")
async def log_user_heartbeat(payload: HeartbeatPayload, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Upsert the user's activity profile
    await db["user_activity"].update_one(
        {"user_id": payload.user_id},
        {"$set": {
            "name": payload.name,
            "company": payload.company,
            "current_action": payload.current_action,
            "last_active": datetime.now(timezone.utc)
        }},
        upsert=True # Creates the record if it doesn't exist
    )
    return {"status": "Heartbeat logged"}

@router.get("/pulse")
async def get_active_users(db: AsyncIOMotorDatabase = Depends(get_database)):
    # Fetch everyone who has been active in the last 24 hours
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    cursor = db["user_activity"].find({"last_active": {"$gte": cutoff}}).sort("last_active", -1)
    activities = await cursor.to_list(length=50)

    pulse_data = []
    now = datetime.now(timezone.utc)

    for act in activities:
        # 1. Ensure the timestamp is offset-aware
        last_active = act.get("last_active")
        if last_active.tzinfo is None:
            last_active = last_active.replace(tzinfo=timezone.utc)

        # 2. Calculate how long ago they pinged the server
        diff = now - last_active
        minutes_ago = diff.total_seconds() / 60

        # 3. Determine Status based on time
        if minutes_ago < 3:
            status = "ONLINE"
            status_color = "text-emerald-400"
            dot_color = "bg-emerald-400"
        elif minutes_ago < 15:
            status = "AWAY"
            status_color = "text-amber-400"
            dot_color = "bg-amber-400"
        else:
            status = "OFFLINE"
            status_color = "text-zinc-500"
            dot_color = "bg-zinc-700"

        # Generate initials (e.g., "Meet Panchal" -> "MP")
        name_parts = act.get("name", "Unknown User").split()
        initials = "".join([n[0] for n in name_parts[:2]]).upper()

        pulse_data.append({
            "id": act["user_id"],
            "initials": initials,
            "name": act.get("name"),
            "company": act.get("company"),
            "status": status,
            "robot": act.get("current_action"),
            "statusColor": status_color,
            "dotColor": dot_color
        })

    return pulse_data