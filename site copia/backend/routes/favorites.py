from fastapi import APIRouter, HTTPException
from models import Favorite
from typing import List

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/user/{user_id}", response_model=List[Favorite])
async def get_user_favorites(user_id: str):
    """Get all favorites for a user"""
    db = get_db()
    favorites = await db.favorites.find({"userId": user_id}).to_list(1000)
    return [Favorite(**favorite) for favorite in favorites]


@router.get("/user/{user_id}/songs")
async def get_user_favorite_songs(user_id: str):
    """Get all favorite songs for a user with song details"""
    db = get_db()
    
    # Get all favorites
    favorites = await db.favorites.find({"userId": user_id}).to_list(1000)
    song_ids = [fav["songId"] for fav in favorites]
    
    # Get song details
    songs = await db.songs.find({"id": {"$in": song_ids}}).to_list(1000)
    
    return songs


@router.post("/", response_model=Favorite)
async def add_favorite(user_id: str, song_id: str):
    """Add a song to favorites"""
    db = get_db()
    
    # Check if song exists
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Check if already favorited
    existing = await db.favorites.find_one({"userId": user_id, "songId": song_id})
    if existing:
        raise HTTPException(status_code=400, detail="Song already in favorites")
    
    # Add to favorites
    new_favorite = Favorite(userId=user_id, songId=song_id)
    await db.favorites.insert_one(new_favorite.dict())
    
    # Increment song likes
    await db.songs.update_one(
        {"id": song_id},
        {"$inc": {"likes": 1}}
    )
    
    return new_favorite


@router.delete("/")
async def remove_favorite(user_id: str, song_id: str):
    """Remove a song from favorites"""
    db = get_db()
    
    result = await db.favorites.delete_one({"userId": user_id, "songId": song_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    # Decrement song likes
    await db.songs.update_one(
        {"id": song_id},
        {"$inc": {"likes": -1}}
    )
    
    return {"message": "Song removed from favorites", "success": True}


@router.get("/check")
async def check_favorite(user_id: str, song_id: str):
    """Check if a song is favorited by user"""
    db = get_db()
    
    favorite = await db.favorites.find_one({"userId": user_id, "songId": song_id})
    
    return {"isFavorite": favorite is not None}