-- =====================================================
-- KNOWLEDGE BASE (FAQ) TABLES
-- =====================================================

-- Table: knowledge_base_labels
-- Stores reusable labels/tags for categorizing questions
CREATE TABLE IF NOT EXISTS knowledge_base_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT, -- Hex color for UI display (e.g., '#3B82F6')
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: knowledge_base_questions
-- Stores FAQ questions and answers linked to technology companies
CREATE TABLE IF NOT EXISTS knowledge_base_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Corregido de technology_companies a tech_companies
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_by UUID REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER DEFAULT 1, -- Increments on each modification
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes for performance
  CONSTRAINT kb_questions_check_approval CHECK (
    (is_approved = TRUE AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR
    (is_approved = FALSE)
  )
);

-- Table: knowledge_base_question_labels
-- Many-to-many relationship between questions and labels
CREATE TABLE IF NOT EXISTS knowledge_base_question_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES knowledge_base_questions(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES knowledge_base_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a label is only assigned once per question
  UNIQUE(question_id, label_id)
);

-- Table: knowledge_base_tech_company_approvers
-- Defines which users can approve questions for each technology company
-- This is the CRUD that Admin manages
CREATE TABLE IF NOT EXISTS knowledge_base_tech_company_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Corregido de technology_companies a tech_companies
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Ensure a user is only assigned once per tech company
  UNIQUE(tech_company_id, user_id)
);

-- Table: knowledge_base_attachments
-- Stores file attachments for questions
CREATE TABLE IF NOT EXISTS knowledge_base_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES knowledge_base_questions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Vercel Blob URL
  file_type TEXT, -- MIME type (e.g., 'application/pdf')
  file_size INTEGER, -- Size in bytes
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Corregido índice de technology_company_id a tech_company_id
CREATE INDEX IF NOT EXISTS idx_kb_questions_tech_company ON knowledge_base_questions(tech_company_id);
CREATE INDEX IF NOT EXISTS idx_kb_questions_created_by ON knowledge_base_questions(created_by);
CREATE INDEX IF NOT EXISTS idx_kb_questions_is_approved ON knowledge_base_questions(is_approved);
CREATE INDEX IF NOT EXISTS idx_kb_questions_search ON knowledge_base_questions USING gin(to_tsvector('spanish', question || ' ' || answer));

CREATE INDEX IF NOT EXISTS idx_kb_question_labels_question ON knowledge_base_question_labels(question_id);
CREATE INDEX IF NOT EXISTS idx_kb_question_labels_label ON knowledge_base_question_labels(label_id);

-- Corregido índice de technology_company_id a tech_company_id
CREATE INDEX IF NOT EXISTS idx_kb_approvers_tech_company ON knowledge_base_tech_company_approvers(tech_company_id);
CREATE INDEX IF NOT EXISTS idx_kb_approvers_user ON knowledge_base_tech_company_approvers(user_id);

CREATE INDEX IF NOT EXISTS idx_kb_attachments_question ON knowledge_base_attachments(question_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kb_labels_updated_at
  BEFORE UPDATE ON knowledge_base_labels
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_updated_at();

CREATE TRIGGER trigger_kb_questions_updated_at
  BEFORE UPDATE ON knowledge_base_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_kb_updated_at();

-- =====================================================
-- TRIGGER FOR VERSION INCREMENT ON MODIFICATION
-- =====================================================

CREATE OR REPLACE FUNCTION increment_kb_question_version()
RETURNS TRIGGER AS $$
BEGIN
  -- If question or answer changed, increment version and reset approval
  IF (OLD.question IS DISTINCT FROM NEW.question) OR (OLD.answer IS DISTINCT FROM NEW.answer) THEN
    NEW.version = OLD.version + 1;
    NEW.is_approved = FALSE;
    NEW.approved_at = NULL;
    NEW.approved_by = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_kb_question_version_increment
  BEFORE UPDATE ON knowledge_base_questions
  FOR EACH ROW
  EXECUTE FUNCTION increment_kb_question_version();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE knowledge_base_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_question_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_tech_company_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_attachments ENABLE ROW LEVEL SECURITY;

-- Labels: All authenticated users can read, only Admin can modify
CREATE POLICY "Anyone can view labels"
  ON knowledge_base_labels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only Admin can manage labels"
  ON knowledge_base_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code = 'admin'
    )
  );

-- Questions: BDD and Admin can read all, create, and edit
CREATE POLICY "BDD and Admin can view all questions"
  ON knowledge_base_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "BDD and Admin can create questions"
  ON knowledge_base_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "BDD and Admin can update questions"
  ON knowledge_base_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "Only Admin can delete questions"
  ON knowledge_base_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code = 'admin'
    )
  );

-- Question Labels: Same as questions
CREATE POLICY "BDD and Admin can view question labels"
  ON knowledge_base_question_labels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "BDD and Admin can manage question labels"
  ON knowledge_base_question_labels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

-- Tech Company Approvers: Only Admin can manage
CREATE POLICY "BDD and Admin can view approvers"
  ON knowledge_base_tech_company_approvers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "Only Admin can manage approvers"
  ON knowledge_base_tech_company_approvers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code = 'admin'
    )
  );

-- Attachments: Same as questions
CREATE POLICY "BDD and Admin can view attachments"
  ON knowledge_base_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

CREATE POLICY "BDD and Admin can manage attachments"
  ON knowledge_base_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('admin', 'bdd')
    )
  );

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE knowledge_base_labels IS 'Reusable labels/tags for categorizing FAQ questions';
COMMENT ON TABLE knowledge_base_questions IS 'FAQ questions and answers linked to technology companies';
COMMENT ON TABLE knowledge_base_question_labels IS 'Many-to-many relationship between questions and labels';
COMMENT ON TABLE knowledge_base_tech_company_approvers IS 'Defines which users can approve questions for each technology company (Admin CRUD)';
COMMENT ON TABLE knowledge_base_attachments IS 'File attachments supporting FAQ answers';

COMMENT ON COLUMN knowledge_base_questions.version IS 'Increments automatically when question or answer is modified';
COMMENT ON COLUMN knowledge_base_questions.is_approved IS 'Automatically set to FALSE when question/answer is modified';
