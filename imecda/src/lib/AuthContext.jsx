// src/lib/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────
// Conecta Firebase Auth con la colección "users" de Firestore.
// Expone: user (Auth), perfil (Firestore), rol, permisos, loading
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc, getDoc, collection, query, where, getDocs,
  setDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // Firebase Auth user
  const [perfil, setPerfil]   = useState(null);      // Firestore /usuarios/{uid}
  const [rol, setRol]         = useState(null);       // Firestore /roles/{id_rol}
  const [permisos, setPermisos] = useState([]);       // Firestore /permisos where id_rol=...
  const [loading, setLoading] = useState(true);

  // ── Listener principal ──────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null); setPerfil(null); setRol(null); setPermisos([]); setLoading(false);
        return;
      }
      setUser(firebaseUser);
      await cargarPerfil(firebaseUser.uid);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Carga perfil + rol + permisos desde Firestore ───────────────
  const cargarPerfil = async (uid) => {
    try {
      // 1. Documento del usuario
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) { setPerfil(null); return; }
      const userData = { id: uid, ...userSnap.data() };
      setPerfil(userData);

      // 2. Rol del usuario
      if (userData.id_rol) {
        const rolSnap = await getDoc(doc(db, "roles", String(userData.id_rol)));
        if (rolSnap.exists()) setRol({ id: rolSnap.id, ...rolSnap.data() });
      }

      // 3. Permisos del rol (menús habilitados)
      if (userData.id_rol) {
        const permQ = query(
          collection(db, "permisos"),
          where("id_rol", "==", userData.id_rol)
        );
        const permSnap = await getDocs(permQ);
        setPermisos(permSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error("Error cargando perfil:", err);
    }
  };

  // ── Login ────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Verifica que el usuario esté activo en Firestore
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (snap.exists() && snap.data().estado === false) {
      await signOut(auth);
      throw new Error("Usuario inactivo. Contacta al administrador.");
    }
    return cred;
  };

  // ── Logout ───────────────────────────────────────────────────────
  const logout = () => signOut(auth);

  // ── Cambiar contraseña (requiere reautenticación) ────────────────
  const cambiarPassword = async (passwordActual, passwordNuevo) => {
    const credential = EmailAuthProvider.credential(user.email, passwordActual);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, passwordNuevo);
  };

  // ── Helper: ¿tiene permiso para este menú? ───────────────────────
  const tienePermiso = (nombreMenu) => {
    if (!perfil) return false;
    if (esAdmin) return true; // admin ve todo
    return permisos.some(p => p.NombreMenu === nombreMenu);
  };

  const esAdmin = rol?.Description === "Administrador";
  const esEmpleado = rol?.Description === "Empleado";

  return (
    <AuthContext.Provider value={{
      user, perfil, rol, permisos, loading,
      login, logout, cambiarPassword,
      tienePermiso, esAdmin, esEmpleado,
      recargarPerfil: () => user && cargarPerfil(user.uid),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};
