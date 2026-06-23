import { useEffect, useState } from "react";
import type { NotificationState } from "../types/NotificationState.js";
import {
  actualizarEstadoPedido,
  listarPedidos,
  reembolsarPedido,
} from "../../../api/apiRestaurante.js";
import { EnumEstadoPedido } from "../../../data/EnumEstadoPedido.js";
import type { DTOPedido } from "../../../data/DTOPedido.js";
import { AlertCircle, CheckCircle } from "lucide-react";
import CardPedidoAconfirmar from "../componentes/CardPedidoAconfirmar.js";
import { usePedidos } from "../../../hooks/usePedidoRestaurante.js";
import { useProductoRestaurante } from "../../../hooks/useProductoRestaurante.js";
import { useFiltrosPedidos } from "../../../hooks/useFiltrosPedidos.js";
import type { DTOProducto } from "../../../data/DTOProducto.js";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";

export default function ListarEnCamino() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const { productos, loadingProductos, errorProductos, recargarProductos } =
    useProductoRestaurante();

  // Obtener pedidos con estado "Solicitado"
  const { pedidos, loading, error, recargar, removerPedidoLocal } = usePedidos(
    EnumEstadoPedido.EnCamino,
    180,
  );

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

  const [productoSelect, setProductoSelect] = useState<DTOProducto>();

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  const handleActualizarEstado = async (
    pedido: DTOPedido,
    nuevoEstado: EnumEstadoPedido,
  ) => {
    try {
      if (nuevoEstado === EnumEstadoPedido.Cancelado) {
        if (!pedido || !pedido.idPedido) {
          showNotification("Sin pedido seleccionado.", "error");
          return;
        }
        await reembolsarPedido(pedido);
        removerPedidoLocal(pedido.idPedido);
        showNotification("Pedido cancelado por el restaurante.", "error");
      } else {
        if (!pedido || !pedido.idPedido) {
          showNotification("Sin pedido seleccionado.", "error");
          return;
        }
        await actualizarEstadoPedido({ pedido, estado: nuevoEstado });
        removerPedidoLocal(pedido.idPedido);
        showNotification(
          `Pedido #${pedido.idPedido} actualizado a ${nuevoEstado}.`,
          "success",
        );
      }
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "Error al actualizar el pedido.";
      showNotification(mensaje, "error");
    }
  };

  useEffect(() => {
    if (errorProductos) showNotification(errorProductos, "error");
  }, [errorProductos]);

  useEffect(() => {
    if (error) showNotification(error, "error");
  }, [error]);

  const handleLimpiarFiltros = () => {
    limpiarFiltros();
    setProductoSelect(undefined);
  };

  return (
    <div className={RESTAURANTE_PAGE_CLASS}>
      {notification.show && (
        <div
          className={`mb-4 p-4 rounded-xl flex items-center shadow-sm ${
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
        titulo="Pedidos en camino"
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
          onChangeFiltroSelect={(item) => {
            (setProductoSelect(item),
              setProductoSeleccionadoId(item?.idProducto));
          }}
          listaFiltros={productos}
          mapToItem={(i) => ({
                id: i?.toString() ?? "",
                label: i.nombre ?? "",
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
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
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
              onActualizarEstado={handleActualizarEstado}
            />
          ))
        )}
      </div>
    </div>
  );
}
