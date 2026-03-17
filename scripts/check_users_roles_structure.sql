-- Verificar estructura de la tabla users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar estructura de la tabla roles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'roles'
ORDER BY ordinal_position;

-- Verificar valores en la tabla roles
SELECT * FROM public.roles;

-- Verificar algunos usuarios con sus roles
SELECT u.id, u.email, u.role_id, r.code
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
LIMIT 5;
