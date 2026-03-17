-- Script para verificar y reparar la tabla de traducciones

-- Verificar si la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'translations'
  ) THEN
    -- Crear la tabla si no existe
    CREATE TABLE public.translations (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      key TEXT NOT NULL,
      language TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(key, language)
    );
    
    -- Añadir comentario
    RAISE NOTICE 'Tabla de traducciones creada';
    
    -- Crear políticas de seguridad básicas
    ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
    
    -- Política para permitir lectura a todos los usuarios autenticados
    CREATE POLICY "Permitir lectura a usuarios autenticados" 
      ON public.translations FOR SELECT 
      TO authenticated 
      USING (true);
      
    -- Política para permitir inserción/actualización a administradores
    CREATE POLICY "Permitir escritura a administradores" 
      ON public.translations FOR ALL 
      TO authenticated 
      USING (
        (SELECT is_admin FROM public.users WHERE id = auth.uid())
      );
      
    RAISE NOTICE 'Políticas de seguridad creadas';
  ELSE
    RAISE NOTICE 'La tabla de traducciones ya existe';
  END IF;
END $$;

-- Verificar índices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'translations' 
    AND indexname = 'translations_key_language_idx'
  ) THEN
    CREATE INDEX translations_key_language_idx ON public.translations(key, language);
    RAISE NOTICE 'Índice para key y language creado';
  ELSE
    RAISE NOTICE 'El índice para key y language ya existe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'translations' 
    AND indexname = 'translations_language_idx'
  ) THEN
    CREATE INDEX translations_language_idx ON public.translations(language);
    RAISE NOTICE 'Índice para language creado';
  ELSE
    RAISE NOTICE 'El índice para language ya existe';
  END IF;
END $$;

-- Verificar si hay traducciones
DO $$
DECLARE
  translation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO translation_count FROM public.translations;
  
  IF translation_count = 0 THEN
    RAISE NOTICE 'No hay traducciones en la tabla. Insertando traducciones básicas...';
    
    -- Insertar algunas traducciones básicas
    INSERT INTO public.translations (key, language, value)
    VALUES
      ('app.name', 'en', 'CRM ScaleUp'),
      ('app.name', 'es', 'CRM ScaleUp'),
      ('app.name', 'pt', 'CRM ScaleUp'),
      ('common.save', 'en', 'Save'),
      ('common.save', 'es', 'Guardar'),
      ('common.save', 'pt', 'Salvar'),
      ('common.cancel', 'en', 'Cancel'),
      ('common.cancel', 'es', 'Cancelar'),
      ('common.cancel', 'pt', 'Cancelar'),
      ('common.loading', 'en', 'Loading...'),
      ('common.loading', 'es', 'Cargando...'),
      ('common.loading', 'pt', 'Carregando...')
    ON CONFLICT (key, language) DO NOTHING;
    
    RAISE NOTICE 'Traducciones básicas insertadas';
  ELSE
    RAISE NOTICE 'La tabla ya contiene % traducciones', translation_count;
  END IF;
END $$;

-- Mostrar estadísticas de traducciones por idioma
SELECT 
  language, 
  COUNT(*) as translation_count 
FROM 
  public.translations 
GROUP BY 
  language 
ORDER BY 
  COUNT(*) DESC;
