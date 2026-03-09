// src/pages/Empleados.jsx
import { useEffect, useState } from "react";
import { EmpleadosService } from "../lib/FirestoreService";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

const ESPECIALIDADES = [
  "Motor y transmisión", "Frenos y suspensión",
  "Electricidad automotriz", "Mantenimiento general", "Carrocería y pintura",
];

const empty = {
  nombre_em: "", especialidad_em: "Motor y transmisión", telefono_em: "",
  direccion_em: "", rfc_em: "", curp_em: "", nss_em: "",
  fechaNacimiento_em: "", salario_em: "", estadoCivil_em: "Soltero", cp_em: "",
};

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(empty);
  const [saving, setSaving]       = useState(false);

  useEffect(() => EmpleadosService.suscribir(setEmpleados), []);

  const filtered = empleados.filter(e =>
    `${e.nombre_em} ${e.especialidad_em}`.toLowerCase().includes(search.toLowerCase())
  );

  const close = () => { setModal(null); setSelected(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.nombre_em) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      if (modal === "edit") {
        await EmpleadosService.actualizar(selected.id, form);
        toast.success("Empleado actualizado");
      } else {
        await EmpleadosService.crear(form);
        toast.success("Empleado registrado");
      }
      close();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
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
        <input className="search-box" placeholder="Buscar empleado, especialidad..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => { setForm(empty); setModal("new"); }}>
            <Plus size={14} /> Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Nombre</th><th>Especialidad</th><th>Teléfono</th><th>Salario</th><th>RFC</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id}>
                  <td className="text-muted">E{String(i + 1).padStart(2, "0")}</td>
                  <td><strong>{e.nombre_em}</strong></td>
                  <td>{e.especialidad_em}</td>
                  <td>{e.telefono_em}</td>
                  <td className="text-accent">${Number(e.salario_em || 0).toLocaleString()}</td>
                  <td className="text-muted" style={{ fontSize: "12px" }}>{e.rfc_em || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(e); setForm(e); setModal("edit"); }}>✏️ Editar</button>
                      <button className="btn btn-ghost btn-sm" onClick={async () => {
                        if (confirm("¿Eliminar empleado?")) {
                          await EmpleadosService.eliminar(e.id);
                          toast.success("Empleado eliminado");
                        }
                      }}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-state">Sin empleados registrados<p>Haz clic en "+ Nuevo Empleado"</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "new" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === "new" ? "+ Nuevo Empleado" : "✏️ Editar Empleado"}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <F label="Nombre completo" field="nombre_em" placeholder="Nombre y apellidos" />
                <F label="Teléfono" field="telefono_em" placeholder="81 XXXX XXXX" />
              </div>
              <div className="form-group">
                <label>Especialidad</label>
                <select value={form.especialidad_em} onChange={e => setForm(p => ({ ...p, especialidad_em: e.target.value }))}>
                  {ESPECIALIDADES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-row">
                <F label="Salario mensual ($)" field="salario_em" placeholder="0.00" type="number" />
                <div className="form-group">
                  <label>Estado Civil</label>
                  <select value={form.estadoCivil_em} onChange={e => setForm(p => ({ ...p, estadoCivil_em: e.target.value }))}>
                    {["Soltero", "Casado", "Divorciado", "Viudo"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <F label="RFC" field="rfc_em" placeholder="XXXX000000XXX" />
                <F label="CURP" field="curp_em" placeholder="18 caracteres" />
              </div>
              <div className="form-row">
                <F label="NSS" field="nss_em" placeholder="Número Seguro Social" />
                <F label="Fecha de Nacimiento" field="fechaNacimiento_em" type="date" />
              </div>
              <div className="form-row">
                <F label="Dirección" field="direccion_em" placeholder="Calle, Colonia" />
                <F label="Código Postal" field="cp_em" placeholder="64000" />
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
