-- Verificar las traducciones del sidebar
SELECT * FROM translations 
WHERE key LIKE 'sidebar.%'
ORDER BY language, key;
