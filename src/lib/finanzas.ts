import type { Movimiento } from "../types";

type MovimientoFinanciero = Pick<Movimiento, "tipo" | "monto" | "estado">;

/** Flujo disponible, no patrimonio ni valor de mercado de inversiones. */
export function resumenFinanciero(movimientos: readonly MovimientoFinanciero[]) {
  let ingresos = 0;
  let gastos = 0;
  let inversiones = 0;
  for (const m of movimientos) {
    if (m.estado !== "confirmado") continue;
    const monto = Number(m.monto);
    if (!Number.isFinite(monto) || monto <= 0) continue;
    if (m.tipo === "ingreso") ingresos += monto;
    else if (m.tipo === "gasto") gastos += monto;
    else if (m.tipo === "inversion") inversiones += monto;
    // "transferencia" entre cuentas no se suma ni resta del disponible agregado.
  }
  return { ingresos, gastos, inversiones, balanceDisponible: ingresos - gastos - inversiones };
}
