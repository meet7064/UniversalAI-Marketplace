import os
import shutil
import uuid
import random # <-- Add random here
from fastapi import APIRouter, Depends, Form, UploadFile, File, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone
from app.db.mongodb import get_database

router = APIRouter()

UPLOAD_DIR = "static/logs"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def submit_repair_ticket(
    name: str = Form(...),
    email: str = Form(...),
    brand: str = Form(...),
    model: str = Form(...),
    service_type: str = Form(...),
    urgency: str = Form(...),
    description: str = Form(...),
    log_file: UploadFile = File(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    try:
        # TRANSLATE public data into the exact format the Admin Kanban Board expects!
        ticket_data = {
            "ticket_number": f"SRV-{random.randint(1000, 9999)}",
            
            # --- SAFEGUARDS PREVENTING .slice() CRASHES ---
            "asset_id": "PUBLIC-REQ",         # Prevents ticket.asset_id.slice() crash!
            "description": description,       # Prevents ticket.description.slice() crash!
            
            # --- KANBAN BOARD REQUIRED FIELDS ---
            "asset_name": f"{brand} {model}", 
            "issue": description,             
            "priority": urgency,              
            "reported_by": f"Customer: {name}", 
            "status": "In Repair" if service_type == "Diagnostic" else "Queue", 
            "assignee": "Unassigned",
            
            # --- PRESERVED STOREFRONT DATA ---
            "email": email,
            "service_type": service_type,
            "created_at": datetime.now(timezone.utc)
        }

        # Handle the log file or image upload if the user attached one
        if log_file and log_file.filename:
            unique_filename = f"ticket_{uuid.uuid4().hex[:8]}_{log_file.filename}"
            file_location = f"{UPLOAD_DIR}/{unique_filename}"
            with open(file_location, "wb+") as file_object:
                shutil.copyfileobj(log_file.file, file_object)
            ticket_data["file_url"] = f"/static/logs/{unique_filename}"

        # Insert into the "tickets" collection
        result = await db["tickets"].insert_one(ticket_data)
        
        return {
            "message": "Ticket submitted successfully", 
            "ticket_id": str(result.inserted_id),
            "ticket_number": ticket_data["ticket_number"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit ticket: {str(e)}")
    
@router.get("/track")
async def track_ticket_status(
    ticket_number: str,
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    PUBLIC ROUTE: Allows users to securely track their ticket status.
    """
    try:
        # Secure lookup: Requires both the ID and the exact email
        ticket = await db["tickets"].find_one({
            "ticket_number": ticket_number.upper().strip(),
            # Case-insensitive email match for better UX
            "email": {"$regex": f"^{email.strip()}$", "$options": "i"} 
        })

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found or email does not match.")

        # Return only safe, customer-facing data (No internal assignee names, etc.)
        return {
            "ticket_number": ticket.get("ticket_number"),
            "status": ticket.get("status"),
            "asset_name": ticket.get("asset_name") or ticket.get("robot_model"),
            "service_type": ticket.get("service_type"),
            "priority": ticket.get("priority") or ticket.get("urgency"),
            "created_at": ticket.get("created_at"),
            "issue": ticket.get("issue") or ticket.get("description"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="An error occurred while fetching the ticket.")