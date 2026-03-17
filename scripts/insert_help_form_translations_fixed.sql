-- Verificar si ya existen las traducciones
DO $$
BEGIN
    -- Español
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.title' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.title', 'es', 'Formulario de Ayuda');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subject' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subject', 'es', 'Tema');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subjectPlaceholder' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subjectPlaceholder', 'es', 'Ingrese el tema de su consulta');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.comment' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.comment', 'es', 'Comentario');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.commentPlaceholder' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.commentPlaceholder', 'es', 'Describa su consulta o problema');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.send' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.send', 'es', 'Enviar');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.sending' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.sending', 'es', 'Enviando...');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.success' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.success', 'es', 'Solicitud enviada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.successMessage' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.successMessage', 'es', 'Su solicitud de ayuda ha sido enviada correctamente. Nos pondremos en contacto con usted lo antes posible.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.error' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.error', 'es', 'Error');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.errorMessage' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.errorMessage', 'es', 'Ha ocurrido un error al enviar su solicitud. Por favor, inténtelo de nuevo más tarde.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.fieldsRequired' AND language = 'es') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.fieldsRequired', 'es', 'Todos los campos son obligatorios');
    END IF;
    
    -- English
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.title' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.title', 'en', 'Help Form');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subject' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subject', 'en', 'Subject');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subjectPlaceholder' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subjectPlaceholder', 'en', 'Enter the subject of your inquiry');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.comment' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.comment', 'en', 'Comment');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.commentPlaceholder' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.commentPlaceholder', 'en', 'Describe your inquiry or issue');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.send' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.send', 'en', 'Send');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.sending' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.sending', 'en', 'Sending...');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.success' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.success', 'en', 'Request Sent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.successMessage' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.successMessage', 'en', 'Your help request has been successfully sent. We will contact you as soon as possible.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.error' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.error', 'en', 'Error');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.errorMessage' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.errorMessage', 'en', 'An error occurred while sending your request. Please try again later.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.fieldsRequired' AND language = 'en') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.fieldsRequired', 'en', 'All fields are required');
    END IF;
    
    -- Portuguese
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.title' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.title', 'pt', 'Formulário de Ajuda');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subject' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subject', 'pt', 'Assunto');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.subjectPlaceholder' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.subjectPlaceholder', 'pt', 'Digite o assunto da sua consulta');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.comment' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.comment', 'pt', 'Comentário');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.commentPlaceholder' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.commentPlaceholder', 'pt', 'Descreva sua consulta ou problema');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.send' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.send', 'pt', 'Enviar');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.sending' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.sending', 'pt', 'Enviando...');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.success' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.success', 'pt', 'Solicitação Enviada');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.successMessage' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.successMessage', 'pt', 'Sua solicitação de ajuda foi enviada com sucesso. Entraremos em contato o mais breve possível.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.error' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.error', 'pt', 'Erro');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.errorMessage' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.errorMessage', 'pt', 'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente mais tarde.');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM translations WHERE key = 'help.form.fieldsRequired' AND language = 'pt') THEN
        INSERT INTO translations (key, language, value) VALUES ('help.form.fieldsRequired', 'pt', 'Todos os campos são obrigatórios');
    END IF;
END $$;

-- Mostrar las traducciones insertadas
SELECT key, language, value FROM translations WHERE key LIKE 'help.form.%' ORDER BY language, key;
