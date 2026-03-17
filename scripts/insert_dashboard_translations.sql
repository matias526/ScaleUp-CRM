-- Script para insertar traducciones del dashboard administrativo en inglés, español y portugués

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

-- Traducciones para el Dashboard principal
SELECT insert_translation(
  'dashboard.title', 
  'Admin Dashboard', 
  'Panel de Administración', 
  'Painel de Administração'
);

SELECT insert_translation(
  'dashboard.subtitle', 
  'Overview of business performance and key metrics', 
  'Resumen del rendimiento del negocio y métricas clave', 
  'Visão geral do desempenho do negócio e métricas-chave'
);

-- Traducciones para KPI Cards
SELECT insert_translation(
  'dashboard.kpis.pipelineValue', 
  'Pipeline Value', 
  'Valor del Pipeline', 
  'Valor do Pipeline'
);

SELECT insert_translation(
  'dashboard.kpis.totalOpportunities', 
  'Total opportunities', 
  'Total de oportunidades', 
  'Total de oportunidades'
);

SELECT insert_translation(
  'dashboard.kpis.conversionRate', 
  'Conversion Rate', 
  'Tasa de Conversión', 
  'Taxa de Conversão'
);

SELECT insert_translation(
  'dashboard.kpis.lastQuarter', 
  'Last quarter', 
  'Último trimestre', 
  'Último trimestre'
);

SELECT insert_translation(
  'dashboard.kpis.newOpportunities', 
  'New Opportunities', 
  'Nuevas Oportunidades', 
  'Novas Oportunidades'
);

SELECT insert_translation(
  'dashboard.kpis.closedOpportunities', 
  'Closed Opportunities', 
  'Oportunidades Cerradas', 
  'Oportunidades Fechadas'
);

SELECT insert_translation(
  'dashboard.kpis.vsLastMonth', 
  'vs last month', 
  'vs mes anterior', 
  'vs mês anterior'
);

-- Traducciones para Pipeline Analysis
SELECT insert_translation(
  'dashboard.pipeline.title', 
  'Pipeline Analysis', 
  'Análisis del Pipeline', 
  'Análise do Pipeline'
);

SELECT insert_translation(
  'dashboard.pipeline.description', 
  'Distribution of opportunities by stage', 
  'Distribución de oportunidades por etapa', 
  'Distribuição de oportunidades por estágio'
);

SELECT insert_translation(
  'dashboard.pipeline.stage', 
  'Stage', 
  'Etapa', 
  'Estágio'
);

SELECT insert_translation(
  'dashboard.pipeline.count', 
  'Count', 
  'Cantidad', 
  'Quantidade'
);

SELECT insert_translation(
  'dashboard.pipeline.value', 
  'Value', 
  'Valor', 
  'Valor'
);

-- Traducciones para Time Analysis
SELECT insert_translation(
  'dashboard.timeAnalysis.title', 
  'Time Analysis', 
  'Análisis Temporal', 
  'Análise Temporal'
);

SELECT insert_translation(
  'dashboard.timeAnalysis.description', 
  'Cycle time and recent activity', 
  'Tiempo de ciclo y actividad reciente', 
  'Tempo de ciclo e atividade recente'
);

SELECT insert_translation(
  'dashboard.timeAnalysis.avgCycleTime', 
  'Average Cycle Time', 
  'Tiempo de Ciclo Promedio', 
  'Tempo Médio de Ciclo'
);

SELECT insert_translation(
  'dashboard.timeAnalysis.days', 
  'days', 
  'días', 
  'dias'
);

SELECT insert_translation(
  'dashboard.timeAnalysis.recentActivity', 
  'Recent Activity', 
  'Actividad Reciente', 
  'Atividade Recente'
);

-- Traducciones para BDD Performance
SELECT insert_translation(
  'dashboard.bddPerformance.title', 
  'BDD Performance', 
  'Rendimiento de BDDs', 
  'Desempenho dos BDDs'
);

SELECT insert_translation(
  'dashboard.bddPerformance.description', 
  'Performance metrics for business development directors', 
  'Métricas de rendimiento para directores de desarrollo de negocio', 
  'Métricas de desempenho para diretores de desenvolvimento de negócios'
);

SELECT insert_translation(
  'dashboard.bddPerformance.bdd', 
  'BDD', 
  'BDD', 
  'BDD'
);

