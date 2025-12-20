from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from supabase import create_client
import os
from dotenv import load_dotenv
import httpx
import io
import zipfile
import asyncio
import logging
from datetime import datetime
import traceback
from zipstream import ZipStream, ZIP_DEFLATED


load_dotenv()

# Configurar logging em arquivo
LOG_DIR = "/tmp"  # Railway escreve em /tmp
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOG_FILE = os.path.join(LOG_DIR, "album_download.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info("=== Album Download Service Iniciado ===")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

router = APIRouter(prefix="/api/albums", tags=["album_download"])


async def download_single_song(client, song, idx):
    """Baixa uma única música e retorna os dados."""
    audio_url = song.get('audio_url')
    title = song.get('title', f'track_{idx}')[:50]
    
    if not audio_url:
        return None
    
    try:
        response = await client.get(audio_url, follow_redirects=True)
        
        if response.status_code == 200 and len(response.content) > 1000:
            track_num = song.get('track_number') or idx
            safe_title = "".join(c for c in title if c.isalnum() or c in ' -_').strip()
            filename = f"{track_num:02d} - {safe_title}.mp3"
            logger.info(f"✅ {filename} ({len(response.content)//1024}KB)")
            return (filename, response.content)
    except Exception as e:
        logger.error(f"❌ {title}: {str(e)[:30]}")
    
    return None


async def stream_zip(songs, album_title):
    """
    Gera ZIP com streaming VERDADEIRAMENTE IMEDIATO.
    Começa a enviar ZIP enquanto baixa as músicas.
    """
    import queue
    import threading
    
    logger.info(f"Iniciando streaming IMEDIATO de {len(songs)} músicas")
    
    # Fila thread-safe para passar músicas conforme são baixadas
    file_queue = queue.Queue()
    error_queue = queue.Queue()
    
    # Thread para baixar as músicas
    def download_songs():
        try:
            async def async_download():
                async with httpx.AsyncClient(timeout=60.0, limits=httpx.Limits(max_connections=10)) as client:
                    for idx, song in enumerate(songs, 1):
                        result = await download_single_song(client, song, idx)
                        if result:
                            file_queue.put(result)
                            logger.info(f"✅ Arquivo {idx} pronto: {result[0]}")
                        # Dar tempo para processamento
                        await asyncio.sleep(0.01)
            
            # Executar async em thread separada
            asyncio.run(async_download())
        except Exception as e:
            logger.error(f"❌ Erro no download: {str(e)}")
            error_queue.put(str(e))
        finally:
            file_queue.put(None)  # Sinal de fim
    
    # Iniciar thread de download
    download_thread = threading.Thread(target=download_songs, daemon=True)
    download_thread.start()
    
    try:
        logger.info(f"✅ Iniciando streaming do ZIP IMEDIATAMENTE...")
        
        # Criar ZipStream
        zs = ZipStream(compress_type=ZIP_DEFLATED, compress_level=6)
        
        # Generator que recebe arquivos da fila
        files_added = 0
        while True:
            # Verificar se houve erro no download
            try:
                error = error_queue.get_nowait()
                raise Exception(f"Erro no download: {error}")
            except queue.Empty:
                pass
            
            # Tentar pegar arquivo da fila (não bloqueia muito)
            try:
                file_data = file_queue.get(timeout=1)
            except queue.Empty:
                continue
            
            if file_data is None:  # Fim dos downloads
                logger.info(f"✅ Todos os {files_added} arquivos foram adicionados ao ZIP")
                break
            
            filename, content = file_data
            files_added += 1
            logger.info(f"Adicionando {filename} ao ZIP ({len(content)//1024}KB) - total: {files_added}")
            zs.add(content, filename)
        
        # Stream do ZIP em chunks
        chunk_count = 0
        total_bytes = 0
        
        for chunk in zs:
            chunk_count += 1
            total_bytes += len(chunk)
            if chunk_count == 1:
                logger.info(f"✅ PRIMEIRO CHUNK ENVIADO! Download iniciado no cliente")
            yield chunk
        
        logger.info(f"✅ Streaming completo: {chunk_count} chunks, {total_bytes//1024}KB")
        
    except Exception as e:
        logger.error(f"❌ Erro: {str(e)}")
        logger.error(traceback.format_exc())
        raise


@router.get("/{album_id}/download")
async def download_album(album_id: str):
    """
    Retorna um arquivo ZIP em stream contendo todas as musicas de um album.
    Streams chunks conforme as musicas sao baixadas (melhor para mobile).
    """
    try:
        logger.info(f"Iniciando download do album: {album_id}")
        
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
        
        logger.info(f"Album '{album_title}' tem {len(songs)} musicas - iniciando stream...")
        
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
        logger.error(f"Erro: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar download do album: {str(e)}"
        )


@router.get("/debug/logs")
async def get_logs():
    """Retorna o conteúdo do arquivo de log."""
    try:
        with open(LOG_FILE, 'r') as f:
            logs = f.read()
        return {"log_file": LOG_FILE, "logs": logs}
    except FileNotFoundError:
        return {"error": f"Log file not found: {LOG_FILE}"}
    except Exception as e:
        return {"error": str(e)}
