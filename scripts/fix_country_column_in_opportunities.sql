-- Verificar si la columna country ya existe
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'country'
    ) INTO column_exists;

    IF column_exists THEN
        -- La columna ya existe, modificarla para asegurar que acepta códigos de país
        EXECUTE 'ALTER TABLE opportunities ALTER COLUMN country TYPE VARCHAR(100)';
        RAISE NOTICE 'La columna country ha sido modificada para aceptar códigos de país';
    ELSE
        -- La columna no existe, crearla
        EXECUTE 'ALTER TABLE opportunities ADD COLUMN country VARCHAR(100)';
        RAISE NOTICE 'La columna country ha sido creada';
    END IF;
    
    -- Añadir comentario a la columna
    EXECUTE 'COMMENT ON COLUMN opportunities.country IS ''Código del país al que pertenece la oportunidad''';
END $$;

-- Verificar si existe la tabla partner_countries
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'partner_countries'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Crear tabla de relación entre partners y países
        CREATE TABLE partner_countries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
            country_id UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(partner_id, country_id)
        );
        
        RAISE NOTICE 'La tabla partner_countries ha sido creada';
    ELSE
        RAISE NOTICE 'La tabla partner_countries ya existe';
    END IF;
END $$;

-- Verificar si existe la tabla countries
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'countries'
    ) INTO table_exists;

    IF NOT table_exists THEN
        -- Crear tabla de países
        CREATE TABLE countries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(100) NOT NULL,
            code VARCHAR(10) NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insertar países de Latinoamérica y España
        INSERT INTO countries (name, code) VALUES
            ('Argentina', 'argentina'),
            ('Bolivia', 'bolivia'),
            ('Brasil', 'brasil'),
            ('Chile', 'chile'),
            ('Colombia', 'colombia'),
            ('Costa Rica', 'costa_rica'),
            ('Cuba', 'cuba'),
            ('Ecuador', 'ecuador'),
            ('El Salvador', 'el_salvador'),
            ('Guatemala', 'guatemala'),
            ('Honduras', 'honduras'),
            ('México', 'mexico'),
            ('Nicaragua', 'nicaragua'),
            ('Panamá', 'panama'),
            ('Paraguay', 'paraguay'),
            ('Perú', 'peru'),
            ('República Dominicana', 'republica_dominicana'),
            ('Uruguay', 'uruguay'),
            ('Venezuela', 'venezuela'),
            ('España', 'espana'),
            ('Estados Unidos', 'estados_unidos'),
            ('Otro', 'otro');
            
        RAISE NOTICE 'La tabla countries ha sido creada y poblada con datos iniciales';
    ELSE
        RAISE NOTICE 'La tabla countries ya existe';
    END IF;
END $$;

-- Verificar si existe la columna assigned_to en opportunities
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'opportunities' AND column_name = 'assigned_to'
    ) INTO column_exists;

    IF NOT column_exists THEN
        -- Añadir columna assigned_to
        EXECUTE 'ALTER TABLE opportunities ADD COLUMN assigned_to UUID REFERENCES users(id)';
        -- Actualizar oportunidades existentes para asignarlas a quien las creó
        EXECUTE 'UPDATE opportunities SET assigned_to = created_by WHERE assigned_to IS NULL';
        RAISE NOTICE 'La columna assigned_to ha sido creada y actualizada';
    ELSE
        RAISE NOTICE 'La columna assigned_to ya existe';
    END IF;
END $$;
