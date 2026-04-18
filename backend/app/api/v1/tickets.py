from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
import random

from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketResponse
from app.db.mongodb import get_database

router = APIRouter()

def format_mongo_doc(doc) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# 1. Create a New Ticket (Used by both Admins and Users!)
@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(ticket: TicketCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    ticket_dict = ticket.model_dump()
    ticket_dict["created_at"] = datetime.now(timezone.utc)
    
    # Generate a random ticket number like "SRV-8492"
    ticket_dict["ticket_number"] = f"SRV-{random.randint(1000, 9999)}"
    
    result = await db["tickets"].insert_one(ticket_dict)
    created_ticket = await db["tickets"].find_one({"_id": result.inserted_id})
    
    # Optional: Automatically update the actual Robot's status to "Maintenance"
    await db["fleet"].update_one(
        {"_id": ObjectId(ticket.asset_id)},
        {"$set": {"status": "Maintenance"}}
    )
    
    return format_mongo_doc(created_ticket)

# 2. Get All Tickets (For the Admin Kanban Board)
# @router.get("/", response_model=list[TicketResponse])
# async def get_tickets(db: AsyncIOMotorDatabase = Depends(get_database)):
#     cursor = db["tickets"].find({}).sort("created_at", -1)
#     tickets = await cursor.to_list(length=200)
#     return [format_mongo_doc(t) for t in tickets]

# 2. Get All Tickets (For the Admin Kanban Board)
@router.get("/", response_model=list[TicketResponse])
async def get_tickets(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        cursor = db["tickets"].find({}).sort("created_at", -1)
        tickets = await cursor.to_list(length=200)
        
        safe_tickets = []
        for t in tickets:
            # Safeguard: Inject a fake ticket number if it's missing from old DB entries
            if "ticket_number" not in t:
                t["ticket_number"] = f"SRV-LEGACY-{str(t['_id'])[-4:].upper()}"
                
            safe_tickets.append(format_mongo_doc(t))
            
        return safe_tickets
    except Exception as e:
        # Print the exact error to your python terminal so you can see what failed
        print(f"Error fetching tickets: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch tickets")

# 3. Update a Ticket (Used when dragging/dropping columns in Kanban)
@router.patch("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: str, 
    update_data: TicketUpdate, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")

    await db["tickets"].update_one(
        {"_id": ObjectId(ticket_id)},
        {"$set": update_dict}
    )
    
    updated_ticket = await db["tickets"].find_one({"_id": ObjectId(ticket_id)})
    if not updated_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    return format_mongo_doc(updated_ticket)

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(ticket_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    result = await db["tickets"].delete_one({"_id": ObjectId(ticket_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return None