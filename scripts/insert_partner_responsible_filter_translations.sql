-- Traducciones para el filtro de responsable del partner
INSERT INTO translations (key, language, value, category) VALUES
-- Español
('filterByResponsible', 'es', 'Filtrar por responsable', 'opportunities'),
('allResponsibles', 'es', 'Todos los responsables', 'opportunities'),
('results', 'es', 'resultados', 'opportunities'),

-- Inglés
('filterByResponsible', 'en', 'Filter by responsible', 'opportunities'),
('allResponsibles', 'en', 'All responsibles', 'opportunities'),
('results', 'en', 'results', 'opportunities'),

-- Portugués
('filterByResponsible', 'pt', 'Filtrar por responsável', 'opportunities'),
('allResponsibles', 'pt', 'Todos os responsáveis', 'opportunities'),
('results', 'pt', 'resultados', 'opportunities')

ON CONFLICT (key, language) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;
