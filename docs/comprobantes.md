# Ingesta de comprobantes de MERCA

## Regla

Los comprobantes compartidos por Atajos generan exclusivamente **gastos**. Los ingresos se crean manualmente desde la aplicación web. El CUIL/CUIT del emisor no determina el tipo.

El atajo envía `POST` a la Edge Function `merca-recibir`, con encabezado `x-merca-token` y cuerpo JSON:

```json
{"texto_ocr":"texto extraído del PDF o imagen","categoria":"Heladería"}
```

No enviar `tipo` ni `simular` en el atajo definitivo.

## Resultado visible en iPhone

La Edge Function v6 devuelve únicamente **texto plano**:

- `exito`: gasto validado y confirmado; o comprobante ya registrado como confirmado.
- `por confirmar`: el gasto se guardó como pendiente y puede revisarse en MERCA; incluye formatos no validados, cifras potencialmente ambiguas con fecha única o categorías inactivas.
- `error`: no se pudo registrar (por ejemplo, sin fecha o importe único y válido, error de autenticación, fallo de base de datos o duplicado descartado).

No presentar `exito` para simulaciones. No reenviar comprobantes para resolver `por confirmar`: abrir el historial web y revisar.

## Destinatario

Desde v6 se extrae el comercio/destinatario cuando aparece con una estructura o etiqueta reconocible; puede ser NULL y se puede corregir en la web. No guardar CUIL/CUIT ni texto OCR completo.

**Orden de instalación:**
1. Ejecutar `supabase/migrations/20261019_destinatario_movimientos.sql` en Supabase SQL Editor.
2. Fusionar la PR de interfaz web y verificar Cloudflare Pages.
3. Pegar/desplegar el archivo completo `merca-recibir-v6-destinatario.ts` en Supabase Edge Functions > merca-recibir. Por el momento se entrega fuera del repositorio.
4. Eliminar `tipo` y `simular` de Atajos. `Obtener contenido de URL` debe conservar `texto_ocr` y `categoria`; mostrar directamente la respuesta como texto, sin intentar analizar JSON.

No compartir tokens ni claves de administrador en el repositorio público.
