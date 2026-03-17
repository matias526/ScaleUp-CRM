-- Crear tabla para registrar la aceptación de términos y condiciones
CREATE TABLE IF NOT EXISTS public.user_terms_acceptance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    terms_version VARCHAR(50) NOT NULL DEFAULT '1.0',
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address VARCHAR(50),
    
    -- Restricción única para evitar duplicados
    CONSTRAINT unique_user_terms_version UNIQUE (user_id, terms_version)
);

-- Comentarios de la tabla
COMMENT ON TABLE public.user_terms_acceptance IS 'Registra la aceptación de términos y condiciones por parte de los usuarios';
COMMENT ON COLUMN public.user_terms_acceptance.user_id IS 'ID del usuario que aceptó los términos';
COMMENT ON COLUMN public.user_terms_acceptance.terms_version IS 'Versión de los términos y condiciones aceptados';
COMMENT ON COLUMN public.user_terms_acceptance.accepted_at IS 'Fecha y hora en que se aceptaron los términos';
COMMENT ON COLUMN public.user_terms_acceptance.ip_address IS 'Dirección IP desde donde se aceptaron los términos';

-- Permisos RLS
ALTER TABLE public.user_terms_acceptance ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Los usuarios pueden ver su propia aceptación de términos"
    ON public.user_terms_acceptance
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden insertar su propia aceptación de términos"
    ON public.user_terms_acceptance
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para administradores (usando user_role en lugar de role)
CREATE POLICY "Los administradores pueden ver todas las aceptaciones de términos"
    ON public.user_terms_acceptance
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.user_role = 'Admin'
        )
    );
