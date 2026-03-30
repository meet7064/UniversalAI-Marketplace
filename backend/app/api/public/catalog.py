from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/")
async def get_public_catalog(
    limit: int = Query(50, ge=1, le=100, description="Max number of items to return"),
    category: Optional[str] = Query(None, description="Filter by Buy or Rent"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    query = {"status": {"$ne": "Maintenance"}}
    if category and category != "All":
        query["category"] = category

    cursor = db["fleet"].find(query).sort("_id", -1).limit(limit)
    assets = await cursor.to_list(length=limit)

    formatted_assets = []
    for asset in assets:
        asset["id"] = str(asset.pop("_id"))
        asset["price"] = float(asset.get("price", 0))
        asset["hours"] = int(asset.get("hours", 0))
        asset["payload"] = int(asset.get("payload", 0))
        asset["reach"] = int(asset.get("reach", 0))
        
        # NEW: Ensure key_features is always an array
        asset["key_features"] = asset.get("key_features", [])
        
        formatted_assets.append(asset)

    return formatted_assets

@router.get("/{asset_id}")
async def get_single_asset(asset_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    from bson import ObjectId
    try:
        asset = await db["fleet"].find_one({"_id": ObjectId(asset_id), "status": {"$ne": "Maintenance"}})
        if not asset:
            return {"error": "Asset not found or currently unavailable"}
            
        asset["id"] = str(asset.pop("_id"))
        # NEW: Ensure key_features is safely passed
        asset["key_features"] = asset.get("key_features", [])
        
        return asset
    except Exception:
        return {"error": "Invalid asset ID format"}