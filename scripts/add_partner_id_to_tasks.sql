-- Check if the column already exists before adding it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tasks' 
        AND column_name = 'partner_id'
    ) THEN
        -- Add partner_id column to tasks table
        ALTER TABLE public.tasks 
        ADD COLUMN partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;
        
        -- Add comment to the column
        COMMENT ON COLUMN public.tasks.partner_id IS 'Reference to the partner associated with this task';
        
        -- Update RLS policies to include the new column
        -- First, let's check if we need to update existing policies
        
        -- Grant permissions for authenticated users to select tasks with their partner_id
        ALTER POLICY IF EXISTS "Users can view tasks related to their partner" 
        ON public.tasks
        USING (
            auth.uid() IN (
                SELECT id FROM public.users 
                WHERE 
                    is_admin = true 
                    OR id = assigned_to 
                    OR id = assigned_by
                    OR partner_id = tasks.partner_id
            )
        );
        
        -- If the policy doesn't exist, create it
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies 
                WHERE schemaname = 'public' 
                AND tablename = 'tasks' 
                AND policyname = 'Users can view tasks related to their partner'
            ) THEN
                CREATE POLICY "Users can view tasks related to their partner" 
                ON public.tasks
                FOR SELECT
                USING (
                    auth.uid() IN (
                        SELECT id FROM public.users 
                        WHERE 
                            is_admin = true 
                            OR id = assigned_to 
                            OR id = assigned_by
                            OR partner_id = tasks.partner_id
                    )
                );
            END IF;
        END
        $$;
        
        RAISE NOTICE 'Column partner_id added to tasks table successfully';
    ELSE
        RAISE NOTICE 'Column partner_id already exists in tasks table';
    END IF;
END
$$;
