-- Script para insertar traducciones del nuevo dashboard administrativo

-- Verificar si la tabla de traducciones existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'translations') THEN
    RAISE EXCEPTION 'La tabla translations no existe';
  END IF;
END
$$;

-- Función para insertar o actualizar traducciones
CREATE OR REPLACE FUNCTION insert_translation(p_key TEXT, p_en TEXT, p_es TEXT, p_pt TEXT)
RETURNS VOID AS $$
BEGIN
  -- Insertar o actualizar traducción en inglés
  INSERT INTO translations (key, language, value)
  VALUES (p_key, 'en', p_en)
  ON CONFLICT (key, language) 
  DO UPDATE SET value = p_en;
  
  -- Insertar o actualizar traducción en español
  INSERT INTO translations (key, language, value)
  VALUES (p_key, 'es', p_es)
  ON CONFLICT (key, language) 
  DO UPDATE SET value = p_es;
  
  -- Insertar o actualizar traducción en portugués
  INSERT INTO translations (key, language, value)
  VALUES (p_key, 'pt', p_pt)
  ON CONFLICT (key, language) 
  DO UPDATE SET value = p_pt;
END;
$$ LANGUAGE plpgsql;

-- Traducciones principales del dashboard
SELECT insert_translation(
  'admin.dashboard.title', 
  'Administration Dashboard', 
  'Panel de Administración', 
  'Painel de Administração'
);

SELECT insert_translation(
  'admin.dashboard.subtitle', 
  'Complete overview of business performance and key metrics', 
  'Visión completa del rendimiento del negocio y métricas clave', 
  'Visão completa do desempenho do negócio e métricas-chave'
);

-- KPIs Principales
SELECT insert_translation(
  'admin.dashboard.kpis.totalPipeline', 
  'Total Pipeline', 
  'Pipeline Total', 
  'Pipeline Total'
);

SELECT insert_translation(
  'admin.dashboard.kpis.totalPipelineDesc', 
  'Total value of active opportunities', 
  'Valor total de oportunidades activas', 
  'Valor total de oportunidades ativas'
);

SELECT insert_translation(
  'admin.dashboard.kpis.activeOpportunities', 
  'Active Opportunities', 
  'Oportunidades Activas', 
  'Oportunidades Ativas'
);

SELECT insert_translation(
  'admin.dashboard.kpis.activeOpportunitiesDesc', 
  'Opportunities currently in progress', 
  'Oportunidades actualmente en proceso', 
  'Oportunidades atualmente em andamento'
);

SELECT insert_translation(
  'admin.dashboard.kpis.conversionRate', 
  'Conversion Rate', 
  'Tasa de Conversión', 
  'Taxa de Conversão'
);

SELECT insert_translation(
  'admin.dashboard.kpis.conversionRateDesc', 
  'Percentage of successfully closed opportunities', 
  'Porcentaje de oportunidades cerradas exitosamente', 
  'Porcentagem de oportunidades fechadas com sucesso'
);

SELECT insert_translation(
  'admin.dashboard.kpis.activePartners', 
  'Active Partners', 
  'Partners Activos', 
  'Parceiros Ativos'
);

SELECT insert_translation(
  'admin.dashboard.kpis.activePartnersDesc', 
  'Partners with recent activity', 
  'Partners con actividad reciente', 
  'Parceiros com atividade recente'
);

-- Secciones del dashboard
SELECT insert_translation(
  'admin.dashboard.sections.pipelineStages', 
  'Pipeline by Stages', 
  'Pipeline por Etapas', 
  'Pipeline por Estágios'
);

SELECT insert_translation(
  'admin.dashboard.sections.pipelineStagesDesc', 
  'Distribution of opportunities across pipeline stages', 
  'Distribución de oportunidades por etapas del pipeline', 
  'Distribuição de oportunidades por estágios do pipeline'
);

SELECT insert_translation(
  'admin.dashboard.sections.monthlyActivity', 
  'Monthly Activity', 
  'Actividad Mensual', 
  'Atividade Mensal'
);

SELECT insert_translation(
  'admin.dashboard.sections.monthlyActivityDesc', 
  'New opportunities vs closed opportunities trend', 
  'Tendencia de nuevas oportunidades vs oportunidades cerradas', 
  'Tendência de novas oportunidades vs oportunidades fechadas'
);

SELECT insert_translation(
  'admin.dashboard.sections.topPartners', 
  'Top Partners', 
  'Top Partners', 
  'Top Parceiros'
);

SELECT insert_translation(
  'admin.dashboard.sections.topPartnersDesc', 
  'Most active partners with key metrics', 
  'Partners más activos con métricas clave', 
  'Parceiros mais ativos com métricas-chave'
);

SELECT insert_translation(
  'admin.dashboard.sections.topTechCompanies', 
  'Top Tech Companies', 
  'Top Empresas Tech', 
  'Top Empresas Tech'
);

SELECT insert_translation(
  'admin.dashboard.sections.topTechCompaniesDesc', 
  'Tech companies with most opportunities', 
  'Empresas tech con más oportunidades', 
  'Empresas tech com mais oportunidades'
);

-- Centro de Acciones
SELECT insert_translation(
  'admin.dashboard.actions.title', 
  'Action Center', 
  'Centro de Acciones', 
  'Centro de Ações'
);