SELECT insert_translation(
  'dashboard.bddPerformance.opportunities', 
  'Opportunities', 
  'Oportunidades', 
  'Oportunidades'
);

SELECT insert_translation(
  'dashboard.bddPerformance.pipelineValue', 
  'Pipeline Value', 
  'Valor del Pipeline', 
  'Valor do Pipeline'
);

SELECT insert_translation(
  'dashboard.bddPerformance.conversionRate', 
  'Conversion Rate', 
  'Tasa de Conversión', 
  'Taxa de Conversão'
);

SELECT insert_translation(
  'dashboard.bddPerformance.avgCycleTime', 
  'Avg. Cycle Time', 
  'Tiempo de Ciclo Prom.', 
  'Tempo Médio de Ciclo'
);

SELECT insert_translation(
  'dashboard.bddPerformance.trend', 
  'Trend', 
  'Tendencia', 
  'Tendência'
);

SELECT insert_translation(
  'dashboard.bddPerformance.activityDistribution', 
  'Activity Distribution', 
  'Distribución de Actividad', 
  'Distribuição de Atividade'
);

SELECT insert_translation(
  'dashboard.bddPerformance.activityDescription', 
  'Opportunities managed by each BDD', 
  'Oportunidades gestionadas por cada BDD', 
  'Oportunidades gerenciadas por cada BDD'
);

SELECT insert_translation(
  'dashboard.bddPerformance.conversionAnalysis', 
  'Conversion Analysis', 
  'Análisis de Conversión', 
  'Análise de Conversão'
);

SELECT insert_translation(
  'dashboard.bddPerformance.conversionDescription', 
  'Conversion rate by BDD', 
  'Tasa de conversión por BDD', 
  'Taxa de conversão por BDD'
);

-- Traducciones para Partners Analysis
SELECT insert_translation(
  'dashboard.partnersAnalysis.title', 
  'Partners Analysis', 
  'Análisis de Partners', 
  'Análise de Parceiros'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.description', 
  'Performance metrics for partners', 
  'Métricas de rendimiento para partners', 
  'Métricas de desempenho para parceiros'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.partner', 
  'Partner', 
  'Partner', 
  'Parceiro'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.opportunities', 
  'Opportunities', 
  'Oportunidades', 
  'Oportunidades'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.pipelineValue', 
  'Pipeline Value', 
  'Valor del Pipeline', 
  'Valor do Pipeline'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.techCompanies', 
  'Tech Companies', 
  'Empresas Tech', 
  'Empresas Tech'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.countries', 
  'Countries', 
  'Países', 
  'Países'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.opportunityDistribution', 
  'Opportunity Distribution', 
  'Distribución de Oportunidades', 
  'Distribuição de Oportunidades'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.byPartner', 
  'By Partner', 
  'Por Partner', 
  'Por Parceiro'
);

SELECT insert_translation(
  'dashboard.partnersAnalysis.valueDistribution', 
  'Value Distribution', 
  'Distribución de Valor', 
  'Distribuição de Valor'
);

-- Traducciones para Tech Companies Analysis
SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.title', 
  'Tech Companies Analysis', 
  'Análisis de Empresas Tech', 
  'Análise de Empresas Tech'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.description', 
  'Performance metrics for tech companies', 
  'Métricas de rendimiento para empresas tech', 
  'Métricas de desempenho para empresas tech'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.techCompany', 
  'Tech Company', 
  'Empresa Tech', 
  'Empresa Tech'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.category', 
  'Category', 
  'Categoría', 
  'Categoria'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.opportunities', 
  'Opportunities', 
  'Oportunidades', 
  'Oportunidades'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.pipelineValue', 
  'Pipeline Value', 
  'Valor del Pipeline', 
  'Valor do Pipeline'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.partners', 
  'Partners', 
  'Partners', 
  'Parceiros'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.categoryDistribution', 
  'Category Distribution', 
  'Distribución por Categoría', 
  'Distribuição por Categoria'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.byCategory', 
  'By Category', 
  'Por Categoría', 
  'Por Categoria'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.opportunityValue', 
  'Opportunity Value', 
  'Valor de Oportunidades', 
  'Valor de Oportunidades'
);

