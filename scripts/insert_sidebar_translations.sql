-- Traducciones para el menú lateral en español
INSERT INTO translations (key, language, value) VALUES
('sidebar.title', 'es', 'CRM ScaleUp'),
('sidebar.navigation', 'es', 'Navegación'),
('sidebar.menu', 'es', 'Menú'),
('sidebar.dashboard', 'es', 'Dashboard'),
('sidebar.tech_companies', 'es', 'Empresas Tecnológicas'),
('sidebar.tech_companies.list', 'es', 'Listado'),
('sidebar.tech_companies.create', 'es', 'Crear nueva'),
('sidebar.partners', 'es', 'Partners'),
('sidebar.partners.list', 'es', 'Listado'),
('sidebar.partners.create', 'es', 'Crear nuevo'),
('sidebar.users', 'es', 'Usuarios'),
('sidebar.users.list', 'es', 'Listado'),
('sidebar.users.create', 'es', 'Crear nuevo'),
('sidebar.customers', 'es', 'Clientes Finales'),
('sidebar.customers.list', 'es', 'Listado'),
('sidebar.customers.create', 'es', 'Crear nuevo'),
('sidebar.opportunities', 'es', 'Oportunidades'),
('sidebar.opportunities.list', 'es', 'Listado'),
('sidebar.opportunities.create', 'es', 'Crear nueva'),
('sidebar.settings', 'es', 'Configuración'),
('sidebar.settings.general', 'es', 'General'),
('sidebar.settings.translations', 'es', 'Traducciones'),
('sidebar.settings.supabase', 'es', 'Supabase'),

-- Traducciones para el encabezado en español
('header.app_name', 'es', 'CRM ScaleUp'),
('header.menu', 'es', 'Menú'),
('header.profile', 'es', 'Mi Perfil'),
('header.notifications', 'es', 'Notificaciones'),

-- Traducciones para la autenticación en español
('auth.logout', 'es', 'Cerrar sesión'),
('auth.logging_out', 'es', 'Cerrando sesión...'),

-- Traducciones para el dashboard en español
('dashboard.title', 'es', 'Dashboard'),
('dashboard.welcome_card.title', 'es', 'Bienvenido al CRM de ScaleUp'),
('dashboard.welcome_card.description', 'es', 'Gestiona tus relaciones comerciales de manera eficiente'),
('dashboard.welcome_card.content', 'es', 'Hola, {name}. Este es el panel de control del CRM de ScaleUp. Desde aquí podrás gestionar empresas tecnológicas, partners, clientes finales y oportunidades de negocio.')

ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para el menú lateral en inglés
INSERT INTO translations (key, language, value) VALUES
('sidebar.title', 'en', 'CRM ScaleUp'),
('sidebar.navigation', 'en', 'Navigation'),
('sidebar.menu', 'en', 'Menu'),
('sidebar.dashboard', 'en', 'Dashboard'),
('sidebar.tech_companies', 'en', 'Technology Companies'),
('sidebar.tech_companies.list', 'en', 'List'),
('sidebar.tech_companies.create', 'en', 'Create new'),
('sidebar.partners', 'en', 'Partners'),
('sidebar.partners.list', 'en', 'List'),
('sidebar.partners.create', 'en', 'Create new'),
('sidebar.users', 'en', 'Users'),
('sidebar.users.list', 'en', 'List'),
('sidebar.users.create', 'en', 'Create new'),
('sidebar.customers', 'en', 'End Customers'),
('sidebar.customers.list', 'en', 'List'),
('sidebar.customers.create', 'en', 'Create new'),
('sidebar.opportunities', 'en', 'Opportunities'),
('sidebar.opportunities.list', 'en', 'List'),
('sidebar.opportunities.create', 'en', 'Create new'),
('sidebar.settings', 'en', 'Settings'),
('sidebar.settings.general', 'en', 'General'),
('sidebar.settings.translations', 'en', 'Translations'),
('sidebar.settings.supabase', 'en', 'Supabase'),

-- Traducciones para el encabezado en inglés
('header.app_name', 'en', 'CRM ScaleUp'),
('header.menu', 'en', 'Menu'),
('header.profile', 'en', 'My Profile'),
('header.notifications', 'en', 'Notifications'),

-- Traducciones para la autenticación en inglés
('auth.logout', 'en', 'Logout'),
('auth.logging_out', 'en', 'Logging out...'),

-- Traducciones para el dashboard en inglés
('dashboard.title', 'en', 'Dashboard'),
('dashboard.welcome_card.title', 'en', 'Welcome to ScaleUp CRM'),
('dashboard.welcome_card.description', 'en', 'Manage your business relationships efficiently'),
('dashboard.welcome_card.content', 'en', 'Hello, {name}. This is the ScaleUp CRM dashboard. From here you can manage technology companies, partners, end customers and business opportunities.')

ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para el menú lateral en portugués
INSERT INTO translations (key, language, value) VALUES
('sidebar.title', 'pt', 'CRM ScaleUp'),
('sidebar.navigation', 'pt', 'Navegação'),
('sidebar.menu', 'pt', 'Menu'),
('sidebar.dashboard', 'pt', 'Dashboard'),
('sidebar.tech_companies', 'pt', 'Empresas de Tecnologia'),
('sidebar.tech_companies.list', 'pt', 'Lista'),
('sidebar.tech_companies.create', 'pt', 'Criar nova'),
('sidebar.partners', 'pt', 'Parceiros'),
('sidebar.partners.list', 'pt', 'Lista'),
('sidebar.partners.create', 'pt', 'Criar novo'),
('sidebar.users', 'pt', 'Usuários'),
('sidebar.users.list', 'pt', 'Lista'),
('sidebar.users.create', 'pt', 'Criar novo'),
('sidebar.customers', 'pt', 'Clientes Finais'),
('sidebar.customers.list', 'pt', 'Lista'),
('sidebar.customers.create', 'pt', 'Criar novo'),
('sidebar.opportunities', 'pt', 'Oportunidades'),
('sidebar.opportunities.list', 'pt', 'Lista'),
('sidebar.opportunities.create', 'pt', 'Criar nova'),
('sidebar.settings', 'pt', 'Configurações'),
('sidebar.settings.general', 'pt', 'Geral'),
('sidebar.settings.translations', 'pt', 'Traduções'),
('sidebar.settings.supabase', 'pt', 'Supabase'),

-- Traducciones para el encabezado en portugués
('header.app_name', 'pt', 'CRM ScaleUp'),
('header.menu', 'pt', 'Menu'),
('header.profile', 'pt', 'Meu Perfil'),
('header.notifications', 'pt', 'Notificações'),

-- Traducciones para la autenticación en portugués
('auth.logout', 'pt', 'Sair'),
('auth.logging_out', 'pt', 'Saindo...'),

-- Traducciones para el dashboard en portugués
('dashboard.title', 'pt', 'Dashboard'),
('dashboard.welcome_card.title', 'pt', 'Bem-vindo ao CRM ScaleUp'),
('dashboard.welcome_card.description', 'pt', 'Gerencie seus relacionamentos comerciais de forma eficiente'),
('dashboard.welcome_card.content', 'pt', 'Olá, {name}. Este é o painel de controle do CRM ScaleUp. A partir daqui, você pode gerenciar empresas de tecnologia, parceiros, clientes finais e oportunidades de negócios.')

ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;
