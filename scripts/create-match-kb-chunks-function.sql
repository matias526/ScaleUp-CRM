-- Create function to match knowledge base chunks using vector similarity
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
  filename TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kdc.id,
    kdc.document_id,
    kdc.chunk_text,
    kdc.chunk_index,
    kdd.file_name as filename,
    1 - (kdc.embedding <=> query_embedding::vector) as similarity
  FROM kb_document_chunks kdc
  JOIN kb_documents kdd ON kdc.document_id = kdd.id
  WHERE 
    (tech_company_filter IS NULL OR kdd.tech_company_id = tech_company_filter)
    AND kdd.status = 'completed'
    AND 1 - (kdc.embedding <=> query_embedding::vector) > match_threshold
  ORDER BY kdc.embedding <=> query_embedding::vector
  LIMIT match_count;
END;
$$;
