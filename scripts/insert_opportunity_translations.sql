-- Insertar traducciones para el menú de oportunidades
INSERT INTO translations (key, value, language)
VALUES 
  ('sidebar.opportunities', 'Opportunities', 'en'),
  ('sidebar.opportunities', 'Oportunidades', 'es'),
  ('sidebar.opportunities.description', 'Manage sales opportunities', 'en'),
  ('sidebar.opportunities.description', 'Gestionar oportunidades de venta', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para las páginas de oportunidades
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.title', 'Opportunities', 'en'),
  ('opportunities.title', 'Oportunidades', 'es'),
  ('opportunities.create', 'Create Opportunity', 'en'),
  ('opportunities.create', 'Crear Oportunidad', 'es'),
  ('opportunities.edit', 'Edit Opportunity', 'en'),
  ('opportunities.edit', 'Editar Oportunidad', 'es'),
  ('opportunities.view', 'View Opportunity', 'en'),
  ('opportunities.view', 'Ver Oportunidad', 'es'),
  ('opportunities.delete', 'Delete Opportunity', 'en'),
  ('opportunities.delete', 'Eliminar Oportunidad', 'es'),
  ('opportunities.kanban', 'Kanban View', 'en'),
  ('opportunities.kanban', 'Vista Kanban', 'es'),
  ('opportunities.table', 'Table View', 'en'),
  ('opportunities.table', 'Vista Tabla', 'es'),
  ('opportunities.filters', 'Filters', 'en'),
  ('opportunities.filters', 'Filtros', 'es'),
  ('opportunities.clear_filters', 'Clear Filters', 'en'),
  ('opportunities.clear_filters', 'Limpiar Filtros', 'es'),
  ('opportunities.no_opportunities', 'No opportunities found', 'en'),
  ('opportunities.no_opportunities', 'No se encontraron oportunidades', 'es'),
  ('opportunities.search', 'Search opportunities...', 'en'),
  ('opportunities.search', 'Buscar oportunidades...', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para los campos del formulario de oportunidades
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.form.name', 'Opportunity Name', 'en'),
  ('opportunities.form.name', 'Nombre de la Oportunidad', 'es'),
  ('opportunities.form.description', 'Description', 'en'),
  ('opportunities.form.description', 'Descripción', 'es'),
  ('opportunities.form.amount', 'Amount', 'en'),
  ('opportunities.form.amount', 'Monto', 'es'),
  ('opportunities.form.currency', 'Currency', 'en'),
  ('opportunities.form.currency', 'Moneda', 'es'),
  ('opportunities.form.close_date', 'Expected Close Date', 'en'),
  ('opportunities.form.close_date', 'Fecha Estimada de Cierre', 'es'),
  ('opportunities.form.stage', 'Stage', 'en'),
  ('opportunities.form.stage', 'Etapa', 'es'),
  ('opportunities.form.tech_company', 'Tech Company', 'en'),
  ('opportunities.form.tech_company', 'Empresa Tecnológica', 'es'),
  ('opportunities.form.partner', 'Partner', 'en'),
  ('opportunities.form.partner', 'Socio', 'es'),
  ('opportunities.form.end_customer', 'End Customer', 'en'),
  ('opportunities.form.end_customer', 'Cliente Final', 'es'),
  ('opportunities.form.country', 'Country', 'en'),
  ('opportunities.form.country', 'País', 'es'),
  ('opportunities.form.tech_fields', 'Technology Specific Fields', 'en'),
  ('opportunities.form.tech_fields', 'Campos Específicos de Tecnología', 'es'),
  ('opportunities.form.create_end_customer', 'Create New End Customer', 'en'),
  ('opportunities.form.create_end_customer', 'Crear Nuevo Cliente Final', 'es'),
  ('opportunities.form.select_end_customer', 'Select End Customer', 'en'),
  ('opportunities.form.select_end_customer', 'Seleccionar Cliente Final', 'es'),
  ('opportunities.form.end_customer_name', 'End Customer Name', 'en'),
  ('opportunities.form.end_customer_name', 'Nombre del Cliente Final', 'es'),
  ('opportunities.form.end_customer_website', 'Website', 'en'),
  ('opportunities.form.end_customer_website', 'Sitio Web', 'es'),
  ('opportunities.form.end_customer_industry', 'Industry', 'en'),
  ('opportunities.form.end_customer_industry', 'Industria', 'es'),
  ('opportunities.form.probability', 'Probability (%)', 'en'),
  ('opportunities.form.probability', 'Probabilidad (%)', 'es'),
  ('opportunities.form.save', 'Save Opportunity', 'en'),
  ('opportunities.form.save', 'Guardar Oportunidad', 'es'),
  ('opportunities.form.cancel', 'Cancel', 'en'),
  ('opportunities.form.cancel', 'Cancelar', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para las etapas del pipeline
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.stages.qualification', 'Qualification', 'en'),
  ('opportunities.stages.qualification', 'Calificación', 'es'),
  ('opportunities.stages.needs_analysis', 'Needs Analysis', 'en'),
  ('opportunities.stages.needs_analysis', 'Análisis de Necesidades', 'es'),
  ('opportunities.stages.proposal', 'Proposal', 'en'),
  ('opportunities.stages.proposal', 'Propuesta', 'es'),
  ('opportunities.stages.negotiation', 'Negotiation', 'en'),
  ('opportunities.stages.negotiation', 'Negociación', 'es'),
  ('opportunities.stages.closed_won', 'Closed Won', 'en'),
  ('opportunities.stages.closed_won', 'Cerrada Ganada', 'es'),
  ('opportunities.stages.closed_lost', 'Closed Lost', 'en'),
  ('opportunities.stages.closed_lost', 'Cerrada Perdida', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para los mensajes de éxito/error
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.success.created', 'Opportunity created successfully', 'en'),
  ('opportunities.success.created', 'Oportunidad creada con éxito', 'es'),
  ('opportunities.success.updated', 'Opportunity updated successfully', 'en'),
  ('opportunities.success.updated', 'Oportunidad actualizada con éxito', 'es'),
  ('opportunities.success.deleted', 'Opportunity deleted successfully', 'en'),
  ('opportunities.success.deleted', 'Oportunidad eliminada con éxito', 'es'),
  ('opportunities.error.create', 'Error creating opportunity', 'en'),
  ('opportunities.error.create', 'Error al crear la oportunidad', 'es'),
  ('opportunities.error.update', 'Error updating opportunity', 'en'),
  ('opportunities.error.update', 'Error al actualizar la oportunidad', 'es'),
  ('opportunities.error.delete', 'Error deleting opportunity', 'en'),
  ('opportunities.error.delete', 'Error al eliminar la oportunidad', 'es'),
  ('opportunities.error.not_found', 'Opportunity not found', 'en'),
  ('opportunities.error.not_found', 'Oportunidad no encontrada', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para la tabla de oportunidades
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.table.name', 'Name', 'en'),
  ('opportunities.table.name', 'Nombre', 'es'),
  ('opportunities.table.tech_company', 'Tech Company', 'en'),
  ('opportunities.table.tech_company', 'Empresa Tecnológica', 'es'),
  ('opportunities.table.partner', 'Partner', 'en'),
  ('opportunities.table.partner', 'Socio', 'es'),
  ('opportunities.table.end_customer', 'End Customer', 'en'),
  ('opportunities.table.end_customer', 'Cliente Final', 'es'),
  ('opportunities.table.amount', 'Amount', 'en'),
  ('opportunities.table.amount', 'Monto', 'es'),
  ('opportunities.table.stage', 'Stage', 'en'),
  ('opportunities.table.stage', 'Etapa', 'es'),
  ('opportunities.table.close_date', 'Close Date', 'en'),
  ('opportunities.table.close_date', 'Fecha de Cierre', 'es'),
  ('opportunities.table.created_at', 'Created At', 'en'),
  ('opportunities.table.created_at', 'Creado El', 'es'),
  ('opportunities.table.actions', 'Actions', 'en'),
  ('opportunities.table.actions', 'Acciones', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para los filtros
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.filters.tech_company', 'Filter by Tech Company', 'en'),
  ('opportunities.filters.tech_company', 'Filtrar por Empresa Tecnológica', 'es'),
  ('opportunities.filters.partner', 'Filter by Partner', 'en'),
  ('opportunities.filters.partner', 'Filtrar por Socio', 'es'),
  ('opportunities.filters.stage', 'Filter by Stage', 'en'),
  ('opportunities.filters.stage', 'Filtrar por Etapa', 'es'),
  ('opportunities.filters.date_range', 'Filter by Date Range', 'en'),
  ('opportunities.filters.date_range', 'Filtrar por Rango de Fechas', 'es'),
  ('opportunities.filters.min_amount', 'Min Amount', 'en'),
  ('opportunities.filters.min_amount', 'Monto Mínimo', 'es'),
  ('opportunities.filters.max_amount', 'Max Amount', 'en'),
  ('opportunities.filters.max_amount', 'Monto Máximo', 'es'),
  ('opportunities.filters.country', 'Filter by Country', 'en'),
  ('opportunities.filters.country', 'Filtrar por País', 'es'),
  ('opportunities.filters.all', 'All', 'en'),
  ('opportunities.filters.all', 'Todos', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para la vista de detalle
INSERT INTO translations (key, value, language)
VALUES 
  ('opportunities.detail.title', 'Opportunity Details', 'en'),
  ('opportunities.detail.title', 'Detalles de la Oportunidad', 'es'),
  ('opportunities.detail.edit', 'Edit', 'en'),
  ('opportunities.detail.edit', 'Editar', 'es'),
  ('opportunities.detail.delete', 'Delete', 'en'),
  ('opportunities.detail.delete', 'Eliminar', 'es'),
  ('opportunities.detail.back', 'Back to Opportunities', 'en'),
  ('opportunities.detail.back', 'Volver a Oportunidades', 'es'),
  ('opportunities.detail.general_info', 'General Information', 'en'),
  ('opportunities.detail.general_info', 'Información General', 'es'),
  ('opportunities.detail.tech_info', 'Technology Information', 'en'),
  ('opportunities.detail.tech_info', 'Información Tecnológica', 'es'),
  ('opportunities.detail.financial_info', 'Financial Information', 'en'),
  ('opportunities.detail.financial_info', 'Información Financiera', 'es'),
  ('opportunities.detail.created_by', 'Created By', 'en'),
  ('opportunities.detail.created_by', 'Creado Por', 'es'),
  ('opportunities.detail.created_at', 'Created At', 'en'),
  ('opportunities.detail.created_at', 'Creado El', 'es'),
  ('opportunities.detail.updated_at', 'Updated At', 'en'),
  ('opportunities.detail.updated_at', 'Actualizado El', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para monedas comunes
INSERT INTO translations (key, value, language)
VALUES 
  ('currencies.usd', 'USD', 'en'),
  ('currencies.usd', 'USD', 'es'),
  ('currencies.eur', 'EUR', 'en'),
  ('currencies.eur', 'EUR', 'es'),
  ('currencies.gbp', 'GBP', 'en'),
  ('currencies.gbp', 'GBP', 'es'),
  ('currencies.jpy', 'JPY', 'en'),
  ('currencies.jpy', 'JPY', 'es'),
  ('currencies.cad', 'CAD', 'en'),
  ('currencies.cad', 'CAD', 'es'),
  ('currencies.aud', 'AUD', 'en'),
  ('currencies.aud', 'AUD', 'es'),
  ('currencies.chf', 'CHF', 'en'),
  ('currencies.chf', 'CHF', 'es'),
  ('currencies.cny', 'CNY', 'en'),
  ('currencies.cny', 'CNY', 'es'),
  ('currencies.inr', 'INR', 'en'),
  ('currencies.inr', 'INR', 'es'),
  ('currencies.brl', 'BRL', 'en'),
  ('currencies.brl', 'BRL', 'es'),
  ('currencies.mxn', 'MXN', 'en'),
  ('currencies.mxn', 'MXN', 'es')
ON CONFLICT (key, language) DO NOTHING;

-- Insertar traducciones para industrias comunes
INSERT INTO translations (key, value, language)
VALUES 
  ('industries.technology', 'Technology', 'en'),
  ('industries.technology', 'Tecnología', 'es'),
  ('industries.healthcare', 'Healthcare', 'en'),
  ('industries.healthcare', 'Salud', 'es'),
  ('industries.finance', 'Finance', 'en'),
  ('industries.finance', 'Finanzas', 'es'),
  ('industries.education', 'Education', 'en'),
  ('industries.education', 'Educación', 'es'),
  ('industries.manufacturing', 'Manufacturing', 'en'),
  ('industries.manufacturing', 'Manufactura', 'es'),
  ('industries.retail', 'Retail', 'en'),
  ('industries.retail', 'Comercio Minorista', 'es'),
  ('industries.government', 'Government', 'en'),
  ('industries.government', 'Gobierno', 'es'),
  ('industries.energy', 'Energy', 'en'),
  ('industries.energy', 'Energía', 'es'),
  ('industries.telecommunications', 'Telecommunications', 'en'),
  ('industries.telecommunications', 'Telecomunicaciones', 'es'),
  ('industries.transportation', 'Transportation', 'en'),
  ('industries.transportation', 'Transporte', 'es'),
  ('industries.media', 'Media & Entertainment', 'en'),
  ('industries.media', 'Medios y Entretenimiento', 'es'),
  ('industries.hospitality', 'Hospitality', 'en'),
  ('industries.hospitality', 'Hostelería', 'es'),
  ('industries.agriculture', 'Agriculture', 'en'),
  ('industries.agriculture', 'Agricultura', 'es'),
  ('industries.construction', 'Construction', 'en'),
  ('industries.construction', 'Construcción', 'es'),
  ('industries.nonprofit', 'Non-profit', 'en'),
  ('industries.nonprofit', 'Sin Fines de Lucro', 'es'),
  ('industries.other', 'Other', 'en'),
  ('industries.other', 'Otro', 'es')
ON CONFLICT (key, language) DO NOTHING;
