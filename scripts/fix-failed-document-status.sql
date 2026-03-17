-- Fix the status of documents that have chunks but are marked as failed
-- This happens when the scraping process saves chunks successfully but fails to update the status

UPDATE kb_documents
SET 
  status = 'completed',
  processed_at = NOW()
WHERE 
  status = 'failed'
  AND id IN (
    SELECT DISTINCT document_id 
    FROM kb_document_chunks 
    WHERE embedding IS NOT NULL
  );

-- Show the updated documents
SELECT 
  id,
  filename,
  source_type,
  status,
  total_chunks,
  created_at,
  processed_at
FROM kb_documents
WHERE source_type = 'url'
ORDER BY created_at DESC
LIMIT 10;
