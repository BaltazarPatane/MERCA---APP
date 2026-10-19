import { useState } from "react";
import type { FormEvent } from "react";
import type { Categoria } from "../types";
import { supabase } from "../lib/supabase";

type Props = {
  userId: string;
  categorias: Categoria[];
  onReload: () => Promise<void>;
  onError: (texto: string) => void;
  onNotice: (texto: string) => void;
};

export default function GestionCategorias({ userId, categorias, onReload, onError, onNotice }: Props) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState<Record<string, string>>({});

  async function crear(e: FormEvent) {
    e.preventDefault();
    const nombreLimpio = nombre.trim().replace(/\s+/g, " ");
    if (!supabase || !nombreLimpio || nombreLimpio.length > 60) {
      onError("El nombre debe tener entre 1 y 60 caracteres.");
      return;
    }
    if (categorias.some(c => c.tipo === tipo && c.nombre.toLocaleLowerCase("es") === nombreLimpio.toLocaleLowerCase("es"))) {
      onError("Ya existe una categoría con ese nombre y tipo.");
      return;
    }
    setBusyId("crear");
    onError("");
    const { error } = await supabase.from("categorias").insert({
      user_id: userId, nombre: nombreLimpio, tipo, activa: true,
    });
    setBusyId(null);
    if (error) { onError("No se pudo crear la categoría: " + error.message); return; }
    setNombre("");
    onNotice("Categoría creada");
    await onReload();
  }

  async function actualizar(id: string, valores: Partial<Pick<Categoria, "nombre" | "activa">>) {
    if (!supabase) return;
    if (valores.nombre !== undefined) {
      valores.nombre = valores.nombre.trim().replace(/\s+/g, " ");
      if (!valores.nombre || valores.nombre.length > 60) {
        onError("El nombre debe tener entre 1 y 60 caracteres.");
        return;
      }
    }
    onError("");
    setBusyId(id);
    const { error } = await supabase.from("categorias").update(valores).eq("id", id);
    setBusyId(null);
    if (error) { onError("No se pudo actualizar la categoría: " + error.message); return; }
    onNotice("Categoría actualizada");
    await onReload();
  }

  return (
    <section className="panel">
      <h2>Mis categorías</h2>
      <p className="muted">Podés agregar, renombrar o desactivar categorías sin perder los gastos históricos.</p>
      <form onSubmit={crear} className="categoryCreate">
        <label>Tipo
          <select value={tipo} onChange={e => setTipo(e.target.value as "gasto" | "ingreso")}>
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </label>
        <label>Nombre
          <input required maxLength={60} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej. Sueldo, Super, Básquet" />
        </label>
        <button className="primary" disabled={!!busyId}>Agregar</button>
      </form>
      <div className="categoryList">
        {categorias.map(c => (
          <div className="categoryRow" key={c.id}>
            <div className="categoryMeta"><span className="pill">{c.tipo}</span>{!c.activa && <span className="pill descartado">Inactiva</span>}</div>
            <input
              aria-label={"Nombre de categoría " + c.nombre}
              maxLength={60}
              value={nombreEditado[c.id] ?? c.nombre}
              disabled={!!busyId}
              onChange={e => setNombreEditado(s => ({...s,[c.id]: e.target.value}))}
            />
            <div className="categoryButtons">
              <button type="button" className="secondary mini" disabled={!!busyId || (nombreEditado[c.id] ?? c.nombre) === c.nombre}
                onClick={() => void actualizar(c.id, {nombre: nombreEditado[c.id] ?? c.nombre})}>Renombrar</button>
              <button type="button" className="secondary mini" disabled={!!busyId}
                onClick={() => void actualizar(c.id, {activa: !c.activa})}>{c.activa ? "Desactivar" : "Activar"}</button>
            </div>
          </div>
        ))}
        {categorias.length === 0 && <p className="muted">Todavía no hay categorías. Creá la primera arriba.</p>}
      </div>
    </section>
  );
}
