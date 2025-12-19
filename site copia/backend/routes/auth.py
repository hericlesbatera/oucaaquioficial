from fastapi import APIRouter, HTTPException
from models import User, UserCreate
from motor.motor_asyncio import AsyncIOMotorDatabase
import os

router = APIRouter()


def get_db():
    from server import db
    return db


@router.post("/login", response_model=User)
async def login(user_data: UserCreate):
    """Login real - valida email e senha, ou cadastra novo usuário"""
    db = get_db()
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        # Valida senha
        if "password" in existing_user and existing_user["password"] == user_data.password:
            return User(**existing_user)
        else:
            raise HTTPException(status_code=401, detail="Senha incorreta")
    # Create new user
    new_user = User(**user_data.dict())
    await db.users.insert_one(new_user.dict())
    # If user is an artist, create artist profile
    if new_user.type == "artist":
        from models import Artist
        artist = Artist(
            userId=new_user.id,
            name=new_user.name,
            avatar=new_user.avatar
        )
        await db.artists.insert_one(artist.dict())
    return new_user


@router.get("/user/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    db = get_db()
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)


@router.put("/user/{user_id}/premium")
async def upgrade_to_premium(user_id: str):
    """Upgrade user to premium"""
    db = get_db()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"isPremium": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User upgraded to premium", "success": True}