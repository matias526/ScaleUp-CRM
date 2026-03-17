-- Actualizar schema para simplificar el sistema de aprendizaje

-- Renombrar columnas para mayor claridad
ALTER TABLE kb_learning_examples 
  DROP COLUMN IF EXISTS mika_response,
  DROP COLUMN IF EXISTS user_correction;

-- Agregar columna correct_answer si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kb_learning_examples' 
    AND column_name = 'correct_answer'
  ) THEN
    ALTER TABLE kb_learning_examples 
      ADD COLUMN correct_answer TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Asegurar que is_positive existe y tiene default
ALTER TABLE kb_learning_examples 
  ALTER COLUMN is_positive SET DEFAULT true;

-- Comentarios para documentar el schema
COMMENT ON COLUMN kb_learning_examples.user_query IS 'Contenido del aprendizaje o contexto de la pregunta';
COMMENT ON COLUMN kb_learning_examples.correct_answer IS 'Conocimiento correcto que Mika debe aplicar';
COMMENT ON COLUMN kb_learning_examples.is_positive IS 'true = conocimiento nuevo, false = corrección (deprecado)';
