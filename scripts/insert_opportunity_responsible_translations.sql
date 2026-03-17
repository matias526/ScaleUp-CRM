-- Insertar traducciones para los campos de responsables en oportunidades

-- Español
INSERT INTO translations (key, language, value)
VALUES 
('opportunities.form.responsible_persons', 'es', 'Personas responsables'),
('opportunities.form.assigned_to', 'es', 'Responsable de ScaleUp'),
('opportunities.form.partner_responsible', 'es', 'Responsable del Partner')
ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Inglés
INSERT INTO translations (key, language, value)
VALUES 
('opportunities.form.responsible_persons', 'en', 'Responsible Persons'),
('opportunities.form.assigned_to', 'en', 'ScaleUp Manager'),
('opportunities.form.partner_responsible', 'en', 'Partner Representative')
ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Portugués
INSERT INTO translations (key, language, value)
VALUES 
('opportunities.form.responsible_persons', 'pt', 'Pessoas responsáveis'),
('opportunities.form.assigned_to', 'pt', 'Responsável da ScaleUp'),
('opportunities.form.partner_responsible', 'pt', 'Responsável do Parceiro')
ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
