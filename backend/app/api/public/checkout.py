import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from typing import Optional, Dict
router = APIRouter()

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int

class CheckoutRequest(BaseModel):
    items: list[CartItem]
    total: float
    email: str  # <--- NEW: Expect the email from the frontend!
    is_managed: bool = False # ADD THIS
    location_zone: Optional[str] = None # ADD THIS
    shipping_address: Optional[Dict[str, str]] = None

@router.post("/")
async def process_checkout(
    request: CheckoutRequest,
    authorization: str = Header(None), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        secure_subtotal = sum(item.price * item.quantity for item in request.items)
        secure_tax = secure_subtotal * 0.08
        secure_total = secure_subtotal + secure_tax

        order_id = f"ORD-{str(uuid.uuid4())[:8].upper()}"

        order_data = {
            "order_id": order_id,
            "email": request.email.strip(),
            "items": [item.model_dump() for item in request.items],
            "subtotal": secure_subtotal,
            "tax": secure_tax,
            "total": secure_total,
            "status": "Pending Dispatch" if request.is_managed else "Pending Approval",
            "payment_status": "Paid", 
            "shipping_address": request.shipping_address,
            "is_managed": request.is_managed, # SAVE THE FLAG
    "location_zone": request.location_zone, # SAVE THE ZONE
            "created_at": datetime.now(timezone.utc)
        }

        # Save order to database
        await db["orders"].insert_one(order_data)

        if request.is_managed:
            return {
            "message": "Dispatch request submitted successfully",
            "order_id": order_id,
            "type": "managed_request"
        }
    
        return {
        "message": "Payment successful and order created",
        "order_id": order_id
    }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")