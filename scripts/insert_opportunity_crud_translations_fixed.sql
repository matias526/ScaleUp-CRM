-- Insertar traducciones para el módulo de Oportunidades

-- Traducciones para el menú y títulos principales
INSERT INTO public.translations (key, language, value)
VALUES 
  ('sidebar.opportunities', 'es', 'Oportunidades'),
  ('sidebar.opportunities', 'en', 'Opportunities'),
  ('sidebar.opportunities', 'pt', 'Oportunidades'),
  ('opportunities.title', 'es', 'Oportunidades'),
  ('opportunities.title', 'en', 'Opportunities'),
  ('opportunities.title', 'pt', 'Oportunidades'),
  ('opportunities.create_title', 'es', 'Crear nueva oportunidad'),
  ('opportunities.create_title', 'en', 'Create new opportunity'),
  ('opportunities.create_title', 'pt', 'Criar nova oportunidade'),
  ('opportunities.edit_title', 'es', 'Editar oportunidad'),
  ('opportunities.edit_title', 'en', 'Edit opportunity'),
  ('opportunities.edit_title', 'pt', 'Editar oportunidade'),
  ('opportunities.view_title', 'es', 'Detalles de la oportunidad'),
  ('opportunities.view_title', 'en', 'Opportunity details'),
  ('opportunities.view_title', 'pt', 'Detalhes da oportunidade')
ON CONFLICT (key, language) DO NOTHING;

-- Traducciones para los campos del formulario
INSERT INTO public.translations (key, language, value)
VALUES 
  ('opportunities.form.name', 'es', 'Nombre'),
  ('opportunities.form.name', 'en', 'Name'),
  ('opportunities.form.name', 'pt', 'Nome'),
  ('opportunities.form.description', 'es', 'Descripción'),
  ('opportunities.form.description', 'en', 'Description'),
  ('opportunities.form.description', 'pt', 'Descrição'),
  ('opportunities.form.stage', 'es', 'Etapa'),
  ('opportunities.form.stage', 'en', 'Stage'),
  ('opportunities.form.stage', 'pt', 'Etapa'),
  ('opportunities.form.tech_company', 'es', 'Empresa tecnológica'),
  ('opportunities.form.tech_company', 'en', 'Tech company'),
  ('opportunities.form.tech_company', 'pt', 'Empresa tecnológica'),
  ('opportunities.form.partner', 'es', 'Partner'),
  ('opportunities.form.partner', 'en', 'Partner'),
  ('opportunities.form.partner', 'pt', 'Parceiro'),
  ('opportunities.form.end_customer', 'es', 'Cliente final'),
  ('opportunities.form.end_customer', 'en', 'End customer'),
  ('opportunities.form.end_customer', 'pt', 'Cliente final'),
  ('opportunities.form.estimated_value', 'es', 'Valor estimado'),
  ('opportunities.form.estimated_value', 'en', 'Estimated value'),
  ('opportunities.form.estimated_value', 'pt', 'Valor estimado'),
  ('opportunities.form.tech_fields', 'es', 'Campos tecnológicos'),
  ('opportunities.form.tech_fields', 'en', 'Tech fields'),
  ('opportunities.form.tech_fields', 'pt', 'Campos tecnológicos'),
  ('opportunities.form.submit', 'es', 'Guardar'),
  ('opportunities.form.submit', 'en', 'Save'),
  ('opportunities.form.submit', 'pt', 'Salvar'),
  ('opportunities.form.cancel', 'es', 'Cancelar'),
  ('opportunities.form.cancel', 'en', 'Cancel'),
  ('opportunities.form.cancel', 'pt', 'Cancelar'),
  ('opportunities.form.select_placeholder', 'es', 'Seleccionar...'),
  ('opportunities.form.select_placeholder', 'en', 'Select...'),
  ('opportunities.form.select_placeholder', 'pt', 'Selecionar...'),
  ('opportunities.form.new_end_customer', 'es', 'Nuevo cliente'),
  ('opportunities.form.new_end_customer', 'en', 'New customer'),
  ('opportunities.form.new_end_customer', 'pt', 'Novo cliente'),
  ('opportunities.form.new_end_customer_name', 'es', 'Nombre del cliente'),
  ('opportunities.form.new_end_customer_name', 'en', 'Customer name'),
  ('opportunities.form.new_end_customer_name', 'pt', 'Nome do cliente'),
  ('opportunities.form.create_end_customer', 'es', 'Crear cliente'),
  ('opportunities.form.create_end_customer', 'en', 'Create customer'),
  ('opportunities.form.create_end_customer', 'pt', 'Criar cliente')
ON CONFLICT (key, language) DO NOTHING;

