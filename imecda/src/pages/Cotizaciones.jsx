// src/pages/Cotizaciones.jsx
import { useEffect, useState } from "react";
import { CotizacionesService, ClientesService, EmpleadosService, ServiciosService } from "../lib/FirestoreService";
import toast from "react-hot-toast";
import { Plus, Printer } from "lucide-react";

const badgeClass = s => ({
  true:  "badge-success",
  false: "badge-warning",
}[String(s)] || "badge-muted");

const estadoLabel = (s) => s === true ? "Aprobada" : "Pendiente";

const emptyForm = {
  id_cliente: "", clienteNombre: "",
  id_empleado: "", empleadoNombre: "",
  id_servicio: "", vehiculo: "",
  items: [{ descripcion: "", cantidad: 1, precioUnitario: 0 }],
};

export default function Cotizaciones() {
  const [cots, setCots]         = useState([]);
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const u1 = CotizacionesService.suscribir(setCots);
    const u2 = ClientesService.suscribir(setClientes);
    const u3 = EmpleadosService.suscribir(setEmpleados);
    const u4 = ServiciosService.suscribir(setServicios);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  const filtered = cots.filter(c =>
    `${c.clienteNombre} ${c.empleadoNombre}`.toLowerCase().includes(search.toLowerCase())
  );

  const close = () => { setModal(null); setSelected(null); setForm(emptyForm); };

  const calcTotal = (items) =>
    (items || []).reduce((a, i) => a + Number(i.cantidad) * Number(i.precioUnitario), 0);

  const addItem    = () => setForm(p => ({ ...p, items: [...p.items, { descripcion: "", cantidad: 1, precioUnitario: 0 }] }));
  const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, field, val) =>
    setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [field]: val } : it) }));

  const handleSave = async () => {
    if (!form.id_cliente) { toast.error("Selecciona un cliente"); return; }
    setSaving(true);
    try {
      await CotizacionesService.crear({
        ...form,
        total: calcTotal(form.items),
        estado_cotizacion: false,
      });
      toast.success("Cotización guardada");
      close();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const toggleAprobada = async (c) => {
    if (c.estado_cotizacion) {
      await CotizacionesService.rechazar(c.id);
      toast.success("Cotización marcada como pendiente");
    } else {
      await CotizacionesService.aprobar(c.id);
      toast.success("Cotización aprobada");
    }
  };

  return (
    <div className="animate-slideIn">
      <div className="toolbar">
        <input className="search-box" placeholder="Buscar cotización, cliente..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => { setForm(emptyForm); setModal("new"); }}>
            <Plus size={14} /> Nueva Cotización
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Folio</th><th>Cliente</th><th>Empleado</th><th>Servicio</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td><strong>COT-{String(i + 1).padStart(3, "0")}</strong></td>
                  <td>{c.clienteNombre}</td>
                  <td className="text-muted">{c.empleadoNombre || "—"}</td>
                  <td className="text-muted" style={{ fontSize: "12px" }}>{c.vehiculo || "—"}</td>
                  <td className="text-accent fw700">${Number(c.total || 0).toLocaleString()}</td>
                  <td><span className={`badge ${badgeClass(c.estado_cotizacion)}`}>{estadoLabel(c.estado_cotizacion)}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setSelected({ ...c, folio: `COT-${String(i + 1).padStart(3, "0")}` });
                        setModal("ticket");
                      }}><Printer size={12} /> Ticket</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleAprobada(c)}>
                        {c.estado_cotizacion ? "↩️" : "✅"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-state">Sin cotizaciones registradas<p>Crea una nueva cotización</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TICKET */}
      {modal === "ticket" && selected && (() => {
        const items    = selected.items || [];
        const subtotal = calcTotal(items);
        const iva      = Math.round(subtotal * 0.16);
        const total    = subtotal + iva;
        return (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
            <div className="modal">
              <div className="modal-header">
                <h3>🖨 Nota de Pago</h3>
                <button className="modal-close" onClick={close}>✕</button>
              </div>
              <div className="modal-body">
                <div className="ticket">
                  <div className="ticket-header">
                    <h2>⚙ RAMGO</h2>
                    <p>Taller Automotriz · 5a. Zona, Caracol, Monterrey N.L.</p>
                    <p>Tel: 81-2345-6789</p>
                  </div>
                  <div className="ticket-row"><span><strong>Folio:</strong></span><span className="text-accent">{selected.folio}</span></div>
                  <div className="ticket-row"><span><strong>Cliente:</strong></span><span>{selected.clienteNombre}</span></div>
                  {selected.vehiculo && <div className="ticket-row"><span><strong>Vehículo:</strong></span><span>{selected.vehiculo}</span></div>}
                  {selected.empleadoNombre && <div className="ticket-row"><span><strong>Mecánico:</strong></span><span>{selected.empleadoNombre}</span></div>}
                  <div className="ticket-row">
                    <span><strong>Estado:</strong></span>
                    <span><span className={`badge ${badgeClass(selected.estado_cotizacion)}`}>{estadoLabel(selected.estado_cotizacion)}</span></span>
                  </div>

                  <div className="ticket-divider" />
                  <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)" }}>
                    Detalle de Servicios
                  </div>
                  {items.length > 0
                    ? items.map((it, i) => (
                      <div key={i} className="ticket-row">
                        <span>{it.descripcion} {it.cantidad > 1 ? `(x${it.cantidad})` : ""}</span>
                        <span>${(Number(it.cantidad) * Number(it.precioUnitario)).toLocaleString()}</span>
                      </div>
                    ))
                    : <div style={{ color: "var(--muted)", fontSize: "12px" }}>Sin items detallados</div>
                  }

                  <div className="ticket-divider" />
                  <div className="ticket-row"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
                  <div className="ticket-row"><span>IVA (16%)</span><span>${iva.toLocaleString()}</span></div>
                  <div className="ticket-row ticket-total"><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
                  <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "var(--muted)" }}>
                    ¡Gracias por su preferencia!<br />Taller Mecánico RAMGO
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-accent" onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
                <button className="btn btn-ghost" onClick={close}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NUEVA COTIZACIÓN */}
      {modal === "new" && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>+ Nueva Cotización</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Cliente</label>
                  <select value={form.id_cliente} onChange={e => {
                    const c = clientes.find(c => c.id === e.target.value);
                    setForm(p => ({ ...p, id_cliente: e.target.value, clienteNombre: c?.nombre_cl || "" }));
                  }}>
                    <option value="">Seleccionar...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_cl}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Mecánico</label>
                  <select value={form.id_empleado} onChange={e => {
                    const em = empleados.find(em => em.id === e.target.value);
                    setForm(p => ({ ...p, id_empleado: e.target.value, empleadoNombre: em?.nombre_em || "" }));
                  }}>
                    <option value="">Seleccionar...</option>
                    {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre_em}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Servicio relacionado</label>
                  <select value={form.id_servicio} onChange={e => setForm(p => ({ ...p, id_servicio: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {servicios.map(s => <option key={s.id} value={s.id}>{s.nombre_servicio}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vehículo</label>
                  <input value={form.vehiculo} onChange={e => setForm(p => ({ ...p, vehiculo: e.target.value }))} placeholder="Toyota Corolla 2020 · ABC-123" />
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>
                    Servicios / Piezas
                  </label>
                  <button className="btn btn-ghost btn-sm" onClick={addItem}>+ Agregar línea</button>
                </div>
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 32px", gap: "1px", background: "var(--border)" }}>
                    {["Descripción", "Cant.", "Precio", ""].map(h => (
                      <div key={h} style={{ background: "var(--surface2)", padding: "7px 10px", fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>{h}</div>
                    ))}
                  </div>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 100px 32px", gap: "1px", background: "var(--border)" }}>
                      <input style={{ background: "var(--bg)", border: "none", padding: "8px 10px", color: "var(--text)", fontSize: "13px", outline: "none" }}
                        value={item.descripcion} onChange={e => updateItem(idx, "descripcion", e.target.value)} placeholder="Descripción..." />
                      <input style={{ background: "var(--bg)", border: "none", padding: "8px 10px", color: "var(--text)", fontSize: "13px", outline: "none", textAlign: "center" }}
                        type="number" value={item.cantidad} onChange={e => updateItem(idx, "cantidad", e.target.value)} min="1" />
                      <input style={{ background: "var(--bg)", border: "none", padding: "8px 10px", color: "var(--accent)", fontSize: "13px", outline: "none", textAlign: "right" }}
                        type="number" value={item.precioUnitario} onChange={e => updateItem(idx, "precioUnitario", e.target.value)} placeholder="0" />
                      <button onClick={() => removeItem(idx)} style={{ background: "var(--bg)", border: "none", color: "var(--muted)", fontSize: "18px", cursor: "pointer" }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 0", gap: "16px", fontSize: "13px" }}>
                  <span className="text-muted">Subtotal:</span>
                  <span className="text-accent fw700">${calcTotal(form.items).toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : "💾 Guardar Cotización"}
              </button>
              <button className="btn btn-ghost" onClick={close}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
