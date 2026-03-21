from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.auth_schema import UserLogin, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.mongodb import get_database

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Check if user already exists
    existing_user = await db["users"].find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash the password and save to Mongo
    hashed_pw = get_password_hash(user.password)
    new_user = {
        "email": user.email,
        "password": hashed_pw,
        "role": "admin"  # Hardcoded to admin for this example
    }
    
    await db["users"].insert_one(new_user)
    return {"message": "Admin user created successfully"}

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Find user in database
    db_user = await db["users"].find_one({"email": user.email})
    
    # 2. Verify existence and password match
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )
    
    # 3. Generate the JWT with the user's email and role embedded inside
    token_data = {
        "sub": db_user["email"], 
        "role": db_user.get("role", "customer")
    }
    access_token = create_access_token(data=token_data)
    
    # 4. Return the token to Next.js
    return TokenResponse(
        access_token=access_token, 
        role=db_user.get("role", "customer")
    )