-- Script minimalista que solo crea el bucket
BEGIN;
  -- Crear el bucket
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('opportunity_files', 'opportunity_files', true)
  ON CONFLICT (id) DO NOTHING;
COMMIT;
