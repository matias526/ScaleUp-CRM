-- Tabla para almacenar credenciales de email conectadas por usuario
CREATE TABLE user_email_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'gmail', 'outlook', etc.
    access_token VARCHAR(2048),
    refresh_token VARCHAR(2048),
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_connected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, email)
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_user_email_integrations_user_id ON user_email_integrations(user_id);
CREATE INDEX idx_user_email_integrations_email ON user_email_integrations(email);
