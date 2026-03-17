-- Eliminar funciones duplicadas y crear la correcta
-- Primero eliminamos todas las versiones de la función
DROP FUNCTION IF EXISTS match_kb_chunks(vector, double precision, integer, uuid);
DROP FUNCTION IF EXISTS match_kb_chunks(text, double precision, integer, uuid);

-- Ahora creamos la función correcta que recibe vector
-- Changed 'content' to 'chunk_text' to match database schema
CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  tech_company_filter uuid
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  chunk_text text,
  chunk_index int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb_document_chunks.id,
    kb_document_chunks.document_id,
    kb_document_chunks.chunk_text,
    kb_document_chunks.chunk_index,
    1 - (kb_document_chunks.embedding <=> query_embedding) as similarity
  FROM kb_document_chunks
  INNER JOIN kb_documents ON kb_document_chunks.document_id = kb_documents.id
  WHERE kb_documents.tech_company_id = tech_company_filter
    AND kb_documents.status = 'completed'
    AND 1 - (kb_document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY kb_document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
