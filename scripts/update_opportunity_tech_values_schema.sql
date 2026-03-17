-- Backup existing data (optional)
CREATE TABLE IF NOT EXISTS opportunity_tech_values_backup AS
SELECT * FROM opportunity_tech_values;

-- Drop existing constraints and indexes
ALTER TABLE opportunity_tech_values
DROP CONSTRAINT IF EXISTS opportunity_tech_values_pkey CASCADE;

-- Modify the table structure to add typed columns
ALTER TABLE opportunity_tech_values
ADD COLUMN IF NOT EXISTS value_text TEXT,
ADD COLUMN IF NOT EXISTS value_numeric DECIMAL,
ADD COLUMN IF NOT EXISTS value_boolean BOOLEAN,
ADD COLUMN IF NOT EXISTS value_date DATE,
ADD COLUMN IF NOT EXISTS value_json JSONB;

-- Migrate existing data from the generic 'value' column to the appropriate typed columns
UPDATE opportunity_tech_values otv
SET 
  value_text = CASE 
    WHEN otf.field_type IN ('text', 'select', 'file') THEN otv.value
    ELSE NULL
  END,
  value_numeric = CASE 
    WHEN otf.field_type = 'number' AND otv.value ~ '^[0-9]+(\.[0-9]+)?$' THEN otv.value::DECIMAL
    ELSE NULL
  END,
  value_boolean = CASE 
    WHEN otf.field_type = 'boolean' AND otv.value IN ('true', 'false') THEN otv.value::BOOLEAN
    ELSE NULL
  END,
  value_date = CASE 
    WHEN otf.field_type = 'date' AND otv.value ~ '^\d{4}-\d{2}-\d{2}' THEN otv.value::DATE
    ELSE NULL
  END,
  value_json = CASE 
    WHEN otf.field_type = 'multiselect' AND otv.value ~ '^\[.*\]$' THEN otv.value::JSONB
    ELSE NULL
  END
FROM opportunity_tech_fields otf
WHERE otv.opportunity_tech_field_id = otf.id;

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW opportunity_tech_values_view AS
SELECT 
  id,
  opportunity_id,
  opportunity_tech_field_id,
  COALESCE(
    value_text, 
    CAST(value_numeric AS TEXT),
    CAST(value_boolean AS TEXT),
    CAST(value_date AS TEXT),
    CAST(value_json AS TEXT),
    value
  ) AS value,
  created_at,
  updated_at,
  value_text,
  value_numeric,
  value_boolean,
  value_date,
  value_json
FROM opportunity_tech_values;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otv_opportunity_id ON opportunity_tech_values(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_otv_field_id ON opportunity_tech_values(opportunity_tech_field_id);
CREATE INDEX IF NOT EXISTS idx_otv_value_text ON opportunity_tech_values(value_text);
CREATE INDEX IF NOT EXISTS idx_otv_value_numeric ON opportunity_tech_values(value_numeric);
CREATE INDEX IF NOT EXISTS idx_otv_value_boolean ON opportunity_tech_values(value_boolean);

-- Add a trigger to maintain the original 'value' column for backward compatibility
CREATE OR REPLACE FUNCTION update_opportunity_tech_values_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the 'value' column based on the field type
  IF NEW.value_text IS NOT NULL THEN
    NEW.value := NEW.value_text;
  ELSIF NEW.value_numeric IS NOT NULL THEN
    NEW.value := CAST(NEW.value_numeric AS TEXT);
  ELSIF NEW.value_boolean IS NOT NULL THEN
    NEW.value := CAST(NEW.value_boolean AS TEXT);
  ELSIF NEW.value_date IS NOT NULL THEN
    NEW.value := CAST(NEW.value_date AS TEXT);
  ELSIF NEW.value_json IS NOT NULL THEN
    NEW.value := CAST(NEW.value_json AS TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_opportunity_tech_values ON opportunity_tech_values;
CREATE TRIGGER update_opportunity_tech_values
BEFORE INSERT OR UPDATE ON opportunity_tech_values
FOR EACH ROW EXECUTE FUNCTION update_opportunity_tech_values_trigger();

-- Add a comment to the table to document the changes
COMMENT ON TABLE opportunity_tech_values IS 
'Stores values for opportunity technical fields with type-specific columns. 
The original "value" column is maintained for backward compatibility.';
