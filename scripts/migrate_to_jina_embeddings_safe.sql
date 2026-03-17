-- Migración segura a Jina AI embeddings (1024 dimensiones)
-- Este script elimina los chunks antiguos y actualiza la estructura

-- PASO 1: Eliminar todos los chunks existentes (con embeddings de 1536 dimensiones)
-- IMPORTANTE: Esto eliminará todos los chunks procesados. Los documentos se mantendrán.
TRUNCATE TABLE kb_document_chunks;

-- PASO 2: Eliminar la función existente
DROP FUNCTION IF EXISTS match_kb_chunks(vector(1536), float, int, uuid);

-- PASO 3: Modificar la columna de embeddings
ALTER TABLE kb_document_chunks 
ALTER COLUMN embedding TYPE vector(1024);

-- PASO 4: Recrear la función de búsqueda con la nueva dimensión
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  tech_company_filter uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float,
  filename text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.chunk_text,
    c.chunk_index,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.file_name as filename
  FROM kb_document_chunks c
  JOIN kb_documents d ON c.document_id = d.id
  WHERE d.tech_company_id = tech_company_filter
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- PASO 5: Actualizar el estado de los documentos para que puedan ser reprocesados
-- Corregido: usar 'status' en lugar de 'processing_status'
UPDATE kb_documents 
SET status = 'pending'
WHERE status = 'completed';

-- ✅ Migración completada
-- Los documentos ahora pueden ser reprocesados con Jina AI desde la interfaz
