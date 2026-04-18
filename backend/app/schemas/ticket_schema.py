from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class TicketCreate(BaseModel):
    # --- LEGACY ADMIN FIELDS (Used by your Kanban Board) ---
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    issue: Optional[str] = None
    priority: Optional[str] = None
    reported_by: Optional[str] = None
    assignee: Optional[str] = None

    # --- NEW PUBLIC FIELDS (Used by the Customer Storefront) ---
    description: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    brand: Optional[str] = None
    robot_model: Optional[str] = None
    service_type: Optional[str] = Field(default="Repair")
    urgency: Optional[str] = Field(default="Standard")
    file_url: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    issue: Optional[str] = None
    urgency: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None

class TicketResponse(TicketCreate):
    id: str
    ticket_number: Optional[str] = "SRV-LEGACY"
    status: str
    created_at: datetime