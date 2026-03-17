-- Add partner_id column to tasks table with foreign key reference
ALTER TABLE public.tasks 
ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

-- Add comment to the column
COMMENT ON COLUMN public.tasks.partner_id IS 'Reference to the partner associated with this task';
