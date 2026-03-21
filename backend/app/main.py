from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.v1 import auth, fleet
from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from fastapi.staticfiles import StaticFiles

# Lifespan context manager handles startup and shutdown events cleanly
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic: Connect to Database
    await connect_to_mongo()
    
    # You could also start your MQTT Mosquitto background listener here later
    
    yield # App is running and handling requests
    
    # Shutdown logic: Clean up connections
    await close_mongo_connection()

# Initialize the FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

# Configure CORS so Next.js can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(fleet.router, prefix="/api/admin/fleet", tags=["Fleet Management"])

# Mount the static directory so Next.js can download the 3D models
app.mount("/static", StaticFiles(directory="static"), name="static")


# A simple health check route
@app.get("/")
async def root():
    return {
        "status": "online", 
        "system": settings.PROJECT_NAME,
        "message": "FastAPI is running and ready to accept commands."
    }