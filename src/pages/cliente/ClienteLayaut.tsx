import {
  matchPath,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router";
import { apiAuth } from "../../api/apiAuth.js";
import Header from "../../components/body/Header.js";
import { useFiltros } from "../../context/FiltrosContext.js";
import CarritoUIRoot from "../../components/carrito/CarritoUIRoot.js";
import { useBusqueda } from "../../context/BusquedaContext.js";
import { limpiarSesion } from "../../utils/sesion.js";
import { useCarrito } from "../../context/CarritoContext.js";
import { useCliente } from "../../hooks/useCliente.js";
import { useEffect } from "react";
import Footer from "../../components/body/Footer.js";

export default function ClienteLayaut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { abrirCarrito, cantidadTotal } = useCarrito();
  const { abrirFiltros } = useFiltros();
  const { busqueda, setBusqueda, placeholder } = useBusqueda();
  const { cliente } = useCliente();

  // ─── Configuración de búsqueda por ruta ───────────────────────────────────
  const esMenuRestaurante = matchPath("/restaurante/:id", location.pathname);

  // Lista de rutas que no quiero que muestre el buscador
  const rutasSinBuscador = ["/Historial", "/perfil", "/pedidos/:pedidoId"];

  // Comprobar si la URL actual coincide con AL MENOS UNA de esas rutas
  const ocultarBuscador = rutasSinBuscador.some((ruta) =>
    matchPath(ruta, location.pathname),
  );

  // Calcular si se debe mostrar (lo contrario de ocultar)
  const noMostrarBuscador = !ocultarBuscador;

  // Verificamos si hay sesión iniciada
  const token = localStorage.getItem("jwtToken");

  if (!token) {
    return <Navigate to="/login/cliente" replace />;
  }

  // cerrar sesion
  const handleLogout = async () => {
    try {
      await apiAuth.cerrarSesion();
    } catch (error) {
      console.error("Error al revocar el token en el servidor:", error);
    } finally {
      limpiarSesion();
      navigate("/login/cliente");
    }
  };

  const handleVerPerfil = () => {
    navigate("/perfil/cliente");
  };

  // Si pasa todas las reglas, renderizamos la pantalla normal
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 overflow-hidden">
      <Header
        tipoUser="Cliente"
        onBuscar={() => {}}
        onLogout={handleLogout}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        onAbrirFiltros={abrirFiltros}
        onAbrirCarrito={abrirCarrito}
        cantidadTotal={cantidadTotal}
        noMostrarbuscador={noMostrarBuscador}
        navigateTo={"/restaurantes"}
        onVerPerfil={handleVerPerfil}
        perfilNombre={cliente?.nombre ?? ""}
        perfilEmail={cliente?.email ?? ""}
        fotoPerfil={cliente?.urlImagen ?? ""}
        verPerfil
        verHistorial
        onChangeHistorial={() => navigate("/Historial")}
        placeholder={placeholder}
        ocultarBotonFiltros={!!esMenuRestaurante}
      />

      <main className="flex-1 flex flex-col overflow-y-auto relative">
        <Outlet />
      </main>
      <CarritoUIRoot />
    </div>
  );
}