-- Traducciones para la tabla y filtros
INSERT INTO public.translations (key, language, value)
VALUES 
  ('opportunities.table.name', 'es', 'Nombre'),
  ('opportunities.table.name', 'en', 'Name'),
  ('opportunities.table.name', 'pt', 'Nome'),
  ('opportunities.table.stage', 'es', 'Etapa'),
  ('opportunities.table.stage', 'en', 'Stage'),
  ('opportunities.table.stage', 'pt', 'Etapa'),
  ('opportunities.table.tech_company', 'es', 'Empresa tecnológica'),
  ('opportunities.table.tech_company', 'en', 'Tech company'),
  ('opportunities.table.tech_company', 'pt', 'Empresa tecnológica'),
  ('opportunities.table.partner', 'es', 'Partner'),
  ('opportunities.table.partner', 'en', 'Partner'),
  ('opportunities.table.partner', 'pt', 'Parceiro'),
  ('opportunities.table.end_customer', 'es', 'Cliente final'),
  ('opportunities.table.end_customer', 'en', 'End customer'),
  ('opportunities.table.end_customer', 'pt', 'Cliente final'),
  ('opportunities.table.estimated_value', 'es', 'Valor estimado'),
  ('opportunities.table.estimated_value', 'en', 'Estimated value'),
  ('opportunities.table.estimated_value', 'pt', 'Valor estimado'),
  ('opportunities.table.created_at', 'es', 'Fecha de creación'),
  ('opportunities.table.created_at', 'en', 'Creation date'),
  ('opportunities.table.created_at', 'pt', 'Data de criação'),
  ('opportunities.table.actions', 'es', 'Acciones'),
  ('opportunities.table.actions', 'en', 'Actions'),
  ('opportunities.table.actions', 'pt', 'Ações'),
  ('opportunities.table.no_data', 'es', 'No hay oportunidades disponibles'),
  ('opportunities.table.no_data', 'en', 'No opportunities available'),
  ('opportunities.table.no_data', 'pt', 'Não há oportunidades disponíveis'),
  ('opportunities.table.search', 'es', 'Buscar oportunidades...'),
  ('opportunities.table.search', 'en', 'Search opportunities...'),
  ('opportunities.table.search', 'pt', 'Buscar oportunidades...'),
  ('opportunities.filter.all', 'es', 'Todas'),
  ('opportunities.filter.all', 'en', 'All'),
  ('opportunities.filter.all', 'pt', 'Todas'),
  ('opportunities.filter.active', 'es', 'Activas'),
  ('opportunities.filter.active', 'en', 'Active'),
  ('opportunities.filter.active', 'pt', 'Ativas'),
  ('opportunities.filter.by_stage', 'es', 'Por etapa'),
  ('opportunities.filter.by_stage', 'en', 'By stage'),
  ('opportunities.filter.by_stage', 'pt', 'Por etapa'),
  ('opportunities.filter.by_tech_company', 'es', 'Por empresa tecnológica'),
  ('opportunities.filter.by_tech_company', 'en', 'By tech company'),
  ('opportunities.filter.by_tech_company', 'pt', 'Por empresa tecnológica'),
  ('opportunities.filter.by_partner', 'es', 'Por partner'),
  ('opportunities.filter.by_partner', 'en', 'By partner'),
  ('opportunities.filter.by_partner', 'pt', 'Por parceiro')
ON CONFLICT (key, language) DO NOTHING;

-- Traducciones para botones y acciones
INSERT INTO public.translations (key, language, value)
VALUES 
  ('opportunities.actions.create', 'es', 'Crear oportunidad'),
  ('opportunities.actions.create', 'en', 'Create opportunity'),
  ('opportunities.actions.create', 'pt', 'Criar oportunidade'),
  ('opportunities.actions.edit', 'es', 'Editar'),
  ('opportunities.actions.edit', 'en', 'Edit'),
  ('opportunities.actions.edit', 'pt', 'Editar'),
  ('opportunities.actions.delete', 'es', 'Eliminar'),
  ('opportunities.actions.delete', 'en', 'Delete'),
  ('opportunities.actions.delete', 'pt', 'Excluir'),
  ('opportunities.actions.view', 'es', 'Ver detalles'),
  ('opportunities.actions.view', 'en', 'View details'),
  ('opportunities.actions.view', 'pt', 'Ver detalhes'),
  ('opportunities.actions.confirm_delete', 'es', '¿Estás seguro de que deseas eliminar esta oportunidad?'),
  ('opportunities.actions.confirm_delete', 'en', 'Are you sure you want to delete this opportunity?'),
  ('opportunities.actions.confirm_delete', 'pt', 'Tem certeza de que deseja excluir esta oportunidade?'),
  ('opportunities.actions.delete_success', 'es', 'Oportunidad eliminada correctamente'),
  ('opportunities.actions.delete_success', 'en', 'Opportunity deleted successfully'),
  ('opportunities.actions.delete_success', 'pt', 'Oportunidade excluída com sucesso'),
  ('opportunities.actions.create_success', 'es', 'Oportunidad creada correctamente'),
  ('opportunities.actions.create_success', 'en', 'Opportunity created successfully'),
  ('opportunities.actions.create_success', 'pt', 'Oportunidade criada com sucesso'),
  ('opportunities.actions.update_success', 'es', 'Oportunidad actualizada correctamente'),
  ('opportunities.actions.update_success', 'en', 'Opportunity updated successfully'),
  ('opportunities.actions.update_success', 'pt', 'Oportunidade atualizada com sucesso')
ON CONFLICT (key, language) DO NOTHING;

-- Traducciones para vistas
INSERT INTO public.translations (key, language, value)
VALUES 
  ('opportunities.views.table', 'es', 'Tabla'),
  ('opportunities.views.table', 'en', 'Table'),
  ('opportunities.views.table', 'pt', 'Tabela'),
  ('opportunities.views.kanban', 'es', 'Kanban'),
  ('opportunities.views.kanban', 'en', 'Kanban'),
  ('opportunities.views.kanban', 'pt', 'Kanban')
ON CONFLICT (key, language) DO NOTHING;
