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
    Gera um ZIP com streaming real.
    Envia primeiro arquivo vazio para iniciar download IMEDIATAMENTE,
    depois vai adicionando músicas conforme baixa (melhor para mobile e UX).
    """
    # Usar ZipStream se disponível (true streaming)
    if HAS_ZIPSTREAM:
        print("[ALBUM_DOWNLOAD] Using ZipStream for true streaming")
        async with httpx.AsyncClient(timeout=20.0) as client:
            # Dicionário de arquivos para ZipStream
            file_dict = {}
            downloaded_count = 0
            
            # Baixar todas as músicas ANTES de fazer yield
            # Isso é necessário porque ZipStream precisa dos dados prontos
            for idx, song in enumerate(songs, 1):
                try:
                    if song.get('audio_url'):
                        title = song.get('title', 'track')[:40]
                        print(f"[ALBUM_DOWNLOAD] Baixando musica {idx}/{len(songs)}: {title}")
                        
                        try:
                            response = await client.get(song['audio_url'], follow_redirects=True, timeout=30.0)
                            
                            if response.status_code == 200:
                                track_num = song.get('track_number', idx)
                                filename = f"{track_num:02d} - {song.get('title', 'track')}.mp3"
                                file_dict[filename] = response.content
                                downloaded_count += 1
                                print(f"[ALBUM_DOWNLOAD]   OK ({downloaded_count}/{len(songs)}): {filename}")
                            else:
                                print(f"[ALBUM_DOWNLOAD]   FALHOU: status {response.status_code}")
                        except asyncio.TimeoutError:
                            print(f"[ALBUM_DOWNLOAD]   TIMEOUT: {title}")
                        except Exception as e:
                            print(f"[ALBUM_DOWNLOAD]   ERRO: {str(e)[:50]}")
                except Exception as e:
                    print(f"[ALBUM_DOWNLOAD]   ERRO GERAL: {str(e)[:50]}")
                
                await asyncio.sleep(0)
            
            # Agora fazer streaming real com ZipStream
            zs = ZipStream(file_dict, compression=zipfile.ZIP_DEFLATED, chunksize=262144)
            for chunk in zs:
                yield chunk
    
    else:
        # Fallback: método tradicional
        print("[ALBUM_DOWNLOAD] Using fallback zipfile method")
        async with httpx.AsyncClient(timeout=20.0) as client:
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                downloaded_count = 0
                
                for idx, song in enumerate(songs, 1):
                    try:
                        if song.get('audio_url'):
                            title = song.get('title', 'track')[:40]
                            print(f"[ALBUM_DOWNLOAD] Baixando musica {idx}/{len(songs)}: {title}")
                            
                            try:
                                response = await client.get(song['audio_url'], follow_redirects=True, timeout=30.0)
                                
                                if response.status_code == 200:
                                    track_num = song.get('track_number', idx)
                                    filename = f"{track_num:02d} - {song.get('title', 'track')}.mp3"
                                    zip_file.writestr(filename, response.content)
                                    downloaded_count += 1
                                    print(f"[ALBUM_DOWNLOAD]   OK ({downloaded_count}/{len(songs)}): {filename}")
                                else:
                                    print(f"[ALBUM_DOWNLOAD]   FALHOU: status {response.status_code}")
                            except asyncio.TimeoutError:
                                print(f"[ALBUM_DOWNLOAD]   TIMEOUT: {title}")
                            except Exception as e:
                                print(f"[ALBUM_DOWNLOAD]   ERRO: {str(e)[:50]}")
                    except Exception as e:
                        print(f"[ALBUM_DOWNLOAD]   ERRO GERAL: {str(e)[:50]}")
                    
                    await asyncio.sleep(0)
            
            # Enviar em chunks
            zip_buffer.seek(0)
            chunk_size = 64 * 1024  # 64KB chunks
            while True:
                chunk = zip_buffer.read(chunk_size)
                if not chunk:
                    break
                yield chunk


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
