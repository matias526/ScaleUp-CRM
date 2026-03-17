-- Script completo para agregar todas las traducciones relacionadas con campos personalizados

-- Traducciones para el menú lateral
INSERT INTO translations (key, language, value) VALUES
('sidebar.settings.custom_fields', 'es', 'Campos personalizados'),
('sidebar.settings.custom_fields', 'en', 'Custom Fields'),
('sidebar.settings.custom_fields', 'pt', 'Campos personalizados')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para la página de listado
INSERT INTO translations (key, language, value) VALUES
('opportunity_tech_fields.title', 'es', 'Campos personalizados'),
('opportunity_tech_fields.title', 'en', 'Custom Fields'),
('opportunity_tech_fields.title', 'pt', 'Campos personalizados'),

('opportunity_tech_fields.description', 'es', 'Gestiona los campos personalizados para las oportunidades según la empresa tecnológica.'),
('opportunity_tech_fields.description', 'en', 'Manage custom fields for opportunities based on the technology company.'),
('opportunity_tech_fields.description', 'pt', 'Gerencie campos personalizados para oportunidades com base na empresa de tecnologia.'),

('opportunity_tech_fields.create', 'es', 'Crear campo personalizado'),
('opportunity_tech_fields.create', 'en', 'Create custom field'),
('opportunity_tech_fields.create', 'pt', 'Criar campo personalizado'),

('opportunity_tech_fields.tech_company', 'es', 'Empresa tecnológica'),
('opportunity_tech_fields.tech_company', 'en', 'Tech Company'),
('opportunity_tech_fields.tech_company', 'pt', 'Empresa de tecnologia'),

('opportunity_tech_fields.field_name', 'es', 'Nombre del campo'),
('opportunity_tech_fields.field_name', 'en', 'Field name'),
('opportunity_tech_fields.field_name', 'pt', 'Nome do campo'),

('opportunity_tech_fields.field_type', 'es', 'Tipo de campo'),
('opportunity_tech_fields.field_type', 'en', 'Field type'),
('opportunity_tech_fields.field_type', 'pt', 'Tipo de campo'),

('opportunity_tech_fields.is_required', 'es', 'Campo obligatorio'),
('opportunity_tech_fields.is_required', 'en', 'Required field'),
('opportunity_tech_fields.is_required', 'pt', 'Campo obrigatório'),

('opportunity_tech_fields.actions', 'es', 'Acciones'),
('opportunity_tech_fields.actions', 'en', 'Actions'),
('opportunity_tech_fields.actions', 'pt', 'Ações'),

('opportunity_tech_fields.edit', 'es', 'Editar'),
('opportunity_tech_fields.edit', 'en', 'Edit'),
('opportunity_tech_fields.edit', 'pt', 'Editar'),

('opportunity_tech_fields.delete', 'es', 'Eliminar'),
('opportunity_tech_fields.delete', 'en', 'Delete'),
('opportunity_tech_fields.delete', 'pt', 'Excluir'),

('opportunity_tech_fields.confirm_delete', 'es', '¿Estás seguro de que deseas eliminar este campo personalizado?'),
('opportunity_tech_fields.confirm_delete', 'en', 'Are you sure you want to delete this custom field?'),
('opportunity_tech_fields.confirm_delete', 'pt', 'Tem certeza de que deseja excluir este campo personalizado?'),

('opportunity_tech_fields.no_fields', 'es', 'No hay campos personalizados definidos.'),
('opportunity_tech_fields.no_fields', 'en', 'No custom fields defined.'),
('opportunity_tech_fields.no_fields', 'pt', 'Nenhum campo personalizado definido.'),

('opportunity_tech_fields.select_tech_company', 'es', 'Seleccionar empresa tecnológica'),
('opportunity_tech_fields.select_tech_company', 'en', 'Select tech company'),
('opportunity_tech_fields.select_tech_company', 'pt', 'Selecionar empresa de tecnologia'),

('opportunity_tech_fields.filter_by_tech_company', 'es', 'Filtrar por empresa tecnológica'),
('opportunity_tech_fields.filter_by_tech_company', 'en', 'Filter by tech company'),
('opportunity_tech_fields.filter_by_tech_company', 'pt', 'Filtrar por empresa de tecnologia'),

('opportunity_tech_fields.all_tech_companies', 'es', 'Todas las empresas'),
('opportunity_tech_fields.all_tech_companies', 'en', 'All companies'),
('opportunity_tech_fields.all_tech_companies', 'pt', 'Todas as empresas')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para los tipos de campo
INSERT INTO translations (key, language, value) VALUES
('opportunity_tech_fields.field_type.text', 'es', 'Texto'),
('opportunity_tech_fields.field_type.text', 'en', 'Text'),
('opportunity_tech_fields.field_type.text', 'pt', 'Texto'),

