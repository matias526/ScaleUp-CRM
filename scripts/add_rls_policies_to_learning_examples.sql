-- Add RLS policies to kb_learning_examples table

-- Enable RLS on the table
ALTER TABLE kb_learning_examples ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API routes)
CREATE POLICY "Service role has full access to learning examples"
ON kb_learning_examples
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to insert learning examples
CREATE POLICY "Authenticated users can insert learning examples"
ON kb_learning_examples
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to view learning examples from their tech_company
CREATE POLICY "Users can view learning examples from their tech_company"
ON kb_learning_examples
FOR SELECT
TO authenticated
USING (
  tech_company_id IN (
    SELECT tech_company_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Policy: Allow authenticated users to update learning examples from their tech_company
CREATE POLICY "Users can update learning examples from their tech_company"
ON kb_learning_examples
FOR UPDATE
TO authenticated
USING (
  tech_company_id IN (
    SELECT tech_company_id 
    FROM users 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  tech_company_id IN (
    SELECT tech_company_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Policy: Allow authenticated users to delete learning examples from their tech_company
CREATE POLICY "Users can delete learning examples from their tech_company"
ON kb_learning_examples
FOR DELETE
TO authenticated
USING (
  tech_company_id IN (
    SELECT tech_company_id 
    FROM users 
    WHERE id = auth.uid()
  )
);
