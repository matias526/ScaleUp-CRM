-- Eliminar las políticas RLS incorrectas
DROP POLICY IF EXISTS "Admin and BDD can view all labels" ON knowledge_base_labels;
DROP POLICY IF EXISTS "Admin can manage labels" ON knowledge_base_labels;
DROP POLICY IF EXISTS "Admin and BDD can view all questions" ON knowledge_base_questions;
DROP POLICY IF EXISTS "Admin and BDD can create questions" ON knowledge_base_questions;
DROP POLICY IF EXISTS "Admin and BDD can update questions" ON knowledge_base_questions;
DROP POLICY IF EXISTS "Admin can delete questions" ON knowledge_base_questions;
DROP POLICY IF EXISTS "Admin and BDD can view question labels" ON knowledge_base_question_labels;
DROP POLICY IF EXISTS "Admin and BDD can manage question labels" ON knowledge_base_question_labels;
DROP POLICY IF EXISTS "Admin can view all approvers" ON knowledge_base_tech_company_approvers;
DROP POLICY IF EXISTS "Admin can manage approvers" ON knowledge_base_tech_company_approvers;
DROP POLICY IF EXISTS "Admin and BDD can view attachments" ON knowledge_base_attachments;
DROP POLICY IF EXISTS "Admin and BDD can manage attachments" ON knowledge_base_attachments;

-- Recrear las políticas RLS con los códigos de roles correctos (Admin y BDD con mayúsculas)

-- Políticas para knowledge_base_labels
CREATE POLICY "Admin and BDD can view all labels"
ON knowledge_base_labels FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin can manage labels"
ON knowledge_base_labels FOR ALL
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
)
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- Políticas para knowledge_base_questions
CREATE POLICY "Admin and BDD can view all questions"
ON knowledge_base_questions FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin and BDD can create questions"
ON knowledge_base_questions FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin and BDD can update questions"
ON knowledge_base_questions FOR UPDATE
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
)
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin can delete questions"
ON knowledge_base_questions FOR DELETE
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- Políticas para knowledge_base_question_labels
CREATE POLICY "Admin and BDD can view question labels"
ON knowledge_base_question_labels FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin and BDD can manage question labels"
ON knowledge_base_question_labels FOR ALL
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
)
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

-- Políticas para knowledge_base_tech_company_approvers
CREATE POLICY "Admin can view all approvers"
ON knowledge_base_tech_company_approvers FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

CREATE POLICY "Admin can manage approvers"
ON knowledge_base_tech_company_approvers FOR ALL
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
)
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) = 'Admin'
);

-- Políticas para knowledge_base_attachments
CREATE POLICY "Admin and BDD can view attachments"
ON knowledge_base_attachments FOR SELECT
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);

CREATE POLICY "Admin and BDD can manage attachments"
ON knowledge_base_attachments FOR ALL
TO authenticated
USING (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
)
WITH CHECK (
  (SELECT r.code FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('Admin', 'BDD')
);
