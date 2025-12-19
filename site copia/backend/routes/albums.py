from fastapi import APIRouter, HTTPException, Query
from models import Album, AlbumCreate
from typing import List, Optional

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/", response_model=List[Album])
async def get_albums(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    artist_id: Optional[str] = None
):
    """Get all albums"""
    db = get_db()
    query = {}
    
    if artist_id:
        query["artistId"] = artist_id
    
    albums = await db.albums.find(query).skip(skip).limit(limit).to_list(limit)
    return [Album(**album) for album in albums]


@router.get("/{album_id}", response_model=Album)
async def get_album(album_id: str):
    """Get album by ID"""
    db = get_db()
    album = await db.albums.find_one({"id": album_id})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    # Retorna o dicionário completo, incluindo campos extras
    return album


@router.post("/", response_model=Album)
async def create_album(album_data: AlbumCreate):
    """Create a new album"""
    db = get_db()
    
    new_album = Album(**album_data.dict())
    await db.albums.insert_one(new_album.dict())
    
    return new_album


@router.put("/{album_id}", response_model=Album)
async def update_album(album_id: str, album_data: dict):
    """Update an album"""
    db = get_db()
    
    result = await db.albums.update_one(
        {"id": album_id},
        {"$set": album_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Album not found")
    
    updated_album = await db.albums.find_one({"id": album_id})
    return Album(**updated_album)


@router.delete("/{album_id}")
async def delete_album(album_id: str):
    """Delete an album"""
    db = get_db()
    
    result = await db.albums.delete_one({"id": album_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Album not found")
    
    # Also delete all songs in this album
    await db.songs.delete_many({"albumId": album_id})
    
    return {"message": "Album and associated songs deleted successfully", "success": True}