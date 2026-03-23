import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timezone

# We get to keep your beautiful schemas!
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
    # Accept the JSON string and the file simultaneously
    accessory_data: str = Form(..., description="JSON string matching AccessoryCreate"),
    image: UploadFile = File(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    # 1. Parse the JSON string through your Pydantic Schema for strict validation!
    accessory = AccessoryCreate.model_validate_json(accessory_data)
    acc_dict = accessory.model_dump()
    
    # 2. Handle the image if it was attached
    if image:
        unique_filename = f"acc_{uuid.uuid4().hex[:8]}_{image.filename}"
        file_location = f"{UPLOAD_DIR}/{unique_filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(image.file, file_object)
        acc_dict["image_url"] = f"/static/models/{unique_filename}"
        
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
    accessory_data: str = Form(None, description="JSON string matching AccessoryUpdate"),
    image: UploadFile = File(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    update_dict = {}
    
    # 1. Parse and validate text updates via Pydantic
    if accessory_data:
        update_model = AccessoryUpdate.model_validate_json(accessory_data)
        update_dict = {k: v for k, v in update_model.model_dump().items() if v is not None}

    # 2. Handle image replacement
    if image:
        unique_filename = f"acc_{uuid.uuid4().hex[:8]}_{image.filename}"
        file_location = f"{UPLOAD_DIR}/{unique_filename}"
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(image.file, file_object)
        update_dict["image_url"] = f"/static/models/{unique_filename}"

    if not update_dict:
        raise HTTPException(status_code=400, detail="No updates provided")

    await db["accessories"].update_one({"_id": ObjectId(acc_id)}, {"$set": update_dict})
    updated_acc = await db["accessories"].find_one({"_id": ObjectId(acc_id)})
    return format_mongo_doc(updated_acc)


@router.delete("/{acc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_accessory(acc_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    await db["accessories"].delete_one({"_id": ObjectId(acc_id)})
    return None