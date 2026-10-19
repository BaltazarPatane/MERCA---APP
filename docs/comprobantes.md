# Ingesta de comprobantes de MERCA

## Regla

Los comprobantes compartidos por Atajos generan exclusivamente **gastos**. Los ingresos se crean manualmente desde la aplicación web. El CUIL/CUIT del emisor no determina el tipo.

El atajo envía `POST` a la Edge Function `merca-recibir`, con encabezado `x-merca-token` y cuerpo JSON:

```json
{"texto_ocr":"texto extraído del PDF o imagen","categoria":"Heladería"}
```

No enviar `tipo` ni `simular` en el atajo definitivo.

## Resultado visible en iPhone

La Edge Function v7 devuelve únicamente **texto plano**:

- `Movimiento cargado exitosamente`: gasto validado y confirmado, o comprobante ya registrado como confirmado.
- `Transacción a confirmar`: gasto guardado como pendiente de revisión; por ejemplo, formato desconocido o categoría inactiva.
- `Error al cargar el movimiento`: no se pudo registrar por datos inválidos, error de autenticación, de conexión o de base de datos.


No presentar `exito` para simulaciones. No reenviar comprobantes para resolver `por confirmar`: abrir el historial web y revisar.

## Destinatario

Desde v6 se extrae el comercio/destinatario cuando aparece con una estructura o etiqueta reconocible; puede ser NULL y se puede corregir en la web. No guardar CUIL/CUIT ni texto OCR completo.

**Orden de instalación:**
1. Ejecutar `supabase/migrations/20261019_destinatario_movimientos.sql` en Supabase SQL Editor.
2. Fusionar la PR de interfaz web y verificar Cloudflare Pages.
3. Pegar/desplegar el archivo completo `merca-recibir-v6-destinatario.ts` en Supabase Edge Functions > merca-recibir. Por el momento se entrega fuera del repositorio.
4. Eliminar `tipo` y `simular` de Atajos. `Obtener contenido de URL` debe conservar `texto_ocr` y `categoria`; mostrar directamente la respuesta como texto, sin intentar analizar JSON.

No compartir tokens ni claves de administrador en el repositorio público.

## Destinatarios personales (v7)

La extracción reconoce nombres etiquetados como destinatario/beneficiario/titular destino y bloques «Origen y destino» donde los nombres aparecen asociados a CUIL/CUIT/CBU/CVU. Se filtran números de cuentas y etiquetas bancarias: **el CVU no es un nombre**. Si falta el nombre en el comprobante, se deja NULL y se puede editar en la web. Al reenviar un comprobante ya existente, solo se completa/corrige un destinatario vacío o numérico si aparece un nombre inequívoco: no cambia ningún importe, estado ni fecha.

En la pestaña Movimientos se puede buscar por destinatario y combinar la búsqueda con los filtros existentes, sin importar mayúsculas o tildes. Para actualizar la Edge Function se copia el archivo v7 íntegro en Supabase > Edge Functions > merca-recibir > Code > Deploy. Su código NO se despliega automáticamente mediante Cloudflare/GitHub Pages.
