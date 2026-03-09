// src/components/Sidebar.jsx
// ─────────────────────────────────────────────────────────────────
// Sidebar dinámico — solo muestra los menús que el rol permite
// ─────────────────────────────────────────────────────────────────
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { LayoutDashboard, Users, Wrench, Car, Package, FileText, UserCog, LogOut } from "lucide-react";

// Mapa de todos los menús posibles
const ALL_MENUS = [
  { menu: "Dashboard",    path: "/",             icon: LayoutDashboard, section: "Principal" },
  { menu: "Clientes",     path: "/clientes",     icon: Users,           section: "Gestión" },
  { menu: "Empleados",    path: "/empleados",    icon: Wrench,          section: null },
  { menu: "Servicios",    path: "/servicios",    icon: Car,             section: null },
  { menu: "Inventario",   path: "/piezas",       icon: Package,         section: null },
  { menu: "Cotizaciones", path: "/cotizaciones", icon: FileText,        section: "Finanzas" },
  { menu: "Usuarios",     path: "/usuarios",     icon: UserCog,         section: "Administración" },
];

const PAGE_TITLES = {
  "/":             "Dashboard",
  "/clientes":     "Clientes",
  "/empleados":    "Empleados",
  "/servicios":    "Servicios en Taller",
  "/piezas":       "Inventario de Piezas",
  "/cotizaciones": "Cotizaciones y Notas de Pago",
  "/usuarios":     "Gestión de Usuarios",
};

export function usePageTitle() {
  const { pathname } = useLocation();
  return PAGE_TITLES[pathname] || "IMECDA";
}

export default function Sidebar() {
  const { perfil, rol, tienePermiso, logout } = useAuth();
  const navigate  = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Filtra los menús según los permisos del usuario
  const menusVisibles = ALL_MENUS.filter(m => tienePermiso(m.menu));

  const iniciales = (perfil?.Nombre_us || perfil?.correo_us || "U")
    .slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>⚙ IMECDA</h1>
        <p>Sistema de Gestión</p>
      </div>

      {/* Usuario actual */}
      <div className="sidebar-user">
        <div className="avatar">{iniciales}</div>
        <div className="sidebar-user-info">
          <p>{perfil?.Nombre_us || "Usuario"}</p>
          <span>{rol?.Description || "Cargando..."}</span>
        </div>
      </div>

      {/* Navegación dinámica por permisos */}
      <nav className="sidebar-nav">
        {menusVisibles.map((item) => {
          const isActive = pathname === item.path;
          const prevItem = menusVisibles[menusVisibles.indexOf(item) - 1];
          const showSection = item.section && item.section !== prevItem?.section;

          return (
            <div key={item.path}>
              {showSection && (
                <div className="nav-section">{item.section}</div>
              )}
              <div
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                {item.menu}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
