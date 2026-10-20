-- MERCA | Habilitación de inversiones como tercer flujo financiero.
-- Ejecutar en Supabase > SQL Editor ANTES de usar la nueva pantalla.
-- No borra ni modifica movimientos/categorías existentes; conserva RLS, FKs e índices.
-- Transacción atómica: si encuentra restricciones ambiguas se revierte por completo.
BEGIN;

DO $$
DECLARE
  tabla text;
  columna smallint;
  restriccion record;
  nuevo_nombre text;
  valores text;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['categorias','movimientos'] LOOP
    SELECT attnum INTO columna
    FROM pg_attribute
    WHERE attrelid = format('public.%I', tabla)::regclass
      AND attname = 'tipo' AND NOT attisdropped;
    IF columna IS NULL THEN
      RAISE EXCEPTION 'No existe public.%.tipo; revisar el esquema antes de migrar', tabla;
    END IF;

    -- Solo se reemplazan CHECKs cuyo único campo referenciado es tipo.
    -- Si hay una condición compuesta con otras columnas, se detiene la migración.
    FOR restriccion IN
      SELECT c.conname, c.conkey, pg_get_constraintdef(c.oid) AS definicion
      FROM pg_constraint c
      WHERE c.conrelid = format('public.%I', tabla)::regclass
        AND c.contype = 'c'
        AND columna = ANY(c.conkey)
    LOOP
      IF array_length(restriccion.conkey, 1) <> 1 THEN
        RAISE EXCEPTION 'CHECK compuesto % en public.% requiere revisión manual: %',
          restriccion.conname, tabla, restriccion.definicion;
      END IF;
      IF restriccion.definicion NOT ILIKE '%gasto%'
         OR restriccion.definicion NOT ILIKE '%ingreso%' THEN
        RAISE EXCEPTION 'CHECK de tipo no reconocido (%) en public.%: %',
          restriccion.conname, tabla, restriccion.definicion;
      END IF;

      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', tabla, restriccion.conname);
    END LOOP;

    nuevo_nombre := 'merca_' || tabla || '_tipo_valido';
    IF tabla = 'categorias' THEN
      valores := '''gasto'',''ingreso'',''inversion''';
    ELSE
      valores := '''gasto'',''ingreso'',''transferencia'',''inversion''';
    END IF;

    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (tipo IN (%s))',
      tabla, nuevo_nombre, valores
    );
  END LOOP;
END $$;

-- Asegura que la nueva clase de movimiento participe de la integridad existente
-- (user_id, categoria_id y cuenta_origen_id siguen usando las FKs actuales).
COMMIT;

-- Verificación de solo lectura:
SELECT conrelid::regclass AS tabla, conname AS restriccion,
       pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid IN ('public.categorias'::regclass, 'public.movimientos'::regclass)
  AND conname IN ('merca_categorias_tipo_valido','merca_movimientos_tipo_valido')
ORDER BY conrelid::regclass::text;
