-- Insertar traducciones faltantes del sidebar si no existen
INSERT INTO translations (key, language, value)
VALUES 
  ('sidebar.dashboard', 'en', 'Dashboard'),
  ('sidebar.opportunities', 'en', 'Opportunities'),
  ('sidebar.partners', 'en', 'Partners'),
  ('sidebar.tech_companies', 'en', 'Tech Companies'),
  ('sidebar.users', 'en', 'Users'),
  ('sidebar.tasks', 'en', 'Tasks'),
  ('sidebar.settings', 'en', 'Settings'),
  
  ('sidebar.dashboard', 'es', 'Dashboard'),
  ('sidebar.opportunities', 'es', 'Oportunidades'),
  ('sidebar.partners', 'es', 'Socios'),
  ('sidebar.tech_companies', 'es', 'Empresas Tech'),
  ('sidebar.users', 'es', 'Usuarios'),
  ('sidebar.tasks', 'es', 'Tareas'),
  ('sidebar.settings', 'es', 'Configuración'),
  
  ('sidebar.dashboard', 'pt', 'Dashboard'),
  ('sidebar.opportunities', 'pt', 'Oportunidades'),
  ('sidebar.partners', 'pt', 'Parceiros'),
  ('sidebar.tech_companies', 'pt', 'Empresas Tech'),
  ('sidebar.users', 'pt', 'Usuários'),
  ('sidebar.tasks', 'pt', 'Tarefas'),
  ('sidebar.settings', 'pt', 'Configurações')
ON CONFLICT (key, language) DO UPDATE
SET value = EXCLUDED.value;
