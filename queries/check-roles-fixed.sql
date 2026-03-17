-- Verificar que existan los roles 'TechUser' y 'PartnerUser' y obtener sus IDs
SELECT id, code
FROM roles
WHERE code IN ('TechUser', 'PartnerUser');
