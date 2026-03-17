-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table: stores metadata about uploaded documents
CREATE TABLE IF NOT EXISTS kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  total_chunks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks: stores text chunks with their embeddings
CREATE TABLE IF NOT EXISTS kb_document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations: stores chat sessions
CREATE TABLE IF NOT EXISTS kb_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages: stores individual messages in conversations
CREATE TABLE IF NOT EXISTS kb_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES kb_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB, -- Array of document chunks used for this response
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback: stores user feedback on AI responses
CREATE TABLE IF NOT EXISTS kb_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES kb_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating IN (-1, 1)), -- -1 for thumbs down, 1 for thumbs up
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kb_documents_tech_company ON kb_documents(tech_company_id);
CREATE INDEX IF NOT EXISTS idx_kb_documents_status ON kb_documents(status);
CREATE INDEX IF NOT EXISTS idx_kb_document_chunks_document ON kb_document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_document_chunks_embedding ON kb_document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_kb_conversations_user ON kb_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_kb_conversations_tech_company ON kb_conversations(tech_company_id);
CREATE INDEX IF NOT EXISTS idx_kb_messages_conversation ON kb_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_kb_feedback_message ON kb_feedback(message_id);

-- Enable Row Level Security
ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE kb_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for kb_documents
-- Admin can do everything
CREATE POLICY "Admin can manage all documents"
ON kb_documents FOR ALL
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- Users can view documents for their tech company
CREATE POLICY "Users can view documents for their tech company"
ON kb_documents FOR SELECT
TO authenticated
USING (
  tech_company_id = (SELECT tech_company_id FROM users WHERE id = auth.uid())
  OR (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

-- RLS Policies for kb_document_chunks
-- Admin and BDD can view all chunks
CREATE POLICY "Admin and BDD can view all chunks"
ON kb_document_chunks FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

-- Users can view chunks for documents in their tech company
CREATE POLICY "Users can view chunks for their tech company"
ON kb_document_chunks FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM kb_documents 
    WHERE tech_company_id = (SELECT tech_company_id FROM users WHERE id = auth.uid())
  )
);

-- Admin can insert chunks (during document processing)
CREATE POLICY "Admin can insert chunks"
ON kb_document_chunks FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- RLS Policies for kb_conversations
-- Users can view and create their own conversations
CREATE POLICY "Users can manage their own conversations"
ON kb_conversations FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all conversations
CREATE POLICY "Admin can view all conversations"
ON kb_conversations FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- RLS Policies for kb_messages
-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON kb_messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (SELECT id FROM kb_conversations WHERE user_id = auth.uid())
);

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
ON kb_messages FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (SELECT id FROM kb_conversations WHERE user_id = auth.uid())
);

-- Admin can view all messages
CREATE POLICY "Admin can view all messages"
ON kb_messages FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- RLS Policies for kb_feedback
-- Users can manage their own feedback
CREATE POLICY "Users can manage their own feedback"
ON kb_feedback FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
ON kb_feedback FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_kb_documents_updated_at
  BEFORE UPDATE ON kb_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kb_conversations_updated_at
  BEFORE UPDATE ON kb_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
