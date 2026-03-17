-- Script para agregar funcionalidad de compromisos a las tareas
-- Versión 1 - Fecha: 2025-01-09

-- 1. Agregar campos a la tabla tasks para soportar compromisos
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_commitment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_in_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commitment_status VARCHAR(20) CHECK (commitment_status IN ('completed', 'not_completed', 'partial'));

-- 2. Agregar índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_commitment ON tasks(is_commitment);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewed_in_meeting_id ON tasks(reviewed_in_meeting_id);

-- 3. Agregar campo a internal_weekly_meetings para vincular con la reunión anterior
ALTER TABLE internal_weekly_meetings
ADD COLUMN IF NOT EXISTS previous_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL;

-- 4. Agregar índice para la relación de reunión anterior
CREATE INDEX IF NOT EXISTS idx_meetings_previous_meeting_id ON internal_weekly_meetings(previous_meeting_id);

-- 5. Agregar comentarios para documentar los campos
COMMENT ON COLUMN tasks.meeting_id IS 'ID de la reunión donde se creó este compromiso';
COMMENT ON COLUMN tasks.is_commitment IS 'Indica si esta tarea es un compromiso de reunión';
COMMENT ON COLUMN tasks.reviewed_in_meeting_id IS 'ID de la reunión donde se revisó este compromiso';
COMMENT ON COLUMN tasks.commitment_status IS 'Estado del cumplimiento: completed (Sí), not_completed (No), partial (Parcial)';
COMMENT ON COLUMN internal_weekly_meetings.previous_meeting_id IS 'ID de la reunión anterior en la secuencia';
