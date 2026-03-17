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

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_tech_company 
ON weekly_report_recipients(tech_company_id);

CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_user 
ON weekly_report_recipients(user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_report_recipients_active 
ON weekly_report_recipients(is_active) WHERE is_active = true;

-- RLS (Row Level Security)
ALTER TABLE weekly_report_recipients ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins pueden gestionar configuraciones
CREATE POLICY "weekly_report_recipients_admin_all" ON weekly_report_recipients
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.code = 'Admin'
  )
);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_weekly_report_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_weekly_report_recipients_updated_at ON weekly_report_recipients;
CREATE TRIGGER update_weekly_report_recipients_updated_at
  BEFORE UPDATE ON weekly_report_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_report_recipients_updated_at();

-- Insertar algunos datos de ejemplo (opcional)
DO $$
DECLARE
  tech_company_record RECORD;
  admin_user_record RECORD;
BEGIN
  -- Para cada tech company, agregar usuarios admin como destinatarios por defecto
  FOR tech_company_record IN 
    SELECT id FROM tech_companies WHERE is_active = true LIMIT 3
  LOOP
    FOR admin_user_record IN 
      SELECT u.id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.code = 'Admin' AND u.is_active = true LIMIT 2
    LOOP
      INSERT INTO weekly_report_recipients (tech_company_id, user_id)
      VALUES (tech_company_record.id, admin_user_record.id)
      ON CONFLICT (tech_company_id, user_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Verificar la creación
SELECT 
  tc.name as tech_company,
  u.first_name || ' ' || u.last_name as recipient,
  u.email,
  wrr.is_active,
  wrr.created_at
FROM weekly_report_recipients wrr
JOIN tech_companies tc ON wrr.tech_company_id = tc.id
JOIN users u ON wrr.user_id = u.id
ORDER BY tc.name, u.first_name;
