-- Traducciones para el CRUD de Usuarios

-- Español (es)
-- Listado de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.title', 'es', 'Usuarios') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.new_user', 'es', 'Nuevo Usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_title', 'es', 'Listado de Usuarios') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_description', 'es', 'Gestiona los usuarios registrados en el sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.search_placeholder', 'es', 'Buscar usuarios...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.no_users', 'es', 'No hay usuarios registrados') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.showing', 'es', 'Mostrando {count} de {total} usuarios') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.table.avatar', 'es', 'Avatar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.name', 'es', 'Nombre') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.email', 'es', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.role', 'es', 'Rol') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.affiliation', 'es', 'Afiliación') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.status', 'es', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.actions', 'es', 'Acciones') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.active', 'es', 'Activo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.inactive', 'es', 'Inactivo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('users.delete.title', 'es', '¿Estás seguro?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.description', 'es', 'Esta acción eliminará permanentemente el usuario "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.cancel', 'es', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.confirm', 'es', 'Eliminar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.deleting', 'es', 'Eliminando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Usuario
INSERT INTO translations (key, language, value) VALUES ('users.form.create_title', 'es', 'Crear Usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_title', 'es', 'Editar Usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create_description', 'es', 'Ingresa los datos para crear un nuevo usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_description', 'es', 'Actualiza la información del usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email', 'es', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_placeholder', 'es', 'usuario@ejemplo.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_description', 'es', 'Email del usuario (será su nombre de usuario)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password', 'es', 'Contraseña') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.new_password', 'es', 'Nueva contraseña') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_placeholder', 'es', 'Contraseña') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_keep', 'es', 'Dejar en blanco para mantener la contraseña actual') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_description', 'es', 'Contraseña para acceder al sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name', 'es', 'Nombre') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name_placeholder', 'es', 'Nombre') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name', 'es', 'Apellido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name_placeholder', 'es', 'Apellido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role', 'es', 'Rol') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_placeholder', 'es', 'Selecciona un rol') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_description', 'es', 'Rol del usuario en el sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company', 'es', 'Empresa Tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_placeholder', 'es', 'Selecciona una empresa tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_description', 'es', 'Empresa tecnológica a la que pertenece el usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner', 'es', 'Partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_placeholder', 'es', 'Selecciona un partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_description', 'es', 'Partner al que pertenece el usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language', 'es', 'Idioma preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_placeholder', 'es', 'Selecciona un idioma') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_description', 'es', 'Idioma preferido del usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme', 'es', 'Tema preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_placeholder', 'es', 'Selecciona un tema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_description', 'es', 'Tema preferido del usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation', 'es', 'Requerir confirmación de email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation_description', 'es', 'Si está activado, el usuario recibirá un correo de confirmación y deberá validar su email antes de poder acceder al sistema. Si está desactivado, el usuario podrá acceder inmediatamente.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active', 'es', 'Activo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active_description', 'es', 'Indica si el usuario está activo en el sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.cancel', 'es', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create', 'es', 'Crear') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.update', 'es', 'Actualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.creating', 'es', 'Creando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.updating', 'es', 'Actualizando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_info', 'es', 'Ahora puedes crear usuarios sin necesidad de verificación de email. Si no marcas la casilla "Requerir confirmación de email", el usuario se creará directamente y podrá iniciar sesión inmediatamente.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('users.details.title', 'es', 'Detalles del Usuario') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.description', 'es', 'Información completa sobre {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.email', 'es', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.role', 'es', 'Rol') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.tech_company', 'es', 'Empresa Tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.partner', 'es', 'Partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.language', 'es', 'Idioma Preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.theme', 'es', 'Tema Preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.status', 'es', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.created_at', 'es', 'Fecha de Creación') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.updated_at', 'es', 'Última Actualización') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back_to_list', 'es', 'Volver al listado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.refresh', 'es', 'Actualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.edit', 'es', 'Editar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.error', 'es', 'Error') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.not_found', 'es', 'Usuario no encontrado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back', 'es', 'Volver') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Inglés (en)
-- Listado de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.title', 'en', 'Users') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.new_user', 'en', 'New User') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_title', 'en', 'Users List') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_description', 'en', 'Manage users registered in the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.search_placeholder', 'en', 'Search users...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.no_users', 'en', 'No users registered') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.showing', 'en', 'Showing {count} of {total} users') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.table.avatar', 'en', 'Avatar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.name', 'en', 'Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.email', 'en', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.role', 'en', 'Role') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.affiliation', 'en', 'Affiliation') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.status', 'en', 'Status') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.actions', 'en', 'Actions') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.active', 'en', 'Active') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.inactive', 'en', 'Inactive') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('users.delete.title', 'en', 'Are you sure?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.description', 'en', 'This action will permanently delete the user "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.cancel', 'en', 'Cancel') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.confirm', 'en', 'Delete') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.deleting', 'en', 'Deleting...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Usuario
INSERT INTO translations (key, language, value) VALUES ('users.form.create_title', 'en', 'Create User') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_title', 'en', 'Edit User') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create_description', 'en', 'Enter the data to create a new user') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_description', 'en', 'Update the user information') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email', 'en', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_placeholder', 'en', 'user@example.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_description', 'en', 'User email (will be their username)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password', 'en', 'Password') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.new_password', 'en', 'New password') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_placeholder', 'en', 'Password') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_keep', 'en', 'Leave blank to keep current password') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_description', 'en', 'Password to access the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name', 'en', 'First Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name_placeholder', 'en', 'First Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name', 'en', 'Last Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name_placeholder', 'en', 'Last Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role', 'en', 'Role') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_placeholder', 'en', 'Select a role') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_description', 'en', 'User role in the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company', 'en', 'Technology Company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_placeholder', 'en', 'Select a technology company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_description', 'en', 'Technology company the user belongs to') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner', 'en', 'Partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_placeholder', 'en', 'Select a partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_description', 'en', 'Partner the user belongs to') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language', 'en', 'Preferred Language') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_placeholder', 'en', 'Select a language') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_description', 'en', 'User preferred language') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme', 'en', 'Preferred Theme') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_placeholder', 'en', 'Select a theme') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_description', 'en', 'User preferred theme') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation', 'en', 'Require email confirmation') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation_description', 'en', 'If enabled, the user will receive a confirmation email and must validate their email before accessing the system. If disabled, the user will be able to access immediately.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active', 'en', 'Active') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active_description', 'en', 'Indicates if the user is active in the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.cancel', 'en', 'Cancel') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create', 'en', 'Create') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.update', 'en', 'Update') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.creating', 'en', 'Creating...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.updating', 'en', 'Updating...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_info', 'en', 'You can now create users without email verification. If you don''t check the "Require email confirmation" box, the user will be created directly and will be able to log in immediately.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('users.details.title', 'en', 'User Details') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.description', 'en', 'Complete information about {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.email', 'en', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.role', 'en', 'Role') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.tech_company', 'en', 'Technology Company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.partner', 'en', 'Partner') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.language', 'en', 'Preferred Language') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.theme', 'en', 'Preferred Theme') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.status', 'en', 'Status') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.created_at', 'en', 'Creation Date') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.updated_at', 'en', 'Last Update') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back_to_list', 'en', 'Back to list') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.refresh', 'en', 'Refresh') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.edit', 'en', 'Edit') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.error', 'en', 'Error') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (  ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.not_found', 'en', 'User not found') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back', 'en', 'Back') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Portugués (pt)
-- Listado de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.title', 'pt', 'Usuários') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.new_user', 'pt', 'Novo Usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_title', 'pt', 'Lista de Usuários') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.list_description', 'pt', 'Gerencie os usuários registrados no sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.search_placeholder', 'pt', 'Buscar usuários...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.no_users', 'pt', 'Não há usuários registrados') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.showing', 'pt', 'Mostrando {count} de {total} usuários') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Usuarios
INSERT INTO translations (key, language, value) VALUES ('users.table.avatar', 'pt', 'Avatar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.name', 'pt', 'Nome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.email', 'pt', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.role', 'pt', 'Função') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.affiliation', 'pt', 'Afiliação') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.status', 'pt', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.table.actions', 'pt', 'Ações') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.active', 'pt', 'Ativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.status.inactive', 'pt', 'Inativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('users.delete.title', 'pt', 'Tem certeza?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.description', 'pt', 'Esta ação excluirá permanentemente o usuário "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.cancel', 'pt', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.confirm', 'pt', 'Excluir') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.delete.deleting', 'pt', 'Excluindo...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Usuario
INSERT INTO translations (key, language, value) VALUES ('users.form.create_title', 'pt', 'Criar Usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_title', 'pt', 'Editar Usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create_description', 'pt', 'Insira os dados para criar um novo usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.edit_description', 'pt', 'Atualize as informações do usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email', 'pt', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_placeholder', 'pt', 'usuario@exemplo.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_description', 'pt', 'Email do usuário (será seu nome de usuário)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password', 'pt', 'Senha') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.new_password', 'pt', 'Nova senha') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_placeholder', 'pt', 'Senha') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_keep', 'pt', 'Deixe em branco para manter a senha atual') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.password_description', 'pt', 'Senha para acessar o sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name', 'pt', 'Nome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.first_name_placeholder', 'pt', 'Nome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name', 'pt', 'Sobrenome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.last_name_placeholder', 'pt', 'Sobrenome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role', 'pt', 'Função') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_placeholder', 'pt', 'Selecione uma função') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.role_description', 'pt', 'Função do usuário no sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company', 'pt', 'Empresa de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_placeholder', 'pt', 'Selecione uma empresa de tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.tech_company_description', 'pt', 'Empresa de tecnologia à qual o usuário pertence') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner', 'pt', 'Parceiro') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_placeholder', 'pt', 'Selecione um parceiro') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.partner_description', 'pt', 'Parceiro ao qual o usuário pertence') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language', 'pt', 'Idioma preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_placeholder', 'pt', 'Selecione um idioma') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.language_description', 'pt', 'Idioma preferido do usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme', 'pt', 'Tema preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_placeholder', 'pt', 'Selecione um tema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.theme_description', 'pt', 'Tema preferido do usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation', 'pt', 'Exigir confirmação de email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.require_confirmation_description', 'pt', 'Se ativado, o usuário receberá um email de confirmação e deverá validar seu email antes de acessar o sistema. Se desativado, o usuário poderá acessar imediatamente.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active', 'pt', 'Ativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.active_description', 'pt', 'Indica se o usuário está ativo no sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.cancel', 'pt', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.create', 'pt', 'Criar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.update', 'pt', 'Atualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.creating', 'pt', 'Criando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.updating', 'pt', 'Atualizando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.form.email_info', 'pt', 'Agora você pode criar usuários sem verificação de email. Se você não marcar a caixa "Exigir confirmação de email", o usuário será criado diretamente e poderá fazer login imediatamente.') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('users.details.title', 'pt', 'Detalhes do Usuário') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.description', 'pt', 'Informações completas sobre {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.email', 'pt', 'Email') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.role', 'pt', 'Função') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.tech_company', 'pt', 'Empresa de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.partner', 'pt', 'Parceiro') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.language', 'pt', 'Idioma Preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.theme', 'pt', 'Tema Preferido') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.status', 'pt', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.created_at', 'pt', 'Data de Criação') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.updated_at', 'pt', 'Última Atualização') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back_to_list', 'pt', 'Voltar à lista') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.refresh', 'pt', 'Atualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.edit', 'pt', 'Editar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.error', 'pt', 'Erro') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.not_found', 'pt', 'Usuário não encontrado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('users.details.back', 'pt', 'Voltar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
