-- Verificar si la restricción existe antes de intentar eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_task_relation' 
    AND conrelid = 'tasks'::regclass
  ) THEN
    -- Eliminar la restricción
    ALTER TABLE tasks DROP CONSTRAINT check_task_relation;
    
    -- Opcional: Crear una nueva restricción más flexible si es necesario
    -- Por ejemplo, para asegurar que al menos uno de los campos no sea NULL
    ALTER TABLE tasks ADD CONSTRAINT check_task_relation_flexible 
    CHECK (
      opportunity_id IS NOT NULL OR 
      tech_company_id IS NOT NULL OR 
      partner_id IS NOT NULL
    );
    
    RAISE NOTICE 'Restricción check_task_relation eliminada y reemplazada por check_task_relation_flexible';
  ELSE
    RAISE NOTICE 'La restricción check_task_relation no existe en la tabla tasks';
  END IF;
END $$;

-- Verificar si la restricción existe antes de intentar eliminarla
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_task_relation_flexible' 
    AND conrelid = 'tasks'::regclass
  ) THEN
    -- Eliminar la restricción
    ALTER TABLE tasks DROP CONSTRAINT check_task_relation_flexible;
    
    -- Crear una nueva restricción más flexible que permita tareas independientes
    ALTER TABLE tasks ADD CONSTRAINT check_task_relation_optional 
    CHECK (
      TRUE  -- Esto permite cualquier combinación, incluyendo todos NULL
    );
    
    RAISE NOTICE 'Restricción check_task_relation_flexible eliminada y reemplazada por check_task_relation_optional';
  ELSE
    RAISE NOTICE 'La restricción check_task_relation_flexible no existe en la tabla tasks';
  END IF;
END $$;
