-- Verificar si ya existen las traducciones
DO $$
DECLARE
    translation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO translation_count FROM translations 
    WHERE key LIKE 'help.form.%';
    
    IF translation_count = 0 THEN
        -- Insertar traducciones en español
        INSERT INTO translations (key, language, value) VALUES
        ('help.form.title', 'es', 'Solicitar Ayuda'),
        ('help.form.subject', 'es', 'Tema'),
        ('help.form.subjectPlaceholder', 'es', 'Escribe el tema de tu consulta'),
        ('help.form.comment', 'es', 'Comentario'),
        ('help.form.commentPlaceholder', 'es', 'Describe tu consulta o problema en detalle'),
        ('help.form.send', 'es', 'Enviar'),
        ('help.form.sending', 'es', 'Enviando...'),
        ('help.form.success', 'es', 'Solicitud enviada'),
        ('help.form.successMessage', 'es', 'Tu solicitud de ayuda ha sido enviada correctamente. Te responderemos lo antes posible.'),
        ('help.form.error', 'es', 'Error'),
        ('help.form.errorMessage', 'es', 'Ha ocurrido un error al enviar tu solicitud. Por favor, inténtalo de nuevo más tarde.'),
        ('help.form.fieldsRequired', 'es', 'Todos los campos son obligatorios');

        -- Insertar traducciones en inglés
        INSERT INTO translations (key, language, value) VALUES
        ('help.form.title', 'en', 'Request Help'),
        ('help.form.subject', 'en', 'Subject'),
        ('help.form.subjectPlaceholder', 'en', 'Enter the subject of your inquiry'),
        ('help.form.comment', 'en', 'Comment'),
        ('help.form.commentPlaceholder', 'en', 'Describe your inquiry or issue in detail'),
        ('help.form.send', 'en', 'Send'),
        ('help.form.sending', 'en', 'Sending...'),
        ('help.form.success', 'en', 'Request Sent'),
        ('help.form.successMessage', 'en', 'Your help request has been sent successfully. We will respond as soon as possible.'),
        ('help.form.error', 'en', 'Error'),
        ('help.form.errorMessage', 'en', 'An error occurred while sending your request. Please try again later.'),
        ('help.form.fieldsRequired', 'en', 'All fields are required');

        -- Insertar traducciones en portugués
        INSERT INTO translations (key, language, value) VALUES
        ('help.form.title', 'pt', 'Solicitar Ajuda'),
        ('help.form.subject', 'pt', 'Assunto'),
        ('help.form.subjectPlaceholder', 'pt', 'Digite o assunto da sua consulta'),
        ('help.form.comment', 'pt', 'Comentário'),
        ('help.form.commentPlaceholder', 'pt', 'Descreva sua consulta ou problema em detalhes'),
        ('help.form.send', 'pt', 'Enviar'),
        ('help.form.sending', 'pt', 'Enviando...'),
        ('help.form.success', 'pt', 'Solicitação Enviada'),
        ('help.form.successMessage', 'pt', 'Sua solicitação de ajuda foi enviada com sucesso. Responderemos o mais breve possível.'),
        ('help.form.error', 'pt', 'Erro'),
        ('help.form.errorMessage', 'pt', 'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente mais tarde.'),
        ('help.form.fieldsRequired', 'pt', 'Todos os campos são obrigatórios');
        
        RAISE NOTICE 'Traducciones para el formulario de ayuda insertadas correctamente';
    ELSE
        RAISE NOTICE 'Las traducciones para el formulario de ayuda ya existen';
    END IF;
END $$;

-- Mostrar las traducciones insertadas
SELECT key, language, value FROM translations WHERE key LIKE 'help.form.%' ORDER BY key, language;
