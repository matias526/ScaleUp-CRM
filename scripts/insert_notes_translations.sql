-- Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'translations') THEN
        RAISE NOTICE 'La tabla translations no existe. Saltando inserción de traducciones.';
        RETURN;
    END IF;

    -- Insertar traducciones para notas en español
    INSERT INTO translations (language, key, value)
    VALUES
        ('es', 'notes.historyTitle', 'Reseña Histórica'),
        ('es', 'notes.addEntry', 'Agregar entrada'),
        ('es', 'notes.noEntries', 'No hay entradas en la reseña histórica'),
        ('es', 'notes.beFirst', 'Sé el primero en agregar una entrada'),
        ('es', 'notes.showMore', 'Mostrar más'),
        ('es', 'notes.showLess', 'Mostrar menos'),
        ('es', 'notes.showMoreContent', 'Mostrar más'),
        ('es', 'notes.remaining', 'restantes'),
        ('es', 'notes.today', 'Hoy'),
        ('es', 'notes.yesterday', 'Ayer'),
        ('es', 'notes.daysAgo', 'días atrás'),
        ('es', 'notes.unknownDate', 'Fecha desconocida'),
        ('es', 'notes.privateNote', 'Nota privada (solo visible para ScaleUp)')
    ON CONFLICT (language, key) 
    DO UPDATE SET value = EXCLUDED.value;

    -- Insertar traducciones para notas en inglés
    INSERT INTO translations (language, key, value)
    VALUES
        ('en', 'notes.historyTitle', 'Historical Review'),
        ('en', 'notes.addEntry', 'Add entry'),
        ('en', 'notes.noEntries', 'No entries in the historical review'),
        ('en', 'notes.beFirst', 'Be the first to add an entry'),
        ('en', 'notes.showMore', 'Show more'),
        ('en', 'notes.showLess', 'Show less'),
        ('en', 'notes.showMoreContent', 'Show more'),
        ('en', 'notes.remaining', 'remaining'),
        ('en', 'notes.today', 'Today'),
        ('en', 'notes.yesterday', 'Yesterday'),
        ('en', 'notes.daysAgo', 'days ago'),
        ('en', 'notes.unknownDate', 'Unknown date'),
        ('en', 'notes.privateNote', 'Private note (only visible to ScaleUp)')
    ON CONFLICT (language, key) 
    DO UPDATE SET value = EXCLUDED.value;

    RAISE NOTICE 'Traducciones de notas insertadas correctamente.';
END $$;
