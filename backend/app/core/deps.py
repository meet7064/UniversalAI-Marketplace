from fastapi import Depends, HTTPException, Request
import jwt
from app.core.security import SECRET_KEY, ALGORITHM
from app.db.mongodb import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase

async def get_current_user(request: Request, db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Look for the cookie named "access_token"
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # 2. Strip the "Bearer " prefix if it exists
        if token.startswith("Bearer "):
            token = token[7:]
            
        # 3. Decode the JWT to find who the user is
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token or session expired")
        
    # 4. Fetch the full user profile from MongoDB
    user = await db["users"].find_one({"email": email})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
        
    return user