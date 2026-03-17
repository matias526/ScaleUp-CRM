-- Insertar etapas predeterminadas para las oportunidades
INSERT INTO public.opportunity_stages (id, name, order, color)
VALUES 
  (gen_random_uuid(), 'Prospección', 1, '#3498db'),
  (gen_random_uuid(), 'Calificación', 2, '#2ecc71'),
  (gen_random_uuid(), 'Propuesta', 3, '#f39c12'),
  (gen_random_uuid(), 'Negociación', 4, '#e74c3c'),
  (gen_random_uuid(), 'Cerrada Ganada', 5, '#27ae60'),
  (gen_random_uuid(), 'Cerrada Perdida', 6, '#7f8c8d')
ON CONFLICT (name) DO NOTHING;
