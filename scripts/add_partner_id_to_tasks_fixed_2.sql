-- Check if the column already exists before adding it
DO $
DECLARE
    policy_exists boolean;
BEGIN
    -- Check if column exists
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
        
        -- Check if policy exists
        SELECT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = 'tasks' 
            AND policyname = 'Users can view tasks related to their partner'
        ) INTO policy_exists;
        
        -- Update or create policy based on existence
        IF policy_exists THEN
            -- Update existing policy
            ALTER POLICY "Users can view tasks related to their partner" 
            ON public.tasks
            USING (
                auth.uid() IN (
                    SELECT id FROM public.users 
                    WHERE 
                        id = assigned_to 
                        OR id = assigned_by
                        OR partner_id = tasks.partner_id
                )
                OR 
                -- Check if user has admin role
                EXISTS (
                    SELECT 1 FROM public.users_roles ur
                    JOIN public.roles r ON ur.role_id = r.id
                    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
                )
            );
        ELSE
            -- Create new policy
            CREATE POLICY "Users can view tasks related to their partner" 
            ON public.tasks
            FOR SELECT
            USING (
                auth.uid() IN (
                    SELECT id FROM public.users 
                    WHERE 
                        id = assigned_to 
                        OR id = assigned_by
                        OR partner_id = tasks.partner_id
                )
                OR 
                -- Check if user has admin role
                EXISTS (
                    SELECT 1 FROM public.users_roles ur
                    JOIN public.roles r ON ur.role_id = r.id
                    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
                )
            );
        END IF;
        
        RAISE NOTICE 'Column partner_id added to tasks table successfully';
    ELSE
        RAISE NOTICE 'Column partner_id already exists in tasks table';
    END IF;
END
$;
