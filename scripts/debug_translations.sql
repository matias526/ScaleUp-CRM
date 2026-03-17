-- Verificar si existen las traducciones de oportunidades
SELECT * FROM translations 
WHERE key LIKE 'sidebar.opportunities%'
ORDER BY key, language;

-- Contar cuántas traducciones hay para cada idioma
SELECT language, COUNT(*) 
FROM translations 
GROUP BY language;

-- Verificar si hay algún problema con las claves de oportunidades
SELECT key, language, value 
FROM translations 
WHERE key IN (
  'sidebar.opportunities',
  'sidebar.opportunities.list',
  'sidebar.opportunities.create'
);
