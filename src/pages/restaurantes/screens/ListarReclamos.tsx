import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";
import FiltrosRestaurantes from "../componentes/FiltrosResto.js";
import { CardReclamo, type Reclamo } from "../componentes/CardReclamo.js";
import type { NotificationState } from "../types/NotificationState.js";
import { resolverReclamo } from "../../../api/reclamosApi.js";
import { useReclamos } from "../../../hooks/useReclamos.js";
import type {
  DTOReclamo,
  ResolverReclamoPayload,
} from "../../../data/DTOReclamo.js";
import { EnumEstadoReclamo } from "../../../data/EnumEstadoReclamo.js";
import type { SearchItem } from "../../../components/TextBuscador.js";
import {
  RESTAURANTE_PAGE_CLASS,
  RestaurantePageHeader,
} from "../componentes/RestaurantePageShell.js";

function mapDtoACard(dto: DTOReclamo): Reclamo {
  const estado =
    dto.estado === EnumEstadoReclamo.Resuelto
      ? EnumEstadoReclamo.Resuelto
      : dto.estado === EnumEstadoReclamo.Rechazado
        ? EnumEstadoReclamo.Rechazado
        : EnumEstadoReclamo.Pendiente;

  return {
    idReclamo: dto.idReclamo,
    descripcion: dto.motivoReclamo ?? "Sin motivo registrado",
    cliente: {
      nombre: dto.nombreUsuario ?? "Cliente",
      email: dto.emailUsuario ?? "",
    },
    idPedido: dto.idPedido,
    fechaPedido: dto.fechaReclamo ?? new Date().toISOString(),
    fechaReclamo: dto.fechaReclamo ?? new Date().toISOString(),
    estado,
    resolucion:
      dto.estado === EnumEstadoReclamo.Resuelto
        ? "Reintegro procesado"
        : dto.motivoRechazo ?? "",
    totalPedido:
      dto.totalPedido != null && Number.isFinite(Number(dto.totalPedido))
        ? Number(dto.totalPedido)
        : 0,
  };
}

const ESTADO_DOT_COLOR: Record<EnumEstadoReclamo, string> = {
  [EnumEstadoReclamo.Pendiente]: "bg-amber-400",
  [EnumEstadoReclamo.Resuelto]: "bg-green-500",
  [EnumEstadoReclamo.Rechazado]: "bg-red-500",
};

const mapEstadoAItem = (estado: EnumEstadoReclamo): SearchItem => ({
  id: estado,
  label: estado,
  dotClassName: ESTADO_DOT_COLOR[estado],
});

export default function ListarReclamos() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const {
    reclamos,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    estadoFiltro,
    setEstadoFiltro,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    orden,
    setOrden,
    hayFiltros,
    limpiarFiltros,
    estadosDisponibles,
    recargar,
  } = useReclamos();

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(
      () => setNotification({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  useEffect(() => {
    if (error) showNotification(error, "error");
  }, [error]);

  const handleResolver = async (
    idReclamo: number,
    payload: ResolverReclamoPayload,
  ) => {
    await resolverReclamo(idReclamo, payload);
    showNotification(
      payload.accion
        ? "Reclamo aceptado. Se notificó al cliente y se procesó el reintegro."
        : "Reclamo rechazado. Se notificó al cliente.",
      "success",
    );
    await recargar();
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
        titulo="Reclamos de pedidos"
        onRecargar={recargar}
        recargando={loading}
      />

      <div className="max-w-5xl mx-auto mb-6 sm:mb-8">
        <FiltrosRestaurantes<EnumEstadoReclamo>
          labelBuscador="Buscar por nombre o ID de pedido"
          nombreID={searchTerm}
          setNombreID={setSearchTerm}
          desplegableTipo="Estado del reclamo"
          listaFiltros={estadosDisponibles}
          filtroSelecte={estadoFiltro}
          onChangeFiltroSelect={setEstadoFiltro}
          mapToItem={mapEstadoAItem}
          orden={orden}
          setOrden={setOrden}
          hayFiltros={hayFiltros}
          limpiarFiltros={limpiarFiltros}
          porFecha
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onChangeFechaDesde={setFechaDesde}
          onChangeFechaHasta={setFechaHasta}
        />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <span className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />
              Cargando reclamos...
            </p>
          </div>
        ) : reclamos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium text-lg">
              No hay reclamos para mostrar.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {hayFiltros
                ? "Probá ajustando los filtros de búsqueda."
                : "Cuando un cliente reclame un pedido, aparecerá acá."}
            </p>
          </div>
        ) : (
          reclamos.map((dto) => (
            <CardReclamo
              key={dto.idReclamo}
              reclamo={mapDtoACard(dto)}
              onResolver={handleResolver}
            />
          ))
        )}
      </div>
    </div>
  );
}
