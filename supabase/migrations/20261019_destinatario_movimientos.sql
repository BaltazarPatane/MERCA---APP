-- Ejecutar UNA VEZ en Supabase > SQL Editor ANTES de desplegar el receptor v6.
-- Mantiene las filas existentes sin modificar su estado o descripción.
alter table public.movimientos
  add column if not exists destinatario text;

comment on column public.movimientos.destinatario is
  'Destinatario/comercio reconocido en el comprobante; NULL si no se pudo identificar.';

-- El campo queda sujeto a las políticas RLS existentes de movimientos.
-- No guardar aquí CUIT, CUIL, CBU, CVU ni el OCR completo.
