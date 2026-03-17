-- Script para agregar campos de compromisos a tasks y previous_meeting_id a internal_weekly_meetings
-- Versión 2: Corregido con campo comments y ALTER TABLE para internal_weekly_meetings

-- 1. Agregar campos a la tabla tasks para manejar compromisos
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_commitment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reviewed_in_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS commitment_status VARCHAR(20) CHECK (commitment_status IN ('completed', 'not_completed', 'partial')),
ADD COLUMN IF NOT EXISTS commitment_comments TEXT;

-- 2. Agregar campo a la tabla internal_weekly_meetings para vincular con reunión anterior
ALTER TABLE internal_weekly_meetings
ADD COLUMN IF NOT EXISTS previous_meeting_id UUID REFERENCES internal_weekly_meetings(id) ON DELETE SET NULL;

-- 3. Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_tasks_meeting_id ON tasks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_commitment ON tasks(is_commitment);
CREATE INDEX IF NOT EXISTS idx_tasks_reviewed_in_meeting ON tasks(reviewed_in_meeting_id);
CREATE INDEX IF NOT EXISTS idx_internal_meetings_previous ON internal_weekly_meetings(previous_meeting_id);

-- 4. Comentarios para documentación
COMMENT ON COLUMN tasks.meeting_id IS 'ID de la reunión donde se creó este compromiso';
COMMENT ON COLUMN tasks.is_commitment IS 'Indica si esta tarea es un compromiso de reunión';
COMMENT ON COLUMN tasks.reviewed_in_meeting_id IS 'ID de la reunión donde se revisó este compromiso';
COMMENT ON COLUMN tasks.commitment_status IS 'Estado del compromiso: completed (Sí), not_completed (No), partial (Parcial)';
COMMENT ON COLUMN tasks.commitment_comments IS 'Comentarios sobre el cumplimiento del compromiso';
COMMENT ON COLUMN internal_weekly_meetings.previous_meeting_id IS 'ID de la reunión anterior en la secuencia';