SELECT insert_translation(
  'admin.dashboard.actions.subtitle', 
  'Items requiring immediate attention', 
  'Elementos que requieren atención inmediata', 
  'Itens que requerem atenção imediata'
);

SELECT insert_translation(
  'admin.dashboard.actions.validationNeeded', 
  'Validation Needed', 
  'Validación Requerida', 
  'Validação Necessária'
);

SELECT insert_translation(
  'admin.dashboard.actions.overdueTasks', 
  'Overdue Tasks', 
  'Tareas Vencidas', 
  'Tarefas Vencidas'
);

SELECT insert_translation(
  'admin.dashboard.actions.unassignedOpportunities', 
  'Unassigned Opportunities', 
  'Oportunidades Sin Asignar', 
  'Oportunidades Não Atribuídas'
);

SELECT insert_translation(
  'admin.dashboard.actions.riskAlerts', 
  'Risk Alerts', 
  'Alertas de Riesgo', 
  'Alertas de Risco'
);

-- Actividad Reciente
SELECT insert_translation(
  'admin.dashboard.activity.title', 
  'Recent Activity', 
  'Actividad Reciente', 
  'Atividade Recente'
);

SELECT insert_translation(
  'admin.dashboard.activity.subtitle', 
  'Latest updates and changes in the system', 
  'Últimas actualizaciones y cambios en el sistema', 
  'Últimas atualizações e mudanças no sistema'
);

SELECT insert_translation(
  'admin.dashboard.activity.newOpportunities', 
  'New Opportunities', 
  'Nuevas Oportunidades', 
  'Novas Oportunidades'
);

SELECT insert_translation(
  'admin.dashboard.activity.stageChanges', 
  'Stage Changes', 
  'Cambios de Etapa', 
  'Mudanças de Estágio'
);

SELECT insert_translation(
  'admin.dashboard.activity.newPartners', 
  'New Partners', 
  'Nuevos Partners', 
  'Novos Parceiros'
);

-- Filtros
SELECT insert_translation(
  'admin.dashboard.filters.title', 
  'Filters', 
  'Filtros', 
  'Filtros'
);

SELECT insert_translation(
  'admin.dashboard.filters.dateRange', 
  'Date Range', 
  'Rango de Fechas', 
  'Intervalo de Datas'
);

SELECT insert_translation(
  'admin.dashboard.filters.country', 
  'Country', 
  'País', 
  'País'
);

SELECT insert_translation(
  'admin.dashboard.filters.partner', 
  'Partner', 
  'Partner', 
  'Parceiro'
);

SELECT insert_translation(
  'admin.dashboard.filters.techCompany', 
  'Tech Company', 
  'Empresa Tech', 
  'Empresa Tech'
);

SELECT insert_translation(
  'admin.dashboard.filters.allCountries', 
  'All Countries', 
  'Todos los Países', 
  'Todos os Países'
);

SELECT insert_translation(
  'admin.dashboard.filters.allPartners', 
  'All Partners', 
  'Todos los Partners', 
  'Todos os Parceiros'
);

SELECT insert_translation(
  'admin.dashboard.filters.allTechCompanies', 
  'All Tech Companies', 
  'Todas las Empresas Tech', 
  'Todas as Empresas Tech'
);

-- Botones y acciones
SELECT insert_translation(
  'admin.dashboard.buttons.viewAll', 
  'View All', 
  'Ver Todo', 
  'Ver Tudo'
);

SELECT insert_translation(
  'admin.dashboard.buttons.refresh', 
  'Refresh', 
  'Actualizar', 
  'Atualizar'
);

SELECT insert_translation(
  'admin.dashboard.buttons.export', 
  'Export', 
  'Exportar', 
  'Exportar'
);

SELECT insert_translation(
  'admin.dashboard.buttons.resolve', 
  'Resolve', 
  'Resolver', 
  'Resolver'
);

-- Estados y mensajes
SELECT insert_translation(
  'admin.dashboard.states.loading', 
  'Loading...', 
  'Cargando...', 
  'Carregando...'
);

SELECT insert_translation(
  'admin.dashboard.states.noData', 
  'No data available', 
  'No hay datos disponibles', 
  'Nenhum dado disponível'
);

SELECT insert_translation(
  'admin.dashboard.states.error', 
  'Error loading data', 
  'Error al cargar los datos', 
  'Erro ao carregar os dados'
);

-- Métricas y unidades
SELECT insert_translation(
  'admin.dashboard.metrics.opportunities', 
  'opportunities', 
  'oportunidades', 
  'oportunidades'
);

SELECT insert_translation(
  'admin.dashboard.metrics.partners', 
  'partners', 
  'partners', 
  'parceiros'
);

SELECT insert_translation(
  'admin.dashboard.metrics.value', 
  'Value', 
  'Valor', 
  'Valor'
);

SELECT insert_translation(
  'admin.dashboard.metrics.count', 
  'Count', 
  'Cantidad', 
  'Quantidade'
);

SELECT insert_translation(
  'admin.dashboard.metrics.percentage', 
  'Percentage', 
  'Porcentaje', 
  'Porcentagem'
);

-- Confirmar que se han insertado todas las traducciones
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM translations WHERE key LIKE 'admin.dashboard.%';
  RAISE NOTICE 'Se han insertado o actualizado % traducciones para el nuevo dashboard admin', total_count;
END
$$;
