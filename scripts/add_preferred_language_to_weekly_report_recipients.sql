-- Agregar columna preferred_language a la tabla weekly_report_recipients
ALTER TABLE weekly_report_recipients 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(2) DEFAULT 'es';

-- Agregar comentario para documentar los valores válidos
COMMENT ON COLUMN weekly_report_recipients.preferred_language IS 'Idioma preferido para el reporte: es (español), en (inglés), pt (portugués)';

-- Crear índice para mejorar performance en consultas por idioma
CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_language 
ON weekly_report_recipients(preferred_language);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'weekly_report_recipients' 
ORDER BY ordinal_position;
