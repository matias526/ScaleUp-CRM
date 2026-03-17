-- Insertar traducciones para el módulo de Oportunidades

-- Traducciones para el menú y títulos principales
INSERT INTO translations (key, es, en, pt)
VALUES 
  ('sidebar.opportunities', 'Oportunidades', 'Opportunities', 'Oportunidades'),
  ('opportunities.title', 'Oportunidades', 'Opportunities', 'Oportunidades'),
  ('opportunities.create_title', 'Crear nueva oportunidad', 'Create new opportunity', 'Criar nova oportunidade'),
  ('opportunities.edit_title', 'Editar oportunidad', 'Edit opportunity', 'Editar oportunidade'),
  ('opportunities.view_title', 'Detalles de la oportunidad', 'Opportunity details', 'Detalhes da oportunidade')
ON CONFLICT (key) DO NOTHING;

-- Traducciones para los campos del formulario
INSERT INTO translations (key, es, en, pt)
VALUES 
  ('opportunities.form.name', 'Nombre', 'Name', 'Nome'),
  ('opportunities.form.description', 'Descripción', 'Description', 'Descrição'),
  ('opportunities.form.stage', 'Etapa', 'Stage', 'Etapa'),
  ('opportunities.form.tech_company', 'Empresa tecnológica', 'Tech company', 'Empresa tecnológica'),
  ('opportunities.form.partner', 'Partner', 'Partner', 'Parceiro'),
  ('opportunities.form.end_customer', 'Cliente final', 'End customer', 'Cliente final'),
  ('opportunities.form.estimated_value', 'Valor estimado', 'Estimated value', 'Valor estimado'),
  ('opportunities.form.tech_fields', 'Campos tecnológicos', 'Tech fields', 'Campos tecnológicos'),
  ('opportunities.form.submit', 'Guardar', 'Save', 'Salvar'),
  ('opportunities.form.cancel', 'Cancelar', 'Cancel', 'Cancelar'),
  ('opportunities.form.select_placeholder', 'Seleccionar...', 'Select...', 'Selecionar...'),
  ('opportunities.form.new_end_customer', 'Nuevo cliente', 'New customer', 'Novo cliente'),
  ('opportunities.form.new_end_customer_name', 'Nombre del cliente', 'Customer name', 'Nome do cliente'),
  ('opportunities.form.create_end_customer', 'Crear cliente', 'Create customer', 'Criar cliente')
ON CONFLICT (key) DO NOTHING;

-- Traducciones para la tabla y filtros
INSERT INTO translations (key, es, en, pt)
VALUES 
  ('opportunities.table.name', 'Nombre', 'Name', 'Nome'),
  ('opportunities.table.stage', 'Etapa', 'Stage', 'Etapa'),
  ('opportunities.table.tech_company', 'Empresa tecnológica', 'Tech company', 'Empresa tecnológica'),
  ('opportunities.table.partner', 'Partner', 'Partner', 'Parceiro'),
  ('opportunities.table.end_customer', 'Cliente final', 'End customer', 'Cliente final'),
  ('opportunities.table.estimated_value', 'Valor estimado', 'Estimated value', 'Valor estimado'),
  ('opportunities.table.created_at', 'Fecha de creación', 'Creation date', 'Data de criação'),
  ('opportunities.table.actions', 'Acciones', 'Actions', 'Ações'),
  ('opportunities.table.no_data', 'No hay oportunidades disponibles', 'No opportunities available', 'Não há oportunidades disponíveis'),
  ('opportunities.table.search', 'Buscar oportunidades...', 'Search opportunities...', 'Buscar oportunidades...'),
  ('opportunities.filter.all', 'Todas', 'All', 'Todas'),
  ('opportunities.filter.active', 'Activas', 'Active', 'Ativas'),
  ('opportunities.filter.by_stage', 'Por etapa', 'By stage', 'Por etapa'),
  ('opportunities.filter.by_tech_company', 'Por empresa tecnológica', 'By tech company', 'Por empresa tecnológica'),
  ('opportunities.filter.by_partner', 'Por partner', 'By partner', 'Por parceiro')
ON CONFLICT (key) DO NOTHING;

-- Traducciones para botones y acciones
INSERT INTO translations (key, es, en, pt)
VALUES 
  ('opportunities.actions.create', 'Crear oportunidad', 'Create opportunity', 'Criar oportunidade'),
  ('opportunities.actions.edit', 'Editar', 'Edit', 'Editar'),
  ('opportunities.actions.delete', 'Eliminar', 'Delete', 'Excluir'),
  ('opportunities.actions.view', 'Ver detalles', 'View details', 'Ver detalhes'),
  ('opportunities.actions.confirm_delete', '¿Estás seguro de que deseas eliminar esta oportunidad?', 'Are you sure you want to delete this opportunity?', 'Tem certeza de que deseja excluir esta oportunidade?'),
  ('opportunities.actions.delete_success', 'Oportunidad eliminada correctamente', 'Opportunity deleted successfully', 'Oportunidade excluída com sucesso'),
  ('opportunities.actions.create_success', 'Oportunidad creada correctamente', 'Opportunity created successfully', 'Oportunidade criada com sucesso'),
  ('opportunities.actions.update_success', 'Oportunidad actualizada correctamente', 'Opportunity updated successfully', 'Oportunidade atualizada com sucesso')
ON CONFLICT (key) DO NOTHING;

-- Traducciones para vistas
INSERT INTO translations (key, es, en, pt)
VALUES 
  ('opportunities.views.table', 'Tabla', 'Table', 'Tabela'),
  ('opportunities.views.kanban', 'Kanban', 'Kanban', 'Kanban')
ON CONFLICT (key) DO NOTHING;
