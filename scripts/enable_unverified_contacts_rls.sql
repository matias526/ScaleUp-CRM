-- Enable RLS on unverified_contacts table
ALTER TABLE public.unverified_contacts ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all unverified contacts
CREATE POLICY "Admins can view all unverified contacts"
  ON public.unverified_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for marketing users to view all unverified contacts
CREATE POLICY "Marketing users can view all unverified contacts"
  ON public.unverified_contacts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'marketing'
    )
  );

-- Policy for admins to insert unverified contacts
CREATE POLICY "Admins can insert unverified contacts"
  ON public.unverified_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for marketing users to insert unverified contacts
CREATE POLICY "Marketing users can insert unverified contacts"
  ON public.unverified_contacts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'marketing'
    )
  );

-- Policy for admins to update unverified contacts
CREATE POLICY "Admins can update unverified contacts"
  ON public.unverified_contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for marketing users to update unverified contacts
CREATE POLICY "Marketing users can update unverified contacts"
  ON public.unverified_contacts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'marketing'
    )
  );

-- Policy for admins to delete unverified contacts
CREATE POLICY "Admins can delete unverified contacts"
  ON public.unverified_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for marketing users to delete unverified contacts
CREATE POLICY "Marketing users can delete unverified contacts"
  ON public.unverified_contacts
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'marketing'
    )
  );
