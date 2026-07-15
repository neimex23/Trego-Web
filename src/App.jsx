import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Inicio from "./pages/Inicio.js";
import SeleccionarRol from "./pages/SeleccionarRol.js";
import LoginCliente from "./pages/logins/LoginCliente.js";
import LoginAdmin from "./pages/logins/LoginAdmin.js";
import RecuperarContraseñaPage from "./pages/logins/RecuperarContraseñaPage.js";
import CambiarContraseñaPage from "./pages/logins/CambiarContraseñaPage.js";
import PagoExito from "./pages/pago/PagoExito.jsx";
import PagoError from "./pages/pago/PagoError.jsx";
import PagoPendiente from "./pages/pago/PagoPendiente.jsx";
import RestauranteLayout from "./pages/restaurantes/RestauranteLayout.js";
import SolicitarAltaRestaurante from "./pages/restaurantes/screens/SolicitarAltaRestaurante.js";
import AltaProducto from "./pages/restaurantes/screens/AltaProducto.js";
import ListarSinConfirmar from "./pages/restaurantes/screens/ListarSinConfirmar.js";
import ListarEnPreparacion from "./pages/restaurantes/screens/ListarEnPreparacion.js";
import ListarEnCamino from "./pages/restaurantes/screens/ListarEnCamino.js";
import ListarEntregados from "./pages/restaurantes/screens/ListarEntregados.js";
import ListarCancelados from "./pages/restaurantes/screens/ListarCancelados.js";
import GestionRestaurantesPage from "./pages/admin/screens/GestionRestaurantesPage.js";
import ListarRestaurantesPage from "./pages/admin/screens/ListarRestaurantesPage.js";
import ListarClientesPage from "./pages/admin/screens/ListarClientesPage.js";
import CrearAdministradorPage from "./pages/admin/screens/CrearAdministradorPage.js";
import AdministradorLayaut from "./pages/admin/AdministradorLayaut.js";
import AltaSubCategoriaPage from "./pages/admin/screens/AltaSubCategoriaPage.js";
import RestauranteMenuPage from "./pages/cliente/screens/RestauranteMenuPage.jsx";
import SubCategoriaPlatosPage from "./pages/cliente/screens/SubCategoriaPlatosPage.jsx";
import HomePage from "./pages/cliente/screens/HomePage.jsx";
import HistorialPage from "./pages/cliente/screens/HistorialPage.jsx";
import ClienteLayaut from "./pages/cliente/ClienteLayaut.js";
import { FiltrosUIProvider } from "./context/FiltrosContext.js";
import { BusquedaProvider } from "./context/BusquedaContext.js";
import LoginRestaurante from "./pages/logins/LoginRestaurante.js";
import RegistrarRestaurante from "./pages/logins/RegistrarRestaurante.js";
import ListarProductos from "./pages/restaurantes/screens/ListarProductos.js";
import ModificarProducto from "./pages/restaurantes/screens/ModificarProducto.js";
import ListarReclamos from "./pages/restaurantes/screens/ListarReclamos.js";
import PerfilCliente from "./pages/perfil/PerfilScreen.js";
import PerfilRestauranteScreen from "./pages/perfil/PerfilRestauranteScreen.js";
import AltaOferta from "./pages/restaurantes/screens/AltaOferta.js";
import EstadisticasPage from "./pages/restaurantes/screens/EstadisticasPage.js";
import ReputacionPage from "./pages/restaurantes/screens/ReputacionPage.tsx";
import { CarritoProvider } from "./context/CarritoContext";
import ListarOfertas from "./pages/restaurantes/screens/ListarOfertas.js";
import { PedidosProvider } from "./context/PedidosRestauranteContext.js";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Analytics />
      <SpeedInsights />
      <Routes>
        {/* --- RUTAS PÚBLICAS O SIN LAYOUT --- */}
        <Route path="/" element={<Inicio />} />
        <Route path="/roles" element={<SeleccionarRol />} />
        <Route path="/login/cliente" element={<LoginCliente />} />
        <Route path="/login/Restaurante" element={<LoginRestaurante />} />
        <Route
          path="/login/Restaurante/recuperar"
          element={<RecuperarContraseñaPage tipo="Restaurante" />}
        />
        <Route path="/login/Administrador" element={<LoginAdmin />} />
        <Route
          path="/login/Administrador/recuperar"
          element={<RecuperarContraseñaPage tipo="Administrador" />}
        />
        <Route
          path="/restaurantes/registrarRestaurante"
          element={<RegistrarRestaurante />}
        />

        {/* --- RUTAS DE RETORNO MERCADO PAGO --- */}
        <Route
          element={
            <CarritoProvider>
              <Outlet />
            </CarritoProvider>
          }
        >
          <Route path="/success" element={<PagoExito />} />
          <Route path="/failure" element={<PagoError />} />
          <Route path="/pending" element={<PagoPendiente />} />
        </Route>

        {/* --- RUTAS RESTAURANTE --- */}
        <Route
          element={
            <PedidosProvider>
              <RestauranteLayout />
            </PedidosProvider>
          }
        >
          <Route
            path="/restaurantes/solicitarAlta"
            element={<SolicitarAltaRestaurante />}
          />
          <Route path="/restaurantes/altaProducto" element={<AltaProducto />} />
          <Route
            path="/restaurantes/ListarPedidosSinConfirmar"
            element={<ListarSinConfirmar />}
          />
          <Route
            path="/restaurantes/Listar-en-preparacion"
            element={<ListarEnPreparacion />}
          />
          <Route
            path="/restaurantes/Listar-en-camino"
            element={<ListarEnCamino />}
          />
          <Route
            path="/restaurantes/pedidos-entregados"
            element={<ListarEntregados />}
          />
          <Route
            path="/restaurantes/pedidos-cancelados"
            element={<ListarCancelados />}
          />
          <Route
            path="/restaurantes/pedidos-reclamos"
            element={<ListarReclamos />}
          />
          <Route
            path="/restaurantes/solicitarAlta"
            element={<SolicitarAltaRestaurante />}
          />
          <Route
            path="/perfil/restaurante"
            element={<PerfilRestauranteScreen />}
          />
          <Route
            path="/restaurantes/perfil/contraseña"
            element={
              <CambiarContraseñaPage
                tipo="Restaurante"
                volverPath="/restaurantes/ListarPedidosSinConfirmar"
              />
            }
          />
          <Route
            path="/restaurantes/ListarProductos"
            element={<ListarProductos />}
          />
          <Route
            path="/restaurantes/ListarProductos/:id"
            element={<ModificarProducto />}
          />
          <Route path="/restaurantes/alta-oferta" element={<AltaOferta />} />
          <Route
            path="/restaurantes/estadisticas/platos"
            element={<EstadisticasPage vista="platos" />}
          />
          <Route
            path="/restaurantes/estadisticas/fechas"
            element={<EstadisticasPage vista="fechas" />}
          />
          <Route
            path="/restaurantes/estadisticas/monto"
            element={<EstadisticasPage vista="monto" />}
          />
          <Route path="/restaurantes/reputacion" element={<ReputacionPage />} />
          <Route
            path="/restaurantes/listar-ofertas"
            element={<ListarOfertas />}
          />
        </Route>

        {/* --- RUTAS ADMIN (LAYOUT CON SIDEBAR) --- */}
        <Route element={<AdministradorLayaut />}>
          <Route
            path="/admin/restaurantes"
            element={<GestionRestaurantesPage />}
          />
          <Route
            path="/admin/subcategorias/nueva"
            element={<AltaSubCategoriaPage />}
          />
          <Route
            path="/admin/restaurantes/todos"
            element={<ListarRestaurantesPage />}
          />
          <Route path="/admin/clientes" element={<ListarClientesPage />} />
          <Route
            path="/admin/administradores/crear"
            element={<CrearAdministradorPage />}
          />
          <Route
            path="/admin/perfil/contraseña"
            element={
              <CambiarContraseñaPage
                tipo="Administrador"
                volverPath="/admin/restaurantes"
              />
            }
          />
        </Route>

        {/*--- Rutas Cliente--- */}
        <Route
          element={
            <CarritoProvider>
              <FiltrosUIProvider>
                <BusquedaProvider>
                  <ClienteLayaut />
                </BusquedaProvider>
              </FiltrosUIProvider>
            </CarritoProvider>
          }
        >
          <Route path="/restaurante/:id" element={<RestauranteMenuPage />} />
          <Route path="/subcategoria/:id" element={<SubCategoriaPlatosPage />} />
          <Route path="/restaurantes" element={<HomePage />} />
          <Route path="/Historial" element={<HistorialPage />} />
          <Route path="/perfil/cliente" element={<PerfilCliente />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
