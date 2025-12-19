# RedMusic - API Contracts & Integration Guide

## Overview
This document outlines the API contracts, backend implementation, and frontend integration strategy for RedMusic.

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login/registration
- `GET /api/auth/user/{user_id}` - Get user profile
- `PUT /api/auth/user/{user_id}/premium` - Upgrade to premium

### Songs
- `GET /api/songs` - Get all songs (with filters)
- `GET /api/songs/{song_id}` - Get song by ID
- `POST /api/songs` - Create new song (artist only)
- `PUT /api/songs/{song_id}` - Update song
- `DELETE /api/songs/{song_id}` - Delete song
- `POST /api/songs/{song_id}/play` - Increment play count

### Albums
- `GET /api/albums` - Get all albums
- `GET /api/albums/{album_id}` - Get album by ID
- `POST /api/albums` - Create new album
- `PUT /api/albums/{album_id}` - Update album
- `DELETE /api/albums/{album_id}` - Delete album

### Artists
- `GET /api/artists` - Get all artists
- `GET /api/artists/{artist_id}` - Get artist by ID
- `GET /api/artists/user/{user_id}` - Get artist by user ID
- `PUT /api/artists/{artist_id}` - Update artist profile
- `GET /api/artists/{artist_id}/stats` - Get artist statistics
- `POST /api/artists/{artist_id}/follow` - Follow artist
- `POST /api/artists/{artist_id}/unfollow` - Unfollow artist

### Playlists
- `GET /api/playlists/user/{user_id}` - Get user playlists
- `GET /api/playlists/{playlist_id}` - Get playlist by ID
- `POST /api/playlists` - Create playlist
- `PUT /api/playlists/{playlist_id}` - Update playlist
- `DELETE /api/playlists/{playlist_id}` - Delete playlist
- `POST /api/playlists/{playlist_id}/songs/{song_id}` - Add song to playlist
- `DELETE /api/playlists/{playlist_id}/songs/{song_id}` - Remove song from playlist

### Favorites
- `GET /api/favorites/user/{user_id}` - Get user favorites
- `GET /api/favorites/user/{user_id}/songs` - Get favorite songs with details
- `POST /api/favorites` - Add song to favorites
- `DELETE /api/favorites` - Remove from favorites
- `GET /api/favorites/check` - Check if song is favorited

---

## Data Currently Mocked in Frontend

### mock.js
- **mockUsers**: User data with type (user/artist) and premium status
- **mockArtists**: Artist profiles with bio, stats, images
- **mockAlbums**: Album information
- **mockSongs**: Song data with metadata, play counts
- **mockPlaylists**: User playlists
- **mockStats**: Artist statistics

---

## Backend Implementation Tasks

### Database Models (MongoDB)
✓ User model with authentication
✓ Artist profile model
✓ Song model with metadata
✓ Album model
✓ Playlist model
✓ Favorite model
✓ Stats model

### API Routes
✓ Authentication routes
✓ Song CRUD operations
✓ Album CRUD operations
✓ Artist profile management
✓ Playlist management
✓ Favorites system
✓ Statistics tracking

### File Upload
- Implement file upload for:
  - Audio files (MP3, OGG, M4A)
  - Cover images
  - Artist profile pictures
  - Album artwork

---

## Frontend Integration Plan

### Phase 1: Replace Mock Authentication
**Files to update:**
- `src/context/AuthContext.jsx`
  - Replace mock login with real API calls
  - Implement token storage
  - Add error handling

### Phase 2: Songs & Albums
**Files to update:**
- `src/pages/Home.jsx`
  - Fetch songs and albums from API
  - Replace mockSongs/mockAlbums with API data
- `src/pages/Search.jsx`
  - Implement search API integration
- `src/pages/Library.jsx`
  - Fetch user's library from API

### Phase 3: Player Integration
**Files to update:**
- `src/context/PlayerContext.jsx`
  - Add play count tracking to API
  - Implement actual audio streaming

### Phase 4: Artist Features
**Files to update:**
- `src/pages/Artist/Dashboard.jsx`
  - Fetch real statistics from API
- `src/pages/Artist/Upload.jsx`
  - Implement file upload to backend
  - Connect form submission to API
- `src/pages/Artist/Songs.jsx`
  - Fetch artist's songs from API
  - Implement edit/delete functionality
- `src/pages/Artist/Profile.jsx`
  - Connect profile updates to API
  - Implement image upload

### Phase 5: Playlists & Favorites
**Files to update:**
- Create new `src/pages/Playlists.jsx`
- Create new `src/pages/Favorites.jsx`
- Add favorites functionality to song components

---

## Integration Steps

1. **Remove mock.js imports** from components
2. **Create API service layer** (`src/services/api.js`)
3. **Implement error handling** and loading states
4. **Add toast notifications** for user feedback
5. **Test each feature** incrementally

---

## Notes

- File uploads are currently simulated in frontend
- Audio URLs point to sample audio files
- Images use Unsplash placeholders
- All mock data should be replaced with real API calls
- Maintain the same data structure for seamless integration