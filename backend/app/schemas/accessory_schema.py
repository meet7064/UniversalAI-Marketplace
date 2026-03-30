from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AccessoryCreate(BaseModel):
    name: str = Field(..., example="Robotiq 2F-85 Gripper")
    category: str = Field(..., description="E.g., Gripper, Sensor, Battery, Cable")
    brand: str = Field(..., example="Robotiq")
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(default=0)
    compatible_with: str = Field(default="Universal", description="Robot model compatibility")
    status: str = Field(default="In Stock")
    images: Optional[List[str]] = [] # NEW: Array of images

class AccessoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    compatible_with: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None # NEW

class AccessoryResponse(AccessoryCreate):
    id: str
    created_at: datetime
    image_url: Optional[str] = None
    images: Optional[List[str]] = [] # NEW