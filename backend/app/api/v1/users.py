from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/{user_id}/history")
async def get_user_complete_history(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    ADMIN ROUTE: Aggregates a specific user's complete history across all collections.
    """
    try:
        # 1. Safely check if it's a valid MongoDB ObjectId format
        if ObjectId.is_valid(user_id):
            query = {"_id": ObjectId(user_id)}
        else:
            # Fallback just in case your database has test users with standard string IDs
            query = {"_id": user_id}

        # 2. Fetch the core user profile
        user = await db["customer"].find_one(query)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database")

        user_email = user.get("email", "Unknown Email")

        # 3. Return the structured MOCK response with the REAL user's identity attached
        # (This keeps your UI looking great while we build the actual Orders/Tickets collections)
        return {
            "profile": {
                "id": str(user["_id"]),
                "name": user.get("name", "Unknown User"),
                "email": user_email,
                "joined": "2024-01-15", # Placeholder
            },
            "stats": {
                "lifetime_value": 145000,
                "active_rentals": 2,
                "open_tickets": 1
            },
            "purchases": [
                {"id": "ORD-9921", "date": "2024-01-10", "item": "Fanuc M-20iA", "amount": 45000, "status": "Delivered"}
            ],
            "rentals": [
                {"id": "RNT-3312", "date": "2024-02-01", "item": "Universal Robots UR10e", "monthly_rate": 1200, "status": "Active"},
                {"id": "RNT-3313", "date": "2024-02-01", "item": "Boston Dynamics Spot", "monthly_rate": 3500, "status": "Active"}
            ],
            "trade_ins": [
                {"id": "TRD-104", "date": "2023-12-05", "item": "ABB IRB 120", "offer": 12500, "status": "Completed"}
            ],
            "repairs": [
                {"id": "TCK-882", "date": "2024-02-14", "issue": "Joint 3 Jitter", "robot": "Fanuc M-20iA", "status": "In Progress"}
            ]
        }
    except Exception as e:
        # Print the exact error in your Python terminal so you can debug if it fails again
        print(f"Error fetching dossier: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid Request: {str(e)}")