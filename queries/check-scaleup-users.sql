-- Verificar si existen usuarios de ScaleUp
SELECT id, first_name, last_name, email, role_id, is_active
FROM public.users
WHERE role_id IN (SELECT id FROM public.roles WHERE code IN ('Admin', 'BDD', 'TechUser'))
AND is_active = TRUE;

-- Contar usuarios de ScaleUp
SELECT COUNT(*) FROM public.users
WHERE role_id IN (SELECT id FROM public.roles WHERE code IN ('Admin', 'BDD', 'TechUser'))
AND is_active = TRUE;
