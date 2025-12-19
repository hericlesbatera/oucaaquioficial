from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
import zipfile
import shutil
import uuid
import tempfile
import httpx
import re
import unicodedata
from mutagen.mp3 import MP3
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path


def generate_slug(text: str, use_hyphens: bool = True) -> str:
    """Gera um slug a partir do texto"""
    # Normalizar unicode e remover acentos
    slug = unicodedata.normalize('NFKD', text)
    slug = slug.encode('ascii', 'ignore').decode('ascii')
    # Converter para minúsculas
    slug = slug.lower()
    
    if use_hyphens:
        # Com hífens (para álbuns)
        slug = re.sub(r'[^a-z0-9]+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
    else:
        # Sem hífens (para artistas)
        slug = re.sub(r'[^a-z0-9]', '', slug)
    
    return slug

# Carregar variáveis de ambiente
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

router = APIRouter()

# Supabase config
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_KEY")

print(f"[album_upload] SUPABASE_URL: {SUPABASE_URL}")
print(f"[album_upload] SUPABASE_KEY: {SUPABASE_KEY[:20] if SUPABASE_KEY else 'MISSING'}...")

def upload_to_supabase_storage(bucket: str, path: str, content: bytes, content_type: str) -> str:
    """Upload file to Supabase Storage using REST API"""
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }
    
    with httpx.Client(timeout=120.0) as client:
        response = client.post(url, content=content, headers=headers)
        
    if response.status_code in [200, 201]:
        return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"
    else:
        print(f"Erro upload: {response.status_code} - {response.text}")
        return None

def insert_to_supabase(table: str, data: dict) -> bool:
    """Insert data to Supabase table using REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    
    with httpx.Client(timeout=30.0) as client:
        response = client.post(url, json=data, headers=headers)
        
    if response.status_code in [200, 201]:
        return True
    else:
        print(f"Erro insert {table}: {response.status_code} - {response.text}")
        return False

def get_mp3_duration(file_path: str) -> int:
    """Retorna a duração do MP3 em segundos"""
    try:
        audio = MP3(file_path)
        return int(audio.info.length)
    except:
        return 0

@router.post("/upload")
async def upload_album(
    title: str = Form(...),
    description: str = Form(None),
    genre: str = Form(...),
    artistId: str = Form(...),
    artistName: str = Form(...),
    coverImage: UploadFile = File(None),
    albumFile: UploadFile = File(...)
):
    """
    Upload de álbum completo:
    1. Salva info do álbum no banco
    2. Upload da capa para Storage
    3. Upload do ZIP/RAR para Storage (disponível para download)
    4. Extrai músicas MP3
    5. Upload de cada música para Storage
    6. Salva cada música no banco
    """
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase não configurado")
    
    album_id = str(uuid.uuid4())
    release_year = datetime.now().year
    
    # Criar diretório temporário para processar arquivos
    temp_dir = tempfile.mkdtemp()
    
    try:
        # 1. Upload da capa (se fornecida)
        cover_url = None
        if coverImage and coverImage.filename:
            cover_ext = os.path.splitext(coverImage.filename)[1]
            cover_filename = f"albums/{album_id}/cover{cover_ext}"
            cover_content = await coverImage.read()
            cover_url = upload_to_supabase_storage("musica", cover_filename, cover_content, coverImage.content_type)
            print(f"Cover URL: {cover_url}")
        
        # 2. Salvar e processar arquivo ZIP
        archive_content = await albumFile.read()
        archive_ext = os.path.splitext(albumFile.filename)[1].lower()
        archive_temp_path = os.path.join(temp_dir, f"album{archive_ext}")
        
        with open(archive_temp_path, "wb") as f:
            f.write(archive_content)
        
        # 3. Upload do arquivo ZIP para download
        archive_filename = f"albums/{album_id}/album{archive_ext}"
        archive_url = upload_to_supabase_storage("musica", archive_filename, archive_content, "application/zip")
        print(f"Archive URL: {archive_url}")
        
        # 4. Extrair músicas
        extract_dir = os.path.join(temp_dir, "extracted")
        os.makedirs(extract_dir, exist_ok=True)
        
        if archive_ext == ".zip":
            try:
                with zipfile.ZipFile(archive_temp_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
            except zipfile.BadZipFile:
                raise HTTPException(status_code=400, detail="Arquivo ZIP inválido")
        else:
            raise HTTPException(status_code=400, detail="Formato não suportado. Use apenas ZIP")
        
        # 5. Listar arquivos MP3 extraídos
        mp3_files = []
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                if file.lower().endswith('.mp3'):
                    mp3_files.append(os.path.join(root, file))
        
        if not mp3_files:
            raise HTTPException(status_code=400, detail="Nenhum arquivo MP3 encontrado no arquivo")
        
        # Ordenar por nome para manter ordem das faixas
        mp3_files.sort()
        
        # 6. Criar registro do álbum no Supabase
        album_slug = generate_slug(title)
        album_data = {
            "id": album_id,
            "slug": album_slug,
            "title": title,
            "description": description,
            "genre": genre,
            "artist_id": artistId,
            "artist_name": artistName,
            "cover_url": cover_url,
            "archive_url": archive_url,
            "release_year": release_year,
            "song_count": len(mp3_files),
            "created_at": datetime.now().isoformat()
        }
        
        insert_to_supabase("albums", album_data)
        print(f"Album criado: {title}")
        
        # 7. Processar cada música
        import re
        songs_created = []
        for index, mp3_path in enumerate(mp3_files):
            song_id = str(uuid.uuid4())
            original_filename = os.path.basename(mp3_path)
            song_title = os.path.splitext(original_filename)[0]
            
            # Limpar nome da música (remover números de faixa como "01 - ", "01. ", etc.)
            song_title = re.sub(r'^[\d]+[\s\.\-\_]+', '', song_title).strip()
            
            # Obter duração
            duration = get_mp3_duration(mp3_path)
            
            # Upload do MP3 para Storage
            with open(mp3_path, 'rb') as f:
                mp3_content = f.read()
            
            song_filename = f"songs/{album_id}/{song_id}.mp3"
            audio_url = upload_to_supabase_storage("musica", song_filename, mp3_content, "audio/mpeg")
            print(f"Música {index+1}: {song_title} -> {audio_url}")
            
            # Criar registro da música
            song_data = {
                "id": song_id,
                "title": song_title,
                "artist_id": artistId,
                "artist_name": artistName,
                "album_id": album_id,
                "album_name": title,
                "cover_url": cover_url,
                "audio_url": audio_url,
                "genre": genre,
                "duration": duration,
                "track_number": index + 1,
                "release_year": release_year,
                "plays": 0,
                "created_at": datetime.now().isoformat()
            }
            
            insert_to_supabase("songs", song_data)
            songs_created.append(song_data)
        
        return {
            "success": True,
            "album": album_data,
            "songs": songs_created,
            "message": f"Álbum '{title}' publicado com {len(songs_created)} músicas!"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar upload: {str(e)}")
    finally:
        # Limpar arquivos temporários
        shutil.rmtree(temp_dir, ignore_errors=True)
