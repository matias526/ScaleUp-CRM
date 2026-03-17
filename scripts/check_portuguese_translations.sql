-- Verificar cuántas traducciones hay para cada idioma
SELECT language, COUNT(*) as translation_count
FROM translations
GROUP BY language
ORDER BY translation_count DESC;

-- Verificar si hay traducciones en portugués
SELECT COUNT(*) as portuguese_translations
FROM translations
WHERE language = 'pt';

-- Verificar las primeras 10 traducciones en portugués (si existen)
SELECT key, value
FROM translations
WHERE language = 'pt'
LIMIT 10;

-- Verificar claves que existen en español pero no en portugués
SELECT es.key
FROM translations es
LEFT JOIN translations pt ON es.key = pt.key AND pt.language = 'pt'
WHERE es.language = 'es' AND pt.key IS NULL;
