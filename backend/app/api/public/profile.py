from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/history")
async def get_user_ticket_history(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    PUBLIC ROUTE: Fetches all tickets submitted by a specific user email.
    Ready to be expanded with user settings, billing, and saved assets!
    """
    try:
        # Securely find all tickets matching the email, newest first
        cursor = db["tickets"].find(
            {"email": {"$regex": f"^{email.strip()}$", "$options": "i"}}
        ).sort("created_at", -1)
        
        tickets = await cursor.to_list(length=50) # Limit to last 50 tickets

        # Return safe, frontend-ready data
        history = []
        for t in tickets:
            history.append({
                "ticket_number": t.get("ticket_number"),
                "status": t.get("status"),
                "asset_name": t.get("asset_name") or t.get("robot_model", "Unknown Hardware"),
                "service_type": t.get("service_type"),
                "priority": t.get("priority") or t.get("urgency", "Standard"),
                "created_at": t.get("created_at"),
            })
            
        return history
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch ticket history.")

# Future placeholder:
# @router.get("/settings")
# async def get_user_settings(...)