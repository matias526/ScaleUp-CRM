CREATE OR REPLACE FUNCTION match_kb_chunks(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  tech_company_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_text TEXT,
  chunk_index INT,
  similarity FLOAT,
  filename TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kbc.id,
    kbc.document_id,
    kbc.chunk_text,
    kbc.chunk_index,
    1 - (kbc.embedding <=> query_embedding::vector) AS similarity,
    kbd.filename
  FROM kb_document_chunks kbc
  JOIN kb_documents kbd ON kbc.document_id = kbd.id
  WHERE 
    (tech_company_filter IS NULL OR kbd.tech_company_id = tech_company_filter)
    AND kbd.status = 'completed'
    AND 1 - (kbc.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY kbc.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