SELECT insert_translation(
  'dashboard.techCompaniesAnalysis.byTechCompany', 
  'By Tech Company', 
  'Por Empresa Tech', 
  'Por Empresa Tech'
);

-- Traducciones para Action Center
SELECT insert_translation(
  'dashboard.actionCenter.title', 
  'Action Center', 
  'Centro de Acción', 
  'Centro de Ação'
);

SELECT insert_translation(
  'dashboard.actionCenter.description', 
  'Pending actions and alerts', 
  'Acciones pendientes y alertas', 
  'Ações pendentes e alertas'
);

SELECT insert_translation(
  'dashboard.actionCenter.action', 
  'Action', 
  'Acción', 
  'Ação'
);

SELECT insert_translation(
  'dashboard.actionCenter.priority', 
  'Priority', 
  'Prioridad', 
  'Prioridade'
);

SELECT insert_translation(
  'dashboard.actionCenter.dueDate', 
  'Due Date', 
  'Fecha Límite', 
  'Data Limite'
);

SELECT insert_translation(
  'dashboard.actionCenter.resolve', 
  'Resolve', 
  'Resolver', 
  'Resolver'
);

SELECT insert_translation(
  'dashboard.actionCenter.validationNeeded', 
  'Validation Needed', 
  'Validación Necesaria', 
  'Validação Necessária'
);

SELECT insert_translation(
  'dashboard.actionCenter.validationDescription', 
  'Opportunities that need validation', 
  'Oportunidades que necesitan validación', 
  'Oportunidades que precisam de validação'
);

SELECT insert_translation(
  'dashboard.actionCenter.validate', 
  'Validate', 
  'Validar', 
  'Validar'
);

SELECT insert_translation(
  'dashboard.actionCenter.highRiskOpportunities', 
  'High Risk Opportunities', 
  'Oportunidades de Alto Riesgo', 
  'Oportunidades de Alto Risco'
);

SELECT insert_translation(
  'dashboard.actionCenter.riskDescription', 
  'Opportunities with high risk of loss', 
  'Oportunidades con alto riesgo de pérdida', 
  'Oportunidades com alto risco de perda'
);

SELECT insert_translation(
  'dashboard.actionCenter.review', 
  'Review', 
  'Revisar', 
  'Revisar'
);

-- Traducciones para Dashboard Filters
SELECT insert_translation(
  'dashboard.filters.title', 
  'Filters', 
  'Filtros', 
  'Filtros'
);

SELECT insert_translation(
  'dashboard.filters.saveView', 
  'Save View', 
  'Guardar Vista', 
  'Salvar Visualização'
);

SELECT insert_translation(
  'dashboard.filters.dateRange', 
  'Date Range', 
  'Rango de Fechas', 
  'Intervalo de Datas'
);

SELECT insert_translation(
  'dashboard.filters.country', 
  'Country', 
  'País', 
  'País'
);

SELECT insert_translation(
  'dashboard.filters.allCountries', 
  'All Countries', 
  'Todos los Países', 
  'Todos os Países'
);

SELECT insert_translation(
  'dashboard.filters.partner', 
  'Partner', 
  'Partner', 
  'Parceiro'
);

SELECT insert_translation(
  'dashboard.filters.allPartners', 
  'All Partners', 
  'Todos los Partners', 
  'Todos os Parceiros'
);

SELECT insert_translation(
  'dashboard.filters.techCompany', 
  'Tech Company', 
  'Empresa Tech', 
  'Empresa Tech'
);

SELECT insert_translation(
  'dashboard.filters.allTechCompanies', 
  'All Tech Companies', 
  'Todas las Empresas Tech', 
  'Todas as Empresas Tech'
);

-- Traducciones para componentes del dashboard
SELECT insert_translation(
  'dashboard.components.overview', 
  'Overview', 
  'Resumen', 
  'Resumo'
);

SELECT insert_translation(
  'dashboard.components.performance', 
  'Performance', 
  'Rendimiento', 
  'Desempenho'
);

SELECT insert_translation(
  'dashboard.components.actions', 
  'Actions', 
  'Acciones', 
  'Ações'
);

-- Confirmar que se han insertado todas las traducciones
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM translations WHERE key LIKE 'dashboard.%';
  RAISE NOTICE 'Se han insertado o actualizado % traducciones para el dashboard', total_count;
END
$$;