('opportunity_tech_fields.field_type.number', 'es', 'Número'),
('opportunity_tech_fields.field_type.number', 'en', 'Number'),
('opportunity_tech_fields.field_type.number', 'pt', 'Número'),

('opportunity_tech_fields.field_type.select', 'es', 'Selección'),
('opportunity_tech_fields.field_type.select', 'en', 'Select'),
('opportunity_tech_fields.field_type.select', 'pt', 'Seleção'),

('opportunity_tech_fields.field_type.multiselect', 'es', 'Selección múltiple'),
('opportunity_tech_fields.field_type.multiselect', 'en', 'Multiple selection'),
('opportunity_tech_fields.field_type.multiselect', 'pt', 'Seleção múltipla'),

('opportunity_tech_fields.field_type.date', 'es', 'Fecha'),
('opportunity_tech_fields.field_type.date', 'en', 'Date'),
('opportunity_tech_fields.field_type.date', 'pt', 'Data'),

('opportunity_tech_fields.field_type.boolean', 'es', 'Sí/No'),
('opportunity_tech_fields.field_type.boolean', 'en', 'Yes/No'),
('opportunity_tech_fields.field_type.boolean', 'pt', 'Sim/Não')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para el formulario
INSERT INTO translations (key, language, value) VALUES
('opportunity_tech_fields.back', 'es', 'Volver'),
('opportunity_tech_fields.back', 'en', 'Back'),
('opportunity_tech_fields.back', 'pt', 'Voltar'),

('opportunity_tech_fields.save', 'es', 'Guardar'),
('opportunity_tech_fields.save', 'en', 'Save'),
('opportunity_tech_fields.save', 'pt', 'Salvar'),

('opportunity_tech_fields.cancel', 'es', 'Cancelar'),
('opportunity_tech_fields.cancel', 'en', 'Cancel'),
('opportunity_tech_fields.cancel', 'pt', 'Cancelar'),

('opportunity_tech_fields.options', 'es', 'Opciones'),
('opportunity_tech_fields.options', 'en', 'Options'),
('opportunity_tech_fields.options', 'pt', 'Opções'),

('opportunity_tech_fields.add_option', 'es', 'Añadir opción'),
('opportunity_tech_fields.add_option', 'en', 'Add option'),
('opportunity_tech_fields.add_option', 'pt', 'Adicionar opção'),

('opportunity_tech_fields.remove_option', 'es', 'Eliminar opción'),
('opportunity_tech_fields.remove_option', 'en', 'Remove option'),
('opportunity_tech_fields.remove_option', 'pt', 'Remover opção'),

('opportunity_tech_fields.option_value', 'es', 'Valor'),
('opportunity_tech_fields.option_value', 'en', 'Value'),
('opportunity_tech_fields.option_value', 'pt', 'Valor'),

('opportunity_tech_fields.option_label', 'es', 'Etiqueta'),
('opportunity_tech_fields.option_label', 'en', 'Label'),
('opportunity_tech_fields.option_label', 'pt', 'Rótulo')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;

-- Traducciones para mensajes de éxito y error
INSERT INTO translations (key, language, value) VALUES
('opportunity_tech_fields.success_create', 'es', 'Campo personalizado creado con éxito'),
('opportunity_tech_fields.success_create', 'en', 'Custom field created successfully'),
('opportunity_tech_fields.success_create', 'pt', 'Campo personalizado criado com sucesso'),

('opportunity_tech_fields.success_update', 'es', 'Campo personalizado actualizado con éxito'),
('opportunity_tech_fields.success_update', 'en', 'Custom field updated successfully'),
('opportunity_tech_fields.success_update', 'pt', 'Campo personalizado atualizado com sucesso'),

('opportunity_tech_fields.success_delete', 'es', 'Campo personalizado eliminado con éxito'),
('opportunity_tech_fields.success_delete', 'en', 'Custom field deleted successfully'),
('opportunity_tech_fields.success_delete', 'pt', 'Campo personalizado excluído com sucesso'),

('opportunity_tech_fields.error_create', 'es', 'Error al crear el campo personalizado'),
('opportunity_tech_fields.error_create', 'en', 'Error creating custom field'),
('opportunity_tech_fields.error_create', 'pt', 'Erro ao criar campo personalizado'),

('opportunity_tech_fields.error_update', 'es', 'Error al actualizar el campo personalizado'),
('opportunity_tech_fields.error_update', 'en', 'Error updating custom field'),
('opportunity_tech_fields.error_update', 'pt', 'Erro ao atualizar campo personalizado'),

('opportunity_tech_fields.error_delete', 'es', 'Error al eliminar el campo personalizado'),
('opportunity_tech_fields.error_delete', 'en', 'Error deleting custom field'),
('opportunity_tech_fields.error_delete', 'pt', 'Erro ao excluir campo personalizado')
ON CONFLICT (key, language) DO UPDATE SET 
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;
