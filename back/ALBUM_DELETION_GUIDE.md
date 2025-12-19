# Album Deletion & Trash System

## Overview

This system implements a soft-delete trash mechanism for albums:

1. **Soft Delete (Trash)**: Artists can move albums to trash (marked with `deleted_at`)
2. **Visibility**: Deleted albums are NOT shown on the public site
3. **Recovery**: Artists can restore albums within 30 days
4. **Auto-Delete**: After 30 days, albums are permanently deleted automatically

## Architecture

### Database Schema

**albums table** fields:
- `deleted_at` - NULL (active) or timestamp (trashed)
- `is_deleted` - Boolean legacy field (being phased out)

### Storage Paths

```
musica bucket (Supabase Storage)
├── albums/{user_id}/{album_id}/
│   └── cover.jpg
└── songs/{user_id}/{album_id}/
    ├── 01_song_name.mp3
    ├── 02_song_name.mp3
    └── ...
```

## Endpoints

### 1. Delete/Move to Trash
**POST** `/api/albums/{album_id}?permanent=false`
- Headers: `Authorization: Bearer {token}`
- Action: Sets `deleted_at` timestamp
- Result: Album moved to trash (not visible on site)

### 2. Permanent Delete
**POST** `/api/albums/{album_id}?permanent=true`
- Headers: `Authorization: Bearer {token}`
- Action: Deletes storage files → deletes database records
- Process:
  1. Delete cover from `albums/{user_id}/{album_id}/`
  2. Delete all songs from `songs/{user_id}/{album_id}/`
  3. Delete songs DB records
  4. Delete album DB record

### 3. Auto-Delete Old Albums
**POST** `/api/cleanup/auto-delete-old-albums`
- Headers: `X-Cleanup-Secret: {CLEANUP_SECRET}`
- Purpose: Called by cron job every day
- Action: Permanently deletes albums in trash for 30+ days
- Logging: Full `[CLEANUP]` logs in backend

### 4. Check Trash Status
**GET** `/api/cleanup/status`
- Returns: List of trashed albums with days remaining
- Shows: Which albums will auto-delete next

## Frontend Filtering

### Active Filters

**HomeImproved.jsx** (line 75):
```javascript
.is('deleted_at', null)  // Only non-deleted albums
```

**AlbumPage.jsx** (lines 70, 79):
```javascript
.is('deleted_at', null)  // Don't show deleted albums
```

All public-facing pages should include this filter.

## Setting Up Auto-Delete (Cron)

### Option 1: GitHub Actions

Create `.github/workflows/cleanup.yml`:

```yaml
name: Auto-delete old albums
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Auto-delete albums in trash 30+ days
        run: |
          curl -X POST \
            https://your-api-domain.com/api/cleanup/auto-delete-old-albums \
            -H "X-Cleanup-Secret: ${{ secrets.CLEANUP_SECRET }}"
```

### Option 2: AWS Lambda / Vercel Cron

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cleanup/auto-delete-old-albums",
    "schedule": "0 2 * * *"
  }]
}
```

### Option 3: External Service (EasyCron, etc.)

- URL: `POST https://your-api-domain.com/api/cleanup/auto-delete-old-albums`
- Header: `X-Cleanup-Secret: your-cleanup-secret`
- Schedule: Daily

## Environment Variables

Add to `.env`:

```
CLEANUP_SECRET=your-very-secret-key-here
```

## Logs to Monitor

**Backend logs** for deletion process:

```
[DELETE] Deleting files from Supabase Storage for album {album_id}
[DELETE] Deleting cover: ...
[DELETE] Deleting song files for album {album_id}
[DELETE] Marked for deletion: songs/{user_id}/{album_id}/...
[DELETE] Successfully deleted X song files
[DELETE] Deleting songs from database
[DELETE] Deleting album from database
```

**Cleanup logs** (via cron):

```
[CLEANUP] Starting auto-delete of old trashed albums...
[CLEANUP] Found X albums to permanently delete
[CLEANUP] Processing album {album_id} by user {user_id}
[CLEANUP] Album {album_id} permanently deleted
[CLEANUP] Cleanup completed: X deleted, Y errors
```

## Testing

### Test Soft Delete
```bash
curl -X DELETE http://localhost:8000/api/albums/{album_id} \
  -H "Authorization: Bearer {token}"
```

### Test Permanent Delete
```bash
curl -X DELETE http://localhost:8000/api/albums/{album_id}?permanent=true \
  -H "Authorization: Bearer {token}"
```

### Test Auto-Delete
```bash
curl -X POST http://localhost:8000/api/cleanup/auto-delete-old-albums \
  -H "X-Cleanup-Secret: test-secret"
```

### Check Status
```bash
curl http://localhost:8000/api/cleanup/status
```

## Important Notes

1. **Soft Delete**: Uses `deleted_at` timestamp (ISO 8601 format)
2. **Storage Cleanup**: Both manual delete and auto-delete clean up files from Supabase
3. **Filtering**: All queries should use `.is('deleted_at', null)` to exclude trash
4. **30-Day Window**: Artists have 30 days to restore before auto-delete
5. **Error Handling**: If storage delete fails, database deletion still proceeds
