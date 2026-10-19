import { Banknote, DatabaseBackup, Download, Landmark, LockKeyhole, Settings2, ShieldCheck, Wallet } from "lucide-react";
import GestionCategorias from "./GestionCategorias";
import type { Categoria } from "../types";

type Cuenta={id:string;nombre:string;tipo?:string;activa?:boolean};
type Props={userId:string;email:string;categorias:Categoria[];cuentas:Cuenta[];onReload:()=>Promise<void>;onError:(v:string)=>void;onNotice:(v:string)=>void;onExportar:()=>void};

export default function AjustesPanel({userId,email,categorias,cuentas,onReload,onError,onNotice,onExportar}:Props){
  return <div className="settingsV2">
    <div className="settingsV2-intro"><span><Settings2 size={20}/></span><div><h2>Personalizá MERCA</h2><p>Administrá tus categorías y consultá los datos de tu cuenta.</p></div></div>
    <GestionCategorias userId={userId} categorias={categorias} onReload={onReload} onError={onError} onNotice={onNotice}/>
    <section className="settingsV2-panel" aria-labelledby="ajustes-cuentas">
      <header className="settingsV2-panel-header">
        <span className="settingsV2-panel-icon"><Wallet size={21}/></span>
        <div><h2 id="ajustes-cuentas">Cuentas registradas</h2><p>Cuentas bancarias y billeteras disponibles en tu perfil</p></div>
        <span className="settingsV2-count">{cuentas.length}</span>
      </header>
      {cuentas.length?<div className="settingsV2-account-list">{cuentas.map(c=><div className="settingsV2-account" key={c.id}>
        <span className="settingsV2-account-icon">{/efectivo/i.test(c.tipo||"")?<Banknote size={21}/>:<Landmark size={21}/>}</span>
        <div><strong>{c.nombre}</strong><small>{c.tipo||"Cuenta"} · {c.activa===false?"Inactiva":"Registrada"}</small></div>
        <span className="settingsV2-account-badge">{c.activa===false?"Inactiva":"Disponible"}</span>
      </div>)}</div>:<div className="settingsV2-empty"><Wallet size={29}/><p>Todavía no tenés cuentas asociadas. Los movimientos manuales se pueden registrar sin cuenta.</p></div>}
      <p className="settingsV2-footnote">Las cuentas existentes pueden elegirse al cargar movimientos manuales. Su administración no se modifica en esta actualización.</p>
    </section>
    <section className="settingsV2-panel" aria-labelledby="ajustes-respaldo">
      <header className="settingsV2-panel-header"><span className="settingsV2-panel-icon"><DatabaseBackup size={21}/></span><div><h2 id="ajustes-respaldo">Respaldo y exportación</h2><p>Descargá los movimientos consultados en CSV</p></div></header>
      <div className="settingsV2-backup-body"><div><p>Exportá fechas, importes, categorías, destinatarios y estados en un archivo compatible con Excel.</p><small>La exportación incluye los movimientos cargados en esta sesión (consulta actual limitada a 3000). Todavía no es una copia histórica completa con paginación.</small></div><button type="button" className="settingsV2-export" onClick={onExportar}><Download size={18}/> Exportar CSV</button></div>
    </section>
    <section className="settingsV2-panel" aria-labelledby="ajustes-seguridad">
      <header className="settingsV2-panel-header"><span className="settingsV2-panel-icon"><ShieldCheck size={21}/></span><div><h2 id="ajustes-seguridad">Sesión y privacidad</h2><p>Tu información personal permanece en Supabase</p></div></header>
      <div className="settingsV2-session"><LockKeyhole size={18}/><div><small>Sesión iniciada</small><strong>{email}</strong></div></div>
      <p className="settingsV2-footnote">MERCA guarda movimientos estructurados. No almacena imágenes ni archivos de comprobantes en el historial.</p>
    </section>
  </div>;
}
