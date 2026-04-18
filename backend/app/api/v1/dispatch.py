# backend/app/api/admin/dispatch.py
from fastapi import APIRouter, Depends, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import uuid

router = APIRouter()

class AssignOperatorRequest(BaseModel):
    operator_id: str

@router.get("/requests")
async def get_dispatch_requests(db: AsyncIOMotorDatabase = Depends(get_database)):
    try:
        # 1. Fetch the documents
        cursor = db["orders"].find({
            "is_managed": True, 
            "status": "Pending Dispatch" 
        }).sort("created_at", -1)
        
        orders = await cursor.to_list(length=100)
        
        # 2. CRITICAL FIX: Convert MongoDB objects to JSON-friendly dictionaries
        formatted_orders = []
        for order in orders:
            formatted_orders.append({
                "id": str(order["_id"]), # Convert ObjectId to string
                "order_id": order.get("order_id"),
                "email": order.get("email"),
                "location_zone": order.get("location_zone"),
                "items": order.get("items", []),
                "total": order.get("total", 0),
                "status": order.get("status"),
                "created_at": str(order.get("created_at")) # Convert datetime to string
            })
            
        return formatted_orders

    except Exception as e:
        # This will show you the error in the terminal if it still fails
        print(f"Error in dispatch requests: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/available-operators")
async def get_operators_for_zone(zone: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Find operators who cover the user's selected area
    cursor = db["operators"].find({"assigned_zones": zone, "status": "active"})
    operators = await cursor.to_list(length=50)
    return [{"id": str(op["_id"]), "name": op["name"]} for op in operators]

@router.patch("/assign/{order_id}")
async def assign_operator(order_id: str, payload: AssignOperatorRequest, db = Depends(get_database)):
    # 1. Check if the ID string is actually 24 characters (standard ObjectId)   
    if not ObjectId.is_valid(payload.operator_id):
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid format: '{payload.operator_id}' is not a valid MongoDB ID."
        )

    try:
        # 2. Proceed with conversion
        op_obj_id = ObjectId(payload.operator_id)
        operator = await db["operators"].find_one({"_id": op_obj_id})
        
        if not operator:
            raise HTTPException(status_code=404, detail="Operator not found in Database")

        # 3. Update the Order
        await db["orders"].update_one(
            {"order_id": order_id},
            {"$set": {
                "operator_id": payload.operator_id,
                "operator_name": operator.get("name"),
                "status": "Awaiting Payment"
            }}
        )
        return {"message": "Assigned successfully"}

    except Exception as e:
        print(f"Server Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    


class OperatorCreate(BaseModel):
    name: str
    assigned_zones: List[str] # List of strings like ["San Diego, CA", "Austin, TX"]
    status: str = "active"

@router.post("/add")
async def create_operator(operator: OperatorCreate, db = Depends(get_database)):
    try:
        new_op = {
            "name": operator.name,
            "assigned_zones": operator.assigned_zones,
            "status": operator.status,
            "booked_dates": [] # Initialize empty calendar
        }
        
        result = await db["operators"].insert_one(new_op)
        return {"message": "Operator added successfully", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_operators(db = Depends(get_database)):
    cursor = db["operators"].find()
    operators = await cursor.to_list(length=100)
    return [{"id": str(op["_id"]), "name": op["name"], "zones": op["assigned_zones"]} for op in operators]

@router.delete("/{operator_id}")
async def delete_operator(operator_id: str, db = Depends(get_database)):
    try:
        # Check if ID is valid
        if not ObjectId.is_valid(operator_id):
            raise HTTPException(status_code=400, detail="Invalid ID format")
            
        result = await db["operators"].delete_one({"_id": ObjectId(operator_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Operator not found")
            
        return {"message": "Operator removed from system"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))