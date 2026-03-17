DO $$
DECLARE
    es_lang_id UUID;
    en_lang_id UUID;
BEGIN
    -- Get language IDs
    SELECT id INTO es_lang_id FROM languages WHERE code = 'es';
    SELECT id INTO en_lang_id FROM languages WHERE code = 'en';

    -- Insert translations for Spanish
    INSERT INTO translations (language_id, key, value)
    VALUES
        (es_lang_id, 'opportunity_tech_fields.title', 'Campos personalizados de oportunidades'),
        (es_lang_id, 'opportunity_tech_fields.description', 'Gestiona los campos personalizados para las oportunidades según la empresa tecnológica.'),
        (es_lang_id, 'opportunity_tech_fields.create', 'Crear campo personalizado'),
        (es_lang_id, 'opportunity_tech_fields.edit', 'Editar campo'),
        (es_lang_id, 'opportunity_tech_fields.delete', 'Eliminar campo'),
        (es_lang_id, 'opportunity_tech_fields.delete_confirm', '¿Estás seguro de que deseas eliminar este campo personalizado? Esta acción no se puede deshacer.'),
        (es_lang_id, 'opportunity_tech_fields.cancel', 'Cancelar'),
        (es_lang_id, 'opportunity_tech_fields.save', 'Guardar'),
        (es_lang_id, 'opportunity_tech_fields.back', 'Volver'),
        (es_lang_id, 'opportunity_tech_fields.tech_company', 'Empresa tecnológica'),
        (es_lang_id, 'opportunity_tech_fields.field_name', 'Nombre del campo'),
        (es_lang_id, 'opportunity_tech_fields.field_type', 'Tipo de campo'),
        (es_lang_id, 'opportunity_tech_fields.is_required', 'Campo obligatorio'),
        (es_lang_id, 'opportunity_tech_fields.options', 'Opciones'),
        (es_lang_id, 'opportunity_tech_fields.add_option', 'Añadir opción'),
        (es_lang_id, 'opportunity_tech_fields.remove_option', 'Eliminar opción'),
        (es_lang_id, 'opportunity_tech_fields.option_value', 'Valor'),
        (es_lang_id, 'opportunity_tech_fields.option_label', 'Etiqueta'),
        (es_lang_id, 'opportunity_tech_fields.select_tech_company', 'Seleccionar empresa tecnológica'),
        (es_lang_id, 'opportunity_tech_fields.no_fields', 'No hay campos personalizados. Crea uno haciendo clic en el botón "Crear campo personalizado".'),
        (es_lang_id, 'opportunity_tech_fields.success_create', 'Campo personalizado creado correctamente.'),
        (es_lang_id, 'opportunity_tech_fields.error_create', 'Error al crear el campo personalizado.'),
        (es_lang_id, 'opportunity_tech_fields.success_update', 'Campo personalizado actualizado correctamente.'),
        (es_lang_id, 'opportunity_tech_fields.error_update', 'Error al actualizar el campo personalizado.'),
        (es_lang_id, 'opportunity_tech_fields.success_delete', 'Campo personalizado eliminado correctamente.'),
        (es_lang_id, 'opportunity_tech_fields.error_delete', 'Error al eliminar el campo personalizado.'),
        (es_lang_id, 'opportunity_tech_fields.field_type.text', 'Texto'),
        (es_lang_id, 'opportunity_tech_fields.field_type.number', 'Número'),
        (es_lang_id, 'opportunity_tech_fields.field_type.select', 'Selección'),
        (es_lang_id, 'opportunity_tech_fields.field_type.multiselect', 'Selección múltiple'),
        (es_lang_id, 'opportunity_tech_fields.field_type.date', 'Fecha'),
        (es_lang_id, 'opportunity_tech_fields.field_type.boolean', 'Sí/No'),
        (es_lang_id, 'settings.custom_fields', 'Campos personalizados'),

        -- Insert translations for English
        (en_lang_id, 'opportunity_tech_fields.title', 'Opportunity Custom Fields'),
        (en_lang_id, 'opportunity_tech_fields.description', 'Manage custom fields for opportunities based on the technology company.'),
        (en_lang_id, 'opportunity_tech_fields.create', 'Create Custom Field'),
        (en_lang_id, 'opportunity_tech_fields.edit', 'Edit Field'),
        (en_lang_id, 'opportunity_tech_fields.delete', 'Delete Field'),
        (en_lang_id, 'opportunity_tech_fields.delete_confirm', 'Are you sure you want to delete this custom field? This action cannot be undone.'),
        (en_lang_id, 'opportunity_tech_fields.cancel', 'Cancel'),
        (en_lang_id, 'opportunity_tech_fields.save', 'Save'),
        (en_lang_id, 'opportunity_tech_fields.back', 'Back'),
        (en_lang_id, 'opportunity_tech_fields.tech_company', 'Technology Company'),
        (en_lang_id, 'opportunity_tech_fields.field_name', 'Field Name'),
        (en_lang_id, 'opportunity_tech_fields.field_type', 'Field Type'),
        (en_lang_id, 'opportunity_tech_fields.is_required', 'Required Field'),
        (en_lang_id, 'opportunity_tech_fields.options', 'Options'),
        (en_lang_id, 'opportunity_tech_fields.add_option', 'Add Option'),
        (en_lang_id, 'opportunity_tech_fields.remove_option', 'Remove Option'),
        (en_lang_id, 'opportunity_tech_fields.option_value', 'Value'),
        (en_lang_id, 'opportunity_tech_fields.option_label', 'Label'),
        (en_lang_id, 'opportunity_tech_fields.select_tech_company', 'Select Technology Company'),
        (en_lang_id, 'opportunity_tech_fields.no_fields', 'No custom fields. Create one by clicking the "Create Custom Field" button.'),
        (en_lang_id, 'opportunity_tech_fields.success_create', 'Custom field created successfully.'),
        (en_lang_id, 'opportunity_tech_fields.error_create', 'Error creating custom field.'),
        (en_lang_id, 'opportunity_tech_fields.success_update', 'Custom field updated successfully.'),
        (en_lang_id, 'opportunity_tech_fields.error_update', 'Error updating custom field.'),
        (en_lang_id, 'opportunity_tech_fields.success_delete', 'Custom field deleted successfully.'),
        (en_lang_id, 'opportunity_tech_fields.error_delete', 'Error deleting custom field.'),
        (en_lang_id, 'opportunity_tech_fields.field_type.text', 'Text'),
        (en_lang_id, 'opportunity_tech_fields.field_type.number', 'Number'),
        (en_lang_id, 'opportunity_tech_fields.field_type.select', 'Select'),
        (en_lang_id, 'opportunity_tech_fields.field_type.multiselect', 'Multi-select'),
        (en_lang_id, 'opportunity_tech_fields.field_type.date', 'Date'),
        (en_lang_id, 'opportunity_tech_fields.field_type.boolean', 'Yes/No'),
        (en_lang_id, 'settings.custom_fields', 'Custom Fields');
END $$;
