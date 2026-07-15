import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import Header from "../../components/body/Header.js";
import Sidebar from "../../components/body/Sidebar.js";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  abrirLocal,
  actualizarCierreProgramado,
  actualizarHoraCierre,
  cerrarLocal,
  obtenerActual,
} from "../../api/apiRestaurante.js";
import { apiAuth } from "../../api/apiAuth.js";
import { obtenerUsuarioActual } from "../../api/usuariosApi.js";
import type { SidebarSection } from "../../components/body/utilities/DataSidebar.js";
import type { DTOAbrirCerrarLocalRequest } from "../../data/DTOAbrirCerrarLocalRequest.js";
import { limpiarSesion } from "../../utils/sesion.js";
import { usePedidosContext } from "../../context/PedidosRestauranteContext.js";
import { EnumEstadoPedido } from "../../data/EnumEstadoPedido.js";
import ModalAvisoCierre from "./componentes/ModalAvisoCierre.js";

const SECCIONES: SidebarSection[] = [
  {
    section: "Pedidos",
    items: [
      {
        label: "En espera",
        path: "/restaurantes/ListarPedidosSinConfirmar",
      },
      {
        label: "En preparacion",
        path: "/restaurantes/Listar-en-preparacion",
      },
      { label: "En camino", path: "/restaurantes/Listar-en-camino" },
      { label: "Entregados", path: "/restaurantes/pedidos-entregados" },
      { label: "Cancelados", path: "/restaurantes/pedidos-cancelados" },
    ],
  },
  {
    section: "Reclamos",
    items: [{ label: "Ver Reclamos", path: "/restaurantes/pedidos-reclamos" }],
  },
  {
    section: "Gestión",
    items: [
      { label: "Alta Producto", path: "/restaurantes/altaProducto" },
      { label: "Mis Productos", path: "/restaurantes/ListarProductos" },
      { label: "Listar Ofertas", path: "/restaurantes/listar-ofertas" },
    ],
  },
  {
    section: "Estadísticas",
    items: [
      {
        label: "Platos mas solicitados",
        path: "/restaurantes/estadisticas/platos",
      },
      { label: "Pedidos por fecha", path: "/restaurantes/estadisticas/fechas" },
      { label: "Monto promedio", path: "/restaurantes/estadisticas/monto" },
      {
        label: "Clasificación global",
        path: "/restaurantes/reputacion",
      },
    ],
  },
];

const NO_Habilitado: SidebarSection[] = [
  {
    section: "Solicitudes",
    items: [{ label: "Solicitar Alta", path: "/restaurantes/solicitarAlta" }],
  },
];

