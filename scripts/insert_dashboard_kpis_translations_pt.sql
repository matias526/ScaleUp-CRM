-- Insertar traducciones del dashboard en portugués
INSERT INTO translations (key, language, value) VALUES
-- KPIs del Dashboard
('dashboard.kpis.pipelineValue', 'pt', 'Valor do Pipeline'),
('dashboard.kpis.totalOpportunities', 'pt', 'Total de Oportunidades'),
('dashboard.kpis.conversionRate', 'pt', 'Taxa de Conversão'),
('dashboard.kpis.averageDealSize', 'pt', 'Tamanho Médio do Negócio'),
('dashboard.kpis.activeTasks', 'pt', 'Tarefas Ativas'),
('dashboard.kpis.upcomingMeetings', 'pt', 'Reuniões Próximas'),

-- Títulos del Dashboard
('dashboard.title', 'pt', 'Painel Administrativo'),
('dashboard.pipeline.title', 'pt', 'Análise do Pipeline'),
('dashboard.pipeline.description', 'pt', 'Visão geral das oportunidades por estágio'),
('dashboard.recentActivity.title', 'pt', 'Atividade Recente'),
('dashboard.topPartners.title', 'pt', 'Principais Parceiros'),
('dashboard.performance.title', 'pt', 'Desempenho'),

-- Análisis del Pipeline
('dashboard.pipeline.stage.lead', 'pt', 'Lead'),
('dashboard.pipeline.stage.qualified', 'pt', 'Qualificado'),
('dashboard.pipeline.stage.proposal', 'pt', 'Proposta'),
('dashboard.pipeline.stage.negotiation', 'pt', 'Negociação'),
('dashboard.pipeline.stage.closed_won', 'pt', 'Fechado Ganho'),
('dashboard.pipeline.stage.closed_lost', 'pt', 'Fechado Perdido'),

-- Filtros del Dashboard
('dashboard.filters.title', 'pt', 'Filtros'),
('dashboard.filters.dateRange', 'pt', 'Período'),
('dashboard.filters.partner', 'pt', 'Parceiro'),
('dashboard.filters.stage', 'pt', 'Estágio'),
('dashboard.filters.apply', 'pt', 'Aplicar'),
('dashboard.filters.clear', 'pt', 'Limpar'),

-- Acciones del Dashboard
('dashboard.actions.title', 'pt', 'Centro de Ações'),
('dashboard.actions.createOpportunity', 'pt', 'Criar Oportunidade'),
('dashboard.actions.addPartner', 'pt', 'Adicionar Parceiro'),
('dashboard.actions.scheduleTask', 'pt', 'Agendar Tarefa'),
('dashboard.actions.viewReports', 'pt', 'Ver Relatórios'),

-- Análisis de Tiempo
('dashboard.timeAnalysis.title', 'pt', 'Análise de Tempo'),
('dashboard.timeAnalysis.averageTimeToClose', 'pt', 'Tempo Médio para Fechar'),
('dashboard.timeAnalysis.days', 'pt', 'dias'),

-- Análisis de Partners
('dashboard.partnersAnalysis.title', 'pt', 'Análise de Parceiros'),
('dashboard.partnersAnalysis.topPerformers', 'pt', 'Melhores Desempenhos'),
('dashboard.partnersAnalysis.opportunities', 'pt', 'oportunidades'),

-- Análisis de Tech Companies
('dashboard.techCompaniesAnalysis.title', 'pt', 'Análise de Empresas de Tecnologia'),
('dashboard.techCompaniesAnalysis.mostActive', 'pt', 'Mais Ativas'),

-- BDD Dashboard específico
('dashboard.bdd.title', 'pt', 'Painel BDD'),
('dashboard.bdd.upcomingActivities', 'pt', 'Atividades Próximas'),
('dashboard.bdd.opportunitiesAtRisk', 'pt', 'Oportunidades em Risco'),
('dashboard.bdd.partnersPerformance', 'pt', 'Desempenho dos Parceiros'),

-- Métricas generales
('dashboard.metrics.total', 'pt', 'Total'),
('dashboard.metrics.active', 'pt', 'Ativo'),
('dashboard.metrics.pending', 'pt', 'Pendente'),
('dashboard.metrics.completed', 'pt', 'Concluído'),
('dashboard.metrics.overdue', 'pt', 'Atrasado'),

-- Estados y acciones
('dashboard.loading', 'pt', 'Carregando...'),
('dashboard.noData', 'pt', 'Nenhum dado disponível'),
('dashboard.error', 'pt', 'Erro ao carregar dados'),
('dashboard.refresh', 'pt', 'Atualizar'),
('dashboard.export', 'pt', 'Exportar'),
('dashboard.viewAll', 'pt', 'Ver Todos')

ON CONFLICT (key, language) DO UPDATE SET value = EXCLUDED.value;
