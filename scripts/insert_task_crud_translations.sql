-- Insert translations for task CRUD operations
DO $$
DECLARE
  languages TEXT[] := ARRAY['en', 'es', 'pt'];
  lang TEXT;
BEGIN
  FOREACH lang IN ARRAY languages
  LOOP
    -- Tasks page
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.title' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.title', lang, CASE 
          WHEN lang = 'es' THEN 'Tareas'
          WHEN lang = 'pt' THEN 'Tarefas'
          ELSE 'Tasks'
        END);
    END IF;

    -- Task form
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.create.title' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.create.title', lang, CASE 
          WHEN lang = 'es' THEN 'Crear Nueva Tarea'
          WHEN lang = 'pt' THEN 'Criar Nova Tarefa'
          ELSE 'Create New Task'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.form.title' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.form.title', lang, CASE 
          WHEN lang = 'es' THEN 'Título'
          WHEN lang = 'pt' THEN 'Título'
          ELSE 'Title'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.form.description' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.form.description', lang, CASE 
          WHEN lang = 'es' THEN 'Descripción'
          WHEN lang = 'pt' THEN 'Descrição'
          ELSE 'Description'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.form.status' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.form.status', lang, CASE 
          WHEN lang = 'es' THEN 'Estado'
          WHEN lang = 'pt' THEN 'Status'
          ELSE 'Status'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.form.dueDate' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.form.dueDate', lang, CASE 
          WHEN lang = 'es' THEN 'Fecha de Vencimiento'
          WHEN lang = 'pt' THEN 'Data de Vencimento'
          ELSE 'Due Date'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.form.taskType' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.form.taskType', lang, CASE 
          WHEN lang = 'es' THEN 'Tipo de Tarea'
          WHEN lang = 'pt' THEN 'Tipo de Tarefa'
          ELSE 'Task Type'
        END);
    END IF;

    -- Task status options
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.status.pending' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.status.pending', lang, CASE 
          WHEN lang = 'es' THEN 'Pendiente'
          WHEN lang = 'pt' THEN 'Pendente'
          ELSE 'Pending'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.status.inProgress' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.status.inProgress', lang, CASE 
          WHEN lang = 'es' THEN 'En Progreso'
          WHEN lang = 'pt' THEN 'Em Andamento'
          ELSE 'In Progress'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.status.completed' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.status.completed', lang, CASE 
          WHEN lang = 'es' THEN 'Completada'
          WHEN lang = 'pt' THEN 'Concluída'
          ELSE 'Completed'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.status.cancelled' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.status.cancelled', lang, CASE 
          WHEN lang = 'es' THEN 'Cancelada'
          WHEN lang = 'pt' THEN 'Cancelada'
          ELSE 'Cancelled'
        END);
    END IF;

    -- Buttons
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.button.create' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.button.create', lang, CASE 
          WHEN lang = 'es' THEN 'Crear Tarea'
          WHEN lang = 'pt' THEN 'Criar Tarefa'
          ELSE 'Create Task'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.button.cancel' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.button.cancel', lang, CASE 
          WHEN lang = 'es' THEN 'Cancelar'
          WHEN lang = 'pt' THEN 'Cancelar'
          ELSE 'Cancel'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.button.newTask' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.button.newTask', lang, CASE 
          WHEN lang = 'es' THEN 'Nueva Tarea'
          WHEN lang = 'pt' THEN 'Nova Tarefa'
          ELSE 'New Task'
        END);
    END IF;

    -- Table columns
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.title' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.title', lang, CASE 
          WHEN lang = 'es' THEN 'Título'
          WHEN lang = 'pt' THEN 'Título'
          ELSE 'Title'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.status' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.status', lang, CASE 
          WHEN lang = 'es' THEN 'Estado'
          WHEN lang = 'pt' THEN 'Status'
          ELSE 'Status'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.dueDate' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.dueDate', lang, CASE 
          WHEN lang = 'es' THEN 'Fecha de Vencimiento'
          WHEN lang = 'pt' THEN 'Data de Vencimento'
          ELSE 'Due Date'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.assignedTo' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.assignedTo', lang, CASE 
          WHEN lang = 'es' THEN 'Asignado A'
          WHEN lang = 'pt' THEN 'Atribuído A'
          ELSE 'Assigned To'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.relatedTo' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.relatedTo', lang, CASE 
          WHEN lang = 'es' THEN 'Relacionado Con'
          WHEN lang = 'pt' THEN 'Relacionado A'
          ELSE 'Related To'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.noTasks' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.noTasks', lang, CASE 
          WHEN lang = 'es' THEN 'No se encontraron tareas'
          WHEN lang = 'pt' THEN 'Nenhuma tarefa encontrada'
          ELSE 'No tasks found'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.unassigned' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.unassigned', lang, CASE 
          WHEN lang = 'es' THEN 'Sin asignar'
          WHEN lang = 'pt' THEN 'Não atribuído'
          ELSE 'Unassigned'
        END);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'tasks.table.noDueDate' AND language = lang) THEN
      INSERT INTO translations (key, language, value) VALUES 
        ('tasks.table.noDueDate', lang, CASE 
          WHEN lang = 'es' THEN 'Sin fecha de vencimiento'
          WHEN lang = 'pt' THEN 'Sem data de vencimento'
          ELSE 'No due date'
        END);
    END IF;

  END LOOP;
END $$;
