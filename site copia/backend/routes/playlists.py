from fastapi import APIRouter, HTTPException
from models import Playlist, PlaylistCreate
from typing import List

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/user/{user_id}", response_model=List[Playlist])
async def get_user_playlists(user_id: str):
    """Get all playlists for a user"""
    db = get_db()
    playlists = await db.playlists.find({"userId": user_id}).to_list(1000)
    return [Playlist(**playlist) for playlist in playlists]


@router.get("/{playlist_id}", response_model=Playlist)
async def get_playlist(playlist_id: str):
    """Get playlist by ID"""
    db = get_db()
    playlist = await db.playlists.find_one({"id": playlist_id})
    
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return Playlist(**playlist)


@router.post("/", response_model=Playlist)
async def create_playlist(playlist_data: PlaylistCreate, user_id: str):
    """Create a new playlist"""
    db = get_db()
    
    new_playlist = Playlist(
        userId=user_id,
        **playlist_data.dict()
    )
    await db.playlists.insert_one(new_playlist.dict())
    
    return new_playlist


@router.put("/{playlist_id}", response_model=Playlist)
async def update_playlist(playlist_id: str, playlist_data: dict):
    """Update a playlist"""
    db = get_db()
    
    result = await db.playlists.update_one(
        {"id": playlist_id},
        {"$set": playlist_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    updated_playlist = await db.playlists.find_one({"id": playlist_id})
    return Playlist(**updated_playlist)


@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str):
    """Delete a playlist"""
    db = get_db()
    
    result = await db.playlists.delete_one({"id": playlist_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found")
    
    return {"message": "Playlist deleted successfully", "success": True}


@router.post("/{playlist_id}/songs/{song_id}")
async def add_song_to_playlist(playlist_id: str, song_id: str):
    """Add a song to playlist"""
    db = get_db()
    
    # Check if song exists
    song = await db.songs.find_one({"id": song_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    
    # Add song to playlist
    result = await db.playlists.update_one(
        {"id": playlist_id},
        {"$addToSet": {"songs": song_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found or song already in playlist")
    
    return {"message": "Song added to playlist", "success": True}


@router.delete("/{playlist_id}/songs/{song_id}")
async def remove_song_from_playlist(playlist_id: str, song_id: str):
    """Remove a song from playlist"""
    db = get_db()
    
    result = await db.playlists.update_one(
        {"id": playlist_id},
        {"$pull": {"songs": song_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found or song not in playlist")
    
    return {"message": "Song removed from playlist", "success": True}