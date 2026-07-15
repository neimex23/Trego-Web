import { useEffect, useState, useCallback } from "react";
import { EnumEstadoPedido } from "../../../data/EnumEstadoPedido.js";
import { AlertCircle, CheckCircle } from "lucide-react";
import CardPedidoAconfirmar from "../componentes/CardPedidoAconfirmar.js";
import type { NotificationState } from "../types/NotificationState.js";
import { usePedidos } from "../../../hooks/usePedidoRestaurante.js";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import { useFiltrosPedidos } from "../../../hooks/useFiltrosPedidos.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";

export default function ListarEntregados() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const [productoSelect, setProductoSelect] = useState<DTOProducto | undefined>(undefined);

  // Cargamos productos para alimentar el dropdown del filtro
  const { productos, errorProductos } = useProductoRestaurante();

  // Cargamos pedidos con estado "Entregado"
  const { pedidos, loading, error, recargar } = usePedidos(
    EnumEstadoPedido.Entregado,
    180,
  );

  const {
    searchTerm,
    setSearchTerm,
    setProductoSeleccionadoId, 
    orden,
    setOrden,
    pedidosFiltrados,
    hayFiltros,
    limpiarFiltros,
    fechaDesde,
    fechaHasta,
    setFechaDesde,
    setFechaHasta,
  } = useFiltrosPedidos(pedidos);

  // Notificación segura con useCallback
  const showNotification = useCallback((message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    const timer = setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000,
    );
    return () => clearTimeout(timer);
  }, []);

  // Manejo de errores de carga
  useEffect(() => {
    if (errorProductos) showNotification(errorProductos, "error");
  }, [errorProductos, showNotification]);

  useEffect(() => {
    if (error) showNotification(error, "error");
  }, [error, showNotification]);

  // Limpieza de filtros
  const handleLimpiarFiltros = useCallback(() => {
    limpiarFiltros();
    setProductoSelect(undefined);
  }, [limpiarFiltros]);

  // Manejo de selección de productos 
  const handleFiltroProductoChange = useCallback((item: DTOProducto | undefined) => {
    setProductoSelect(item);
    setProductoSeleccionadoId(item?.idProducto);
  }, [setProductoSeleccionadoId]);

  return (
    <div className={RESTAURANTE_PAGE_CLASS}>
      {notification.show && (
        <div
          className={`mb-4 p-4 rounded-xl flex items-center shadow-sm animate-fade-in ${
            notification.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="mr-3" size={20} />
          ) : (
            <AlertCircle className="mr-3" size={20} />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <RestaurantePageHeader
        titulo="Pedidos entregados"
        onRecargar={recargar}
        recargando={loading}
      />

      <div className="max-w-5xl mx-auto mb-6 sm:mb-8 relative group">
        <FiltrosRestaurantes
          labelBuscador="Buscar por Nombre o ID"
          nombreID={searchTerm}
          setNombreID={setSearchTerm}
          desplegableTipo="Producto Pedido"
          filtroSelecte={productoSelect}
          onChangeFiltroSelect={handleFiltroProductoChange}
          listaFiltros={productos}
          mapToItem={(i) => ({
            id: i?.idProducto?.toString() ?? "",
            label: i?.nombre ?? "",
          })}
          orden={orden}
          setOrden={setOrden}
          hayFiltros={hayFiltros}
          limpiarFiltros={handleLimpiarFiltros}
          porFecha
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChangeFechaDesde={setFechaDesde}
          onChangeFechaHasta={setFechaHasta}
          wBox="w-60!"
        />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full"></span>
              Cargando pedidos...
            </p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300 animate-fade-in">
            <p className="text-gray-500 font-medium text-lg">
              No se encontraron pedidos entregados.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Prueba modificando las fechas o quitando los filtros activos.
            </p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <CardPedidoAconfirmar key={pedido.idPedido} pedido={pedido} />
          ))
        )}
      </div>
    </div>
  );
}