from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

class TicketCreate(BaseModel):
    asset_id: str = Field(..., description="The MongoDB ID of the robot")
    asset_name: str = Field(..., description="Name of the robot (for quick UI display)")
    issue: str = Field(..., description="Description of the problem")
    priority: str = Field(default="Medium", description="High, Medium, or Low")
    reported_by: str = Field(default="Admin", description="User ID or 'Admin'")
    
    # Defaults for a brand new ticket
    status: str = "Queue"
    assignee: str = "Unassigned"

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None

class TicketResponse(TicketCreate):
    id: str
    ticket_number: str # e.g., "SRV-1042"
    created_at: datetime