-- Crear la función para buscar ejemplos de aprendizaje similares
CREATE OR REPLACE FUNCTION match_learning_examples(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  tech_company_filter uuid
)
RETURNS TABLE (
  id uuid,
  user_query text,
  mika_response text,
  user_correction text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    le.id,
    le.user_query,
    le.mika_response,
    le.user_correction,
    1 - (le.query_embedding <=> query_embedding) as similarity
  FROM kb_learning_examples le
  WHERE le.tech_company_id = tech_company_filter
  AND 1 - (le.query_embedding <=> query_embedding) > match_threshold
  ORDER BY le.query_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
