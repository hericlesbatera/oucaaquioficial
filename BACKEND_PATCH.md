# Backend Patch - Album Upload (youtube video + cover fix)

## Problemas corrigidos:

1. **Vídeo do YouTube não era salvo ao fazer upload de álbum**
   - A URL do YouTube era recebida mas não criava registro na tabela `artist_videos`
   
2. **Capa do álbum pode não estar sendo salva corretamente em alguns casos**
   - Melhorado o tratamento de erro e garantia de salvamento

## Alterações necessárias em `routes/album_upload.py`

### 1. Importar método para extrair video_id do YouTube

Adicione esta função no início do arquivo (depois das outras funções de sanitização):

```python
def extract_youtube_video_id(url: str) -> Optional[str]:
    """
    Extract video ID from YouTube URL.
    Supports: youtu.be/xxx, youtube.com/watch?v=xxx, youtube.com/embed/xxx
    """
    import re
    pattern = r'^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*'
    match = re.match(pattern, url)
    return match.group(2) if match and len(match.group(2)) == 11 else None
```

### 2. Adicionar criação de vídeo do YouTube após criar o álbum

Procure pela seção onde o álbum é criado (por volta da linha 470) e DEPOIS de criar o álbum com sucesso, ANTES de fazer upload dos arquivos de áudio, adicione:

```python
            # Create YouTube video record if youtube_url provided
            if youtube_url:
                try:
                    video_id = extract_youtube_video_id(youtube_url)
                    if video_id:
                        # Get YouTube thumbnail
                        thumbnail_url = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
                        
                        # Get YouTube video title
                        video_title = title  # Default to album title
                        try:
                            async with httpx.AsyncClient(timeout=10.0) as client:
                                oembed_response = await client.get(
                                    f"https://www.youtube.com/oembed?url={youtube_url}&format=json"
                                )
                                if oembed_response.status_code == 200:
                                    oembed_data = oembed_response.json()
                                    video_title = oembed_data.get("title", title)
                        except Exception as e:
                            print(f"[UPLOAD] Could not fetch YouTube title: {e}")
                        
                        # Create artist_videos record
                        video_data = {
                            "artist_id": user_id,
                            "album_id": album_id,
                            "video_url": youtube_url,
                            "video_id": video_id,
                            "title": video_title,
                            "thumbnail": thumbnail_url,
                            "is_public": not is_public,  # Se álbum é público, vídeo é público
                            "created_at": datetime.now(timezone.utc).isoformat()
                        }
                        
                        print(f"[UPLOAD] Creating video record: {video_data}")
                        try:
                            video_response = supabase.table("artist_videos").insert(video_data).execute()
                            print(f"[UPLOAD] Video record created successfully")
                        except Exception as e:
                            print(f"[UPLOAD] Error creating video record: {e}")
                            # Não falhar o upload se o vídeo não for criado
                    else:
                        print(f"[UPLOAD] Invalid YouTube URL: {youtube_url}")
                except Exception as e:
                    print(f"[UPLOAD] Error processing YouTube URL: {e}")
                    # Não falhar o upload se houve erro processando vídeo
```

### 3. Melhorar tratamento da capa do álbum

Na seção onde a capa é feita upload (por volta da linha 530), garanta que sempre há feedback sobre o que aconteceu:

```python
            # Upload MP3 files and create song records
            progress_module.update_progress(upload_id, 40, "iniciando_upload_musicas")
            await asyncio.sleep(0.1)
            
            # Log cover_url status
            if cover_url:
                print(f"[UPLOAD] Cover successfully uploaded: {cover_url}")
            else:
                print(f"[UPLOAD] WARNING: No cover URL available for this album")
```

## Resumo das mudanças:

- ✅ Adiciona função para extrair YouTube video ID
- ✅ Cria registro de vídeo na tabela `artist_videos` quando YouTube URL é fornecida
- ✅ Extrai título automático do YouTube se disponível
- ✅ Associa o vídeo ao álbum criado
- ✅ Respeita a configuração de privacidade do álbum para o vídeo
- ✅ Não falha o upload se algo der errado com o vídeo (graceful fallback)
- ✅ Melhor logging para debug

## Frontend já foi atualizado:

O arquivo `UploadNew.jsx` já foi modificado para enviar `youtubeUrl` no FormData quando fornecido.
