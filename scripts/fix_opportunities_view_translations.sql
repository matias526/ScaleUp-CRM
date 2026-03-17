-- Añadir traducciones faltantes para opportunities.table_view y opportunities.kanban_view en inglés
INSERT INTO translations (key, language, value, created_at, updated_at)
VALUES 
('opportunities.table_view', 'en', 'Table View', NOW(), NOW()),
('opportunities.kanban_view', 'en', 'Kanban View', NOW(), NOW())
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Añadir traducciones faltantes para opportunities.table_view y opportunities.kanban_view en portugués
INSERT INTO translations (key, language, value, created_at, updated_at)
VALUES 
('opportunities.table_view', 'pt', 'Visualização em Tabela', NOW(), NOW()),
('opportunities.kanban_view', 'pt', 'Visualização Kanban', NOW(), NOW())
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Añadir traducciones faltantes para opportunities.title y opportunities.create en portugués
INSERT INTO translations (key, language, value, created_at, updated_at)
VALUES 
('opportunities.title', 'pt', 'Oportunidades', NOW(), NOW()),
('opportunities.create', 'pt', 'Criar Oportunidade', NOW(), NOW())
ON CONFLICT (key, language) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Verificar que las traducciones se hayan añadido correctamente
SELECT key, language, value 
FROM translations 
WHERE key IN ('opportunities.table_view', 'opportunities.kanban_view', 'opportunities.title', 'opportunities.create')
ORDER BY key, language;
