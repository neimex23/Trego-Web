import { useState, useEffect, useCallback } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import CardPedidoAconfirmar from "../componentes/CardPedidoAconfirmar.js";
import { EnumEstadoPedido } from "../../../data/EnumEstadoPedido.js";
import {
  confirmarPedidoRestaurante,
  reembolsarPedido,
} from "../../../api/apiRestaurante.js";
import type { NotificationState } from "../types/NotificationState.js";
import type { DTOPedido } from "../../../data/DTOPedido.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import { useFiltrosPedidos } from "../../../hooks/useFiltrosPedidos.js";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";
import { usePedidosContext } from "../../../context/PedidosRestauranteContext.js";

export default function ListarSinConfirmar() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const [productoSelect, setProductoSelect] = useState<DTOProducto | undefined>(
    undefined,
  );

  const { pedidosEspera, refrescarListas } = usePedidosContext();

  const { pedidos, loading, error, recargar, removerPedidoLocal } =
    pedidosEspera;

  const { productos, errorProductos } = useProductoRestaurante();

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

  // Función auxiliar para notificaciones
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

  // Escucha de errores de carga
  useEffect(() => {
    if (errorProductos) showNotification(errorProductos, "error");
  }, [errorProductos, showNotification]);

  useEffect(() => {
    if (error) showNotification(error, "error");
  }, [error, showNotification]);

  const handleConfirmar = useCallback(
    async (pedido: DTOPedido | undefined) => {
      try {
        if (!pedido || !pedido.idPedido) {
          showNotification(
            "No se ha seleccionado un pedido correctamente.",
            "error",
          );
          return;
        }
        const confirmacion = window.confirm(
          `¿Estás seguro de que deseas confirmar el pedido #${pedido.idPedido}? Esta acción no se puede deshacer.`,
        );

        if (confirmacion) {
          await confirmarPedidoRestaurante(pedido.idPedido);

          removerPedidoLocal(pedido.idPedido);

          await refrescarListas([
            EnumEstadoPedido.EnPreparacion,
            EnumEstadoPedido.Pagado,
          ]);

          showNotification("Pedido confirmado correctamente.", "success");
        }
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : "Error al confirmar el pedido.";
        showNotification(mensaje, "error");
      }
    },
    [removerPedidoLocal, refrescarListas, showNotification],
  );

  const handleCancelar = useCallback(
    async (pedido: DTOPedido | undefined) => {
      try {
        if (!pedido || !pedido.idPedido) {
          showNotification(
            "No se seleccionó un pedido correctamente.",
            "error",
          );
          return;
        }
        const confirmacion = window.confirm(
          `¿Estás seguro de que deseas cancelar el pedido #${pedido.idPedido}? Esta acción no se puede deshacer.`,
        );

        if (confirmacion) {
          await reembolsarPedido(pedido);

          removerPedidoLocal(pedido.idPedido);

          await refrescarListas([EnumEstadoPedido.Pagado]);

          showNotification("Pedido cancelado por el restaurante.", "error");
        }
      } catch (err) {
        const mensaje =
          err instanceof Error ? err.message : "Error desconocido";
        showNotification(mensaje, "error");
      }
    },
    [removerPedidoLocal, refrescarListas, showNotification],
  );

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
        titulo="Pedidos a Confirmar"
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
          mapToItem={(i) => ({
            id: i.idProducto?.toString() ?? "",
            label: i.nombre ?? "",
          })}
          onChangeFiltroSelect={handleFiltroProductoChange}
          listaFiltros={productos}
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
              No hay pedidos pendientes de confirmación.
            </p>
            <p className="text-gray-400 text-sm mt-1">La cocina está al día.</p>
          </div>
        ) : (
          pedidosFiltrados.map((pedido) => (
            <CardPedidoAconfirmar
              key={pedido.idPedido}
              pedido={pedido}
              onConfirmar={handleConfirmar}
              onCancelar={handleCancelar}
            />
          ))
        )}
      </div>
    </div>
  );
}
