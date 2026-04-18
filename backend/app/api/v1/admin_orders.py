from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database

router = APIRouter()

class OrderStatusUpdate(BaseModel):
    status: str

@router.get("/")
async def get_all_orders(
    authorization: str = Header(None), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    ADMIN ROUTE: Fetches all orders across the entire platform.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    try:
        # Fetch all orders, newest first
        cursor = db["orders"].find().sort("created_at", -1)
        orders = await cursor.to_list(length=200) # Limit to 200 for dashboard performance

        formatted_orders = []
        for order in orders:
            formatted_orders.append({
                "id": str(order["_id"]),
                "order_id": order.get("order_id"),
                "email": order.get("email", "Unknown"),
                "status": order.get("status", "Pending Approval"),
                "total": order.get("total", 0),
                "items": order.get("items", []),
                "created_at": order.get("created_at")
            })

        return formatted_orders

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch orders: {str(e)}")

@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    payload: OrderStatusUpdate,
    authorization: str = Header(None), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    ADMIN ROUTE: Updates the status of a specific order.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Allowed statuses to prevent typos
    allowed_statuses = ["Pending Approval", "Approved", "Shipped", "Delivered", "Rejected"]
    if payload.status not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")

    try:
        result = await db["orders"].update_one(
            {"order_id": order_id}, 
            {"$set": {"status": payload.status}}
        )

        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Order not found or status is already set to this value.")

        return {"message": "Order status updated successfully", "new_status": payload.status}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")