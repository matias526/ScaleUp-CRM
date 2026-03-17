-- Traducciones para el módulo de industrias
INSERT INTO translations (key, language, value) VALUES
-- Español
('industries.title', 'es', 'Industrias'),
('industries.description', 'es', 'Gestiona el catálogo de industrias'),
('industries.create_title', 'es', 'Crear Industria'),
('industries.edit_title', 'es', 'Editar Industria'),
('industries.name', 'es', 'Nombre'),
('industries.description_field', 'es', 'Descripción'),
('industries.is_active', 'es', 'Activa'),
('industries.display_order', 'es', 'Orden de visualización'),
('industries.select_industry', 'es', 'Seleccionar industria'),

-- Inglés
('industries.title', 'en', 'Industries'),
('industries.description', 'en', 'Manage the industries catalog'),
('industries.create_title', 'en', 'Create Industry'),
('industries.edit_title', 'en', 'Edit Industry'),
('industries.name', 'en', 'Name'),
('industries.description_field', 'en', 'Description'),
('industries.is_active', 'en', 'Active'),
('industries.display_order', 'en', 'Display Order'),
('industries.select_industry', 'en', 'Select industry'),

-- Portugués
('industries.title', 'pt', 'Indústrias'),
('industries.description', 'pt', 'Gerenciar o catálogo de indústrias'),
('industries.create_title', 'pt', 'Criar Indústria'),
('industries.edit_title', 'pt', 'Editar Indústria'),
('industries.name', 'pt', 'Nome'),
('industries.description_field', 'pt', 'Descrição'),
('industries.is_active', 'pt', 'Ativa'),
('industries.display_order', 'pt', 'Ordem de exibição'),
('industries.select_industry', 'pt', 'Selecionar indústria')

ON CONFLICT (key, language) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
