// src/pages/Servicios.jsx
import { useEffect, useState } from "react";
import { ServiciosService, ClientesService, EmpleadosService } from "../lib/FirestoreService";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const ESTADOS = ["Diagnóstico", "En proceso", "Listo", "Entregado"];
const PASOS   = ["Recepción del vehículo", "Diagnóstico", "Autorización del cliente", "Servicio en curso", "Control de calidad", "Entrega al cliente"];

const badgeClass = s => ({
  "En proceso": "badge-warning", "Diagnóstico": "badge-info",
  "Listo": "badge-success", "Entregado": "badge-muted",
}[s] || "badge-muted");

const empty = {
  nombre_servicio: "", clienteNombre: "", empleadoNombre: "",
  vehiculo: "", costo_servicio: "", duracion_servicio: "",
  Estado_orden: "Diagnóstico", descripcion: "",
};

export default function Servicios() {
  const [servicios, setServicios]   = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [empleados, setEmpleados]   = useState([]);
  const [search, setSearch]         = useState("");
  const [filterEstado, setFilter]   = useState("");
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(empty);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const u1 = ServiciosService.suscribir(setServicios);
    const u2 = ClientesService.suscribir(setClientes);
    const u3 = EmpleadosService.suscribir(setEmpleados);
    return () => { u1(); u2(); u3(); };
  }, []);

  const filtered = servicios.filter(s => {
    const match = `${s.nombre_servicio} ${s.clienteNombre} ${s.empleadoNombre}`
      .toLowerCase().includes(search.toLowerCase());
    const est = !filterEstado || s.Estado_orden === filterEstado;
    return match && est;
  });

  const close = () => { setModal(null); setSelected(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.nombre_servicio || !form.clienteNombre) {
      toast.error("Servicio y cliente son obligatorios"); return;
    }
    setSaving(true);
    try {
      if (modal === "edit") {
        await ServiciosService.actualizar(selected.id, form);
        toast.success("Servicio actualizado");
      } else {
        await ServiciosService.crear(form);
        toast.success("Orden de servicio creada");
      }
      close();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const updateEstado = async (id, estado) => {
    await ServiciosService.actualizarEstado(id, estado);
    setSelected(s => ({ ...s, Estado_orden: estado }));
    toast.success(`Estado → ${estado}`);
  };

  const pasoActual = (estado) => ESTADOS.indexOf(estado) + 1;

  return (
    <div className="animate-slideIn">
      <div className="toolbar">
        <input className="search-box" placeholder="Buscar servicio, cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterEstado} onChange={e => setFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => { setForm(empty); setModal("new"); }}>
            <Plus size={14} /> Nueva Orden
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Orden</th><th>Cliente</th><th>Vehículo</th><th>Servicio</th><th>Mecánico</th><th>Costo</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id}>
                  <td><strong>#{String(i + 1).padStart(3, "0")}</strong></td>
                  <td>{s.clienteNombre}</td>
                  <td className="text-muted" style={{ fontSize: "12px" }}>{s.vehiculo}</td>
                  <td>{s.nombre_servicio}</td>
                  <td>{s.empleadoNombre}</td>
                  <td className="text-accent fw700">${Number(s.costo_servicio || 0).toLocaleString()}</td>
                  <td><span className={`badge ${badgeClass(s.Estado_orden)}`}>{s.Estado_orden}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(s); setModal("view"); }}>👁 Ver</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(s); setForm(s); setModal("edit"); }}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-state">Sin órdenes de servicio<p>Crea una nueva orden</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VER con timeline */}
      {modal === "view" && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>🚗 {selected.nombre_servicio}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row" style={{ marginBottom: "14px" }}>
                <div className="form-group"><label>Cliente</label><input readOnly value={selected.clienteNombre || "—"} /></div>
                <div className="form-group"><label>Mecánico</label><input readOnly value={selected.empleadoNombre || "—"} /></div>
              </div>
              <div className="form-row" style={{ marginBottom: "14px" }}>
                <div className="form-group"><label>Vehículo</label><input readOnly value={selected.vehiculo || "—"} /></div>
                <div className="form-group"><label>Costo</label><input readOnly value={`$${Number(selected.costo_servicio || 0).toLocaleString()}`} /></div>
              </div>
              {selected.descripcion && (
                <div className="form-group"><label>Descripción</label><textarea readOnly value={selected.descripcion} /></div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px", fontWeight: 600 }}>
                  Actualizar Estado
                </label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {ESTADOS.map(est => (
                    <button key={est}
                      className={`btn btn-sm ${selected.Estado_orden === est ? "btn-accent" : "btn-ghost"}`}
                      onClick={() => updateEstado(selected.id, est)}>
                      {est}
                    </button>
                  ))}
                </div>
              </div>

              <label style={{ display: "block", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px", fontWeight: 600 }}>
                Progreso del Servicio
              </label>
              <ul className="timeline">
                {PASOS.map((paso, i) => {
                  const done   = i < pasoActual(selected.Estado_orden);
                  const active = i === pasoActual(selected.Estado_orden) - 1;
                  return (
                    <li key={paso} className="tl-item">
                      <div className={`tl-dot ${done ? "done" : active ? "active" : "pending"}`}>
                        {done ? "✓" : i + 1}
                      </div>
                      <div className="tl-content">
                        <p>{paso}</p>
                        <span>{done ? "Completado" : active ? "En curso" : "Pendiente"}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setForm(selected); setModal("edit"); }}>✏️ Editar</button>
              <button className="btn btn-ghost" onClick={close}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* NUEVO / EDITAR */}
      {(modal === "new" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === "new" ? "+ Nueva Orden de Servicio" : "✏️ Editar Servicio"}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <select value={form.clienteNombre} onChange={e => setForm(p => ({ ...p, clienteNombre: e.target.value }))}>
                    <option value="">Seleccionar cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.nombre_cl}>{c.nombre_cl}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mecánico</label>
                  <select value={form.empleadoNombre} onChange={e => setForm(p => ({ ...p, empleadoNombre: e.target.value }))}>
                    <option value="">Seleccionar mecánico...</option>
                    {empleados.map(e => <option key={e.id} value={e.nombre_em}>{e.nombre_em}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Tipo de Servicio</label>
                <input value={form.nombre_servicio || ""} onChange={e => setForm(p => ({ ...p, nombre_servicio: e.target.value }))} placeholder="Ej: Afinación completa, Cambio de frenos..." />
              </div>
              <div className="form-group">
                <label>Vehículo (marca / modelo / placa)</label>
                <input value={form.vehiculo || ""} onChange={e => setForm(p => ({ ...p, vehiculo: e.target.value }))} placeholder="Toyota Corolla 2020 · ABC-123" />
              </div>
              <div className="form-group">
                <label>Descripción del problema</label>
                <textarea value={form.descripcion || ""} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))} placeholder="Describe el problema reportado por el cliente..." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Costo estimado ($)</label>
                  <input type="number" value={form.costo_servicio || ""} onChange={e => setForm(p => ({ ...p, costo_servicio: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Duración estimada</label>
                  <input value={form.duracion_servicio || ""} onChange={e => setForm(p => ({ ...p, duracion_servicio: e.target.value }))} placeholder="Ej: 2 días" />
                </div>
              </div>
              <div className="form-group">
                <label>Estado inicial</label>
                <select value={form.Estado_orden} onChange={e => setForm(p => ({ ...p, Estado_orden: e.target.value }))}>
                  {ESTADOS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "💾 Guardar"}
              </button>
              <button className="btn btn-ghost" onClick={close}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
