from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.schemas.auth_schema import UserLogin, UserCreate, TokenResponse
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.mongodb import get_database

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Check if email OR username already exists
    existing_user = await db["customer"].find_one({
        "$or": [{"email": user.email}, {"username": user.username}]
    })
    
    if existing_user:
        if existing_user.get("email") == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
        if existing_user.get("username") == user.username:
            raise HTTPException(status_code=400, detail="Username already taken")
    
    # 2. Hash the password and save to Mongo
    hashed_pw = get_password_hash(user.password)
    new_user = {
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "password": hashed_pw,
        "role": "customer"  # Strictly enforced for public registrations
    }
    
    await db["customer"].insert_one(new_user)
    return {"message": "Customer account created successfully"}


# @router.post("/register", status_code=status.HTTP_201_CREATED)
# async def register_admin(user: UserCreate, db: AsyncIOMotorDatabase = Depends(get_database)):
#     """HIDDEN ROUTE: Used only by the private Admin Registration frontend."""
#     existing_user = await db["customer"].find_one({
#         "$or": [{"email": user.email}, {"username": user.username}]
#     })
    
#     if existing_user:
#         raise HTTPException(status_code=400, detail="User already exists")
    
#     hashed_pw = get_password_hash(user.password)
#     new_admin = {
#         "name": user.name,
#         "email": user.email,
#         "password": hashed_pw,
#         "role": "admin"  # Grants Command Center access
#     }
    
#     await db["customer"].insert_one(new_admin)
#     return {"message": "Admin user created successfully"}


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: AsyncIOMotorDatabase = Depends(get_database)):
    # 1. Find user in database
    db_user = await db["customer"].find_one({"email": user.email})
    
    # 2. Verify existence and password match
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )
    
    # 3. Embed user data directly into the JWT payload
    token_data = {
        "sub": db_user["email"], 
        "role": db_user.get("role", "customer"),
        "name": db_user.get("name", "User"),
        "username": db_user.get("username", "")
    }
    access_token = create_access_token(data=token_data)
    
    # 4. Return the token and role (Matches the TokenResponse schema)
    return TokenResponse(
        access_token=access_token, 
        role=db_user.get("role", "customer")
    )