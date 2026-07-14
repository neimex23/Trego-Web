import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import Header from "../../components/body/Header.js";
import Sidebar from "../../components/body/Sidebar.js";
import { useEffect, useRef, useState } from "react";
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

const SECCIONES: SidebarSection[] = [
  {
    section: "Pedidos",
    items: [
      {
        label: "En espera de confirmación",
        path: "/restaurantes/ListarPedidosSinConfirmar",
      },
      {
        label: "En preparacion(Confirmados)",
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
  // Verificamos si hay sesión iniciada
  const token = localStorage.getItem("jwtToken");

  // Verificamos si está habilitado
  const isHabilitado = localStorage.getItem("restauranteHabilitado") === "true";

  // --- Estados del toggle y hora de cierre ---
  const [restauranteAbierto, setRestauranteAbierto] = useState<boolean>(false);
  const [horaCierre, setHoraCierre] = useState<string | undefined>(undefined);
  const [horaApertura, setHoraApertura] = useState<string | undefined>(
    undefined,
  );
  const [cierreProgramado, setCierreProgramado] = useState<string | null>(null);
  const [isLoadingToggle, setIsLoadingToggle] = useState(false);
  const [cambio, setCambio] = useState<boolean>(false);
  const [mostrarAvisoCierre, setMostrarAvisoCierre] = useState(false);
  const [mostrarAvisoCerrado, setMostrarAvisoCerrado] = useState(false);
  const [avisoDescartado, setAvisoDescartado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState<{
    minutos: number;
    segundos: number;
  } | null>(null);
  const [perfilNombre, setPerfilNombre] = useState("Restaurante");
  const [perfilEmail, setPerfilEmail] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | undefined>(undefined);
  const [menuNavegacionAbierto, setMenuNavegacionAbierto] = useState(false);

  // --- REGLAS DE SEGURIDAD ---

  // Regla A: Si no hay token, lo mandamos al login.
  if (!token) {
    return <Navigate to="/login/Restaurante" replace />;
  }

  // Regla B: Si NO está habilitado, SOLO puede estar en /solicitarAlta.
  // Si intenta ir a /ListarPedidosSinConfirmar o /altaProducto, lo devolvemos.
  if (
    !isHabilitado &&
    location.pathname !== "/restaurantes/solicitarAlta" &&
    location.pathname !== "/restaurantes/perfil/contraseña"
  ) {
    return <Navigate to="/restaurantes/solicitarAlta" replace />;
  }

  // Regla C: Si SÍ está habilitado y por error va a /solicitarAlta, lo mandamos a sus pedidos.
  if (isHabilitado && location.pathname === "/restaurantes/solicitarAlta") {
    return <Navigate to="/restaurantes/ListarPedidosSinConfirmar" replace />;
  }

  const lista_Secciones: SidebarSection[] = isHabilitado
    ? SECCIONES
    : NO_Habilitado;

  // Effect para enviar al backend el estado del backend
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

  // Funcion para cambiar estado (Abierto/Cerrado) restaurante
  const handleToggleRestaurante = async (
    horaDesdeMenu?: string,
    aperturaDesdeMenu?: string,
  ) => {
    if (!token || !isHabilitado) return;

    const horaEfectiva = horaDesdeMenu ?? horaCierre;
    // 👇 Capturamos la apertura instantánea que viene del menú
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
          horaApertura: aperturaEfectiva ?? "", // 👇 Usamos la efectiva aquí
          horaCierre: horaEfectiva ?? "",
        };
        await abrirLocal(hora!);
        setRestauranteAbierto(true);

        // Sincronizamos el estado de React con lo que ingresó el usuario
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

  // --- Actualizar hora de cierre desde el input ---
  const handleChangeHoraCierre = async (nuevaHora: string | undefined) => {
    setHoraCierre(nuevaHora);

    // Si el local está abierto y hay una hora válida, la guardamos en backend
    if (restauranteAbierto && nuevaHora && token && isHabilitado) {
      try {
        await actualizarHoraCierre(nuevaHora);
        setCambio(true);
      } catch (error) {
        console.error("Error al actualizar la hora de cierre:", error);
      }
    }
  };

  // El usuario fija manualmente el instante exacto de cierre. Arranca igual a la
  // hora de cierre (lo calcula el backend al abrir) pero puede cambiarlo a otra
  // fecha/hora. Tras guardar, re-fetch para traer el valor confirmado.
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
    // Si el local está abierto, lo cerramos antes de salir
    /*     if (restauranteAbierto) {
      try {
        await cerrarLocal();
        // Actualizamos el estado local para reflejar el cierre
        setRestauranteAbierto(false);
      } catch (error) {
        console.error("Error al cerrar el local automáticamente:", error);
        // Opcional: mostrar un mensaje de error, pero aún así continuamos con el logout
      }
    } */

    try {
      await apiAuth.cerrarSesion();
    } catch (error) {
      console.error("Error al revocar el token en el servidor:", error);
    } finally {
      limpiarSesion();
      navigate("/login/Restaurante");
    }
  };

  useEffect(() => {
    if (!restauranteAbierto || !cierreProgramado) {
      setMostrarAvisoCierre(false);
      setTiempoRestante(null);
      return;
    }

    // El backend persiste cierreProgramado como instante absoluto
    const calcularRestante = () => {
      const cierre = new Date(cierreProgramado);
      if (isNaN(cierre.getTime())) return null;

      const diffSegundos = Math.floor(
        (cierre.getTime() - Date.now()) / 1000,
      );
      return diffSegundos;
    };

    let intervalo: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      const restante = calcularRestante();
      if (restante === null) return;

      // Actualizar el tiempo para el contador
      const mins = Math.floor(Math.max(restante, 0) / 60);
      const secs = Math.max(restante, 0) % 60;
      setTiempoRestante({ minutos: mins, segundos: secs });

      // Mostrar aviso si quedan 5 min o menos (300 seg) y no se ha descartado
      if (restante <= 300 && restante > 0 && !avisoDescartado) {
        setMostrarAvisoCierre(true);
      } else {
        setMostrarAvisoCierre(false);
      }

      // Cierre automático cuando se alcance o pase la hora
      if (restante <= 0) {
        clearInterval(intervalo);
        try {
          await cerrarLocal();
        } catch (error) {
          console.warn(
            "Cierre automático: el backend ya cerró o hubo un error",
            error,
          );
        } finally {
          setRestauranteAbierto(false);
          setCambio(true);
          setMostrarAvisoCierre(false);
          setMostrarAvisoCerrado(true);
        }
      }
    };

    // Ejecutar inmediatamente y luego cada segundo
    tick();
    intervalo = setInterval(tick, 1000);

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [restauranteAbierto, cierreProgramado, avisoDescartado]);

  useEffect(() => {
    setAvisoDescartado(false);
  }, [restauranteAbierto, cierreProgramado]);

  useEffect(() => {
    setMenuNavegacionAbierto(false);
  }, [location.pathname]);

  // Si pasa todas las reglas, renderizamos la pantalla normal
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
        cierreProgramado={cierreProgramado ? cierreProgramado.slice(0, 16) : undefined}
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
        {/* Le pasamos el estado real al Sidebar para que se bloquee visualmente */}
        <Sidebar
          tipoUser="Restaurante"
          secciones={lista_Secciones}
          mobileOpen={menuNavegacionAbierto}
          onCloseMobile={() => setMenuNavegacionAbierto(false)}
        />

        <main className="flex-1 flex flex-col overflow-y-auto relative pb-6">
          <Outlet />
        </main>
      </div>
      {mostrarAvisoCierre && tiempoRestante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-[min(20rem,calc(100vw-2rem))] p-5 sm:p-6 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              El local cerrará pronto
            </h2>
            <p className="text-3xl font-bold text-red-500 mb-2">
              {tiempoRestante.minutos}:
              {tiempoRestante.segundos.toString().padStart(2, "0")}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Se cerrará automáticamente al llegar a las{" "}
              {cierreProgramado
                ? new Date(cierreProgramado).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })
                : horaCierre}{" "}
              hs.
            </p>
            <button
              onClick={() => {
                setMostrarAvisoCierre(false);
                setAvisoDescartado(true);
              }}
              className="w-full py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      {mostrarAvisoCerrado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-[min(20rem,calc(100vw-2rem))] p-5 sm:p-6 text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              El local se cerró
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Se alcanzó el horario de cierre programado y el local dejó de estar
              visible para los clientes.
            </p>
            <button
              onClick={() => setMostrarAvisoCerrado(false)}
              className="w-full py-2 bg-trego-restaurante hover:opacity-90 text-white font-medium rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
