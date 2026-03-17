-- Verificar si la columna tech_company_id ya existe en la tabla users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'tech_company_id'
    ) THEN
        -- Agregar la columna tech_company_id a la tabla users
        ALTER TABLE users
        ADD COLUMN tech_company_id UUID REFERENCES tech_companies(id) ON DELETE SET NULL;
        
        -- Agregar un índice para mejorar el rendimiento de las consultas
        CREATE INDEX idx_users_tech_company_id ON users(tech_company_id);
        
        RAISE NOTICE 'Columna tech_company_id agregada a la tabla users';
    ELSE
        RAISE NOTICE 'La columna tech_company_id ya existe en la tabla users';
    END IF;
END $$;
