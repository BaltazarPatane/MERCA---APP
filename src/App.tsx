import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import EditarMovimiento from "./components/EditarMovimiento";
import GestionCategorias from "./components/GestionCategorias";
import { montoParaBD } from "./types";
import type { Categoria, Movimiento } from "./types";


type Tab = "inicio" | "movimientos" | "agregar" | "ajustes";
const money = (n: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(n);
const fechaHoy = () => new Date().toLocaleDateString("en-CA");
const mesHoy = () => fechaHoy().slice(0, 7);
const fechaLegible = (fecha: string) => {
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a}`;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(() => window.location.hash.includes("type=recovery"));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("inicio");
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [periodo, setPeriodo] = useState("mes");
  const [mes, setMes] = useState(mesHoy());
  const [dia, setDia] = useState(fechaHoy());
  const [desde, setDesde] = useState(fechaHoy());
  const [hasta, setHasta] = useState(fechaHoy());
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<"gasto" | "ingreso">("gasto");
  const [montoNuevo, setMontoNuevo] = useState("");
  const [fechaNueva, setFechaNueva] = useState(fechaHoy());
  const [categoriaNueva, setCategoriaNueva] = useState("");
  const [descripcionNueva, setDescripcionNueva] = useState("");
  const [notice, setNotice] = useState("");
  const [editando, setEditando] = useState<Movimiento | null>(null);

  useEffect(() => {
    if (!supabase) { setStarting(false); return; }
    const client = supabase;
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setStarting(false);
    }).catch(() => setStarting(false));
    const { data } = client.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function cargar() {
    if (!supabase || !session) return;
    setLoading(true);
    setError("");
    const [mov, cat] = await Promise.all([
      supabase.from("movimientos").select("id,tipo,monto,moneda,fecha,hora,descripcion,estado,categoria_id,cuenta_origen_id,cuenta_destino_id").order("fecha", { ascending: false }).limit(3000),
      supabase.from("categorias").select("id,nombre,tipo,activa,color").order("nombre"),
    ]);
    if (mov.error || cat.error) setError(mov.error?.message || cat.error?.message || "Error desconocido");
    else {
      setMovimientos((mov.data || []) as Movimiento[]);
      setCategorias((cat.data || []) as Categoria[]);
    }
    setLoading(false);
  }

  useEffect(() => { if (session) void cargar(); else { setMovimientos([]); setCategorias([]); } }, [session?.user.id]);

  const visibles = useMemo(() => movimientos.filter(m => {
    if (periodo === "mes" && !m.fecha.startsWith(mes)) return false;
    if (periodo === "dia" && m.fecha !== dia) return false;
    if (periodo === "rango" && (m.fecha < desde || m.fecha > hasta)) return false;
    return filtroEstado === "todos" || m.estado === filtroEstado;
  }), [movimientos, periodo, mes, dia, desde, hasta, filtroEstado]);

  const confirmados = visibles.filter(m => m.estado === "confirmado");
  const ingresos = confirmados.filter(m => m.tipo === "ingreso").reduce((a, m) => a + Number(m.monto), 0);
  const gastos = confirmados.filter(m => m.tipo === "gasto").reduce((a, m) => a + Number(m.monto), 0);
  const porCategoria = useMemo(() => {
    const suma = new Map<string, number>();
    confirmados.filter(m => m.tipo === "gasto").forEach(m => {
      const nombre = categorias.find(c => c.id === m.categoria_id)?.nombre || "Sin categoría";
      suma.set(nombre, (suma.get(nombre) || 0) + Number(m.monto));
    });
    return [...suma.entries()].sort((a, b) => b[1] - a[1]);
  }, [visibles, categorias]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setAuthError("");
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setAuthError("No se pudo iniciar sesión. Comprobá tu correo y contraseña.");
    setBusy(false);
  }

  async function enviarRecuperacion(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setAuthError("");
    setRecoveryMessage("");
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setBusy(false);
    if (err) {
      setAuthError(err.message);
    } else {
      setRecoveryMessage("Si el correo está autorizado para recibir mensajes de Supabase, te llegará un enlace para elegir una contraseña nueva. Revisá también spam.");
    }
  }

  async function guardarNuevaContrasena(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (newPassword.length < 12) {
      setAuthError("Usá una contraseña de al menos 12 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setAuthError("");
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (err) {
      setAuthError(err.message);
    } else {
      setNewPassword("");
      setConfirmPassword("");
      setRecoveryMode(false);
      setShowPasswordReset(false);
      setNotice("Contraseña actualizada. Tu sesión está iniciada.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  async function actualizarEstado(id: string, estado: string) {
    if (!supabase) return;
    setBusy(true);
    const { error: err } = await supabase.from("movimientos").update({ estado, updated_at: new Date().toISOString() }).eq("id", id);
    setBusy(false);
    if (err) setError(err.message);
    else { setNotice(estado === "confirmado" ? "Movimiento confirmado" : "Movimiento descartado"); await cargar(); }
  }

  async function guardarEdicion(data: {
    tipo: "gasto" | "ingreso" | "transferencia";
    monto: string;
    fecha: string;
    hora: string | null;
    categoria_id: string | null;
    descripcion: string | null;
    estado: "pendiente_revision" | "confirmado" | "descartado";
  }) {
    if (!supabase || !editando) return;
    setBusy(true);
    setError("");
    const { error: err } = await supabase.from("movimientos").update({
      ...data, updated_at: new Date().toISOString(),
    }).eq("id", editando.id);
    setBusy(false);
    if (err) setError("No se pudieron guardar los cambios: " + err.message);
    else { setEditando(null); setNotice("Movimiento actualizado"); await cargar(); }
  }

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !session) return;
    const importe = montoParaBD(montoNuevo);
    if (!importe || !fechaNueva || !categoriaNueva) { setError("Revisá el importe, la fecha y la categoría."); return; }
    setBusy(true); setError("");
    const { error: err } = await supabase.from("movimientos").insert({
      user_id: session.user.id,
      tipo: tipoNuevo, monto: importe, moneda: "ARS",
      fecha: fechaNueva, categoria_id: categoriaNueva,
      descripcion: descripcionNueva.trim() || null,
      origen_registro: "manual", estado: "confirmado",
    });
    setBusy(false);
    if (err) setError(err.message);
    else { setMontoNuevo(""); setDescripcionNueva(""); setCategoriaNueva(""); setNotice("Movimiento agregado correctamente"); setTab("movimientos"); await cargar(); }
  }

  function exportarCSV() {
    const encabezado = "fecha,tipo,monto,moneda,categoria,descripcion,estado";
    const esc = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
    const filas = movimientos.map(m => [
      m.fecha, m.tipo, m.monto, m.moneda,
      categorias.find(c => c.id === m.categoria_id)?.nombre ?? "", m.descripcion ?? "", m.estado
    ].map(esc).join(","));
    const blob = new Blob(["\uFEFF" + [encabezado, ...filas].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "merca-movimientos.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (!supabase) return <div className="centered"><div className="panel auth"><div className="brand">MERCA<span>.</span></div><h1>Configuración pendiente</h1><p>La aplicación ya está preparada. Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> en Cloudflare Pages.</p><p>No publiques claves administrativas ni el token de Atajos.</p></div></div>;
  if (starting) return <div className="centered">Iniciando MERCA…</div>;
  if (recoveryMode) return (
    <div className="centered">
      <form onSubmit={guardarNuevaContrasena} className="panel auth">
        <div className="brand">MERCA<span>.</span></div>
        <h1>Elegí una contraseña nueva</h1>
        {!session && <p>Validando el enlace de recuperación… Si tarda demasiado, volvé a solicitarlo.</p>}
        <label>Contraseña nueva<input type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
        <label>Repetir contraseña<input type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>
        {authError && <div className="message error" role="alert">{authError}</div>}
        <button type="submit" className="primary" disabled={busy || !session}>{busy ? "Actualizando…" : "Establecer contraseña"}</button>
      </form>
    </div>
  );
  if (showPasswordReset && !session) return (
    <div className="centered">
      <form onSubmit={enviarRecuperacion} className="panel auth">
        <div className="brand">MERCA<span>.</span></div>
        <h1>Recuperar acceso</h1>
        <p>Escribí el correo del usuario que creaste en Supabase.</p>
        <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
        {authError && <div className="message error" role="alert">{authError}</div>}
        {recoveryMessage && <div className="message success" role="status">{recoveryMessage}</div>}
        <button className="primary" disabled={busy}>{busy ? "Enviando…" : "Enviar enlace de recuperación"}</button>
        <button type="button" className="secondary" onClick={() => { setShowPasswordReset(false); setAuthError(""); setRecoveryMessage(""); }}>Volver a iniciar sesión</button>
      </form>
    </div>
  );
  if (!session) return (
    <div className="centered">
      <form onSubmit={login} className="panel auth">
        <div className="brand">MERCA<span>.</span></div>
        <h1>Tus finanzas, claras.</h1>
        <p>Ingresá con tu cuenta personal de MERCA.</p>
        <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {authError && <div className="message error" role="alert">{authError}</div>}
        <button className="primary" disabled={busy}>{busy ? "Ingresando…" : "Iniciar sesión"}</button>
        <button type="button" className="secondary" onClick={() => { setShowPasswordReset(true); setAuthError(""); }}>¿Olvidaste tu contraseña?</button>
      </form>
    </div>
  );

  const opciones = categorias.filter(c => c.tipo === tipoNuevo && c.activa);
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">MERCA<span>.</span></div>
        <div className="slogan">Control personal de finanzas</div>
        <nav>{([["inicio","◫","Inicio"],["movimientos","☷","Movimientos"],["agregar","＋","Agregar"],["ajustes","⚙","Ajustes"]] as const).map(([id, icon, label]) =>
          <button key={id} className={tab === id ? "nav active" : "nav"} onClick={() => { setTab(id); setError(""); }}>{icon} <span>{label}</span></button>
        )}</nav>
        <button className="logout" onClick={() => { if (supabase) void supabase.auth.signOut(); }}>Cerrar sesión</button>
      </aside>
      <main>
        <header className="top"><div><div className="overline">MERCA / FINANZAS PERSONALES</div><h1>{({ inicio: "Tu resumen", movimientos: "Movimientos", agregar: "Nuevo movimiento", ajustes: "Ajustes" } as const)[tab]}</h1></div><button className="subtle" onClick={() => void cargar()} disabled={loading}>{loading ? "Cargando…" : "↻ Actualizar"}</button></header>
        {error && <div className="message error" role="alert">{error}</div>}
        {notice && <div className="message success" role="status" onClick={() => setNotice("")}>{notice} ×</div>}
        {(tab === "inicio" || tab === "movimientos") && <section className="filters"><label>Período<select value={periodo} onChange={e => setPeriodo(e.target.value)}><option value="mes">Mes</option><option value="dia">Día</option><option value="rango">Rango de fechas</option><option value="todo">Todo el historial</option></select></label>{periodo === "mes" && <label>Mes<input type="month" value={mes} onChange={e => setMes(e.target.value)} /></label>}{periodo === "dia" && <label>Fecha<input type="date" value={dia} onChange={e => setDia(e.target.value)} /></label>}{periodo === "rango" && <><label>Desde<input type="date" value={desde} onChange={e => setDesde(e.target.value)} /></label><label>Hasta<input type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></label></>}{tab === "movimientos" && <label>Estado<select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}><option value="todos">Todos</option><option value="confirmado">Confirmados</option><option value="pendiente_revision">Pendientes</option><option value="descartado">Descartados</option></select></label>}</section>}
        {tab === "inicio" && <><section className="stats"><article className="panel stat"><span>Ingresos confirmados</span><strong className="green">{money(ingresos)}</strong></article><article className="panel stat"><span>Gastos confirmados</span><strong>{money(gastos)}</strong></article><article className="panel stat"><span>Balance del período</span><strong className={ingresos - gastos >= 0 ? "green" : "red"}>{money(ingresos - gastos)}</strong></article></section><div className="split"><section className="panel chart"><h2>¿En qué gastaste?</h2>{porCategoria.length === 0 ? <p className="muted">Cuando confirmes tus primeros gastos, aparecerá la distribución por categoría.</p> : <><div className="donut" style={{background:`conic-gradient(${porCategoria.reduce((acc, [, valor], i) => { const start = porCategoria.slice(0, i).reduce((s, x) => s + x[1], 0) / gastos * 100; return acc + `${["#2dd4bf","#60a5fa","#fbbf24","#c084fc","#fb7185"][i % 5]} ${start}% ${(start + valor / gastos * 100)}%,`; }, "").slice(0,-1)})`}}><div>{money(gastos)}<small>Total gastos</small></div></div><div className="legend">{porCategoria.map(([nombre, valor], i) => <div key={nombre}><i style={{background:["#2dd4bf","#60a5fa","#fbbf24","#c084fc","#fb7185"][i%5]}} />{nombre}<b>{money(valor)}</b></div>)}</div></>}</section><section className="panel"><h2>Por revisar</h2><p className="muted">Los movimientos pendientes todavía no cuentan en el balance.</p><div className="bigNumber">{movimientos.filter(m => m.estado === "pendiente_revision").length}</div><button className="secondary" onClick={() => { setTab("movimientos"); setFiltroEstado("pendiente_revision"); setPeriodo("todo"); }}>Revisar movimientos →</button></section></div></>}
        {tab === "movimientos" && <section className="panel"><div className="sectionTitle"><h2>Historial</h2><span>{visibles.length} movimientos</span></div>{visibles.length === 0 ? <p className="muted">No hay movimientos para el período seleccionado.</p> : <div className="transactionList">{visibles.map(m => <article className="transaction" key={m.id}><div><div className="transactionTitle">{categorias.find(c => c.id === m.categoria_id)?.nombre || "Sin categoría"} <span className={"pill " + m.estado}>{m.estado.replace("_", " ")}</span></div><p>{fechaLegible(m.fecha)} · {m.descripcion || (m.tipo === "ingreso" ? "Ingreso" : "Gasto")}</p>{m.estado === "pendiente_revision" && <div className="actions"><button disabled={busy} className="mini primary" onClick={() => void actualizarEstado(m.id, "confirmado")}>Confirmar</button><button disabled={busy} className="mini secondary" onClick={() => void actualizarEstado(m.id, "descartado")}>Descartar</button></div>}<button className="mini secondary editButton" disabled={busy} onClick={() => setEditando(m)}>Editar</button></div><strong className={m.tipo === "ingreso" ? "green" : ""}>{m.tipo === "ingreso" ? "+" : m.tipo === "gasto" ? "−" : ""}{money(Number(m.monto))}</strong></article>)}</div>}</section>}
        {tab === "agregar" && <section className="panel formPanel"><h2>Carga manual</h2><p className="muted">Ingresá gastos o ingresos que no tengan comprobante.</p><form onSubmit={agregar} className="form"><label>Tipo<select value={tipoNuevo} onChange={e => {setTipoNuevo(e.target.value as "gasto" | "ingreso");setCategoriaNueva("");}}><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></label><label>Importe en ARS<input type="text" inputMode="decimal" required placeholder="15000,50" value={montoNuevo} onChange={e => setMontoNuevo(e.target.value)} /></label><label>Fecha<input type="date" required value={fechaNueva} onChange={e => setFechaNueva(e.target.value)} /></label><label>Categoría<select required value={categoriaNueva} onChange={e => setCategoriaNueva(e.target.value)}><option value="">Seleccionar categoría</option>{opciones.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>{opciones.length === 0 && <p className="muted">Todavía no tenés categorías de este tipo. Las configuraremos en la siguiente etapa.</p>}<label>Descripción (opcional)<input value={descripcionNueva} onChange={e => setDescripcionNueva(e.target.value)} placeholder="Ej. Almuerzo, sueldo, fútbol…" /></label><button className="primary" disabled={busy || !opciones.length}>{busy ? "Guardando…" : "Guardar movimiento"}</button></form></section>}
        {tab === "ajustes" && <div className="settingsStack"><GestionCategorias userId={session.user.id} categorias={categorias} onReload={cargar} onError={setError} onNotice={setNotice} /><section className="panel"><h2>Cuenta y respaldo</h2><p className="muted">Sesión: {session.user.email}</p><p>El historial permanece en Supabase. Las imágenes de comprobantes no se almacenan aquí.</p><button className="secondary" onClick={exportarCSV}>Exportar todos los movimientos a CSV</button><p className="muted small">Esta exportación incluye los movimientos consultados en esta sesión (hasta 3000). Antes de considerarla una copia histórica completa implementaremos exportación paginada y restauración.</p></section></div>}
      </main>
      {editando && <EditarMovimiento key={editando.id} movimiento={editando} categorias={categorias} busy={busy} onSave={guardarEdicion} onClose={() => setEditando(null)} />}
      <nav className="bottomNav">{([["inicio","⌂","Inicio"],["movimientos","☷","Historial"],["agregar","＋","Agregar"],["ajustes","⚙","Ajustes"]] as const).map(([id,ico,label]) => <button key={id} className={tab === id ? "selected" : ""} onClick={() => setTab(id)}><span>{ico}</span>{label}</button>)}</nav>
    </div>
  );
}
