-- Agregar columna quiz_iniciado a la tabla visita
-- Ejecutar este script en la base de datos PostgreSQL

ALTER TABLE visita 
ADD COLUMN IF NOT EXISTS quiz_iniciado BOOLEAN DEFAULT NULL;

COMMENT ON COLUMN visita.quiz_iniciado IS 'Indica si el usuario abrio el quiz (true=inicio, false=abandono, null=no inicio)';

-- Verificar que la columna se haya agregado
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'visita' AND column_name = 'quiz_iniciado';
