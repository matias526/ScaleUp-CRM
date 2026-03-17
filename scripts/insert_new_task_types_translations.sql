-- Insertar traducciones para los nuevos tipos de tareas
INSERT INTO translations (key, language, value) VALUES
-- Español
('task_type.follow_up_call', 'es', 'Llamada de seguimiento'),
('task_type.demo_preparation', 'es', 'Preparación de demo'),
('task_type.proposal_review', 'es', 'Revisión de propuesta'),
('task_type.contract_negotiation', 'es', 'Negociación de contrato'),
('task_type.technical_meeting', 'es', 'Reunión técnica'),
('task_type.client_visit', 'es', 'Visita al cliente'),
('task_type.documentation', 'es', 'Documentación'),
('task_type.training', 'es', 'Capacitación'),

-- Inglés
('task_type.follow_up_call', 'en', 'Follow-up Call'),
('task_type.demo_preparation', 'en', 'Demo Preparation'),
('task_type.proposal_review', 'en', 'Proposal Review'),
('task_type.contract_negotiation', 'en', 'Contract Negotiation'),
('task_type.technical_meeting', 'en', 'Technical Meeting'),
('task_type.client_visit', 'en', 'Client Visit'),
('task_type.documentation', 'en', 'Documentation'),
('task_type.training', 'en', 'Training'),

-- Portugués
('task_type.follow_up_call', 'pt', 'Chamada de acompanhamento'),
('task_type.demo_preparation', 'pt', 'Preparação de demonstração'),
('task_type.proposal_review', 'pt', 'Revisão de proposta'),
('task_type.contract_negotiation', 'pt', 'Negociação de contrato'),
('task_type.technical_meeting', 'pt', 'Reunião técnica'),
('task_type.client_visit', 'pt', 'Visita ao cliente'),
('task_type.documentation', 'pt', 'Documentação'),
('task_type.training', 'pt', 'Treinamento')

ON CONFLICT (key, language) DO UPDATE SET
value = EXCLUDED.value;
