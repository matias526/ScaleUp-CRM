-- Add source_type column to kb_documents to support both files and URLs
ALTER TABLE kb_documents 
ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'file' 
CHECK (source_type IN ('file', 'url'));

-- Add source_url column for storing the original URL
ALTER TABLE kb_documents 
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Make file_path and file_size nullable for URL sources
ALTER TABLE kb_documents 
ALTER COLUMN file_path DROP NOT NULL,
ALTER COLUMN file_size DROP NOT NULL;

-- Add index for source_type
CREATE INDEX IF NOT EXISTS idx_kb_documents_source_type 
ON kb_documents(source_type);

-- Add comment
COMMENT ON COLUMN kb_documents.source_type IS 'Type of source: file or url';
COMMENT ON COLUMN kb_documents.source_url IS 'Original URL if source_type is url';
