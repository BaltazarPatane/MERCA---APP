# Inversiones en MERCA

MERCA registra **aportes a inversiones** como movimientos del tipo `inversion`, con **categorías propias**. Esto no equivale a cotizaciones de activos, dividendos, intereses, rescates o seguimiento de patrimonio: únicamente registra dinero aportado.

## Comportamiento

- **Agregar:** tercer selector `Inversión`. Importe, fecha y categoría son obligatorios. Activo/plataforma, descripción y cuenta de origen son opcionales.
- **Inversiones:** pantalla propia, filtros por mes/rango/historial total, categoría, estado y búsqueda por activo o plataforma. Permite editar y revisar pendientes.
- **Ajustes:** crear, renombrar, activar y desactivar categorías de tipo `inversion` sin mezclar las de gastos o ingresos.
- **Inicio:** muestra inversión confirmada del período y define **balance disponible = ingresos confirmados − gastos confirmados − inversiones confirmadas**. El gráfico de gastos por categoría sigue reflejando **solo gastos**.
- **Movimientos:** la pestaña de historial de gastos/ingresos conserva su funcionamiento anterior; las inversiones se consultan en **Inversiones**.
- **CSV:** exporta todos los tipos, con `tipo=inversion` para los aportes.
- **Atajos iOS:** continúa registrando exclusivamente **gastos**; no requiere ningún cambio.

### Ejemplo

Con $200.000 de ingresos, $45.000 de gastos y $75.000 aportados a inversiones confirmadas:

| Concepto | Importe |
| --- | ---: |
| Ingresos | $200.000 |
| Gastos de consumo | $45.000 |
| Inversiones | $75.000 |
| **Balance disponible** | **$80.000** |

Una inversión pendiente o descartada **no se descuenta**. Las transferencias entre cuentas propias tampoco se contabilizan como ingresos ni gastos del conjunto.

## Activar en una instalación existente

Esta incorporación **requiere una migración previa de PostgreSQL**. No alcanza con desplegar la web: hay restricciones `CHECK` sobre `tipo` que deben admitir los nuevos valores.

1. Antes de actualizar el frontend, entrar a **Supabase → SQL Editor → New query**.
2. Copiar íntegramente `supabase/migrations/20261020_inversiones.sql` y ejecutarla.
3. La migración sustituye **solo los CHECK de una columna que validan `tipo`** en `public.movimientos` y `public.categorias`. Conserva filas, RLS, claves foráneas, índices y tipos anteriores.
4. Comprobar que la consulta final muestre restricciones con `inversion` en ambas tablas.
5. Publicar la versión web con la nueva pestaña.
6. Ir a Ajustes, crear una categoría de tipo **Inversión** (por ejemplo, `Fondo común`, `Acciones`, `Plazo fijo`), y registrar un aporte desde Agregar.

La migración está dentro de una transacción: **si encuentra una restricción compuesta o distinta a la prevista, genera un error y revierte el cambio**. En ese caso, no intentar eliminar restricciones al azar; consultar las definiciones actuales de la tabla antes de adaptarla.

## Decisiones de integridad y límites

- No se reescriben movimientos previos.
- No se cambian permisos o reglas de acceso: sigue aplicando RLS por usuario.
- Los aportes se guardan inicialmente `confirmado`, al igual que el resto de movimientos manuales.
- No existe un módulo de rendimientos, valoración de carteras, rescates ni ventas de activos.
- No se calculan saldos bancarios individuales ni se concilia con bancos.
- Un ingreso relacionado con una inversión se registra manualmente como **ingreso**, sin vinculación contable automática al aporte original.
- El balance representa **flujo disponible de un período**, no patrimonio ni valor de mercado.
- La exportación CSV sigue limitada por los movimientos cargados en la consulta web, no reemplaza un respaldo completo.

## Pruebas

Se agregó `tests/finanzas.test.mjs`, ejecutable mediante `npm test`. Prueba la separación de gastos e inversiones, la exclusión de pendientes/descartados, transferencias propias, importes `numeric` como texto y saldo disponible.
