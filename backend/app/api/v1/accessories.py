import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone
from typing import List, Optional

from app.schemas.accessory_schema import AccessoryCreate, AccessoryUpdate, AccessoryResponse
from app.db.mongodb import get_database

router = APIRouter()

UPLOAD_DIR = "static/models"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def format_mongo_doc(doc) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

@router.post("/", response_model=AccessoryResponse)
async def create_accessory(
    accessory_data: str = Form(...),
    images: Optional[List[UploadFile]] = File(None), # CACHES MULTIPLE FILES
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    accessory = AccessoryCreate.model_validate_json(accessory_data)
    acc_dict = accessory.model_dump()
    
    saved_images = []
    
    # LOOP THROUGH EVERY UPLOADED IMAGE
    if images:
        for img in images:
            if img.filename:
                unique_filename = f"acc_{uuid.uuid4().hex[:8]}_{img.filename}"
                file_location = f"{UPLOAD_DIR}/{unique_filename}"
                with open(file_location, "wb+") as file_object:
                    shutil.copyfileobj(img.file, file_object)
                saved_images.append(f"/static/models/{unique_filename}")
            
    if saved_images:
        acc_dict["images"] = saved_images
        acc_dict["image_url"] = saved_images[0] # Sets the first one as primary
        
    acc_dict["created_at"] = datetime.now(timezone.utc)
    
    result = await db["accessories"].insert_one(acc_dict)
    created_acc = await db["accessories"].find_one({"_id": result.inserted_id})
    return format_mongo_doc(created_acc)


@router.get("/", response_model=list[AccessoryResponse])
async def get_accessories(db: AsyncIOMotorDatabase = Depends(get_database)):
    cursor = db["accessories"].find({}).sort("created_at", -1)
    accessories = await cursor.to_list(length=500)
    return [format_mongo_doc(acc) for acc in accessories]


@router.patch("/{acc_id}", response_model=AccessoryResponse)
async def update_accessory(
    acc_id: str, 
    accessory_data: str = Form(None),
    images: Optional[List[UploadFile]] = File(None), # CACHES MULTIPLE FILES
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    update_dict = {}
    
    if accessory_data:
        update_model = AccessoryUpdate.model_validate_json(accessory_data)
        update_dict = {k: v for k, v in update_model.model_dump().items() if v is not None}

    saved_images = []
    
    # LOOP THROUGH EVERY UPLOADED IMAGE
    if images:
        for img in images:
            if img.filename:
                unique_filename = f"acc_{uuid.uuid4().hex[:8]}_{img.filename}"
                file_location = f"{UPLOAD_DIR}/{unique_filename}"
                with open(file_location, "wb+") as file_object:
                    shutil.copyfileobj(img.file, file_object)
                saved_images.append(f"/static/models/{unique_filename}")

    if saved_images:
        update_dict["images"] = saved_images
        update_dict["image_url"] = saved_images[0]

    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")

    await db["accessories"].update_one({"_id": ObjectId(acc_id)}, {"$set": update_dict})
    updated_acc = await db["accessories"].find_one({"_id": ObjectId(acc_id)})
    return format_mongo_doc(updated_acc)


@router.delete("/{acc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_accessory(acc_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    await db["accessories"].delete_one({"_id": ObjectId(acc_id)})
    return None