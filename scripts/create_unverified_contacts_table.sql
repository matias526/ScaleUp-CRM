-- Create unverified_contacts table for Pulse module
CREATE TABLE IF NOT EXISTS unverified_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT NOT NULL,
  position TEXT,
  industry_id UUID REFERENCES industries(id),
  country_id UUID REFERENCES countries(id),
  source TEXT NOT NULL DEFAULT 'BULK_IMPORT', -- BULK_IMPORT, WEB_FORM, EVENT
  status TEXT NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, GRADUATED, DISCARDED
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_unverified_contacts_email ON unverified_contacts(email);
CREATE INDEX IF NOT EXISTS idx_unverified_contacts_source ON unverified_contacts(source);
CREATE INDEX IF NOT EXISTS idx_unverified_contacts_status ON unverified_contacts(status);
CREATE INDEX IF NOT EXISTS idx_unverified_contacts_created_at ON unverified_contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_unverified_contacts_deleted_at ON unverified_contacts(deleted_at);

-- Enable RLS
ALTER TABLE unverified_contacts ENABLE ROW LEVEL SECURITY;

-- Allow admins and marketing users to view all unverified contacts
CREATE POLICY "Allow admin and marketing to view all unverified contacts" ON unverified_contacts
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.is_admin = true OR users.role_code = 'MARKETING'
    )
  );

-- Allow admins and marketing users to insert unverified contacts
CREATE POLICY "Allow admin and marketing to insert unverified contacts" ON unverified_contacts
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.is_admin = true OR users.role_code = 'MARKETING'
    )
  );

-- Allow admins and marketing users to update unverified contacts
CREATE POLICY "Allow admin and marketing to update unverified contacts" ON unverified_contacts
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.is_admin = true OR users.role_code = 'MARKETING'
    )
  );

-- Allow admins and marketing users to delete unverified contacts
CREATE POLICY "Allow admin and marketing to delete unverified contacts" ON unverified_contacts
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT users.id FROM users
      WHERE users.is_admin = true OR users.role_code = 'MARKETING'
    )
  );
