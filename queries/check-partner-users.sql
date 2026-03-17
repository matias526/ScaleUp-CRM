-- Reemplaza 'your_partner_id' con el ID del partner que estás probando
SELECT id, first_name, last_name, email, role_id, is_active
FROM public.users
WHERE partner_id = 'your_partner_id'
AND is_active = TRUE;

-- Contar usuarios del partner
SELECT COUNT(*) FROM public.users
WHERE partner_id = 'your_partner_id'
AND is_active = TRUE;
