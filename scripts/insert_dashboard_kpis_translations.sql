-- Insertar traducciones para dashboard.kpis en español
INSERT INTO translations (key, language, value)
VALUES 
  ('dashboard.kpis.pipelineValue', 'es', 'Valor del Pipeline'),
  ('dashboard.kpis.totalOpportunities', 'es', 'Oportunidades Totales'),
  ('dashboard.kpis.conversionRate', 'es', 'Tasa de Conversión'),
  ('dashboard.kpis.lastQuarter', 'es', 'Último Trimestre'),
  ('dashboard.kpis.newOpportunities', 'es', 'Nuevas Oportunidades'),
  ('dashboard.pipeline.title', 'es', 'Análisis de Pipeline'),
  ('dashboard.pipeline.description', 'es', 'Distribución de oportunidades por etapa'),
  ('dashboard.pipeline.stage', 'es', 'Etapa'),
  ('dashboard.pipeline.count', 'es', 'Cantidad'),
  ('dashboard.pipeline.value', 'es', 'Valor')
ON CONFLICT (key, language) DO UPDATE
SET value = EXCLUDED.value;

-- Insertar traducciones para dashboard.kpis en inglés
INSERT INTO translations (key, language, value)
VALUES 
  ('dashboard.kpis.pipelineValue', 'en', 'Pipeline Value'),
  ('dashboard.kpis.totalOpportunities', 'en', 'Total Opportunities'),
  ('dashboard.kpis.conversionRate', 'en', 'Conversion Rate'),
  ('dashboard.kpis.lastQuarter', 'en', 'Last Quarter'),
  ('dashboard.kpis.newOpportunities', 'en', 'New Opportunities'),
  ('dashboard.pipeline.title', 'en', 'Pipeline Analysis'),
  ('dashboard.pipeline.description', 'en', 'Distribution of opportunities by stage'),
  ('dashboard.pipeline.stage', 'en', 'Stage'),
  ('dashboard.pipeline.count', 'en', 'Count'),
  ('dashboard.pipeline.value', 'en', 'Value')
ON CONFLICT (key, language) DO UPDATE
SET value = EXCLUDED.value;

-- Insertar traducciones para dashboard.kpis en portugués
INSERT INTO translations (key, language, value)
VALUES 
  ('dashboard.kpis.pipelineValue', 'pt', 'Valor do Pipeline'),
  ('dashboard.kpis.totalOpportunities', 'pt', 'Oportunidades Totais'),
  ('dashboard.kpis.conversionRate', 'pt', 'Taxa de Conversão'),
  ('dashboard.kpis.lastQuarter', 'pt', 'Último Trimestre'),
  ('dashboard.kpis.newOpportunities', 'pt', 'Novas Oportunidades'),
  ('dashboard.pipeline.title', 'pt', 'Análise de Pipeline'),
  ('dashboard.pipeline.description', 'pt', 'Distribuição de oportunidades por etapa'),
  ('dashboard.pipeline.stage', 'pt', 'Etapa'),
  ('dashboard.pipeline.count', 'pt', 'Quantidade'),
  ('dashboard.pipeline.value', 'pt', 'Valor')
ON CONFLICT (key, language) DO UPDATE
SET value = EXCLUDED.value;
