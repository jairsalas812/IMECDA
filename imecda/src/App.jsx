// src/App.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { ProtectedRoute, PublicRoute, AdminRoute } from "./hooks/useProtectedRoute";
import Sidebar, { usePageTitle } from "./components/Sidebar";
import Login        from "./pages/Login";
import Dashboard    from "./pages/Dashboard";
import Clientes     from "./pages/Clientes";
import Empleados    from "./pages/Empleados";
import Servicios    from "./pages/Servicios";
import Piezas       from "./pages/Piezas";
import Cotizaciones from "./pages/Cotizaciones";
import Usuarios     from "./pages/Usuarios";
import Setup        from "./pages/Setup";

function AppShell() {
  const title = usePageTitle();
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <h2>{title}</h2>
          <div className="topbar-actions" id="topbar-portal" />
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SinPermiso() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:"12px" }}>
      <div style={{ fontSize:"48px" }}>🔒</div>
      <h2 style={{ fontFamily:"Barlow Condensed,sans-serif", fontSize:"24px", letterSpacing:"2px" }}>Acceso Restringido</h2>
      <p style={{ color:"var(--muted)", fontSize:"14px" }}>No tienes permiso para ver esta sección.</p>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Iniciando IMECDA...</p>
    </div>
  );

  return (
    <Routes>
      <Route path="/login"       element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/sin-permiso" element={<SinPermiso />} />
      <Route path="/setup"       element={<Setup />} />

      <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route index               element={<Dashboard />} />
        <Route path="clientes"     element={<Clientes />} />
        <Route path="empleados"    element={<Empleados />} />
        <Route path="servicios"    element={<Servicios />} />
        <Route path="piezas"       element={<Piezas />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="usuarios"     element={<AdminRoute><Usuarios /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}