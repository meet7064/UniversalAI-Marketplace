from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from app.db.mongodb import get_database
from bson import ObjectId

router = APIRouter()

@router.get("/")
async def get_public_accessories(
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    PUBLIC ROUTE: Feeds the customer accessories storefront.
    """
    query = {}
    
    if category and category != "All":
        query["category"] = category

    # Fetch from MongoDB, newest first
    cursor = db["accessories"].find(query).sort("_id", -1).limit(100)
    accessories = await cursor.to_list(length=100)

    formatted_accs = []
    for acc in accessories:
        acc["id"] = str(acc.pop("_id"))
        acc["price"] = float(acc.get("price", 0))
        acc["stock_quantity"] = int(acc.get("stock_quantity", 0))
        acc["images"] = acc.get("images", []) # Ensure array exists
        
        formatted_accs.append(acc)

    return formatted_accs

@router.get("/{acc_id}")
async def get_single_accessory(acc_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    """
    PUBLIC ROUTE: Fetches a single accessory for the Product Detail Page.
    """
    try:
        acc = await db["accessories"].find_one({"_id": ObjectId(acc_id)})
        if not acc:
            return {"error": "Accessory not found"}
            
        acc["id"] = str(acc.pop("_id"))
        acc["price"] = float(acc.get("price", 0))
        acc["stock_quantity"] = int(acc.get("stock_quantity", 0))
        acc["images"] = acc.get("images", [])
        
        return acc
    except Exception:
        return {"error": "Invalid accessory ID format"}