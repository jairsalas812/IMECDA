// src/pages/Setup.jsx
// ─────────────────────────────────────────────────────────────────
// Página de configuración inicial — ejecutar UNA SOLA VEZ
// Acceso: /setup  (eliminar esta ruta después de usarla)
// ─────────────────────────────────────────────────────────────────
import { useState } from "react";
import { seedCompleto, UsuariosService } from "../lib/FirestoreService";
import toast from "react-hot-toast";

export default function Setup() {
  const [done, setDone] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminForm, setAdminForm] = useState({ nombre: "", correo: "", password: "" });

  const step1 = async () => {
    setLoading(true);
    try {
      await seedCompleto();
      setDone(d => [...d, "seed"]);
      toast.success("✅ Roles, permisos y categorías creados en Firestore");
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally { setLoading(false); }
  };

  const step2 = async () => {
    if (!adminForm.nombre || !adminForm.correo || !adminForm.password) {
      toast.error("Completa todos los campos"); return;
    }
    setLoading(true);
    try {
      await UsuariosService.crear({ ...adminForm, id_rol: "1" });
      setDone(d => [...d, "admin"]);
      toast.success(`✅ Administrador ${adminForm.nombre} creado`);
    } catch (err) {
      toast.error("Error: " + err.message);
    } finally { setLoading(false); }
  };

  const isDone = (step) => done.includes(step);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      <div style={{ width: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ fontSize: "42px", marginBottom: "8px" }}>⚙️</div>
          <h1 style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: "28px", fontWeight: 900, letterSpacing: "3px", color: "var(--accent)" }}>IMECDA SETUP</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>Configuración inicial del sistema — ejecutar una sola vez</p>
        </div>

        {/* PASO 1 */}
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header">
            <h3>Paso 1 — Inicializar Base de Datos</h3>
            {isDone("seed") && <span className="badge badge-success">✓ Completado</span>}
          </div>
          <div style={{ padding: "16px" }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "14px" }}>
              Crea las colecciones: <code>roles</code>, <code>permisos</code> y <code>categorias</code> con datos iniciales.
            </p>
            <button className="btn btn-accent" onClick={step1} disabled={loading || isDone("seed")}>
              {isDone("seed") ? "✓ Ya ejecutado" : "▶ Ejecutar Seed"}
            </button>
          </div>
        </div>

        {/* PASO 2 */}
        <div className="card" style={{ marginBottom: "16px" }}>
          <div className="card-header">
            <h3>Paso 2 — Crear Administrador</h3>
            {isDone("admin") && <span className="badge badge-success">✓ Completado</span>}
          </div>
          <div style={{ padding: "16px" }}>
            <div className="form-group"><label>Nombre</label><input value={adminForm.nombre} onChange={e => setAdminForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Raúl Montalvo González" /></div>
            <div className="form-group"><label>Correo</label><input type="email" value={adminForm.correo} onChange={e => setAdminForm(p => ({ ...p, correo: e.target.value }))} placeholder="admin@ramgo.mx" /></div>
            <div className="form-group"><label>Contraseña (mín. 8 caracteres)</label><input type="password" value={adminForm.password} onChange={e => setAdminForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" /></div>
            <button className="btn btn-accent" onClick={step2} disabled={loading || isDone("admin") || !isDone("seed")}>
              {isDone("admin") ? "✓ Admin creado" : "▶ Crear Administrador"}
            </button>
          </div>
        </div>

        {/* LISTO */}
        {isDone("seed") && isDone("admin") && (
          <div style={{ background: "rgba(39,174,96,.1)", border: "1px solid rgba(39,174,96,.3)", borderRadius: "4px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px" }}>🎉</div>
            <p style={{ color: "#2ecc71", fontWeight: 700, margin: "8px 0 4px" }}>¡Sistema configurado!</p>
            <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "14px" }}>
              Ahora elimina la ruta <code>/setup</code> de App.jsx por seguridad
            </p>
            <a href="/login" className="btn btn-accent">→ Ir al Login</a>
          </div>
        )}
      </div>
    </div>
  );
}
