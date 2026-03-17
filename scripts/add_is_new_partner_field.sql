-- Add is_new_partner field to opportunities table
-- This field indicates if the opportunity is for incorporating a new partner
-- Only visible to ScaleUp users

ALTER TABLE opportunities 
ADD COLUMN is_new_partner BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the field purpose
COMMENT ON COLUMN opportunities.is_new_partner IS 'Indicates if this opportunity is for incorporating a new partner. Only visible to ScaleUp users.';
