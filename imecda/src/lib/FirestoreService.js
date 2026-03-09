// src/lib/FirestoreService.js
// ─────────────────────────────────────────────────────────────────
// Todas las operaciones de Firestore organizadas por colección,
// respetando exactamente el diagrama UML del sistema IMECDA.
// ─────────────────────────────────────────────────────────────────
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, onSnapshot,
  serverTimestamp, writeBatch,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  updatePassword,
  deleteUser as deleteAuthUser,
} from "firebase/auth";
import { db, auth } from "./firebase";

// ══════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════
const col = (name) => collection(db, name);
const docRef = (name, id) => doc(db, name, id);

// Suscripción en tiempo real (retorna unsubscribe)
export const suscribir = (colName, callback, ...queryConstraints) => {
  const q = queryConstraints.length
    ? query(col(colName), ...queryConstraints)
    : query(col(colName), orderBy("creadoEn", "desc"));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
};

// ══════════════════════════════════════════════════════════════════
// ROLES  (colección: roles)
// Campos: id_rol, Description, FechaCreacion
// ══════════════════════════════════════════════════════════════════
export const RolesService = {
  // Seed inicial de roles (ejecutar una vez)
  seedRoles: async () => {
    const roles = [
      { id: "1", Description: "Administrador", FechaCreacion: serverTimestamp() },
      { id: "2", Description: "Empleado",      FechaCreacion: serverTimestamp() },
    ];
    for (const r of roles) {
      await setDoc(docRef("roles", r.id), r);
    }
  },

  getAll: async () => {
    const snap = await getDocs(col("roles"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ══════════════════════════════════════════════════════════════════
// PERMISOS  (colección: permisos)
// Campos: id_permiso, id_rol, NombreMenu, fechaCreacion
// ══════════════════════════════════════════════════════════════════
const MENUS_ADMIN    = ["Dashboard", "Clientes", "Empleados", "Servicios", "Inventario", "Cotizaciones", "Usuarios"];
const MENUS_EMPLEADO = ["Dashboard", "Clientes", "Servicios", "Cotizaciones"];

export const PermisosService = {
  // Seed inicial de permisos
  seedPermisos: async () => {
    const batch = writeBatch(db);
    MENUS_ADMIN.forEach((menu, i) => {
      batch.set(docRef("permisos", `admin_${i}`), {
        id_rol: "1", NombreMenu: menu, fechaCreacion: serverTimestamp(),
      });
    });
    MENUS_EMPLEADO.forEach((menu, i) => {
      batch.set(docRef("permisos", `emp_${i}`), {
        id_rol: "2", NombreMenu: menu, fechaCreacion: serverTimestamp(),
      });
    });
    await batch.commit();
  },

  getPorRol: async (id_rol) => {
    const q = query(col("permisos"), where("id_rol", "==", id_rol));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ══════════════════════════════════════════════════════════════════
// USUARIOS  (colección: usuarios)
// El ID del documento = UID de Firebase Auth
// Campos: IdUsuario, Documento, Nombre_us, correo_us,
//         id_rol, estado, FechaCreacion_us
// ══════════════════════════════════════════════════════════════════
export const UsuariosService = {
  // Crear usuario en Auth + Firestore
  crear: async ({ nombre, correo, password, id_rol, documento }) => {
    const cred = await createUserWithEmailAndPassword(auth, correo, password);
    await setDoc(docRef("users", cred.user.uid), {
      IdUsuario:        cred.user.uid,
      Documento:        documento || "",
      Nombre_us:        nombre,
      correo_us:        correo,
      id_rol:           id_rol,     // "1" = Admin, "2" = Empleado
      estado:           true,
      FechaCreacion_us: serverTimestamp(),
    });
    return cred.user.uid;
  },

  // Actualizar datos (no cambia contraseña ni email de Auth)
  actualizar: async (uid, data) => {
    await updateDoc(docRef("users", uid), {
      ...data,
      actualizadoEn: serverTimestamp(),
    });
  },

  // Desactivar (soft delete — nunca borrar usuarios de Auth)
  desactivar: async (uid) => {
    await updateDoc(docRef("users", uid), { estado: false });
  },

  activar: async (uid) => {
    await updateDoc(docRef("users", uid), { estado: true });
  },

  getAll: () => suscribir("users"),

  getOne: async (uid) => {
    const snap = await getDoc(docRef("users", uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  },
};

// ══════════════════════════════════════════════════════════════════
// EMPLEADOS  (colección: empleados)
// Campos: id_empleado, nombre_em, especialidad_em, telefono_em,
//         id_orden(FK), fechaCreacion_em, direccion_em, rfc_em,
//         curp_em, nss_em, fechaNacimiento_em, salario_em,
//         estadoCivil_em, cp_em, id_usuario(FK)
// ══════════════════════════════════════════════════════════════════
export const EmpleadosService = {
  crear: async (data) =>
    addDoc(col("empleados"), { ...data, fechaCreacion_em: serverTimestamp() }),

  actualizar: async (id, data) =>
    updateDoc(docRef("empleados", id), { ...data, actualizadoEn: serverTimestamp() }),

  eliminar: async (id) => deleteDoc(docRef("empleados", id)),

  suscribir: (cb) => suscribir("empleados", cb, orderBy("fechaCreacion_em", "desc")),

  getAll: async () => {
    const snap = await getDocs(query(col("empleados"), orderBy("fechaCreacion_em", "desc")));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ══════════════════════════════════════════════════════════════════
// CLIENTES  (colección: clientes)
// Campos: id_cliente, nombre_cl, rfc_cl, telefono_cliente,
//         correo_cliente, direccion_cliente, modelo_cliente,
//         placas_cliente, ano_cl, cp_cl, color_cl, numeroserie_cl
// ══════════════════════════════════════════════════════════════════
export const ClientesService = {
  crear: async (data) =>
    addDoc(col("clientes"), { ...data, creadoEn: serverTimestamp() }),

  actualizar: async (id, data) =>
    updateDoc(docRef("clientes", id), { ...data, actualizadoEn: serverTimestamp() }),

  eliminar: async (id) => deleteDoc(docRef("clientes", id)),

  suscribir: (cb) => suscribir("clientes", cb, orderBy("creadoEn", "desc")),
};

// ══════════════════════════════════════════════════════════════════
// SERVICIOS  (colección: servicios)
// Campos: id_servicio, Estado_orden, nombre_servicio,
//         costo_servicio, duracion_servicio,
//         fechaCreacion_se, fechaModificacion_se
// ══════════════════════════════════════════════════════════════════
export const ServiciosService = {
  crear: async (data) =>
    addDoc(col("servicios"), {
      ...data,
      Estado_orden:      data.Estado_orden || "Diagnóstico",
      fechaCreacion_se:  serverTimestamp(),
      fechaModificacion_se: serverTimestamp(),
    }),

  actualizar: async (id, data) =>
    updateDoc(docRef("servicios", id), {
      ...data,
      fechaModificacion_se: serverTimestamp(),
    }),

  actualizarEstado: async (id, nuevoEstado) =>
    updateDoc(docRef("servicios", id), {
      Estado_orden: nuevoEstado,
      fechaModificacion_se: serverTimestamp(),
    }),

  eliminar: async (id) => deleteDoc(docRef("servicios", id)),

  suscribir: (cb) => suscribir("servicios", cb, orderBy("fechaCreacion_se", "desc")),

  porEstado: async (estado) => {
    const q = query(col("servicios"), where("Estado_orden", "==", estado));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ══════════════════════════════════════════════════════════════════
// PIEZAS  (colección: piezas)
// Campos: id_pieza, sku_pieza, nombre_pieza, descripcion_pieza,
//         id_categoria(FK), id_provedor(FK), id_ubicacion(FK),
//         id_servicio(FK), fechaCreacion_pi, fechaModificacion_pi,
//         costo_pieza, cantidad_pieza
// ══════════════════════════════════════════════════════════════════
export const PiezasService = {
  crear: async (data) =>
    addDoc(col("piezas"), {
      ...data,
      fechaCreacion_pi:     serverTimestamp(),
      fechaModificacion_pi: serverTimestamp(),
    }),

  actualizar: async (id, data) =>
    updateDoc(docRef("piezas", id), {
      ...data,
      fechaModificacion_pi: serverTimestamp(),
    }),

  ajustarCantidad: async (id, delta) => {
    const snap = await getDoc(docRef("piezas", id));
    if (!snap.exists()) return;
    const actual = Number(snap.data().cantidad_pieza) || 0;
    await updateDoc(docRef("piezas", id), {
      cantidad_pieza:       actual + delta,
      fechaModificacion_pi: serverTimestamp(),
    });
  },

  eliminar: async (id) => deleteDoc(docRef("piezas", id)),

  suscribir: (cb) => suscribir("piezas", cb, orderBy("fechaCreacion_pi", "desc")),

  stockBajo: async (limite = 3) => {
    // Firestore no soporta < en campos numéricos con índice simple,
    // se filtra client-side después de traer todo
    const snap = await getDocs(col("piezas"));
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => Number(p.cantidad_pieza) <= limite);
  },
};

// ══════════════════════════════════════════════════════════════════
// CATEGORIAS  (colección: categorias)
// Campos: id_categoria, nombre_ca, descripcion_ca
// ══════════════════════════════════════════════════════════════════
export const CategoriasService = {
  seedCategorias: async () => {
    const cats = ["Motor", "Frenos", "Lubricantes", "Suspensión", "Electricidad", "Carrocería", "Otros"];
    for (const [i, nombre_ca] of cats.entries()) {
      await setDoc(docRef("categorias", String(i + 1)), {
        id_categoria: i + 1, nombre_ca, descripcion_ca: "",
        creadoEn: serverTimestamp(),
      });
    }
  },

  getAll: async () => {
    const snap = await getDocs(col("categorias"));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  suscribir: (cb) => suscribir("categorias", cb),
};

// ══════════════════════════════════════════════════════════════════
// COTIZACIONES  (colección: cotizaciones)
// Campos: id_cotizacion, id_servicio(FK), fecha_cotizacion,
//         id_empleado(FK), id_cliente(FK), estado_cotizacion
// ══════════════════════════════════════════════════════════════════
export const CotizacionesService = {
  crear: async (data) =>
    addDoc(col("cotizaciones"), {
      ...data,
      fecha_cotizacion:  serverTimestamp(),
      estado_cotizacion: data.estado_cotizacion ?? false, // false=Pendiente, true=Aprobada
      creadoEn:          serverTimestamp(),
    }),

  actualizar: async (id, data) =>
    updateDoc(docRef("cotizaciones", id), { ...data, actualizadoEn: serverTimestamp() }),

  aprobar: async (id) =>
    updateDoc(docRef("cotizaciones", id), {
      estado_cotizacion: true,
      actualizadoEn: serverTimestamp(),
    }),

  rechazar: async (id) =>
    updateDoc(docRef("cotizaciones", id), {
      estado_cotizacion: false,
      actualizadoEn: serverTimestamp(),
    }),

  eliminar: async (id) => deleteDoc(docRef("cotizaciones", id)),

  suscribir: (cb) => suscribir("cotizaciones", cb, orderBy("creadoEn", "desc")),

  porCliente: async (id_cliente) => {
    const q = query(col("cotizaciones"), where("id_cliente", "==", id_cliente));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
};

// ══════════════════════════════════════════════════════════════════
// SEED COMPLETO — ejecutar UNA SOLA VEZ para poblar la BD
// ══════════════════════════════════════════════════════════════════
export const seedCompleto = async () => {
  console.log("🌱 Iniciando seed de base de datos...");
  await RolesService.seedRoles();
  await PermisosService.seedPermisos();
  await CategoriasService.seedCategorias();
  console.log("✅ Roles, permisos y categorías creados");
  console.log("⚠️  Crea el primer admin desde UsuariosService.crear()");
};
