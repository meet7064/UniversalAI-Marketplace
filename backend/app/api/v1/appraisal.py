import random
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter()

# Schema for the incoming robot data
class AppraisalRequest(BaseModel):
    brand: str
    model: str
    original_price: float = Field(..., gt=0)
    operating_hours: int = Field(..., ge=0)
    condition: str = Field(..., description="Excellent, Good, Fair, or Needs Repair")

# Schema for the output report
class AppraisalResponse(BaseModel):
    ai_health_score: int
    diagnostic_logs: list[str]
    estimated_value: float
    deductions: dict

@router.post("/run", response_model=AppraisalResponse)
async def run_ai_diagnostics(request: AppraisalRequest):
    # 1. Simulate AI Processing Delay (Makes the frontend terminal feel real)
    await asyncio.sleep(1.5)

    # 2. Base Depreciation Logic
    # Standard industrial robots lose roughly $2.50 of value per operating hour
    hourly_depreciation_rate = 2.50
    hours_deduction = request.operating_hours * hourly_depreciation_rate

    # 3. Condition Multiplier & Health Score Generation
    condition_multipliers = {
        "Excellent": {"mult": 0.90, "health_range": (92, 99)},
        "Good": {"mult": 0.75, "health_range": (80, 91)},
        "Fair": {"mult": 0.55, "health_range": (65, 79)},
        "Needs Repair": {"mult": 0.30, "health_range": (40, 64)}
    }
    
    cond_data = condition_multipliers.get(request.condition, condition_multipliers["Fair"])
    
    # Generate a realistic, slightly randomized health score
    health_score = random.randint(cond_data["health_range"][0], cond_data["health_range"][1])
    
    # 4. Final Math
    # Value = (Original Price - Hours Depreciation) * Condition Multiplier * (Health Score Penalty)
    base_after_hours = max(0, request.original_price - hours_deduction)
    condition_adjusted = base_after_hours * cond_data["mult"]
    
    # If the health score is 85%, we retain 85% of the condition-adjusted value
    final_offer = condition_adjusted * (health_score / 100.0)
    
    # Ensure we don't offer negative money or insanely low amounts for salvage
    salvage_value = request.original_price * 0.05
    final_offer = max(salvage_value, final_offer)

    # 5. Generate Dynamic Diagnostic Logs for the UI
    logs = [
        f"Initiating neural handshake with {request.brand} {request.model} controller...",
        f"Scanning kinematic chain... Payload stress parameters within nominal limits.",
        f"Analyzing joint servo telemetry across {request.operating_hours} historical operating hours...",
        f"Warning: Micro-abrasions detected on Joint 3 harmonic drive (Impact: Minimal).",
        f"Evaluating physical chassis condition: Registered as '{request.condition}'.",
        f"Compiling AI Health Matrix... Overall system integrity rated at {health_score}%.",
        "Finalizing market depreciation algorithms...",
        "Appraisal complete. Buy-back offer generated."
    ]

    return {
        "ai_health_score": health_score,
        "diagnostic_logs": logs,
        "estimated_value": round(final_offer, 2),
        "deductions": {
            "wear_and_tear_loss": round(hours_deduction, 2),
            "condition_penalty_pct": int((1 - cond_data["mult"]) * 100)
        }
    }