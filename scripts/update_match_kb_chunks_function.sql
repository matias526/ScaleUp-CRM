CREATE OR REPLACE FUNCTION public.match_kb_chunks(
  query_embedding vector(1024),
  match_threshold double precision,
  match_count integer,
  tech_company_filter uuid
)
RETURNS TABLE(
  id uuid,
  document_id uuid,
  chunk_text text,
  chunk_index integer,
  similarity double precision,
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
    d.filename  -- Corregido de file_name a filename
  FROM kb_document_chunks c
  JOIN kb_documents d ON c.document_id = d.id
  WHERE d.tech_company_id = tech_company_filter
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
