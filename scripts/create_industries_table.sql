-- Crear tabla de industrias
CREATE TABLE IF NOT EXISTS industries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(name);
CREATE INDEX IF NOT EXISTS idx_industries_is_active ON industries(is_active);
CREATE INDEX IF NOT EXISTS idx_industries_display_order ON industries(display_order);

-- Insertar industrias básicas
INSERT INTO industries (name, code, display_order, is_active) VALUES
('Tecnología', 'TECH', 1, true),
('Finanzas', 'FIN', 2, true),
('Salud', 'HEALTH', 3, true),
('Educación', 'EDU', 4, true),
('Retail', 'RETAIL', 5, true),
('Manufactura', 'MFG', 6, true),
('Servicios', 'SERV', 7, true),
('Energía', 'ENERGY', 8, true),
('Inmobiliario', 'REAL', 9, true),
('Transporte', 'TRANS', 10, true),
('Telecomunicaciones', 'TELECOM', 11, true),
('Media y Entretenimiento', 'MEDIA', 12, true),
('Agricultura', 'AGRI', 13, true),
('Construcción', 'CONST', 14, true),
('Consultoría', 'CONSULT', 15, true),
('Gobierno', 'GOV', 16, true),
('Sin fines de lucro', 'NONPROFIT', 17, true),
('Otros', 'OTHER', 99, true)
ON CONFLICT (name) DO NOTHING;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_industries_updated_at 
    BEFORE UPDATE ON industries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos pueden leer industrias activas)
CREATE POLICY "Anyone can read active industries" ON industries
  FOR SELECT USING (is_active = true);

-- Política para administradores (pueden hacer todo)
CREATE POLICY "Admins can manage industries" ON industries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'Admin'
    )
  );
