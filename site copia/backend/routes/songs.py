from fastapi import APIRouter, HTTPException, Query
from models import Song, SongCreate
from typing import List, Optional
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def get_db():
    from server import db
    return db


@router.get("/", response_model=List[Song])
async def get_songs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    artist_id: Optional[str] = None
):
    """Get all songs with optional filters"""
    db = get_db()
    query = {}
    
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artistName": {"$regex": search, "$options": "i"}}
        ]
    
    if artist_id:
        query["artistId"] = artist_id
    
    songs = await db.songs.find(query).skip(skip).limit(limit).to_list(limit)
    return [Song(**song) for song in songs]


@router.get("/{song_id}", response_model=Song)
async def get_song(song_id: str):
    """Get song by ID"""
    db = get_db()
    song = await db.songs.find_one({"id": song_id})
    
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return Song(**song)


@router.post("/", response_model=Song)
async def create_song(song_data: SongCreate):
    """Create a new song"""
    db = get_db()
    
    new_song = Song(**song_data.dict())
    await db.songs.insert_one(new_song.dict())
    
    # Update album song count if album exists
    if new_song.albumId:
        await db.albums.update_one(
            {"id": new_song.albumId},
            {"$inc": {"songCount": 1}}
        )
    
    logger.info(f"Song created: {new_song.title}")
    return new_song


@router.put("/{song_id}", response_model=Song)
async def update_song(song_id: str, song_data: dict):
    """Update a song"""
    db = get_db()
    
    result = await db.songs.update_one(
        {"id": song_id},
        {"$set": song_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Song not found")
    
    updated_song = await db.songs.find_one({"id": song_id})
    return Song(**updated_song)


@router.delete("/{song_id}")
async def delete_song(song_id: str):
    """Delete a song"""
    db = get_db()
    
    # Get song to find album
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Delete song
    result = await db.songs.delete_one({"id": song_id})
    
    # Update album song count
    if song.get("albumId"):
        await db.albums.update_one(
            {"id": song["albumId"]},
            {"$inc": {"songCount": -1}}
        )
    
    return {"message": "Song deleted successfully", "success": True}


@router.post("/{song_id}/play")
async def increment_play_count(song_id: str):
    """Increment play count for a song"""
    db = get_db()
    
    result = await db.songs.update_one(
        {"id": song_id},
        {"$inc": {"plays": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Song not found")
    
    return {"message": "Play count incremented", "success": True}