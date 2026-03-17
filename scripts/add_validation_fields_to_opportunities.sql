-- Verificar si existen los campos de validación en la tabla opportunities
DO $$
BEGIN
  -- Verificar y añadir validation_status
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities' 
    AND column_name = 'validation_status'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN validation_status VARCHAR(20) DEFAULT 'pending';
  END IF;

  -- Verificar y añadir validation_date
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities' 
    AND column_name = 'validation_date'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN validation_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Verificar y añadir validation_by
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'opportunities' 
    AND column_name = 'validation_by'
  ) THEN
    ALTER TABLE opportunities ADD COLUMN validation_by UUID REFERENCES auth.users(id);
  END IF;
END $$;
