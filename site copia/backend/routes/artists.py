from fastapi import APIRouter, HTTPException
from models import Artist, ArtistUpdate, Stats
from typing import List

router = APIRouter()


def get_db():
    from server import db
    return db


@router.get("/", response_model=List[Artist])
async def get_artists():
    """Get all artists"""
    db = get_db()
    artists = await db.artists.find().to_list(1000)
    return [Artist(**artist) for artist in artists]


@router.get("/{artist_id}", response_model=Artist)
async def get_artist(artist_id: str):
    """Get artist by ID"""
    db = get_db()
    artist = await db.artists.find_one({"id": artist_id})
    
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return Artist(**artist)


@router.get("/user/{user_id}", response_model=Artist)
async def get_artist_by_user_id(user_id: str):
    """Get artist profile by user ID"""
    db = get_db()
    artist = await db.artists.find_one({"userId": user_id})
    
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return Artist(**artist)


@router.put("/{artist_id}", response_model=Artist)
async def update_artist(artist_id: str, artist_data: ArtistUpdate):
    """Update artist profile"""
    db = get_db()
    
    update_data = {k: v for k, v in artist_data.dict().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    result = await db.artists.update_one(
        {"id": artist_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    updated_artist = await db.artists.find_one({"id": artist_id})
    return Artist(**updated_artist)


@router.get("/{artist_id}/stats")
async def get_artist_stats(artist_id: str):
    """Get artist statistics"""
    db = get_db()
    
    # Get artist
    artist = await db.artists.find_one({"id": artist_id})
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    # Get all songs by this artist
    songs = await db.songs.find({"artistId": artist_id}).to_list(1000)
    
    # Calculate total plays
    total_plays = sum(song.get("plays", 0) for song in songs)
    
    # Get top songs (sorted by plays)
    top_songs = sorted(songs, key=lambda x: x.get("plays", 0), reverse=True)[:5]
    
    return {
        "artistId": artist_id,
        "totalPlays": total_plays,
        "monthlyListeners": artist.get("monthlyListeners", 0),
        "followers": artist.get("followers", 0),
        "totalSongs": len(songs),
        "topSongs": [
            {
                "songId": song["id"],
                "title": song["title"],
                "plays": song.get("plays", 0)
            }
            for song in top_songs
        ]
    }


@router.post("/{artist_id}/follow")
async def follow_artist(artist_id: str):
    """Follow an artist"""
    db = get_db()
    
    result = await db.artists.update_one(
        {"id": artist_id},
        {"$inc": {"followers": 1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return {"message": "Artist followed successfully", "success": True}


@router.post("/{artist_id}/unfollow")
async def unfollow_artist(artist_id: str):
    """Unfollow an artist"""
    db = get_db()
    
    result = await db.artists.update_one(
        {"id": artist_id},
        {"$inc": {"followers": -1}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Artist not found")
    
    return {"message": "Artist unfollowed successfully", "success": True}