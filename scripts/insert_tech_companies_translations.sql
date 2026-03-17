-- Insertar traducciones para la sección de empresas tecnológicas
INSERT INTO translations (key, language, value)
VALUES
  -- Títulos y encabezados
  ('tech_companies.list.title', 'es', 'Empresas Tecnológicas'),
  ('tech_companies.list.title', 'en', 'Tech Companies'),
  ('tech_companies.list.title', 'pt', 'Empresas Tecnológicas'),
  
  -- Campos
  ('tech_companies.fields.logo', 'es', 'Logo'),
  ('tech_companies.fields.logo', 'en', 'Logo'),
  ('tech_companies.fields.logo', 'pt', 'Logo'),
  
  ('tech_companies.fields.name', 'es', 'Nombre'),
  ('tech_companies.fields.name', 'en', 'Name'),
  ('tech_companies.fields.name', 'pt', 'Nome'),
  
  ('tech_companies.fields.website', 'es', 'Sitio Web'),
  ('tech_companies.fields.website', 'en', 'Website'),
  ('tech_companies.fields.website', 'pt', 'Site'),
  
  ('tech_companies.fields.status', 'es', 'Estado'),
  ('tech_companies.fields.status', 'en', 'Status'),
  ('tech_companies.fields.status', 'pt', 'Estado'),
  
  -- Estados
  ('tech_companies.status.active', 'es', 'Activo'),
  ('tech_companies.status.active', 'en', 'Active'),
  ('tech_companies.status.active', 'pt', 'Ativo'),
  
  ('tech_companies.status.inactive', 'es', 'Inactivo'),
  ('tech_companies.status.inactive', 'en', 'Inactive'),
  ('tech_companies.status.inactive', 'pt', 'Inativo'),
  
  -- Botones y acciones
  ('tech_companies.create.button', 'es', 'Añadir Empresa Tecnológica'),
  ('tech_companies.create.button', 'en', 'Add Tech Company'),
  ('tech_companies.create.button', 'pt', 'Adicionar Empresa Tecnológica'),
  
  -- Mensajes
  ('tech_companies.list.no_results', 'es', 'No se encontraron empresas tecnológicas que coincidan con tu búsqueda.'),
  ('tech_companies.list.no_results', 'en', 'No tech companies found matching your search.'),
  ('tech_companies.list.no_results', 'pt', 'Nenhuma empresa tecnológica encontrada correspondente à sua pesquisa.'),
  
  ('tech_companies.list.empty', 'es', 'No se encontraron empresas tecnológicas. ¡Crea tu primera empresa!'),
  ('tech_companies.list.empty', 'en', 'No tech companies found. Create your first one!'),
  ('tech_companies.list.empty', 'pt', 'Nenhuma empresa tecnológica encontrada. Crie sua primeira empresa!'),
  
  ('tech_companies.delete.confirm', 'es', '¿Estás seguro de que deseas eliminar esta empresa tecnológica? Esta acción no se puede deshacer.'),
  ('tech_companies.delete.confirm', 'en', 'Are you sure you want to delete this tech company? This action cannot be undone.'),
  ('tech_companies.delete.confirm', 'pt', 'Tem certeza de que deseja excluir esta empresa tecnológica? Esta ação não pode ser desfeita.');
