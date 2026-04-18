from fastapi import APIRouter, Depends, HTTPException, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class FinalizePaymentRequest(BaseModel):
    email: str
    shipping_address: dict

@router.get("/")
async def get_user_orders(
    authorization: str = Header(None), # Expecting Bearer token
    email: str = None, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    CUSTOMER ROUTE: Fetches the order history for the logged-in user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    if not email:
        raise HTTPException(status_code=400, detail="Email is required to fetch orders")

    try:
        # Fetch orders from MongoDB, newest first
        cursor = db["orders"].find({"email": email}).sort("created_at", -1)
        orders = await cursor.to_list(length=50)

        # Format for frontend
        formatted_orders = []
        for order in orders:
            formatted_orders.append({
                "id": str(order["_id"]),
                "order_id": order.get("order_id"),
                "email": order.get("email", email),               # Added for the Invoice
                "status": order.get("status", "Processing"),
                "subtotal": order.get("subtotal", 0),             # Added for the Invoice
                "tax": order.get("tax", 0),                       # Added for the Invoice
                "total": order.get("total", 0),
                "items": order.get("items", []),
                "shipping_address": order.get("shipping_address"), # <--- THE MAGIC FIX
                "created_at": order.get("created_at"),

                "is_managed": order.get("is_managed", False),
                "operator_name": order.get("operator_name"), # This was likely missing!
                "location_zone": order.get("location_zone")
            })

        return formatted_orders

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")
    

@router.get("/{order_id}")
async def get_order_for_checkout(order_id: str, db = Depends(get_database)):
    # 1. Clean the ID (removes any hidden spaces or newlines)
    clean_id = order_id.strip()
    
    print(f"--- DISPATCH DEBUG ---")
    print(f"Searching for order_id: '{clean_id}'") # Check your Python terminal for this!
    
    # 2. Search using the exact field name from your MongoDB
    order = await db["orders"].find_one({"order_id": clean_id})
    
    if not order:
        print(f"RESULT: No order found for '{clean_id}'")
        raise HTTPException(status_code=404, detail=f"Order {clean_id} not found in database")
    
    print(f"RESULT: Order found! Total: {order.get('total')}")
    
    # 3. Convert for JSON
    order["_id"] = str(order["_id"])
    return order

@router.post("/{order_id}/finalize-payment")
async def finalize_payment(
    order_id: str, 
    payload: FinalizePaymentRequest, # <--- Capture the body here
    db = Depends(get_database)
):
    # 2. Clean the ID exactly like the GET route
    clean_id = order_id.strip()
    
    # 3. Perform the update
    result = await db["orders"].update_one(
        {"order_id": clean_id},
        {"$set": {
            "status": "Paid",
            "payment_status": "Paid",
            "shipping_address": payload.shipping_address, # Update address at payment
            "dispatched_at": datetime.now()
        }}
    )

    # 4. Check if the order actually existed
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found for finalization")

    return {"message": "Order finalized successfully"}