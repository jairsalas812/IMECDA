// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { ServiciosService, ClientesService, PiezasService } from "../lib/FirestoreService";

const statusBadge = (s) => {
  const map = {
    "En proceso": "badge-warning",
    "Diagnóstico": "badge-info",
    "Listo": "badge-success",
    "Entregado": "badge-muted",
  };
  return map[s] || "badge-muted";
};

export default function Dashboard() {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes]   = useState([]);
  const [piezas, setPiezas]       = useState([]);

  useEffect(() => {
    const u1 = ServiciosService.suscribir(setServicios);
    const u2 = ClientesService.suscribir(setClientes);
    const u3 = PiezasService.suscribir(setPiezas);
    return () => { u1(); u2(); u3(); };
  }, []);

  const activos   = servicios.filter(s => s.Estado_orden === "En proceso" || s.Estado_orden === "Diagnóstico").length;
  const ingresos  = servicios.reduce((a, s) => a + (Number(s.costo_servicio) || 0), 0);
  const stockBajo = piezas.filter(p => Number(p.cantidad_pieza) <= 3).length;
  const listos    = servicios.filter(s => s.Estado_orden === "Listo").length;

  return (
    <div className="animate-slideIn">
      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Servicios Activos</div>
          <div className="kpi-value">{activos}</div>
          <div className="kpi-sub">{listos} listos para entrega</div>
          <div className="kpi-icon">🚗</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Clientes Registrados</div>
          <div className="kpi-value">{clientes.length}</div>
          <div className="kpi-sub">En base de datos</div>
          <div className="kpi-icon">👤</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-label">Ingresos Totales</div>
          <div className="kpi-value">${ingresos.toLocaleString()}</div>
          <div className="kpi-sub">{servicios.length} servicios registrados</div>
          <div className="kpi-icon">💰</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-label">Piezas Stock Bajo</div>
          <div className="kpi-value">{stockBajo}</div>
          <div className="kpi-sub">Requieren reorden</div>
          <div className="kpi-icon">⚠️</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Servicios recientes */}
        <div className="card">
          <div className="card-header">
            <h3>Servicios Recientes</h3>
            <span className="badge badge-warning">En tiempo real</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th><th>Servicio</th><th>Mecánico</th><th>Costo</th><th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {servicios.slice(0, 6).map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.clienteNombre}</strong></td>
                    <td>{s.nombre_servicio}</td>
                    <td className="text-muted">{s.empleadoNombre}</td>
                    <td className="text-accent fw700">${Number(s.costo_servicio || 0).toLocaleString()}</td>
                    <td><span className={`badge ${statusBadge(s.Estado_orden)}`}>{s.Estado_orden}</span></td>
                  </tr>
                ))}
                {servicios.length === 0 && (
                  <tr><td colSpan={5} className="empty-state">Sin servicios registrados aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estado del taller */}
        <div className="card">
          <div className="card-header"><h3>Estado del Taller</h3></div>
          <div style={{ padding: "20px" }}>
            {[
              { label: "Capacidad utilizada",   val: Math.min(activos / 6, 1),                                    txt: `${activos}/6 bahías` },
              { label: "Servicios completados",  val: listos / Math.max(servicios.length, 1),                     txt: `${listos} listos` },
              { label: "Inventario saludable",   val: (piezas.length - stockBajo) / Math.max(piezas.length, 1),   txt: `${piezas.length - stockBajo}/${piezas.length} piezas` },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                  <span>{item.label}</span>
                  <span className="text-accent fw700">{item.txt}</span>
                </div>
                <div className="inv-bar">
                  <div className="inv-fill high" style={{ width: `${item.val * 100}%` }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: "20px", padding: "14px", background: "var(--bg)", borderRadius: "3px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "10px", fontWeight: 600 }}>
                Distribución por Estado
              </div>
              {["En proceso", "Diagnóstico", "Listo", "Entregado"].map(est => (
                <div key={est} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "4px 0" }}>
                  <span>{est}</span>
                  <span className={`badge ${statusBadge(est)}`}>
                    {servicios.filter(s => s.Estado_orden === est).length}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
