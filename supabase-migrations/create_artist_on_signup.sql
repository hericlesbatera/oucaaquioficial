-- Criar função que executa quando um usuário novo é criado
CREATE OR REPLACE FUNCTION public.handle_new_artist_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário é do tipo 'artist', criar perfil automaticamente
  IF NEW.raw_user_meta_data->>'user_type' = 'artist' THEN
    INSERT INTO public.artists (
      id,
      name,
      email,
      slug,
      cidade,
      estado,
      genero,
      estilo_musical,
      bio,
      avatar_url,
      cover_url,
      followers_count,
      is_verified,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Artista'),
      NEW.email,
      LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'full_name', 'artista'), '[^a-z0-9]+', '', 'g')),
      COALESCE(NEW.raw_user_meta_data->>'cidade', ''),
      COALESCE(NEW.raw_user_meta_data->>'estado', ''),
      COALESCE(NEW.raw_user_meta_data->>'genero', ''),
      COALESCE(NEW.raw_user_meta_data->>'estilo_musical', ''),
      '',
      '',
      '',
      0,
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger que executa quando um novo usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_artist_user();
