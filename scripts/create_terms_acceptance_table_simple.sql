-- Crear tabla para registrar la aceptación de términos y condiciones (versión simple)
CREATE TABLE IF NOT EXISTS public.user_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    
    -- Restricción única para evitar duplicados
    CONSTRAINT unique_user_terms_version UNIQUE (user_id, terms_version)
);

-- Permisos RLS
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas
CREATE POLICY "Usuarios autenticados pueden ver su propia aceptación"
    ON public.user_terms_acceptance
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuarios autenticados pueden insertar su propia aceptación"
    ON public.user_terms_acceptance
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Esta política permite a todos los usuarios autenticados ver todas las aceptaciones
-- Puedes eliminar esta política si no es necesaria
CREATE POLICY "Todos los usuarios autenticados pueden ver todas las aceptaciones"
    ON public.user_terms_acceptance
    FOR SELECT
    USING (auth.role() = 'authenticated');
