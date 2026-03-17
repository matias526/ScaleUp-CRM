-- Script para insertar traducciones del dashboard administrativo en inglés, español y portugués
-- Versión con inserts simples sin función personalizada

-- Verificar si la tabla de traducciones existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'translations') THEN
    RAISE EXCEPTION 'La tabla translations no existe';
  END IF;
END
$$;

-- Traducciones para el Dashboard principal
-- Inglés
INSERT INTO translations (key, language, value)
VALUES ('dashboard.title', 'en', 'Admin Dashboard')
ON CONFLICT (key, language) DO UPDATE SET value = 'Admin Dashboard';

-- Español
INSERT INTO translations (key, language, value)
VALUES ('dashboard.title', 'es', 'Panel de Administración')
ON CONFLICT (key, language) DO UPDATE SET value = 'Panel de Administración';

-- Portugués
INSERT INTO translations (key, language, value)
VALUES ('dashboard.title', 'pt', 'Painel de Administração')
ON CONFLICT (key, language) DO UPDATE SET value = 'Painel de Administração';

-- Subtítulo
INSERT INTO translations (key, language, value)
VALUES ('dashboard.subtitle', 'en', 'Overview of business performance and key metrics')
ON CONFLICT (key, language) DO UPDATE SET value = 'Overview of business performance and key metrics';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.subtitle', 'es', 'Resumen del rendimiento del negocio y métricas clave')
ON CONFLICT (key, language) DO UPDATE SET value = 'Resumen del rendimiento del negocio y métricas clave';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.subtitle', 'pt', 'Visão geral do desempenho do negócio e métricas-chave')
ON CONFLICT (key, language) DO UPDATE SET value = 'Visão geral do desempenho do negócio e métricas-chave';

-- Traducciones para KPI Cards
INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.pipelineValue', 'en', 'Pipeline Value')
ON CONFLICT (key, language) DO UPDATE SET value = 'Pipeline Value';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.pipelineValue', 'es', 'Valor del Pipeline')
ON CONFLICT (key, language) DO UPDATE SET value = 'Valor del Pipeline';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.pipelineValue', 'pt', 'Valor do Pipeline')
ON CONFLICT (key, language) DO UPDATE SET value = 'Valor do Pipeline';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.totalOpportunities', 'en', 'Total opportunities')
ON CONFLICT (key, language) DO UPDATE SET value = 'Total opportunities';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.totalOpportunities', 'es', 'Total de oportunidades')
ON CONFLICT (key, language) DO UPDATE SET value = 'Total de oportunidades';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.totalOpportunities', 'pt', 'Total de oportunidades')
ON CONFLICT (key, language) DO UPDATE SET value = 'Total de oportunidades';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.conversionRate', 'en', 'Conversion Rate')
ON CONFLICT (key, language) DO UPDATE SET value = 'Conversion Rate';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.conversionRate', 'es', 'Tasa de Conversión')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tasa de Conversión';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.conversionRate', 'pt', 'Taxa de Conversão')
ON CONFLICT (key, language) DO UPDATE SET value = 'Taxa de Conversão';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.lastQuarter', 'en', 'Last quarter')
ON CONFLICT (key, language) DO UPDATE SET value = 'Last quarter';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.lastQuarter', 'es', 'Último trimestre')
ON CONFLICT (key, language) DO UPDATE SET value = 'Último trimestre';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.lastQuarter', 'pt', 'Último trimestre')
ON CONFLICT (key, language) DO UPDATE SET value = 'Último trimestre';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.newOpportunities', 'en', 'New Opportunities')
ON CONFLICT (key, language) DO UPDATE SET value = 'New Opportunities';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.newOpportunities', 'es', 'Nuevas Oportunidades')
ON CONFLICT (key, language) DO UPDATE SET value = 'Nuevas Oportunidades';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.newOpportunities', 'pt', 'Novas Oportunidades')
ON CONFLICT (key, language) DO UPDATE SET value = 'Novas Oportunidades';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.closedOpportunities', 'en', 'Closed Opportunities')
ON CONFLICT (key, language) DO UPDATE SET value = 'Closed Opportunities';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.closedOpportunities', 'es', 'Oportunidades Cerradas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Oportunidades Cerradas';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.closedOpportunities', 'pt', 'Oportunidades Fechadas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Oportunidades Fechadas';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.vsLastMonth', 'en', 'vs last month')
ON CONFLICT (key, language) DO UPDATE SET value = 'vs last month';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.vsLastMonth', 'es', 'vs mes anterior')
ON CONFLICT (key, language) DO UPDATE SET value = 'vs mes anterior';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.kpis.vsLastMonth', 'pt', 'vs mês anterior')
ON CONFLICT (key, language) DO UPDATE SET value = 'vs mês anterior';

