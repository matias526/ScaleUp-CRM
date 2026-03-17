-- Verificar si hay usuarios asignados a roles específicos
SELECT u.id, u.email, r.code AS role_code
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE r.code IN ('TechUser', 'PartnerUser');
