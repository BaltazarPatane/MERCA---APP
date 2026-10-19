# Ajustes de MERCA — presentación del historial y receptor v8

## Web (se despliega desde GitHub)
- Espaciado entre encabezado y contenido en **Movimientos**, **Agregar** y **Ajustes**.
- Contenedor de filtros con separación real antes del panel Historial.
- Cada fila muestra, en este orden, **categoría**, **destinatario/identificador** y **fecha + hora + origen**.
- Estado con mayúscula inicial («Confirmado», «Pendiente de revisión», «Descartado»).
- Los registros con descripción anterior `Comprobante recibido por Atajos` aparecen en el historial como `Atajos`, sin migrar ni modificar la descripción histórica de la base de datos.

## Edge Function v8 (despliegue MANUAL en Supabase)
Esta función no está conectada automáticamente al despliegue web. La copia íntegra se entrega como archivo `merca-recibir-v8-destinatario.ts`.

- Los gastos enviados desde Atajos siguen guardándose como **gastos**, sin opción de ingreso en Atajos.
- `destinatario`: elegir nombre comprobable; si falta, usar **alias**; si falta, **CVU/CBU** u otro identificador etiquetado explícitamente como perteneciente a destino.
- No mostrar identificadores de **origen** en lugar de destino: si no se distingue el destinatario, dejar el campo vacío.
- Ante reenvío de un mismo comprobante, sin duplicar el movimiento se puede mejorar un destinatario vacío o menos descriptivo (nombre > alias > CVU/CBU > CUIL/CUIT).
- Descripción nueva: `Atajos`.
- Las respuestas del atajo se conservan como texto plano: `Movimiento cargado exitosamente`, `Transacción a confirmar`, `Error al cargar el movimiento`.
- No se guarda texto OCR ni imágenes.
- Requiere que ya exista `public.movimientos.destinatario text`; agregada en la actualización anterior.

**Orden:** verificar build del PR > fusionar > comprobar publicación en Cloudflare > desplegar código v8 de Supabase > probar comprobante repetido con alias/CVU. No modificar la función en Supabase hasta tener el archivo correcto completo.
