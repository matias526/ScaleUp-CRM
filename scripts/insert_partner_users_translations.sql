-- Insertar traducciones para la sección de usuarios del partner
DO $$
BEGIN
    -- Español
    INSERT INTO translations (language_code, translation_key, translation_value)
    VALUES
        ('es', 'partner_users', 'Usuarios del Partner'),
        ('es', 'users_associated_with_partner', 'Usuarios asociados con {name}'),
        ('es', 'users_associated_with_this_partner', 'Usuarios asociados con este partner'),
        ('es', 'no_users_for_partner', 'No hay usuarios registrados para este partner'),
        ('es', 'add_first_user', 'Añadir primer usuario'),
        ('es', 'add_user', 'Añadir Usuario'),
        ('es', 'users.table.avatar', ''),
        ('es', 'users.table.name', 'Nombre'),
        ('es', 'users.table.email', 'Email'),
        ('es', 'users.table.role', 'Rol'),
        ('es', 'users.table.status', 'Estado'),
        ('es', 'users.table.actions', 'Acciones'),
        ('es', 'users.status.active', 'Activo'),
        ('es', 'users.status.inactive', 'Inactivo'),
        ('es', 'error_loading_users', 'Error al cargar usuarios')
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET translation_value = EXCLUDED.translation_value;

    -- English
    INSERT INTO translations (language_code, translation_key, translation_value)
    VALUES
        ('en', 'partner_users', 'Partner Users'),
        ('en', 'users_associated_with_partner', 'Users associated with {name}'),
        ('en', 'users_associated_with_this_partner', 'Users associated with this partner'),
        ('en', 'no_users_for_partner', 'No users registered for this partner'),
        ('en', 'add_first_user', 'Add first user'),
        ('en', 'add_user', 'Add User'),
        ('en', 'users.table.avatar', ''),
        ('en', 'users.table.name', 'Name'),
        ('en', 'users.table.email', 'Email'),
        ('en', 'users.table.role', 'Role'),
        ('en', 'users.table.status', 'Status'),
        ('en', 'users.table.actions', 'Actions'),
        ('en', 'users.status.active', 'Active'),
        ('en', 'users.status.inactive', 'Inactive'),
        ('en', 'error_loading_users', 'Error loading users')
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET translation_value = EXCLUDED.translation_value;

    -- Portuguese
    INSERT INTO translations (language_code, translation_key, translation_value)
    VALUES
        ('pt', 'partner_users', 'Usuários do Parceiro'),
        ('pt', 'users_associated_with_partner', 'Usuários associados a {name}'),
        ('pt', 'users_associated_with_this_partner', 'Usuários associados a este parceiro'),
        ('pt', 'no_users_for_partner', 'Não há usuários registrados para este parceiro'),
        ('pt', 'add_first_user', 'Adicionar primeiro usuário'),
        ('pt', 'add_user', 'Adicionar Usuário'),
        ('pt', 'users.table.avatar', ''),
        ('pt', 'users.table.name', 'Nome'),
        ('pt', 'users.table.email', 'Email'),
        ('pt', 'users.table.role', 'Função'),
        ('pt', 'users.table.status', 'Estado'),
        ('pt', 'users.table.actions', 'Ações'),
        ('pt', 'users.status.active', 'Ativo'),
        ('pt', 'users.status.inactive', 'Inativo'),
        ('pt', 'error_loading_users', 'Erro ao carregar usuários')
    ON CONFLICT (language_code, translation_key) 
    DO UPDATE SET translation_value = EXCLUDED.translation_value;
END $$;
