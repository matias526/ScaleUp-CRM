-- Traducciones para el CRUD de Technology Companies

-- Español (es)
-- Listado de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.title', 'es', 'Empresas Tecnológicas') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.new_company', 'es', 'Nueva Empresa') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_title', 'es', 'Listado de Empresas Tecnológicas') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_description', 'es', 'Gestiona las empresas tecnológicas registradas en el sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.search_placeholder', 'es', 'Buscar empresas...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.no_companies', 'es', 'No hay empresas registradas') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.logo', 'es', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.name', 'es', 'Nombre') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.code', 'es', 'Código') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.status', 'es', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.actions', 'es', 'Acciones') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.active', 'es', 'Activo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.inactive', 'es', 'Inactivo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.title', 'es', '¿Estás seguro?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.description', 'es', 'Esta acción eliminará permanentemente la empresa "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.cancel', 'es', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.confirm', 'es', 'Eliminar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.deleting', 'es', 'Eliminando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Empresa Tecnológica
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_title', 'es', 'Crear Empresa Tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_title', 'es', 'Editar Empresa Tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_description', 'es', 'Ingresa los datos para crear una nueva empresa tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_description', 'es', 'Actualiza la información de la empresa tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name', 'es', 'Nombre') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_placeholder', 'es', 'Nombre de la empresa') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_description', 'es', 'Nombre completo de la empresa tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code', 'es', 'Código') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_placeholder', 'es', 'Código único') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_description', 'es', 'Código único para identificar la empresa (sin espacios)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo', 'es', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo_description', 'es', 'Logo de la empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website', 'es', 'Sitio Web') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_placeholder', 'es', 'https://ejemplo.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_description', 'es', 'URL del sitio web de la empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description', 'es', 'Descripción') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_placeholder', 'es', 'Descripción de la empresa tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_help', 'es', 'Breve descripción de la empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active', 'es', 'Activo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active_description', 'es', 'Indica si la empresa está activa en el sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.cancel', 'es', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create', 'es', 'Crear') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.update', 'es', 'Actualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.creating', 'es', 'Creando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.updating', 'es', 'Actualizando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.save_changes', 'es', 'Guardar cambios') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.saving', 'es', 'Guardando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.title', 'es', 'Detalles de la Empresa Tecnológica') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description', 'es', 'Información completa sobre {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website', 'es', 'Sitio Web') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website_not_available', 'es', 'No disponible') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description_label', 'es', 'Descripción') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.no_description', 'es', 'Sin descripción') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.created_at', 'es', 'Fecha de Creación') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.updated_at', 'es', 'Última Actualización') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.status', 'es', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back_to_list', 'es', 'Volver al listado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.refresh', 'es', 'Actualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.edit', 'es', 'Editar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.error', 'es', 'Error') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.not_found', 'es', 'Empresa tecnológica no encontrada') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back', 'es', 'Volver') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Inglés (en)
-- Listado de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.title', 'en', 'Technology Companies') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.new_company', 'en', 'New Company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_title', 'en', 'Technology Companies List') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_description', 'en', 'Manage technology companies registered in the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.search_placeholder', 'en', 'Search companies...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.no_companies', 'en', 'No companies registered') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.logo', 'en', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.name', 'en', 'Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.code', 'en', 'Code') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.status', 'en', 'Status') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.actions', 'en', 'Actions') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.active', 'en', 'Active') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.inactive', 'en', 'Inactive') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.title', 'en', 'Are you sure?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.description', 'en', 'This action will permanently delete the company "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.cancel', 'en', 'Cancel') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.confirm', 'en', 'Delete') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.deleting', 'en', 'Deleting...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Empresa Tecnológica
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_title', 'en', 'Create Technology Company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_title', 'en', 'Edit Technology Company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_description', 'en', 'Enter the data to create a new technology company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_description', 'en', 'Update the technology company information') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name', 'en', 'Name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_placeholder', 'en', 'Company name') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_description', 'en', 'Full name of the technology company') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code', 'en', 'Code') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_placeholder', 'en', 'Unique code') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_description', 'en', 'Unique code to identify the company (no spaces)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo', 'en', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo_description', 'en', 'Company logo (optional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website', 'en', 'Website') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_placeholder', 'en', 'https://example.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_description', 'en', 'Company website URL (optional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description', 'en', 'Description') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_placeholder', 'en', 'Technology company description') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_help', 'en', 'Brief description of the company (optional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active', 'en', 'Active') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active_description', 'en', 'Indicates if the company is active in the system') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.cancel', 'en', 'Cancel') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create', 'en', 'Create') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.update', 'en', 'Update') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.creating', 'en', 'Creating...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.updating', 'en', 'Updating...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.save_changes', 'en', 'Save changes') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.saving', 'en', 'Saving...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.title', 'en', 'Technology Company Details') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description', 'en', 'Complete information about {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website', 'en', 'Website') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website_not_available', 'en', 'Not available') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description_label', 'en', 'Description') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.no_description', 'en', 'No description') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.created_at', 'en', 'Creation Date') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.updated_at', 'en', 'Last Update') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.status', 'en', 'Status') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back_to_list', 'en', 'Back to list') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.refresh', 'en', 'Refresh') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.edit', 'en', 'Edit') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.error', 'en', 'Error') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.not_found', 'en', 'Technology company not found') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back', 'en', 'Back') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Portugués (pt)
-- Listado de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.title', 'pt', 'Empresas de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.new_company', 'pt', 'Nova Empresa') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_title', 'pt', 'Lista de Empresas de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.list_description', 'pt', 'Gerencie as empresas de tecnologia registradas no sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.search_placeholder', 'pt', 'Buscar empresas...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.no_companies', 'pt', 'Não há empresas registradas') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Tabla de Empresas Tecnológicas
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.logo', 'pt', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.name', 'pt', 'Nome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.code', 'pt', 'Código') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.status', 'pt', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.table.actions', 'pt', 'Ações') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.active', 'pt', 'Ativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.status.inactive', 'pt', 'Inativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Confirmación de eliminación
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.title', 'pt', 'Tem certeza?') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.description', 'pt', 'Esta ação excluirá permanentemente a empresa "{name}".') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.cancel', 'pt', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.confirm', 'pt', 'Excluir') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.delete.deleting', 'pt', 'Excluindo...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Formulario de Empresa Tecnológica
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_title', 'pt', 'Criar Empresa de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_title', 'pt', 'Editar Empresa de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create_description', 'pt', 'Insira os dados para criar uma nova empresa de tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.edit_description', 'pt', 'Atualize as informações da empresa de tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name', 'pt', 'Nome') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_placeholder', 'pt', 'Nome da empresa') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.name_description', 'pt', 'Nome completo da empresa de tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code', 'pt', 'Código') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_placeholder', 'pt', 'Código único') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_description', 'pt', 'Código único para identificar a empresa (sem espaços)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.code_description', 'pt', 'Código único para identificar a empresa (sem espaços)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo', 'pt', 'Logo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.logo_description', 'pt', 'Logo da empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website', 'pt', 'Site Web') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_placeholder', 'pt', 'https://exemplo.com') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.website_description', 'pt', 'URL do site da empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description', 'pt', 'Descrição') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_placeholder', 'pt', 'Descrição da empresa de tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.description_help', 'pt', 'Breve descrição da empresa (opcional)') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active', 'pt', 'Ativo') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.active_description', 'pt', 'Indica se a empresa está ativa no sistema') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.cancel', 'pt', 'Cancelar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.create', 'pt', 'Criar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.update', 'pt', 'Atualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.creating', 'pt', 'Criando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.updating', 'pt', 'Atualizando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.save_changes', 'pt', 'Salvar alterações') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.form.saving', 'pt', 'Salvando...') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;

-- Página de detalles
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.title', 'pt', 'Detalhes da Empresa de Tecnologia') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description', 'pt', 'Informações completas sobre {name}') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website', 'pt', 'Site Web') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.website_not_available', 'pt', 'Não disponível') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.description_label', 'pt', 'Descrição') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.no_description', 'pt', 'Sem descrição') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.created_at', 'pt', 'Data de Criação') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.updated_at', 'pt', 'Última Atualização') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.status', 'pt', 'Estado') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back_to_list', 'pt', 'Voltar à lista') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.refresh', 'pt', 'Atualizar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.edit', 'pt', 'Editar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.error', 'pt', 'Erro') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.not_found', 'pt', 'Empresa de tecnologia não encontrada') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
INSERT INTO translations (key, language, value) VALUES ('tech_companies.details.back', 'pt', 'Voltar') ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
