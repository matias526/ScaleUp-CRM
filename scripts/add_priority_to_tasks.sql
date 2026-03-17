-- Verificar si la columna priority ya existe en la tabla tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    -- Agregar la columna priority a la tabla tasks
    ALTER TABLE tasks ADD COLUMN priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low'));
    
    -- Actualizar todas las tareas existentes con prioridad media
    UPDATE tasks SET priority = 'medium';
    
    -- Agregar traducciones para las prioridades
    INSERT INTO translations (key, es, en, pt) VALUES 
      ('task.priority.high', 'Alta', 'High', 'Alta'),
      ('task.priority.medium', 'Media', 'Medium', 'Média'),
      ('task.priority.low', 'Baja', 'Low', 'Baixa'),
      ('task.priority.label', 'Prioridad', 'Priority', 'Prioridade')
    ON CONFLICT (key) DO NOTHING;
    
    -- Verificar si existe una vista de tareas y actualizarla si es necesario
    IF EXISTS (
      SELECT 1
      FROM information_schema.views
      WHERE table_name = 'tasks_view'
    ) THEN
      -- Recrear la vista para incluir el nuevo campo
      CREATE OR REPLACE VIEW tasks_view AS
      SELECT t.*, 
             u.full_name as assigned_to_name,
             p.name as partner_name,
             o.title as opportunity_title,
             tt.name as task_type_name,
             t.priority
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN partners p ON t.partner_id = p.id
      LEFT JOIN opportunities o ON t.opportunity_id = o.id
      LEFT JOIN task_types tt ON t.task_type_id = tt.id;
    END IF;
    
    RAISE NOTICE 'Columna priority agregada a la tabla tasks';
  ELSE
    RAISE NOTICE 'La columna priority ya existe en la tabla tasks';
  END IF;
END $$;
