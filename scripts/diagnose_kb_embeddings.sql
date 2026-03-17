-- Script de diagnóstico para verificar el estado de los embeddings

-- 1. Verificar la dimensión actual de la columna embedding
SELECT 
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'kb_document_chunks' 
  AND column_name = 'embedding';

-- 2. Contar chunks por documento
SELECT 
  kdd.filename,
  kdd.status,
  COUNT(kdc.id) as chunk_count,
  kdd.created_at
FROM kb_documents kdd
LEFT JOIN kb_document_chunks kdc ON kdd.id = kdc.document_id
GROUP BY kdd.id, kdd.filename, kdd.status, kdd.created_at
ORDER BY kdd.created_at DESC
LIMIT 10;

-- 3. Verificar si hay chunks con embeddings
SELECT 
  COUNT(*) as total_chunks,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as chunks_with_embeddings,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as chunks_without_embeddings
FROM kb_document_chunks;

-- 4. Ver un ejemplo de chunk reciente
SELECT 
  kdc.id,
  kdc.chunk_text,
  kdc.chunk_index,
  kdd.filename,
  CASE 
    WHEN kdc.embedding IS NOT NULL THEN 'Has embedding'
    ELSE 'No embedding'
  END as embedding_status
FROM kb_document_chunks kdc
JOIN kb_documents kdd ON kdc.document_id = kdd.id
ORDER BY kdc.created_at DESC
LIMIT 5;

-- 5. Verificar dimensión de embeddings existentes (usando vector_dims de pgvector)
SELECT 
  id,
  chunk_index,
  CASE 
    WHEN embedding IS NULL THEN 'NULL'
    -- Usar vector_dims() en lugar de array_length() para tipo vector
    ELSE vector_dims(embedding)::text
  END as embedding_dimension
FROM kb_document_chunks
WHERE embedding IS NOT NULL
LIMIT 5;
