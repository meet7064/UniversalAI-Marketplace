from pydantic import BaseModel, EmailStr

# What Next.js sends to the backend
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# What the backend sends back to Next.js
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str     # <--- ADD THIS
    name: str      # <--- ADD THIS
    username: str  # <--- ADD THIS

class UserCreate(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str