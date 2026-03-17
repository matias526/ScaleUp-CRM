-- Force drop all versions of the function
DROP FUNCTION IF EXISTS match_kb_chunks CASCADE;

-- Create the correct function that uses chunk_text
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
