from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    type: str = "user"  # "user" or "artist"
    isPremium: bool = False
    avatar: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Artist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    name: str
    bio: Optional[str] = None
    avatar: Optional[str] = None
    coverImage: Optional[str] = None
    genre: Optional[str] = None
    location: Optional[str] = None
    followers: int = 0
    monthlyListeners: int = 0
    socialLinks: Optional[dict] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Album(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artistId: str
    artistName: str
    coverImage: Optional[str] = None
    releaseYear: int
    songCount: int = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Song(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    artistId: str
    artistName: str
    albumId: Optional[str] = None
    albumName: Optional[str] = None
    duration: int  # in seconds
    coverImage: Optional[str] = None
    audioUrl: Optional[str] = None
    genre: Optional[str] = None
    plays: int = 0
    likes: int = 0
    description: Optional[str] = None
    releaseYear: Optional[int] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Playlist(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    userId: str
    description: Optional[str] = None
    coverImage: Optional[str] = None
    songs: List[str] = []  # List of song IDs
    isPublic: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Favorite(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    songId: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Stats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    artistId: str
    totalPlays: int = 0
    monthlyListeners: int = 0
    followers: int = 0
    date: datetime = Field(default_factory=datetime.utcnow)


# Input models for API endpoints
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    type: str = "user"
    avatar: Optional[str] = None


class SongCreate(BaseModel):
    title: str
    artistId: str
    artistName: str
    albumId: Optional[str] = None
    albumName: Optional[str] = None
    duration: int
    genre: Optional[str] = None
    description: Optional[str] = None
    releaseYear: Optional[int] = None


class AlbumCreate(BaseModel):
    title: str
    artistId: str
    artistName: str
    releaseYear: int


class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    isPublic: bool = True


class ArtistUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    genre: Optional[str] = None
    location: Optional[str] = None
    socialLinks: Optional[dict] = None