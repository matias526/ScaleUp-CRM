-- Insertar traducciones para el centro de acciones del dashboard de admin
INSERT INTO translations (key, language, value) VALUES
-- Español
('admin.dashboard.actionCenter.title', 'es', 'Centro de Acciones'),
('admin.dashboard.actionCenter.noActions', 'es', '¡Excelente! No hay acciones pendientes'),
('admin.dashboard.actionCenter.itemsRequireAttention', 'es', 'elementos requieren atención'),

-- Inglés
('admin.dashboard.actionCenter.title', 'en', 'Action Center'),
('admin.dashboard.actionCenter.noActions', 'en', 'Excellent! No pending actions'),
('admin.dashboard.actionCenter.itemsRequireAttention', 'en', 'items require attention'),

-- Portugués
('admin.dashboard.actionCenter.title', 'pt', 'Centro de Ações'),
('admin.dashboard.actionCenter.noActions', 'pt', 'Excelente! Não há ações pendentes'),
('admin.dashboard.actionCenter.itemsRequireAttention', 'pt', 'itens requerem atenção')

ON CONFLICT (key, language) DO UPDATE SET
value = EXCLUDED.value,
updated_at = CURRENT_TIMESTAMP;
