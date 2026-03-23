from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.mongodb import get_database
from datetime import datetime, timezone

router = APIRouter()

@router.get("/dashboard")
async def get_analytics_dashboard(db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Market Popularity (Group live Fleet by Brand)
    fleet_cursor = db["fleet"].find({})
    fleet = await fleet_cursor.to_list(length=1000)
    
    brand_counts = {}
    for robot in fleet:
        brand = robot.get("brand", "Unknown")
        brand_counts[brand] = brand_counts.get(brand, 0) + 1

    # Assign vibrant colors dynamically
    colors = ["#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#10b981", "#f59e0b"]
    market_data = []
    for i, (brand, count) in enumerate(brand_counts.items()):
        market_data.append({
            "name": brand,
            "value": count,
            "color": colors[i % len(colors)]
        })
        
    # Fallback if DB is empty
    if not market_data:
        market_data = [{"name": "No Assets", "value": 1, "color": "#3f3f46"}]

    # 2. Live Feeds (Grab the 3 most recent Service Tickets)
    # 2. Live Feeds (Grab the 3 most recent Service Tickets)
    tickets_cursor = db["tickets"].find({}).sort("created_at", -1).limit(3)
    tickets = await tickets_cursor.to_list(length=3)
    
    live_feeds = []
    for t in tickets:
        created_at = t.get("created_at")
        time_str = "Just now"
        
        if created_at:
            # THE FIX: If MongoDB returned a naive datetime, make it UTC aware again
            if created_at.tzinfo is None:
                created_at = created_at.replace(tzinfo=timezone.utc)
                
            # Now they match and can be safely subtracted!
            diff = datetime.now(timezone.utc) - created_at
            minutes = int(diff.total_seconds() / 60)
            
            if minutes < 60:
                time_str = f"{minutes}m"
            elif minutes < 1440:
                time_str = f"{minutes // 60}h {minutes % 60}m"
            else:
                time_str = f"{minutes // 1440}d ago"

        live_feeds.append({
            "id": str(t["_id"]),
            "company": t.get("reported_by", "Admin"),
            "robot": t.get("asset_name", "Unknown Asset"),
            "time": time_str,
            "status": t.get("priority", "NORMAL").upper()
        })

    # 3. Simulate Time-Series Activity (Scaled by your actual DB size)
    # Because we don't have years of historical data yet, we base the activity volume on how many robots you own.
    fleet_size = len(fleet)
    base_margin = 15 + (fleet_size * 0.5)
    financial_data = [
        {"day": "Mon", "margin": round(base_margin + 2, 1)},
        {"day": "Tue", "margin": round(base_margin + 1, 1)},
        {"day": "Wed", "margin": round(base_margin + 4, 1)},
        {"day": "Thu", "margin": round(base_margin - 1, 1)},
        {"day": "Fri", "margin": round(base_margin + 3, 1)},
        {"day": "Sat", "margin": round(base_margin + 5, 1)},
        {"day": "Sun", "margin": round(base_margin + 5, 1)},
    ]
    
    base_hours = fleet_size * 10
    usage_data = [
        {"day": "Mon", "hours": base_hours + 15},
        {"day": "Tue", "hours": base_hours + 5},
        {"day": "Wed", "hours": base_hours + 25},
        {"day": "Thu", "hours": base_hours + 10},
        {"day": "Fri", "hours": base_hours + 35},
        {"day": "Sat", "hours": max(0, base_hours - 20)},
        {"day": "Sun", "hours": max(0, base_hours - 30)},
    ]

    return {
        "financialData": financial_data,
        "marketData": market_data,
        "usageData": usage_data,
        "liveFeeds": live_feeds,
        "totalUnits": fleet_size
    }