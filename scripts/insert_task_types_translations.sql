-- Insert translations for task types menu item
INSERT INTO translations (language_code, translation_key, translation_value)
VALUES 
('en', 'sidebar.tasks', 'Tasks'),
('es', 'sidebar.tasks', 'Tareas'),
('pt', 'sidebar.tasks', 'Tarefas')
ON CONFLICT (language_code, translation_key) 
DO UPDATE SET translation_value = EXCLUDED.translation_value;
