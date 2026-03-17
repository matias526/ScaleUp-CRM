-- Verificar si la tabla notes existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'notes'
);

-- Verificar si la tabla opportunity_notes existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'opportunity_notes'
);

-- Si la tabla notes existe, verificar su estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'notes';

-- Si la tabla opportunity_notes existe, verificar su estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'opportunity_notes';
