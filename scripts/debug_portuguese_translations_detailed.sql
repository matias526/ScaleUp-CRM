-- Verificar qué códigos de idioma existen
SELECT DISTINCT language, COUNT(*) as total_translations
FROM translations 
GROUP BY language 
ORDER BY language;

-- Verificar si existen las traducciones específicas del dashboard en portugués
SELECT key, language, value 
FROM translations 
WHERE language LIKE '%pt%' 
AND key LIKE 'dashboard.kpis.%'
ORDER BY key, language;

-- Verificar todas las variantes de portugués
SELECT key, language, value 
FROM translations 
WHERE language IN ('pt', 'pt-BR', 'pt_BR', 'por') 
AND key = 'dashboard.kpis.pipelineValue'
ORDER BY language;

-- Verificar si el usuario tiene configurado el idioma correcto
SELECT id, email, preferred_language 
FROM users 
WHERE preferred_language LIKE '%pt%';
