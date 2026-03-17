-- Insertar traducciones para Reuniones Internas
INSERT INTO translations (key, language, value) VALUES
-- Títulos principales
('internal_meetings.title', 'es', 'Reuniones Internas'),
('internal_meetings.title', 'en', 'Internal Meetings'),
('internal_meetings.title', 'pt', 'Reuniões Internas'),

('internal_meetings.description', 'es', 'Gestiona las reuniones semanales del equipo'),
('internal_meetings.description', 'en', 'Manage weekly team meetings'),
('internal_meetings.description', 'pt', 'Gerencie reuniões semanais da equipe'),

-- Botones y acciones
('internal_meetings.new_meeting', 'es', 'Nueva Reunión'),
('internal_meetings.new_meeting', 'en', 'New Meeting'),
('internal_meetings.new_meeting', 'pt', 'Nova Reunião'),

('internal_meetings.start_meeting', 'es', 'Iniciar Reunión'),
('internal_meetings.start_meeting', 'en', 'Start Meeting'),
('internal_meetings.start_meeting', 'pt', 'Iniciar Reunião'),

('internal_meetings.edit', 'es', 'Editar'),
('internal_meetings.edit', 'en', 'Edit'),
('internal_meetings.edit', 'pt', 'Editar'),

('internal_meetings.start', 'es', 'Iniciar'),
('internal_meetings.start', 'en', 'Start'),
('internal_meetings.start', 'pt', 'Iniciar'),

-- Secciones
('internal_meetings.next_meeting', 'es', 'Próxima Reunión'),
('internal_meetings.next_meeting', 'en', 'Next Meeting'),
('internal_meetings.next_meeting', 'pt', 'Próxima Reunião'),

('internal_meetings.stats', 'es', 'Estadísticas'),
('internal_meetings.stats', 'en', 'Statistics'),
('internal_meetings.stats', 'pt', 'Estatísticas'),

('internal_meetings.recent', 'es', 'Reuniones Recientes'),
('internal_meetings.recent', 'en', 'Recent Meetings'),
('internal_meetings.recent', 'pt', 'Reuniões Recentes'),

('internal_meetings.recent_description', 'es', 'Historial de las últimas reuniones del equipo'),
('internal_meetings.recent_description', 'en', 'History of the latest team meetings'),
('internal_meetings.recent_description', 'pt', 'Histórico das últimas reuniões da equipe'),

-- Estados
('internal_meetings.status.scheduled', 'es', 'Programada'),
('internal_meetings.status.scheduled', 'en', 'Scheduled'),
('internal_meetings.status.scheduled', 'pt', 'Agendada'),

('internal_meetings.status.in_progress', 'es', 'En Progreso'),
('internal_meetings.status.in_progress', 'en', 'In Progress'),
('internal_meetings.status.in_progress', 'pt', 'Em Andamento'),

('internal_meetings.status.completed', 'es', 'Completada'),
('internal_meetings.status.completed', 'en', 'Completed'),
('internal_meetings.status.completed', 'pt', 'Concluída'),

-- Campos
('internal_meetings.date', 'es', 'Fecha'),
('internal_meetings.date', 'en', 'Date'),
('internal_meetings.date', 'pt', 'Data'),

('internal_meetings.topic', 'es', 'Tema'),
('internal_meetings.topic', 'en', 'Topic'),
('internal_meetings.topic', 'pt', 'Tópico'),

-- Estadísticas
('internal_meetings.total_meetings', 'es', 'Total de Reuniones'),
('internal_meetings.total_meetings', 'en', 'Total Meetings'),
('internal_meetings.total_meetings', 'pt', 'Total de Reuniões'),

('internal_meetings.completed', 'es', 'Completadas'),
('internal_meetings.completed', 'en', 'Completed'),
('internal_meetings.completed', 'pt', 'Concluídas'),

('internal_meetings.scheduled', 'es', 'Programadas'),
('internal_meetings.scheduled', 'en', 'Scheduled'),
('internal_meetings.scheduled', 'pt', 'Agendadas'),

-- Mensajes vacíos
('internal_meetings.no_scheduled', 'es', 'No hay reuniones programadas'),
('internal_meetings.no_scheduled', 'en', 'No scheduled meetings'),
('internal_meetings.no_scheduled', 'pt', 'Nenhuma reunião agendada'),

('internal_meetings.schedule_first', 'es', 'Programar Primera Reunión'),
('internal_meetings.schedule_first', 'en', 'Schedule First Meeting'),
('internal_meetings.schedule_first', 'pt', 'Agendar Primeira Reunião'),

('internal_meetings.no_meetings', 'es', 'No hay reuniones registradas'),
('internal_meetings.no_meetings', 'en', 'No meetings registered'),
('internal_meetings.no_meetings', 'pt', 'Nenhuma reunião registrada'),

-- Sidebar
('sidebar.internal_meetings', 'es', 'Reuniones Internas'),
('sidebar.internal_meetings', 'en', 'Internal Meetings'),
('sidebar.internal_meetings', 'pt', 'Reuniões Internas')

ON CONFLICT (key, language) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = CURRENT_TIMESTAMP;
