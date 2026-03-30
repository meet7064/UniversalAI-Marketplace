from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from app.db.mongodb import get_database

router = APIRouter()

def calculate_status(last_active):
    if not last_active:
        return "Offline", "Never"
    
    # Ensure timezone awareness
    if last_active.tzinfo is None:
        last_active = last_active.replace(tzinfo=timezone.utc)
        
    now = datetime.now(timezone.utc)
    diff_minutes = (now - last_active).total_seconds() / 60
    
    if diff_minutes < 5:
        return "Online", "Just now" if diff_minutes < 1 else f"{int(diff_minutes)}m ago"
    elif diff_minutes < 15:
        return "Away", f"{int(diff_minutes)}m ago"
    else:
        hours = int(diff_minutes / 60)
        time_str = f"{hours}h ago" if hours > 0 else f"{int(diff_minutes)}m ago"
        return "Offline", time_str

@router.get("/")
async def get_real_user_activity(db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Fetch all customers from MongoDB, sorted by who was active most recently
    cursor = db["customer"].find({"role": "customer"}).sort("last_active", -1)
    users = await cursor.to_list(length=50)
    
    activities = []
    for user in users:
        # 2. Calculate their live status
        status, time_str = calculate_status(user.get("last_active"))
        
        # 3. Generate initials (e.g., "Meet Panchal" -> "MP")
        name = user.get("name", "Unknown User")
        parts = name.split()
        initials = "".join([p[0] for p in parts[:2]]).upper() if name else "U"
        
        # 4. Fetch their tickets & products (We will mock this specific part 
        # just until you build the Orders/Tickets collections, but the USER is real!)
        activities.append({
            "id": str(user["_id"]),
            "name": name,
            "email": user.get("email", ""),
            "initials": initials,
            "status": status,
            "time_ago": time_str,
            "service": "No active tickets",       # TODO: Link to Tickets DB later
            "product": "Browsing Marketplace"     # TODO: Link to Orders DB later
        })
        
    return activities