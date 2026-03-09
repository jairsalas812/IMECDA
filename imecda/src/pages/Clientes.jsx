// src/pages/Clientes.jsx
import { useEffect, useState } from "react";
import { ClientesService } from "../lib/FirestoreService";
import toast from "react-hot-toast";
import { Plus, Eye, Trash2 } from "lucide-react";

const empty = {
  nombre_cl: "", rfc_cl: "", telefono_cliente: "", correo_cliente: "",
  direccion_cliente: "", modelo_cliente: "", placas_cliente: "",
  ano_cl: "", cp_cl: "", color_cl: "", numeroserie_cl: "",
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null); // 'new' | 'view' | 'edit'
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(empty);
  const [saving, setSaving]     = useState(false);

  useEffect(() => ClientesService.suscribir(setClientes), []);

  const filtered = clientes.filter(c =>
    `${c.nombre_cl} ${c.modelo_cliente} ${c.placas_cliente} ${c.telefono_cliente}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const close = () => { setModal(null); setSelected(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.nombre_cl || !form.telefono_cliente) {
      toast.error("Nombre y teléfono son obligatorios"); return;
    }
    setSaving(true);
    try {
      if (modal === "edit") {
        await ClientesService.actualizar(selected.id, form);
        toast.success("Cliente actualizado");
      } else {
        await ClientesService.crear(form);
        toast.success("Cliente registrado");
      }
      close();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await ClientesService.eliminar(id);
    toast.success("Cliente eliminado");
    close();
  };

  const F = ({ label, field, placeholder, type = "text" }) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={form[field] || ""}
        onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="animate-slideIn">
      <div className="toolbar">
        <input
          className="search-box"
          placeholder="Buscar cliente, placa, modelo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => { setForm(empty); setModal("new"); }}>
            <Plus size={14} /> Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Nombre</th><th>Teléfono</th><th>Vehículo</th>
                <th>Placas</th><th>Año</th><th>Color</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}>
                  <td className="text-muted">{String(i + 1).padStart(3, "0")}</td>
                  <td><strong>{c.nombre_cl}</strong></td>
                  <td>{c.telefono_cliente}</td>
                  <td>{c.modelo_cliente}</td>
                  <td>
                    <code style={{ background: "var(--surface2)", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>
                      {c.placas_cliente}
                    </code>
                  </td>
                  <td>{c.ano_cl}</td>
                  <td>{c.color_cl}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(c); setModal("view"); }}>
                        <Eye size={12} /> Ver
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(c); setForm(c); setModal("edit"); }}>✏️</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-state">Sin clientes registrados<p>Haz clic en "+ Nuevo Cliente"</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NUEVO / EDITAR */}
      {(modal === "new" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === "new" ? "+ Nuevo Cliente" : "✏️ Editar Cliente"}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <F label="Nombre completo" field="nombre_cl" placeholder="Nombre y apellidos" />
                <F label="RFC" field="rfc_cl" placeholder="XXXX000000XXX" />
              </div>
              <div className="form-row">
                <F label="Teléfono" field="telefono_cliente" placeholder="81 XXXX XXXX" />
                <F label="Correo electrónico" field="correo_cliente" placeholder="correo@email.com" type="email" />
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input value={form.direccion_cliente || ""} onChange={e => setForm(p => ({ ...p, direccion_cliente: e.target.value }))} placeholder="Calle, Colonia, Ciudad" />
              </div>
              <div style={{ height: "1px", background: "var(--border)", margin: "4px 0 16px" }} />
              <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "14px", fontWeight: 600 }}>
                🚗 Datos del Vehículo
              </div>
              <div className="form-row">
                <F label="Marca / Modelo" field="modelo_cliente" placeholder="Toyota Corolla" />
                <F label="Año" field="ano_cl" placeholder="2020" />
              </div>
              <div className="form-row">
                <F label="Placas" field="placas_cliente" placeholder="ABC-123" />
                <F label="Color" field="color_cl" placeholder="Blanco" />
              </div>
              <div className="form-row">
                <F label="Código Postal" field="cp_cl" placeholder="64000" />
                <F label="Número de Serie (VIN)" field="numeroserie_cl" placeholder="17 caracteres" />
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

      {/* MODAL VER */}
      {modal === "view" && selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>👤 {selected.nombre_cl}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>Nombre</label><input readOnly value={selected.nombre_cl || "—"} /></div>
                <div className="form-group"><label>RFC</label><input readOnly value={selected.rfc_cl || "—"} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Teléfono</label><input readOnly value={selected.telefono_cliente || "—"} /></div>
                <div className="form-group"><label>Correo</label><input readOnly value={selected.correo_cliente || "—"} /></div>
              </div>
              <div className="form-group"><label>Dirección</label><input readOnly value={selected.direccion_cliente || "—"} /></div>
              <div style={{ height: "1px", background: "var(--border)", margin: "4px 0 16px" }} />
              <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>🚗 Vehículo</div>
              <div className="form-row">
                <div className="form-group"><label>Modelo</label><input readOnly value={selected.modelo_cliente || "—"} /></div>
                <div className="form-group"><label>Año</label><input readOnly value={selected.ano_cl || "—"} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Placas</label><input readOnly value={selected.placas_cliente || "—"} /></div>
                <div className="form-group"><label>Color</label><input readOnly value={selected.color_cl || "—"} /></div>
              </div>
              <div className="form-group"><label>N° de Serie (VIN)</label><input readOnly value={selected.numeroserie_cl || "—"} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost btn-sm" onClick={() => { setForm(selected); setModal("edit"); }}>✏️ Editar</button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}><Trash2 size={12} /> Eliminar</button>
              <button className="btn btn-ghost" onClick={close}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
