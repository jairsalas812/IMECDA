// src/pages/Piezas.jsx
import { useEffect, useState } from "react";
import { PiezasService, CategoriasService } from "../lib/FirestoreService";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";

const empty = {
  sku_pieza: "", nombre_pieza: "", descripcion_pieza: "",
  id_categoria: "1", costo_pieza: "", cantidad_pieza: "",
  id_provedor: "", id_ubicacion: "",
};

const stockLevel = (qty) => {
  const n = Number(qty);
  if (n <= 2) return { cls: "low",  pct: Math.max(n * 10, 5), label: "Bajo" };
  if (n <= 8) return { cls: "mid",  pct: Math.min(n * 8, 70), label: "Medio" };
  return            { cls: "high", pct: Math.min(n * 4, 100), label: "OK" };
};

export default function Piezas() {
  const [piezas, setPiezas]         = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [search, setSearch]         = useState("");
  const [filterCat, setFilterCat]   = useState("");
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(empty);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    const u1 = PiezasService.suscribir(setPiezas);
    const u2 = CategoriasService.suscribir(setCategorias);
    return () => { u1(); u2(); };
  }, []);

  const filtered = piezas.filter(p => {
    const match = `${p.nombre_pieza} ${p.sku_pieza}`.toLowerCase().includes(search.toLowerCase());
    const cat   = !filterCat || p.id_categoria === filterCat;
    return match && cat;
  });

  const close = () => { setModal(null); setSelected(null); setForm(empty); };

  const handleSave = async () => {
    if (!form.nombre_pieza || !form.sku_pieza) {
      toast.error("SKU y nombre son obligatorios"); return;
    }
    setSaving(true);
    try {
      if (modal === "edit") {
        await PiezasService.actualizar(selected.id, form);
        toast.success("Pieza actualizada");
      } else {
        await PiezasService.crear(form);
        toast.success("Pieza registrada");
      }
      close();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  const bajosDeStock = piezas.filter(p => Number(p.cantidad_pieza) <= 3).length;
  const nombreCategoria = (id) => categorias.find(c => c.id === id)?.nombre_ca || id;

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
      {bajosDeStock > 0 && (
        <div style={{ background: "rgba(231,76,60,.1)", border: "1px solid rgba(231,76,60,.3)", borderLeft: "4px solid var(--danger)", borderRadius: "4px", padding: "12px 16px", marginBottom: "18px", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}>
          ⚠️ <strong>{bajosDeStock} pieza{bajosDeStock > 1 ? "s" : ""}</strong> con stock bajo — se recomienda reordenar
        </div>
      )}

      <div className="toolbar">
        <input className="search-box" placeholder="Buscar pieza, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre_ca}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-accent" onClick={() => { setForm(empty); setModal("new"); }}>
            <Plus size={14} /> Nueva Pieza
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>SKU</th><th>Nombre</th><th>Categoría</th><th>Costo</th><th>Cantidad</th><th>Stock</th><th>Proveedor</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const s = stockLevel(p.cantidad_pieza);
                return (
                  <tr key={p.id}>
                    <td><code style={{ background: "var(--surface2)", padding: "2px 6px", borderRadius: "2px", fontSize: "11px" }}>{p.sku_pieza}</code></td>
                    <td><strong>{p.nombre_pieza}</strong></td>
                    <td><span className="badge badge-muted">{nombreCategoria(p.id_categoria)}</span></td>
                    <td className="text-accent">${Number(p.costo_pieza || 0).toLocaleString()}</td>
                    <td><strong style={{ color: s.cls === "low" ? "var(--danger)" : "var(--text)" }}>{p.cantidad_pieza}</strong></td>
                    <td style={{ minWidth: "110px" }}>
                      <div style={{ fontSize: "10px", color: "var(--muted)", marginBottom: "3px" }}>{s.label}</div>
                      <div className="inv-bar"><div className={`inv-fill ${s.cls}`} style={{ width: `${s.pct}%` }} /></div>
                    </td>
                    <td className="text-muted" style={{ fontSize: "12px" }}>{p.id_provedor || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(p); setForm(p); setModal("edit"); }}>✏️</button>
                        <button className="btn btn-ghost btn-sm" onClick={async () => {
                          if (confirm("¿Eliminar pieza?")) {
                            await PiezasService.eliminar(p.id);
                            toast.success("Pieza eliminada");
                          }
                        }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="empty-state">Sin piezas en inventario<p>Agrega piezas al inventario</p></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(modal === "new" || modal === "edit") && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modal === "new" ? "+ Nueva Pieza" : "✏️ Editar Pieza"}</h3>
              <button className="modal-close" onClick={close}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <F label="SKU" field="sku_pieza" placeholder="FIL-001" />
                <F label="Nombre de la pieza" field="nombre_pieza" placeholder="Filtro de aceite" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.id_categoria} onChange={e => setForm(p => ({ ...p, id_categoria: e.target.value }))}>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre_ca}</option>)}
                  </select>
                </div>
                <F label="Costo unitario ($)" field="costo_pieza" placeholder="0.00" type="number" />
              </div>
              <div className="form-row">
                <F label="Cantidad en stock" field="cantidad_pieza" placeholder="0" type="number" />
                <F label="Proveedor" field="id_provedor" placeholder="Nombre del proveedor" />
              </div>
              <F label="Ubicación en almacén" field="id_ubicacion" placeholder="Ej: Estante A, Cajón 3" />
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={form.descripcion_pieza || ""}
                  onChange={e => setForm(p => ({ ...p, descripcion_pieza: e.target.value }))}
                  placeholder="Descripción, compatibilidad..."
                />
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
