// src/pages/Usuarios.jsx
// Solo accesible para Administrador
import { useEffect, useState } from "react";
import { UsuariosService } from "../lib/FirestoreService";
import { useAuth } from "../lib/AuthContext";
import toast from "react-hot-toast";
import { Plus, UserCheck, UserX } from "lucide-react";

const empty = { nombre: "", correo: "", password: "", id_rol: "2", documento: "" };

export default function Usuarios() {
  const { perfil: miPerfil } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = UsuariosService.getAll(setUsuarios);
    return unsub;
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.correo || !form.password) {
      toast.error("Nombre, correo y contraseña son obligatorios"); return;
    }
    if (form.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres"); return;
    }
    setSaving(true);
    try {
      await UsuariosService.crear(form);
      toast.success(`Usuario ${form.nombre} creado exitosamente`);
      setForm(empty);
      setShowForm(false);
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/weak-password": "Contraseña muy débil (mínimo 8 caracteres)",
        "auth/invalid-email": "Correo inválido",
      };
      toast.error(msgs[err.code] || "Error al crear usuario");
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (uid, estadoActual, nombre) => {
    if (uid === miPerfil?.IdUsuario) { toast.error("No puedes desactivarte a ti mismo"); return; }
    if (estadoActual) {
      await UsuariosService.desactivar(uid);
      toast.success(`${nombre} desactivado`);
    } else {
      await UsuariosService.activar(uid);
      toast.success(`${nombre} activado`);
    }
  };

  return (
    <div className="animate-slideIn">
      <div className="toolbar">
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => setShowForm(s => !s)}>
            <Plus size={14} /> Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Formulario inline de creación */}
      {showForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div className="card-header"><h3>Crear Nuevo Usuario</h3></div>
          <form onSubmit={handleCrear} style={{ padding: "20px" }}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del usuario" required />
              </div>
              <div className="form-group">
                <label>Correo electrónico</label>
                <input type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} placeholder="correo@ramgo.mx" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Contraseña (mín. 8 caracteres)</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" required minLength={8} />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select value={form.id_rol} onChange={e => setForm(p => ({ ...p, id_rol: e.target.value }))}>
                  <option value="1">Administrador</option>
                  <option value="2">Empleado</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Documento (RFC / INE)</label>
              <input value={form.documento} onChange={e => setForm(p => ({ ...p, documento: e.target.value }))} placeholder="Opcional" />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setForm(empty); }}>Cancelar</button>
              <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Creando..." : "💾 Crear Usuario"}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr key={u.id}>
                  <td className="text-muted">{String(i + 1).padStart(2, "0")}</td>
                  <td><strong>{u.Nombre_us}</strong>{u.id === miPerfil?.IdUsuario && <span style={{ fontSize: "10px", color: "var(--accent)", marginLeft: "6px" }}>(tú)</span>}</td>
                  <td className="text-muted">{u.correo_us}</td>
                  <td><span className={`badge ${u.id_rol === "1" ? "badge-warning" : "badge-info"}`}>{u.id_rol === "1" ? "Administrador" : "Empleado"}</span></td>
                  <td><span className={`badge ${u.estado ? "badge-success" : "badge-danger"}`}>{u.estado ? "Activo" : "Inactivo"}</span></td>
                  <td className="text-muted" style={{ fontSize: "11px" }}>{u.FechaCreacion_us?.toDate?.()?.toLocaleDateString("es-MX") || "—"}</td>
                  <td>
                    <button
                      className={`btn btn-ghost btn-sm`}
                      onClick={() => toggleEstado(u.id, u.estado, u.Nombre_us)}
                      disabled={u.id === miPerfil?.IdUsuario}
                    >
                      {u.estado ? <><UserX size={12} /> Desactivar</> : <><UserCheck size={12} /> Activar</>}
                    </button>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={7} className="empty-state">Sin usuarios registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
