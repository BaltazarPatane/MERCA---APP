# Recepción de comprobantes — MERCA

Este documento describe la integración del atajo de iPhone con la **Supabase Edge Function** `merca-recibir`. El código del receptor instalado actualmente se desplegó manualmente desde Supabase y **no forma parte de la compilación de Cloudflare Pages ni está versionado aquí como fuente completa del backend**.

## Regla funcional

- Todos los comprobantes compartidos desde **Atajos** se registran como **gastos**.
- Los **ingresos** se cargan manualmente desde la web.
- El flujo del atajo no solicita tipo de operación; solicita una **categoría**.
- Se admite texto extraído de PDF y de imágenes; el procesamiento automático confiable depende del formato del comprobante.

## Solicitud del atajo

```http
POST https://TU-PROYECTO.supabase.co/functions/v1/merca-recibir
Content-Type: application/json
x-merca-token: TOKEN_CONFIGURADO_EN_SECRETS
```

```json
{
  "texto_ocr": "Texto extraído del comprobante",
  "categoria": "Comida"
}
```

El token real solo se configura en el atajo privado y en los **Secrets de Supabase**. No se publica en GitHub.

## Extracción y validación

El receptor utilizado durante el desarrollo contempla:

1. Lectura de importes y fechas en formatos usuales argentinos y algunas variantes de PDF de Mercado Pago.
2. Manejo de centavos en superíndice o unidos al importe tras la extracción de texto.
3. Detección de horas y referencias de operación cuando aparecen.
4. Priorización de nombre de destinatario, con alternativa de **alias, CBU/CVU u otro identificador de destino inequívoco**. No confundir origen y destino.
5. Prevención de duplicados por referencia de operación o huella del texto.
6. Registro `confirmado` cuando el comprobante es confiable, `pendiente_revision` cuando admite revisión; rechazo si no se puede guardar correctamente.

No se debe inferir un importe dudoso. Tampoco se almacenan imágenes, PDF ni OCR completo en la tabla de movimientos. Si se vuelve a compartir una operación existente, el receptor puede mejorar un destinatario vacío o poco descriptivo sin volver a contabilizar el gasto.

## Mensajes del atajo

| Respuesta | Significado |
| --- | --- |
| `Movimiento cargado exitosamente` | Guardado confirmado o duplicado ya confirmado. |
| `Transacción a confirmar` | Guardado en estado pendiente de revisión. |
| `Error al cargar el movimiento` | La solicitud no produjo un registro válido. |

## Diferencia entre los despliegues

- **Frontend:** React, TypeScript y Vite; se publica desde `main` mediante Cloudflare Pages.
- **Backend de comprobantes:** Edge Function `merca-recibir`; se configura y actualiza manualmente en el proyecto Supabase.
- **Base de datos:** PostgreSQL y políticas RLS. La migración pública `supabase/migrations/20261019_destinatario_movimientos.sql` incorpora el campo `destinatario` a un esquema de base de datos previamente configurado.

Para conocer la arquitectura y las funcionalidades de la aplicación, consultar el [README principal](../README.md).
