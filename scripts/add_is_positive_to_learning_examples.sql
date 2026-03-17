-- Agregar columna para marcar ejemplos positivos
ALTER TABLE kb_learning_examples
ADD COLUMN IF NOT EXISTS is_positive boolean DEFAULT false;

-- Crear índice para búsquedas más rápidas
CREATE INDEX IF NOT EXISTS idx_learning_examples_positive 
ON kb_learning_examples(tech_company_id, is_positive);
