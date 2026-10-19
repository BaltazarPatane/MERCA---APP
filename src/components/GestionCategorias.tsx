import { useState } from "react";
import type { FormEvent } from "react";
import { Check, CirclePlus, FolderClosed, Power, Tag, X } from "lucide-react";
import type { Categoria } from "../types";
import { supabase } from "../lib/supabase";

type Props={userId:string;categorias:Categoria[];onReload:()=>Promise<void>;onError:(texto:string)=>void;onNotice:(texto:string)=>void};

export default function GestionCategorias({userId,categorias,onReload,onError,onNotice}:Props){
  const [nombre,setNombre]=useState("");
  const [tipo,setTipo]=useState<"gasto"|"ingreso">("gasto");
  const [busyId,setBusyId]=useState<string|null>(null);
  const [nombreEditado,setNombreEditado]=useState<Record<string,string>>({});
  const activas=categorias.filter(c=>c.activa).length;

  async function crear(e:FormEvent){
    e.preventDefault();
    const limpio=nombre.trim().replace(/\s+/g," ");
    if(!supabase||!limpio||limpio.length>60){onError("El nombre debe tener entre 1 y 60 caracteres.");return;}
    if(categorias.some(c=>c.tipo===tipo&&c.nombre.toLocaleLowerCase("es")===limpio.toLocaleLowerCase("es"))){onError("Ya existe una categoría con ese nombre y tipo.");return;}
    setBusyId("crear");onError("");
    const {error}=await supabase.from("categorias").insert({user_id:userId,nombre:limpio,tipo,activa:true});
    setBusyId(null);
    if(error){onError("No se pudo crear la categoría: "+error.message);return;}
    setNombre("");onNotice("Categoría creada");await onReload();
  }

  async function actualizar(id:string,valores:Partial<Pick<Categoria,"nombre"|"activa">>){
    if(!supabase)return;
    if(valores.nombre!==undefined){
      valores.nombre=valores.nombre.trim().replace(/\s+/g," ");
      if(!valores.nombre||valores.nombre.length>60){onError("El nombre debe tener entre 1 y 60 caracteres.");return;}
    }
    setBusyId(id);onError("");
    const {error}=await supabase.from("categorias").update(valores).eq("id",id);
    setBusyId(null);
    if(error){onError("No se pudo actualizar la categoría: "+error.message);return;}
    setNombreEditado(s=>{const copia={...s};delete copia[id];return copia;});
    onNotice("Categoría actualizada");await onReload();
  }

  return <section className="settingsV2-panel" aria-labelledby="ajustes-categorias">
    <header className="settingsV2-panel-header">
      <span className="settingsV2-panel-icon"><Tag size={21}/></span>
      <div><h2 id="ajustes-categorias">Categorías</h2><p>Organizá tus gastos e ingresos</p></div>
      <span className="settingsV2-count">{activas} activas</span>
    </header>
    <form className="settingsV2-create" onSubmit={crear}>
      <label><span>Tipo</span><select value={tipo} onChange={e=>setTipo(e.target.value as "gasto"|"ingreso")} disabled={!!busyId}><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></label>
      <label><span>Nombre de categoría</span><input required maxLength={60} value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Ej. Sueldo, Salud, Básquet" disabled={!!busyId}/></label>
      <button type="submit" className="settingsV2-create-button" disabled={!!busyId}><CirclePlus size={18}/> Agregar</button>
    </form>
    <div className="settingsV2-category-list">
      {categorias.map((c,i)=>{
        const editado=nombreEditado[c.id]??c.nombre;
        const cambio=editado!==c.nombre;
        return <div className="settingsV2-category-row" key={c.id}>
          <span className={"settingsV2-category-icon "+(c.tipo==="ingreso"?"income":"")} style={{color:["#36d4b0","#54c6f0","#b391ea","#f5b94d","#f38ba4","#90c6c2"][i%6]}}><FolderClosed size={18}/></span>
          <div className="settingsV2-category-info">
            <input aria-label={"Nombre de categoría "+c.nombre} value={editado} maxLength={60} onChange={e=>setNombreEditado(s=>({...s,[c.id]:e.target.value}))} disabled={!!busyId}/>
            <div className="settingsV2-category-meta"><span>{c.tipo==="gasto"?"Gastos":"Ingresos"}</span><span className={"settingsV2-category-state "+(c.activa?"active":"")}>{c.activa?"Activa":"Inactiva"}</span></div>
          </div>
          <div className="settingsV2-category-actions">
            {cambio&&<button type="button" title="Guardar nuevo nombre" aria-label={"Guardar nombre de "+c.nombre} className="settingsV2-icon-button save" disabled={!!busyId} onClick={()=>void actualizar(c.id,{nombre:editado})}><Check size={18}/></button>}
            {cambio&&<button type="button" title="Cancelar edición" aria-label="Cancelar edición" className="settingsV2-icon-button" disabled={!!busyId} onClick={()=>setNombreEditado(s=>{const copia={...s};delete copia[c.id];return copia;})}><X size={17}/></button>}
            <button type="button" className={"settingsV2-power "+(c.activa?"active":"")} disabled={!!busyId} onClick={()=>void actualizar(c.id,{activa:!c.activa})} title={c.activa?"Desactivar categoría":"Activar categoría"} aria-label={(c.activa?"Desactivar ":"Activar ")+c.nombre}><Power size={16}/></button>
          </div>
        </div>;
      })}
      {!categorias.length&&<div className="settingsV2-empty"><Tag size={28}/><p>Todavía no hay categorías. Creá la primera arriba.</p></div>}
    </div>
    <p className="settingsV2-footnote">Las categorías desactivadas permanecen en los movimientos históricos.</p>
  </section>;
}
