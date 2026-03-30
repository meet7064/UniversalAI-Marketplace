from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

# What Next.js sends when adding a new robot
class AssetCreate(BaseModel):
    name: str = Field(..., example="UR10e")
    brand: str = Field(..., example="Universal Robots")
    category: str = Field(..., description="Must be 'Buy' or 'Rent'")
    condition: str = Field(..., example="New")
    price: float = Field(..., gt=0, description="Base price or monthly rent")
    
    # Technical Specs
    payload: float = Field(..., description="Payload capacity in kg")
    reach: float = Field(..., description="Max reach in mm")
    controller: str = Field(..., example="CB3")
    hours: int = Field(0, description="Operating hours")
    
    # NEW: Dynamic Key Features Array
    key_features: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of feature dicts e.g. [{'value': '23', 'label': 'Degrees of Freedom'}]")
    
    # Defaults handled by the backend
    status: Optional[str] = None
    certified: bool = False
    images: Optional[List[str]] = [] # NEW

# What FastAPI sends back to Next.js (includes the MongoDB ID)
class AssetResponse(AssetCreate):
    id: str
    created_at: datetime
    model_url: Optional[str] = None 
    image_url: Optional[str] = None  
    images: Optional[List[str]] = [] # NEW

# A universal update schema where all fields are optional
class AssetUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    payload: Optional[float] = None
    reach: Optional[float] = None
    controller: Optional[str] = None
    hours: Optional[int] = None
    status: Optional[str] = None
    certified: Optional[bool] = None
    image_url: Optional[str] = None
    images: Optional[List[str]] = None # NEW
    key_features: Optional[List[Dict[str, Any]]] = None # NEW