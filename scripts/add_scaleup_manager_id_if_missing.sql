-- Verificar si la columna scaleup_manager_id existe
DO $$
BEGIN
  -- Verificar si la columna existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'partner_tech_companies' AND column_name = 'scaleup_manager_id'
  ) THEN
    -- Si no existe, añadirla
    EXECUTE 'ALTER TABLE partner_tech_companies ADD COLUMN scaleup_manager_id UUID REFERENCES auth.users(id)';
    RAISE NOTICE 'Columna scaleup_manager_id añadida a la tabla partner_tech_companies';
  ELSE
    RAISE NOTICE 'La columna scaleup_manager_id ya existe en la tabla partner_tech_companies';
  END IF;
END $$;
