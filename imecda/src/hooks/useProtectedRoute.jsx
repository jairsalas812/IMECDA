// src/hooks/useProtectedRoute.jsx
// ─────────────────────────────────────────────────────────────────
// Protege rutas según autenticación y permisos de menú
// ─────────────────────────────────────────────────────────────────
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

// Ruta solo para usuarios autenticados
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

// Ruta protegida por permiso de menú específico
export function PermissionRoute({ children, menu }) {
  const { tienePermiso, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;
  if (!tienePermiso(menu)) return <Navigate to="/sin-permiso" replace />;
  return children;
}

// Ruta solo para admins
export function AdminRoute({ children }) {
  const { esAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!esAdmin) return <Navigate to="/sin-permiso" replace />;
  return children;
}

// Redirige si ya está logueado
export function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", gap: "16px"
    }}>
      <div style={{
        width: "36px", height: "36px",
        border: "3px solid #2a3050",
        borderTopColor: "#f0a500",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite"
      }} />
      <p style={{ color: "#7a8299", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>
        Cargando sistema...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
