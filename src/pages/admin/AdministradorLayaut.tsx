import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { apiAuth } from "../../api/apiAuth.js";
import Header from "../../components/body/Header.js";
import Sidebar from "../../components/body/Sidebar.js";
import type { SidebarSection } from "../../components/body/utilities/DataSidebar.js";
import { useEffect, useState } from "react";
import { administradorApi } from "../../api/administradorApi.js";
import { obtenerUsuarioActual } from "../../api/usuariosApi.js";
import { limpiarSesion } from "../../utils/sesion.js";

export const SECCIONES_ADMIN: SidebarSection[] = [
  {
    section: "Restaurantes",
    items: [
      { 
        label: "Todos los registrados", 
        path: "/admin/restaurantes/todos", 
        end: true 
      },
      { 
        label: "Solicitudes pendientes", 
        path: "/admin/restaurantes", 
        end: true 
      },
      {
        label: "Crear nueva subcategoría",
        path: "/admin/subcategorias/nueva",
        end: true,
      },
    ],
  },
  {
    section: "Clientes",
    items: [
      { 
        label: "Todos los clientes", 
        path: "/admin/clientes", 
        end: true 
      },
    ],
  },
  {
    section: "Sistema",
    items: [
      {
        label: "Crear administrador",
        path: "/admin/administradores/crear",
        end: true,
      },
    ],
  },
];

export default function AdministradorLayaut() {
  const navigate = useNavigate();
  const location = useLocation();
  // Verificamos si hay sesión iniciada
  const token = localStorage.getItem("jwtToken");
  const [pendientesCount, setPendientesCount] = useState(0);
  const [perfilNombre, setPerfilNombre] = useState("Administrador");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [menuNavegacionAbierto, setMenuNavegacionAbierto] = useState(false);


  if (!token) {
    return <Navigate to="/login/Administrador" replace />;
  }

  useEffect(() => {
    if (!token) return;

    const actualizarPendientes = () => {
      administradorApi
        .obtenerRestaurantesPendientes()
        .then((lista) => setPendientesCount(lista.length))
        .catch(() => setPendientesCount(0));
    };

    actualizarPendientes();

     obtenerUsuarioActual()
      .then((usuario) => {
        setPerfilNombre(usuario.nombre?.trim() || "Administrador");
        setPerfilEmail(usuario.email ?? "");
      })
      .catch(() => {});

    window.addEventListener("trego-restaurante-gestionado", actualizarPendientes);
    return () => {
      window.removeEventListener(
        "trego-restaurante-gestionado",
        actualizarPendientes,
      );
    };
  }, [token]);

  useEffect(() => {
    setMenuNavegacionAbierto(false);
  }, [location.pathname]);

  // cerrar sesion
  const handleLogout = async () => {
    try {
      await apiAuth.cerrarSesion();
    } catch (error) {
      console.error("Error al revocar el token en el servidor:", error);
    } finally {
      limpiarSesion();
      navigate("/login/Administrador");
    }
  };

  const seccionesConBadges = SECCIONES_ADMIN.map((seccion) => ({
    ...seccion,
    items: seccion.items.map((item) => {
      // Si es la ruta correcta, le inyectamos el estado actual
      if (item.path === "/admin/restaurantes") {
        return { ...item, badge: pendientesCount };
      }
      return item;
    }),
  }));

  // Si pasa todas las reglas, renderizamos la pantalla normal
  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-gray-50 overflow-hidden notranslate" lang="es">
      <Header
        tipoUser="Administrador"
        onAbrirMenuNavegacion={() => setMenuNavegacionAbierto(true)}
        perfilNombre={perfilNombre}
        perfilEmail={perfilEmail}
        onCambiarContraseña={() => navigate("/admin/perfil/contraseña")}
        onLogout={handleLogout}
        cambiarContrasenia
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          tipoUser="Administrador"
          secciones={seccionesConBadges}
          mobileOpen={menuNavegacionAbierto}
          onCloseMobile={() => setMenuNavegacionAbierto(false)}
        />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
