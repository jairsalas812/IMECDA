// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [correo, setCorreo]       = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [showPass, setShowPass]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!correo || !password) { setError("Ingresa correo y contraseña"); return; }
    setLoading(true);
    try {
      await login(correo, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msgs = {
        "auth/user-not-found":    "Usuario no encontrado",
        "auth/wrong-password":    "Contraseña incorrecta",
        "auth/invalid-email":     "Correo inválido",
        "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
        "auth/user-disabled":     "Usuario deshabilitado",
      };
      setError(msgs[err.code] || err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--bg)",
      backgroundImage: `repeating-linear-gradient(0deg,transparent,transparent 39px,#2a3050 39px,#2a3050 40px),
                        repeating-linear-gradient(90deg,transparent,transparent 39px,#2a3050 39px,#2a3050 40px)`,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderTop: "3px solid var(--accent)", borderRadius: "4px",
        padding: "48px 52px", width: "420px",
        boxShadow: "0 32px 80px rgba(0,0,0,.6)",
        animation: "fadeUp .35s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
          <span style={{ fontSize: "38px" }}>⚙️</span>
          <div>
            <div style={{ fontFamily: "Barlow Condensed,sans-serif", fontSize: "30px", fontWeight: 900, letterSpacing: "3px", color: "var(--accent)", lineHeight: 1 }}>IMECDA</div>
            <div style={{ fontSize: "10px", color: "var(--muted)", letterSpacing: "1px", textTransform: "uppercase", marginTop: "3px" }}>Taller Mecánico RAMGO</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", borderLeft: "3px solid #e74c3c", borderRadius: "3px", padding: "10px 14px", marginBottom: "20px", fontSize: "13px", color: "#e74c3c" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Correo */}
          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email" value={correo} autoFocus
              onChange={e => setCorreo(e.target.value)}
              placeholder="correo@ramgo.mx"
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <div className="form-group" style={{ marginBottom: "28px", position: "relative" }}>
            <label>Contraseña</label>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              style={{ paddingRight: "44px" }}
            />
            <button type="button" onClick={() => setShowPass(p => !p)}
              style={{ position: "absolute", right: "12px", bottom: "10px", background: "none", border: "none", color: "var(--muted)", fontSize: "16px", cursor: "pointer", padding: 0 }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>

          <button type="submit" className="btn btn-accent"
            style={{ width: "100%", justifyContent: "center", padding: "13px", fontSize: "15px" }}
            disabled={loading}>
            {loading ? "Verificando..." : "→ Entrar al Sistema"}
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "11px", color: "var(--muted)", textAlign: "center", lineHeight: 1.7 }}>
          Acceso restringido al personal autorizado.<br />
          Contacta al administrador si no puedes ingresar.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
