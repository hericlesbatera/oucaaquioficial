from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from supabase import create_client
import os
from dotenv import load_dotenv
import httpx
import io
import zipfile
import asyncio
try:
    from zipstream import ZipStream
    HAS_ZIPSTREAM = True
except ImportError:
    HAS_ZIPSTREAM = False
    print("WARNING: zipstream not installed, using fallback method")

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter(prefix="/api/albums", tags=["album_download"])


async def stream_zip(songs, album_title):
    """
    Gera um ZIP em memória e envia.
    Método mais simples e confiável.
    """
    print(f"[ALBUM_DOWNLOAD] Iniciando download de {len(songs)} músicas para '{album_title}'")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            downloaded_count = 0
            
            for idx, song in enumerate(songs, 1):
                audio_url = song.get('audio_url')
                title = song.get('title', f'track_{idx}')[:50]
                
                if not audio_url:
                    print(f"[ALBUM_DOWNLOAD] ❌ Música {idx} sem URL: {title}")
                    continue
                
                print(f"[ALBUM_DOWNLOAD] ⏳ Baixando {idx}/{len(songs)}: {title}")
                print(f"[ALBUM_DOWNLOAD]    URL: {audio_url[:80]}...")
                
                try:
                    response = await client.get(audio_url, follow_redirects=True, timeout=60.0)
                    
                    if response.status_code == 200:
                        content_type = response.headers.get('content-type', '')
                        content_length = len(response.content)
                        
                        print(f"[ALBUM_DOWNLOAD]    Content-Type: {content_type}, Size: {content_length} bytes")
                        
                        if content_length < 1000:
                            print(f"[ALBUM_DOWNLOAD] ⚠️ Arquivo muito pequeno, pode ser erro")
                            continue
                        
                        track_num = song.get('track_number') or idx
                        safe_title = "".join(c for c in title if c.isalnum() or c in ' -_').strip()
                        filename = f"{track_num:02d} - {safe_title}.mp3"
                        
                        zip_file.writestr(filename, response.content)
                        downloaded_count += 1
                        print(f"[ALBUM_DOWNLOAD] ✅ OK ({downloaded_count}/{len(songs)}): {filename}")
                    else:
                        print(f"[ALBUM_DOWNLOAD] ❌ HTTP {response.status_code}: {title}")
                        
                except asyncio.TimeoutError:
                    print(f"[ALBUM_DOWNLOAD] ❌ TIMEOUT: {title}")
                except Exception as e:
                    print(f"[ALBUM_DOWNLOAD] ❌ ERRO: {title} - {str(e)[:100]}")
                
                await asyncio.sleep(0.1)
        
        if downloaded_count == 0:
            print("[ALBUM_DOWNLOAD] ❌ Nenhuma música baixada!")
            error_content = f"Erro: Não foi possível baixar nenhuma música do álbum '{album_title}'."
            yield error_content.encode('utf-8')
            return
        
        print(f"[ALBUM_DOWNLOAD] ✅ ZIP criado com {downloaded_count} músicas")
        
        # Enviar ZIP completo
        zip_buffer.seek(0)
        zip_data = zip_buffer.read()
        print(f"[ALBUM_DOWNLOAD] 📦 Tamanho do ZIP: {len(zip_data)} bytes")
        yield zip_data


@router.get("/{album_id}/download")
async def download_album(album_id: str):
    """
    Retorna um arquivo ZIP em stream contendo todas as musicas de um album.
    Streams chunks conforme as musicas sao baixadas (melhor para mobile).
    """
    try:
        print(f"[ALBUM_DOWNLOAD] Iniciando download do album: {album_id}")
        
        # Buscar album
        album_result = supabase.table("albums").select("id, title").eq("id", album_id).single().execute()
        
        if not album_result.data:
            raise HTTPException(status_code=404, detail="Album nao encontrado")
        
        album = album_result.data
        album_title = album.get("title", f"album_{album_id}")
        
        # Buscar todas as musicas do album
        songs_result = supabase.table("songs").select("id, title, audio_url, track_number").eq("album_id", album_id).order("track_number", desc=False).execute()
        
        songs = songs_result.data if songs_result.data else []
        
        if not songs:
            raise HTTPException(status_code=404, detail="Album nao tem musicas")
        
        print(f"[ALBUM_DOWNLOAD] Album '{album_title}' tem {len(songs)} musicas - iniciando stream...")
        
        # Retornar stream do ZIP
        return StreamingResponse(
            stream_zip(songs, album_title),
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{album_title}.zip"',
                "Transfer-Encoding": "chunked"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ALBUM_DOWNLOAD] Erro: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar download do album: {str(e)}"
        )
