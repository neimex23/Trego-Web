import { useEffect, useState, useCallback } from "react";
import type { NotificationState } from "../types/NotificationState.js";
import {
  actualizarEstadoPedido,
  reembolsarPedido,
} from "../../../api/apiRestaurante.js";
import { EnumEstadoPedido } from "../../../data/EnumEstadoPedido.js";
import { AlertCircle, CheckCircle } from "lucide-react";
import CardPedidoAconfirmar from "../componentes/CardPedidoAconfirmar.js";
import type { DTOPedido } from "../../../data/DTOPedido.js";
import { useFiltrosPedidos } from "../../../hooks/useFiltrosPedidos.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";
import { usePedidosContext } from "../../../context/PedidosRestauranteContext.js";

export default function ListarEnPreparacion() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const [productoSelect, setProductoSelect] = useState<DTOProducto | undefined>(
    undefined,
  );

  const { productos, errorProductos } = useProductoRestaurante();

  const { pedidosPreparacion, refrescarListas } = usePedidosContext();

  const { pedidos, loading, error, recargar, removerPedidoLocal } =
    pedidosPreparacion;

  const {
    searchTerm,
    setSearchTerm,
    productoSeleccionadoId,
    setProductoSeleccionadoId,
    orden,
    setOrden,
    pedidosFiltrados,
    hayFiltros,
    limpiarFiltros,
  } = useFiltrosPedidos(pedidos);

  // Notificaciones estables con useCallback
  const showNotification = useCallback(
    (message: string, type: "success" | "error") => {
      setNotification({ show: true, message, type });
      const timer = setTimeout(
        () => setNotification({ show: false, message: "", type: "success" }),
        4000,
      );
      return () => clearTimeout(timer);
    },
    [],
  );

  const handleActualizarEstado = useCallback(
    async (pedido: DTOPedido, nuevoEstado: EnumEstadoPedido) => {
      try {
        if (!pedido || !pedido.idPedido) {
          showNotification("Sin pedido seleccionado.", "error");
          return;
        }

        if (nuevoEstado === EnumEstadoPedido.Cancelado) {
          await reembolsarPedido(pedido);

          removerPedidoLocal(pedido.idPedido);

          await refrescarListas([EnumEstadoPedido.EnPreparacion]);

          showNotification("Pedido cancelado por el restaurante.", "error");
        } else {
          await actualizarEstadoPedido({ pedido, estado: nuevoEstado });

          removerPedidoLocal(pedido.idPedido);

          await refrescarListas([
            EnumEstadoPedido.EnPreparacion,
            EnumEstadoPedido.EnCamino,
          ]);

          showNotification(
            `Pedido #${pedido.idPedido} actualizado a ${nuevoEstado}.`,
            "success",
          );
        }
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : "Error al actualizar el pedido.";
        showNotification(mensaje, "error");
      }
    },
    [removerPedidoLocal, refrescarListas, showNotification],
  );

  // Manejo de errores
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

  const handleFiltroProductoChange = useCallback(
    (item: DTOProducto | undefined) => {
      setProductoSelect(item);
      setProductoSeleccionadoId(item?.idProducto);
    },
    [setProductoSeleccionadoId],
  );

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
        titulo="Pedidos en preparacion"
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
              No hay pedidos en preparación en este momento.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Los cocineros pueden tomarse un respiro.
            </p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <CardPedidoAconfirmar
              key={pedido.idPedido}
              pedido={pedido}
              onActualizarEstado={handleActualizarEstado}
            />
          ))
        )}
      </div>
    </div>
  );
}
