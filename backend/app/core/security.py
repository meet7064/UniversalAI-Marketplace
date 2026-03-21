from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Bcrypt requires bytes, so we encode the strings to utf-8
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    # Generate a salt and hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Decode back to a string to store cleanly in MongoDB
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    
    # Set expiration time (default to 24 hours if not specified)
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(hours=24))
    to_encode.update({"exp": expire})
    
    # Sign the JWT using the secret key from your .env file
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm="HS256")
    return encoded_jwt