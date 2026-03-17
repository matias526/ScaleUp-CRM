-- Tabla para guardar ejemplos de aprendizaje de correcciones
CREATE TABLE IF NOT EXISTS kb_learning_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  
  -- El contexto de la conversación
  user_query TEXT NOT NULL,
  mika_response TEXT NOT NULL,
  user_correction TEXT NOT NULL,
  
  -- Embedding de la query original para búsqueda semántica
  query_embedding vector(1024),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Índices
  CONSTRAINT kb_learning_examples_tech_company_fkey 
    FOREIGN KEY (tech_company_id) REFERENCES tech_companies(id) ON DELETE CASCADE
);

-- Índice para búsqueda por tech_company
CREATE INDEX IF NOT EXISTS idx_kb_learning_examples_tech_company 
  ON kb_learning_examples(tech_company_id);

-- Índice para búsqueda por conversación
CREATE INDEX IF NOT EXISTS idx_kb_learning_examples_conversation 
  ON kb_learning_examples(conversation_id);

-- Índice HNSW para búsqueda semántica de ejemplos
CREATE INDEX IF NOT EXISTS idx_kb_learning_examples_embedding 
  ON kb_learning_examples 
  USING hnsw (query_embedding vector_cosine_ops);

-- Función para buscar ejemplos de aprendizaje relevantes
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
    AND le.query_embedding IS NOT NULL
    AND 1 - (le.query_embedding <=> query_embedding) > match_threshold
  ORDER BY le.query_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS policies
ALTER TABLE kb_learning_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning examples from their tech company"
  ON kb_learning_examples FOR SELECT
  USING (
    tech_company_id IN (
      SELECT tech_company_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert learning examples for their tech company"
  ON kb_learning_examples FOR INSERT
  WITH CHECK (
    tech_company_id IN (
      SELECT tech_company_id FROM users WHERE id = auth.uid()
    )
  );
