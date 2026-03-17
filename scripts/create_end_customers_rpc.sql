-- Crear función para obtener clientes finales con países
CREATE OR REPLACE FUNCTION get_end_customers_with_countries()
RETURNS TABLE (
  id uuid,
  name varchar(100),
  industry varchar(100),
  website varchar(255),
  country_id uuid,
  city varchar(100),
  primary_contact_name varchar(200),
  primary_contact_email varchar(255),
  primary_contact_phone varchar(50),
  tax_id varchar(100),
  created_at timestamptz,
  updated_at timestamptz,
  country_name varchar(100),
  country_code varchar(10)
)
LANGUAGE sql
AS $$
  SELECT 
    ec.id,
    ec.name,
    ec.industry,
    ec.website,
    ec.country_id,
    ec.city,
    ec.primary_contact_name,
    ec.primary_contact_email,
    ec.primary_contact_phone,
    ec.tax_id,
    ec.created_at,
    ec.updated_at,
    c.name as country_name,
    c.code as country_code
  FROM end_customers ec
  LEFT JOIN countries c ON ec.country_id = c.id
  ORDER BY ec.name;
$$;