export default function RestauranteLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("jwtToken");
  const isHabilitado = localStorage.getItem("restauranteHabilitado") === "true";

  const [restauranteAbierto, setRestauranteAbierto] = useState<boolean>(false);
  const [horaCierre, setHoraCierre] = useState<string | undefined>(undefined);
  const [horaApertura, setHoraApertura] = useState<string | undefined>(undefined);
  const [cierreProgramado, setCierreProgramado] = useState<string | null>(null);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);
  const [cambio, setCambio] = useState<boolean>(false);
  const [perfilNombre, setPerfilNombre] = useState("Restaurante");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | undefined>(undefined);
  const [menuNavegacionAbierto, setMenuNavegacionAbierto] = useState(false);
  
  const { counts } = usePedidosContext();

  // Regla A: Si no hay token, lo mandamos al login.
  if (!token) {
    return <Navigate to="/login/Restaurante" replace />;
  }

  // Regla B: Si NO está habilitado, solo /solicitarAlta o /contraseña.
  if (
    !isHabilitado &&
    location.pathname !== "/restaurantes/solicitarAlta" &&
    location.pathname !== "/restaurantes/perfil/contraseña"
  ) {
    return <Navigate to="/restaurantes/solicitarAlta" replace />;
  }

  // Regla C: Si está habilitado, no puede ir a /solicitarAlta.
  if (isHabilitado && location.pathname === "/restaurantes/solicitarAlta") {
    return <Navigate to="/restaurantes/ListarPedidosSinConfirmar" replace />;
  }


  const seccionesConBadges = useMemo(() => {
    const listaBase = isHabilitado ? SECCIONES : NO_Habilitado;

    return listaBase.map((seccion) => {
      if (seccion.section !== "Pedidos" && seccion.section !== "Reclamos") return seccion;

      return {
        ...seccion,
        items: seccion.items.map((item) => {
          if (item.path === "/restaurantes/ListarPedidosSinConfirmar") {
            return { ...item, badge: counts[EnumEstadoPedido.Pagado] || 0 };
          }
          if (item.path === "/restaurantes/Listar-en-preparacion") {
            return { ...item, badge: counts[EnumEstadoPedido.EnPreparacion] || 0 };
          }
          if (item.path === "/restaurantes/Listar-en-camino") {
            return { ...item, badge: counts[EnumEstadoPedido.EnCamino] || 0 };
          }
          if (item.path === "/restaurantes/pedidos-reclamos") {
            return { ...item, badge: counts["Reclamos"] || 0 };
          }
          return item;
        }),
      };
    });
  }, [isHabilitado, counts]);

  // Carga de datos del usuario
  useEffect(() => {
    if (!token) return;

    obtenerUsuarioActual()
      .then((usuario) => {
        setPerfilNombre(usuario.nombre?.trim() || "Restaurante");
        setPerfilEmail(usuario.email ?? "");
        setFotoPerfil(usuario.urlImagen);
      })
      .catch(() => {});
  }, [token]);

  // Sincronización del estado de apertura
  useEffect(() => {
    if (!token || !isHabilitado) return;

    const fetchEstado = async () => {
      try {
        const data = await obtenerActual();
        setRestauranteAbierto(data.abierto ?? false);
        setCierreProgramado(data.cierreProgramado ?? null);
        if (data.horaCierre) {
          const horaSinSegundos = data.horaCierre.slice(0, 5);
          const horaAperturaSinSegundos = data.horaApertura?.slice(0, 5);
          setHoraCierre(horaSinSegundos);
          setHoraApertura(horaAperturaSinSegundos);
          setCambio(false);
        } else {
          setHoraCierre(undefined);
          setCambio(false);
        }
      } catch (error) {
        console.error("Error al obtener estado:", error);
      }
    };

    fetchEstado();
  }, [token, isHabilitado, cambio]);

  // Alternar apertura
  const handleToggleRestaurante = async (
    horaDesdeMenu?: string,
    aperturaDesdeMenu?: string,
  ) => {
    if (!token || !isHabilitado) return;

    const horaEfectiva = horaDesdeMenu ?? horaCierre;
    const aperturaEfectiva = aperturaDesdeMenu ?? horaApertura;

    if (!restauranteAbierto && (!horaEfectiva || horaEfectiva.trim() === "")) {
      console.warn("No se puede abrir sin una hora de cierre");
      return;
    }

    setIsLoadingToggle(true);
    try {
      if (restauranteAbierto) {
        await cerrarLocal();
        setRestauranteAbierto(false);
        setCierreProgramado(null);
      } else {
        const hora: DTOAbrirCerrarLocalRequest = {
          horaApertura: aperturaEfectiva ?? "",
          horaCierre: horaEfectiva ?? "",
        };
        await abrirLocal(hora);
        setRestauranteAbierto(true);

        if (horaDesdeMenu !== undefined) setHoraCierre(horaDesdeMenu);
        if (aperturaDesdeMenu !== undefined) setHoraApertura(aperturaDesdeMenu);
        setCambio(true);
      }
    } catch (error) {
      console.error("Error al alternar estado:", error);
    } finally {
      setIsLoadingToggle(false);
    }
  };

  const handleChangeHoraCierre = async (nuevaHora: string | undefined) => {
    setHoraCierre(nuevaHora);
    if (restauranteAbierto && nuevaHora && token && isHabilitado) {
      try {
        await actualizarHoraCierre(nuevaHora);
        setCambio(true);
      } catch (error) {
        console.error("Error al actualizar la hora de cierre:", error);
      }
    }
  };

  const handleChangeCierreProgramado = async (nuevoCierre: string) => {
    if (!restauranteAbierto || !nuevoCierre || !token || !isHabilitado) return;
    try {
      await actualizarCierreProgramado(nuevoCierre);
      setCambio(true);
    } catch (error) {
      console.error("Error al actualizar el cierre programado:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiAuth.cerrarSesion();
    } catch (error) {
      console.error("Error al revocar el token en el servidor:", error);
    } finally {
      limpiarSesion();
      navigate("/login/Restaurante");
    }
  };

  // Callback para cuando el temporizador interno decide el cierre automático
  const handleLocalCerradoAutomaticamente = useCallback(() => {
    setRestauranteAbierto(false);
    setCambio(true);
  }, []);

  useEffect(() => {
    setMenuNavegacionAbierto(false);
  }, [location.pathname]);

  return (
    <div className="h-dvh w-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header
        verPerfil
        tipoUser="Restaurante"
        onAbrirMenuNavegacion={() => setMenuNavegacionAbierto(true)}
        perfilNombre={perfilNombre}
        perfilEmail={perfilEmail}
        fotoPerfil={fotoPerfil}
        onCambiarContraseña={() => navigate("/restaurantes/perfil/contraseña")}
        cambiarContrasenia
        onVerPerfil={() => navigate("/perfil/restaurante")}
        horaCierre={horaCierre}
        onChangeHoraCierre={handleChangeHoraCierre}
        horaApertura={horaApertura}
        onChangeHoraApertura={setHoraApertura}
        cierreProgramado={
          cierreProgramado ? cierreProgramado.slice(0, 16) : undefined
        }
        onChangeCierreProgramado={handleChangeCierreProgramado}
        restauranteAbierto={restauranteAbierto}
        onToggleRestauranteAbierto={handleToggleRestaurante}
        onLogout={handleLogout}
        navigateTo={
          isHabilitado
            ? "/restaurantes/ListarPedidosSinConfirmar"
            : "/restaurantes/solicitarAlta"
        }
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          tipoUser="Restaurante"
          secciones={seccionesConBadges}
          mobileOpen={menuNavegacionAbierto}
          onCloseMobile={() => setMenuNavegacionAbierto(false)}
        />

        <main className="flex-1 flex flex-col overflow-y-auto relative pb-6">
          <Outlet />
        </main>
      </div>

      <ModalAvisoCierre
        restauranteAbierto={restauranteAbierto}
        cierreProgramado={cierreProgramado}
        horaCierre={horaCierre}
        onLocalCerradoAutomaticamente={handleLocalCerradoAutomaticamente}
      />
    </div>
  );
}