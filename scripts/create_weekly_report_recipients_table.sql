-- Crear tabla para configurar destinatarios de reportes semanales por tech company
CREATE TABLE IF NOT EXISTS weekly_report_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_company_id UUID NOT NULL REFERENCES tech_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Evitar duplicados
  UNIQUE(tech_company_id, user_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_tech_company 
ON weekly_report_recipients(tech_company_id);

CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_user 
ON weekly_report_recipients(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_active 
ON weekly_report_recipients(is_active) WHERE is_active = true;

-- RLS (Row Level Security)
ALTER TABLE weekly_report_recipients ENABLE ROW LEVEL SECURITY;

-- Política para que solo admins puedan gestionar
CREATE POLICY "weekly_report_recipients_admin_policy" ON weekly_report_recipients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    JOIN roles ON users.role_id = roles.id 
    WHERE users.id = auth.uid() 
    AND roles.code = 'Admin'
  )
);

-- Comentarios
COMMENT ON TABLE weekly_report_recipients IS 'Configuración de destinatarios para reportes semanales por empresa tecnológica';
COMMENT ON COLUMN weekly_report_recipients.tech_company_id IS 'ID de la empresa tecnológica';
COMMENT ON COLUMN weekly_report_recipients.user_id IS 'ID del usuario que recibirá el reporte';
COMMENT ON COLUMN weekly_report_recipients.is_active IS 'Si el usuario está activo para recibir reportes';
