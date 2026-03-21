import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone

from fastapi import File, UploadFile
from bson import ObjectId
from app.schemas.asset_schema import AssetCreate, AssetResponse, AssetUpdate
from app.db.mongodb import get_database

router = APIRouter()

UPLOAD_DIR = "static/models"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Helper function to convert MongoDB's _id object to a readable string
def format_mongo_doc(doc) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(asset: AssetCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Convert Pydantic model to a dictionary
    asset_dict = asset.model_dump()
    
    # Add timestamps
    asset_dict["created_at"] = datetime.now(timezone.utc)
    
    # Insert into the "fleet" collection in MongoDB
    result = await db["fleet"].insert_one(asset_dict)
    
    # Fetch the newly created document to return to the frontend
    created_asset = await db["fleet"].find_one({"_id": result.inserted_id})
    
    return format_mongo_doc(created_asset)

@router.get("/", response_model=list[AssetResponse])
async def get_fleet(db: AsyncIOMotorDatabase = Depends(get_database)):
    # Fetch all robots from MongoDB
    cursor = db["fleet"].find({})
    fleet = await cursor.to_list(length=100) # Limit to 100 for now
    
    # Format the IDs for Next.js
    return [format_mongo_doc(robot) for robot in fleet]

@router.post("/{asset_id}/twin", status_code=status.HTTP_200_OK)
async def upload_digital_twin(
    asset_id: str, 
    file: UploadFile = File(...), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # 1. Validate the file type (ensure it's a 3D model)
    if not file.filename.endswith(('.glb', '.gltf')):
        raise HTTPException(status_code=400, detail="Only .glb or .gltf files are accepted")

    # 2. Save the file locally 
    # (In production, you would upload to AWS S3 here)
    file_location = f"{UPLOAD_DIR}/{asset_id}_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # 3. Create the URL that Next.js will use to fetch the model
    model_url = f"/static/models/{asset_id}_{file.filename}"
    
    # 4. Update the robot's document in MongoDB
    await db["fleet"].update_one(
        {"_id": ObjectId(asset_id)},
        {"$set": {"model_url": model_url}}
    )

    return {
        "message": "Digital Twin successfully linked to asset", 
        "model_url": model_url
    }

@router.patch("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: str, 
    update_data: AssetUpdate, 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # 1. Convert the Pydantic model to a dict, but ONLY keep fields that were actually sent
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    # 2. Update those specific fields in MongoDB
    await db["fleet"].update_one(
        {"_id": ObjectId(asset_id)},
        {"$set": update_dict}
    )
    
    # 3. Fetch and return the fresh document
    updated_asset = await db["fleet"].find_one({"_id": ObjectId(asset_id)})
    if not updated_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return format_mongo_doc(updated_asset)

@router.post("/{asset_id}/image", status_code=status.HTTP_200_OK)
async def upload_asset_image(
    asset_id: str, 
    file: UploadFile = File(...), 
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # 1. Validate the file is actually an image
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
        raise HTTPException(status_code=400, detail="Only image files are accepted")

    # 2. Save it locally
    file_location = f"{UPLOAD_DIR}/{asset_id}_img_{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)

    # 3. Create the URL and save to MongoDB
    image_url = f"/static/models/{asset_id}_img_{file.filename}"
    
    await db["fleet"].update_one(
        {"_id": ObjectId(asset_id)},
        {"$set": {"image_url": image_url}}
    )

    return {"message": "Image successfully linked", "image_url": image_url}


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_asset(asset_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    # Attempt to delete the document from MongoDB
    result = await db["fleet"].delete_one({"_id": ObjectId(asset_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return None