-- Traducciones para Pipeline Analysis
INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.title', 'en', 'Pipeline Analysis')
ON CONFLICT (key, language) DO UPDATE SET value = 'Pipeline Analysis';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.title', 'es', 'Análisis del Pipeline')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análisis del Pipeline';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.title', 'pt', 'Análise do Pipeline')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análise do Pipeline';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.description', 'en', 'Distribution of opportunities by stage')
ON CONFLICT (key, language) DO UPDATE SET value = 'Distribution of opportunities by stage';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.description', 'es', 'Distribución de oportunidades por etapa')
ON CONFLICT (key, language) DO UPDATE SET value = 'Distribución de oportunidades por etapa';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.description', 'pt', 'Distribuição de oportunidades por estágio')
ON CONFLICT (key, language) DO UPDATE SET value = 'Distribuição de oportunidades por estágio';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.stage', 'en', 'Stage')
ON CONFLICT (key, language) DO UPDATE SET value = 'Stage';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.stage', 'es', 'Etapa')
ON CONFLICT (key, language) DO UPDATE SET value = 'Etapa';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.stage', 'pt', 'Estágio')
ON CONFLICT (key, language) DO UPDATE SET value = 'Estágio';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.count', 'en', 'Count')
ON CONFLICT (key, language) DO UPDATE SET value = 'Count';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.count', 'es', 'Cantidad')
ON CONFLICT (key, language) DO UPDATE SET value = 'Cantidad';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.count', 'pt', 'Quantidade')
ON CONFLICT (key, language) DO UPDATE SET value = 'Quantidade';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.value', 'en', 'Value')
ON CONFLICT (key, language) DO UPDATE SET value = 'Value';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.value', 'es', 'Valor')
ON CONFLICT (key, language) DO UPDATE SET value = 'Valor';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.pipeline.value', 'pt', 'Valor')
ON CONFLICT (key, language) DO UPDATE SET value = 'Valor';

-- Traducciones para Time Analysis
INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.title', 'en', 'Time Analysis')
ON CONFLICT (key, language) DO UPDATE SET value = 'Time Analysis';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.title', 'es', 'Análisis Temporal')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análisis Temporal';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.title', 'pt', 'Análise Temporal')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análise Temporal';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.description', 'en', 'Cycle time and recent activity')
ON CONFLICT (key, language) DO UPDATE SET value = 'Cycle time and recent activity';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.description', 'es', 'Tiempo de ciclo y actividad reciente')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tiempo de ciclo y actividad reciente';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.description', 'pt', 'Tempo de ciclo e atividade recente')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tempo de ciclo e atividade recente';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.avgCycleTime', 'en', 'Average Cycle Time')
ON CONFLICT (key, language) DO UPDATE SET value = 'Average Cycle Time';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.avgCycleTime', 'es', 'Tiempo de Ciclo Promedio')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tiempo de Ciclo Promedio';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.avgCycleTime', 'pt', 'Tempo Médio de Ciclo')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tempo Médio de Ciclo';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.days', 'en', 'days')
ON CONFLICT (key, language) DO UPDATE SET value = 'days';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.days', 'es', 'días')
ON CONFLICT (key, language) DO UPDATE SET value = 'días';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.days', 'pt', 'dias')
ON CONFLICT (key, language) DO UPDATE SET value = 'dias';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.recentActivity', 'en', 'Recent Activity')
ON CONFLICT (key, language) DO UPDATE SET value = 'Recent Activity';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.recentActivity', 'es', 'Actividad Reciente')
ON CONFLICT (key, language) DO UPDATE SET value = 'Actividad Reciente';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.timeAnalysis.recentActivity', 'pt', 'Atividade Recente')
ON CONFLICT (key, language) DO UPDATE SET value = 'Atividade Recente';

