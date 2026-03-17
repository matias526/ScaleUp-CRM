-- Script para actualizar las dimensiones de embeddings de 1536 a 384
-- Esto es necesario para usar el modelo all-MiniLM-L6-v2

-- Primero, eliminar la tabla de chunks existente (si hay datos, hacer backup primero)
DROP TABLE IF EXISTS kb_chunks CASCADE;

-- Recrear la tabla con la nueva dimensión
CREATE TABLE kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(384), -- Cambiado de 1536 a 384
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recrear índices
CREATE INDEX idx_kb_chunks_document_id ON kb_chunks(document_id);
CREATE INDEX idx_kb_chunks_embedding ON kb_chunks USING ivfflat (embedding vector_cosine_ops);

-- Recrear la función de búsqueda con la nueva dimensión
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(384), -- Cambiado de 1536 a 384
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_chunks.id,
    kb_chunks.document_id,
    kb_chunks.content,
    1 - (kb_chunks.embedding <=> query_embedding) as similarity,
    kb_chunks.metadata
  FROM kb_chunks
  WHERE 1 - (kb_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comentario: Este script debe ejecutarse solo una vez
-- Si ya tienes documentos procesados, deberás reprocesarlos