-- Traducciones para BDD Performance
INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.title', 'en', 'BDD Performance')
ON CONFLICT (key, language) DO UPDATE SET value = 'BDD Performance';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.title', 'es', 'Rendimiento de BDDs')
ON CONFLICT (key, language) DO UPDATE SET value = 'Rendimiento de BDDs';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.title', 'pt', 'Desempenho dos BDDs')
ON CONFLICT (key, language) DO UPDATE SET value = 'Desempenho dos BDDs';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.description', 'en', 'Performance metrics for business development directors')
ON CONFLICT (key, language) DO UPDATE SET value = 'Performance metrics for business development directors';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.description', 'es', 'Métricas de rendimiento para directores de desarrollo de negocio')
ON CONFLICT (key, language) DO UPDATE SET value = 'Métricas de rendimiento para directores de desarrollo de negocio';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.bddPerformance.description', 'pt', 'Métricas de desempenho para diretores de desenvolvimento de negócios')
ON CONFLICT (key, language) DO UPDATE SET value = 'Métricas de desempenho para diretores de desenvolvimento de negócios';

-- Traducciones para Partners Analysis
INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.title', 'en', 'Partners Analysis')
ON CONFLICT (key, language) DO UPDATE SET value = 'Partners Analysis';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.title', 'es', 'Análisis de Partners')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análisis de Partners';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.title', 'pt', 'Análise de Parceiros')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análise de Parceiros';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.description', 'en', 'Performance metrics for partners')
ON CONFLICT (key, language) DO UPDATE SET value = 'Performance metrics for partners';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.description', 'es', 'Métricas de rendimiento para partners')
ON CONFLICT (key, language) DO UPDATE SET value = 'Métricas de rendimiento para partners';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.partnersAnalysis.description', 'pt', 'Métricas de desempenho para parceiros')
ON CONFLICT (key, language) DO UPDATE SET value = 'Métricas de desempenho para parceiros';

-- Traducciones para Tech Companies Analysis
INSERT INTO translations (key, language, value)
VALUES ('dashboard.techCompaniesAnalysis.title', 'en', 'Tech Companies Analysis')
ON CONFLICT (key, language) DO UPDATE SET value = 'Tech Companies Analysis';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.techCompaniesAnalysis.title', 'es', 'Análisis de Empresas Tech')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análisis de Empresas Tech';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.techCompaniesAnalysis.title', 'pt', 'Análise de Empresas Tech')
ON CONFLICT (key, language) DO UPDATE SET value = 'Análise de Empresas Tech';

-- Traducciones para Action Center
INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.title', 'en', 'Action Center')
ON CONFLICT (key, language) DO UPDATE SET value = 'Action Center';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.title', 'es', 'Centro de Acción')
ON CONFLICT (key, language) DO UPDATE SET value = 'Centro de Acción';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.title', 'pt', 'Centro de Ação')
ON CONFLICT (key, language) DO UPDATE SET value = 'Centro de Ação';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.description', 'en', 'Pending actions and alerts')
ON CONFLICT (key, language) DO UPDATE SET value = 'Pending actions and alerts';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.description', 'es', 'Acciones pendientes y alertas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Acciones pendientes y alertas';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.actionCenter.description', 'pt', 'Ações pendentes e alertas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Ações pendentes e alertas';

-- Traducciones para Dashboard Filters
INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.title', 'en', 'Filters')
ON CONFLICT (key, language) DO UPDATE SET value = 'Filters';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.title', 'es', 'Filtros')
ON CONFLICT (key, language) DO UPDATE SET value = 'Filtros';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.title', 'pt', 'Filtros')
ON CONFLICT (key, language) DO UPDATE SET value = 'Filtros';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.dateRange', 'en', 'Date Range')
ON CONFLICT (key, language) DO UPDATE SET value = 'Date Range';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.dateRange', 'es', 'Rango de Fechas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Rango de Fechas';

INSERT INTO translations (key, language, value)
VALUES ('dashboard.filters.dateRange', 'pt', 'Intervalo de Datas')
ON CONFLICT (key, language) DO UPDATE SET value = 'Intervalo de Datas';

-- Confirmar que se han insertado todas las traducciones
DO $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM translations WHERE key LIKE 'dashboard.%';
  RAISE NOTICE 'Se han insertado o actualizado % traducciones para el dashboard', total_count;
END
$$;
